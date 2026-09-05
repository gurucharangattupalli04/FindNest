"""
Script to set up, initialize, and run a real local PostgreSQL server
using official PostgreSQL portable binaries for Windows.
"""
import os
import sys
import time
import socket
import urllib.request
import zipfile
import subprocess
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PGSQL_DIR = BACKEND_DIR / "pgsql"
PGDATA_DIR = BACKEND_DIR / "pgdata"
BIN_DIR = PGSQL_DIR / "bin"
ZIP_PATH = BACKEND_DIR / "postgresql-binaries.zip"
DOWNLOAD_URL = "https://get.enterprisedb.com/postgresql/postgresql-16.15-3-windows-x64-binaries.zip"
PORT = 5432
DB_NAME = "findnest"
USER = "postgres"


def is_port_open(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def download_progress(block_num, block_size, total_size):
    downloaded = block_num * block_size
    if total_size > 0:
        percent = min(100.0, downloaded * 100.0 / total_size)
        mb_down = downloaded / (1024 * 1024)
        mb_total = total_size / (1024 * 1024)
        sys.stdout.write(f"\rDownloading PostgreSQL binaries: {mb_down:.1f}/{mb_total:.1f} MB ({percent:.1f}%)")
        sys.stdout.flush()


def setup():
    # 1. Download binaries if not already extracted
    postgres_exe = BIN_DIR / "postgres.exe"
    initdb_exe = BIN_DIR / "initdb.exe"
    pg_ctl_exe = BIN_DIR / "pg_ctl.exe"
    createdb_exe = BIN_DIR / "createdb.exe"

    if not postgres_exe.exists():
        if not ZIP_PATH.exists():
            print(f"Downloading official PostgreSQL binaries from {DOWNLOAD_URL}...")
            urllib.request.urlretrieve(DOWNLOAD_URL, ZIP_PATH, reporthook=download_progress)
            print("\nDownload complete.")
        
        print(f"Extracting PostgreSQL to {PGSQL_DIR}...")
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(BACKEND_DIR)
        print("Extraction complete.")
        
        if ZIP_PATH.exists():
            try:
                os.remove(ZIP_PATH)
            except Exception:
                pass

    if not postgres_exe.exists():
        print(f"Error: Could not locate {postgres_exe}")
        sys.exit(1)

    print(f"PostgreSQL binary found at {postgres_exe}")

    # 2. Initialize database cluster if pgdata does not exist
    if not (PGDATA_DIR / "PG_VERSION").exists():
        print(f"Initializing database cluster at {PGDATA_DIR}...")
        initdb_cmd = [
            str(initdb_exe),
            "-D", str(PGDATA_DIR),
            "-U", USER,
            "-A", "trust",
            "-E", "UTF8"
        ]
        result = subprocess.run(initdb_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"initdb failed: {result.stderr}")
            sys.exit(1)
        print("Database cluster initialized successfully.")

    # 3. Check if PostgreSQL server is already running on port
    if is_port_open(PORT):
        print(f"PostgreSQL server is already responding on port {PORT}.")
    else:
        print(f"Starting PostgreSQL server on port {PORT}...")
        start_cmd = [
            str(pg_ctl_exe),
            "-D", str(PGDATA_DIR),
            "-l", str(PGDATA_DIR / "logfile.log"),
            "-o", f"-p {PORT}",
            "start"
        ]
        result = subprocess.run(start_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"pg_ctl start output: {result.stdout}\n{result.stderr}")
        
        # Wait for port to become active
        for _ in range(15):
            if is_port_open(PORT):
                print(f"PostgreSQL server is up and listening on port {PORT}!")
                break
            time.sleep(1)
        else:
            print("Server did not start in time. Check log file:")
            log_file = PGDATA_DIR / "logfile.log"
            if log_file.exists():
                print(log_file.read_text())
            sys.exit(1)

    # 4. Create database if it doesn't exist
    print(f"Ensuring database '{DB_NAME}' exists...")
    create_cmd = [
        str(createdb_exe),
        "-U", USER,
        "-p", str(PORT),
        DB_NAME
    ]
    res = subprocess.run(create_cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Database '{DB_NAME}' created successfully.")
    elif "already exists" in res.stderr:
        print(f"Database '{DB_NAME}' already exists.")
    else:
        print(f"createdb notice: {res.stderr.strip()}")

    # 5. Write backend/.env
    env_file = BACKEND_DIR / ".env"
    db_url = f"postgresql://{USER}@127.0.0.1:{PORT}/{DB_NAME}"
    env_content = f"""# FindNest Local Development Environment Configuration
PROJECT_NAME="FindNest API"
VERSION="1.0.0"
API_V1_STR="/api/v1"
CORS_ORIGINS='["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]'

# Real PostgreSQL Database Connection
POSTGRES_SERVER=127.0.0.1
POSTGRES_PORT={PORT}
POSTGRES_USER={USER}
POSTGRES_PASSWORD=
POSTGRES_DB={DB_NAME}
DATABASE_URL={db_url}
"""
    env_file.write_text(env_content, encoding="utf-8")
    print(f"Configuration written to {env_file}")
    print(f"DATABASE_URL={db_url}")


if __name__ == "__main__":
    setup()
