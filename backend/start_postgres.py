"""
Convenience helper to start the local PostgreSQL server for FindNest.
"""
import subprocess
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PG_CTL = BACKEND_DIR / "pgsql" / "bin" / "pg_ctl.exe"
PG_DATA = BACKEND_DIR / "pgdata"

if __name__ == "__main__":
    if not PG_CTL.exists():
        print(f"PostgreSQL binary not found at {PG_CTL}.")
        print("Run setup_local_postgres.py first.")
    else:
        print("Starting PostgreSQL server...")
        subprocess.run([str(PG_CTL), "-D", str(PG_DATA), "-o", "-p 5432", "start"])
