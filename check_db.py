import sqlite3
import os

db_path = 'backend/test.db'

if not os.path.exists(db_path):
    print(f"Error: Database file not found at {db_path}")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if AUDIT_LOG table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='AUDIT_LOG';")
        table_exists = cursor.fetchone()

        if table_exists:
            print("Table 'AUDIT_LOG' exists.")
            # Check for data in AUDIT_LOG table
            cursor.execute("SELECT * FROM AUDIT_LOG LIMIT 5;")
            rows = cursor.fetchall()
            if rows:
                print("Found data in 'AUDIT_LOG' table (first 5 rows):")
                for row in rows:
                    print(row)
            else:
                print("No data found in 'AUDIT_LOG' table.")
        else:
            print("Table 'AUDIT_LOG' does not exist.")

        conn.close()
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
