"""
Real PostgreSQL Verification Script for FindNest.
Tests connection, executes real DDL table creation, inserts and queries ORM entities,
and validates Pydantic schema serialization.
"""
import sys
from datetime import datetime, timezone
from sqlalchemy import text, inspect
from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.db.init_db import init_db
from app.models.enums import ItemCategory, ItemStatus
from app.models.user import User
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.schemas.user import UserResponse
from app.schemas.lost_item import LostItemResponse
from app.schemas.found_item import FoundItemResponse


def verify_postgresql():
    print("=" * 60)
    print("FindNest: Real PostgreSQL Database Verification")
    print("=" * 60)
    print(f"Target Database URL: {settings.SQLALCHEMY_DATABASE_URI}")
    
    # 1. Test Low-level PostgreSQL Connection & Version
    print("\n[Step 1/5] Testing PostgreSQL Connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version(), current_database(), current_user;"))
            row = result.fetchone()
            print("  Connection Successful!")
            print(f"  PostgreSQL Version: {row[0]}")
            print(f"  Current Database:   {row[1]}")
            print(f"  Connected User:     {row[2]}")
    except Exception as e:
        print(f"  FAILED to connect to PostgreSQL: {e}")
        sys.exit(1)

    # 2. Execute Table Creation (DDL)
    print("\n[Step 2/5] Creating Tables via SQLAlchemy init_db()...")
    try:
        init_db(bind=engine)
        print("  init_db() completed without errors.")
    except Exception as e:
        print(f"  FAILED to create tables: {e}")
        sys.exit(1)

    # 3. Inspect Created PostgreSQL Tables & Columns
    print("\n[Step 3/5] Inspecting PostgreSQL information_schema...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"  Detected tables in PostgreSQL: {existing_tables}")
    
    expected_tables = ["users", "lost_items", "found_items"]
    for tbl in expected_tables:
        if tbl in existing_tables:
            columns = [col["name"] for col in inspector.get_columns(tbl)]
            print(f"  Table '{tbl}' found with {len(columns)} columns:")
            print(f"     Columns: {', '.join(columns[:10])}{'...' if len(columns) > 10 else ''}")
        else:
            print(f"  ERROR: Expected table '{tbl}' was NOT found in database!")
            sys.exit(1)

    # 4. Insert Real ORM Entities & Relationships
    print("\n[Step 4/5] Testing CRUD & ORM Relationships in PostgreSQL...")
    db = SessionLocal()
    try:
        # Create a test user with a timestamped email to allow repeated runs
        ts = int(datetime.now(timezone.utc).timestamp())
        test_email = f"alex.chen.{ts}@example.com"
        
        user = User(
            email=test_email,
            full_name="Alex Chen",
            phone_number="+1-555-0199",
            hashed_password="hashed_placeholder_for_future_auth",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"  Created User (ID: {user.id}, Email: {user.email})")

        # Create a test LostItem associated with user
        lost_item = LostItem(
            title="Space Gray MacBook Pro 14\"",
            category=ItemCategory.ELECTRONICS,
            description="Left on the 3rd floor quiet study area in the university library. NASA sticker on top shell.",
            color="Space Gray",
            brand="Apple",
            location="University Library, 3rd Floor",
            latitude=37.7749,
            longitude=-122.4194,
            date_lost=datetime.now(timezone.utc),
            reward="$150 Reward",
            contact_name="Alex Chen",
            contact_phone="+1-555-0199",
            contact_email=test_email,
            image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
            status=ItemStatus.ACTIVE,
            is_featured=True,
            ai_metadata={"tags": ["laptop", "apple", "macbook", "space gray"], "confidence": 0.98},
            user_id=user.id,
        )
        db.add(lost_item)

        # Create a test FoundItem associated with user
        found_item = FoundItem(
            title="Black Leather Bifold Wallet",
            category=ItemCategory.WALLETS,
            description="Discovered near the subway ticket machines. Contains metro pass and student card.",
            color="Black",
            brand="Bellroy",
            location="Central Metro Station, Exit 4",
            storage_location="Central Station Security Office, Locker 12",
            latitude=37.7752,
            longitude=-122.4180,
            date_found=datetime.now(timezone.utc),
            contact_name="Security Officer Ramirez",
            contact_phone="+1-555-0144",
            contact_email="security@metrostations.org",
            image_url="https://images.unsplash.com/photo-1627123424574-724758594e93",
            status=ItemStatus.ACTIVE,
            is_featured=True,
            ai_metadata={"tags": ["wallet", "leather", "bifold", "black"], "confidence": 0.95},
            user_id=user.id,
        )
        db.add(found_item)
        db.commit()
        db.refresh(lost_item)
        db.refresh(found_item)

        print(f"  Created LostItem (ID: {lost_item.id}, Title: '{lost_item.title}')")
        print(f"  Created FoundItem (ID: {found_item.id}, Title: '{found_item.title}')")

        # Test relationship navigation
        db.refresh(user)
        user_lost_count = len(user.lost_items)
        user_found_count = len(user.found_items)
        print(f"  Verified User Relationships: user.lost_items={user_lost_count}, user.found_items={user_found_count}")
        assert user_lost_count >= 1, "Relationship user.lost_items navigation failed"
        assert user_found_count >= 1, "Relationship user.found_items navigation failed"

        # 5. Pydantic Schema Serialization
        print("\n[Step 5/5] Validating Pydantic Schemas from ORM Instances...")
        user_schema = UserResponse.model_validate(user)
        lost_schema = LostItemResponse.model_validate(lost_item)
        found_schema = FoundItemResponse.model_validate(found_item)

        print(f"  UserResponse:  ID={user_schema.id}, Email={user_schema.email}, Created={user_schema.created_at.isoformat()}")
        print(f"  LostItemResponse: ID={lost_schema.id}, Title={lost_schema.title}, Category={lost_schema.category.value}")
        print(f"  FoundItemResponse: ID={found_schema.id}, Title={found_schema.title}, Storage={found_schema.storage_location}")

        print("\n" + "=" * 60)
        print("ALL VERIFICATION CHECKS PASSED ON REAL POSTGRESQL!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"  FAILED during ORM/Schema verification: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    verify_postgresql()
