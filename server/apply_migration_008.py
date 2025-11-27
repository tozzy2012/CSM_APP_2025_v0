"""
Apply migration 008: Add internal_kickoff column and remove unused fields
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/zapper_cs_db")

print("Connecting to database...")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    print("Applying migration 008...")
    
    # Remove unnecessary columns
    print("Removing unused columns...")
    cur.execute("ALTER TABLE accounts DROP COLUMN IF EXISTS stage;")
    cur.execute("ALTER TABLE accounts DROP COLUMN IF EXISTS contract_value;")
    cur.execute("ALTER TABLE accounts DROP COLUMN IF EXISTS employees;")
    cur.execute("ALTER TABLE accounts DROP COLUMN IF EXISTS health_score;")
    cur.execute("ALTER TABLE accounts DROP COLUMN IF EXISTS status;")
    
    # Add internal_kickoff column
    print("Adding internal_kickoff column...")
    cur.execute("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS internal_kickoff JSON DEFAULT '{}';")
    
    # Add comment
    cur.execute("COMMENT ON COLUMN accounts.internal_kickoff IS 'Sales to CS handoff information using SPICED framework';")
    
    conn.commit()
    print("✅ Migration 008 applied successfully!")
    
except Exception as e:
    conn.rollback()
    print(f"❌ Error applying migration: {e}")
    raise
finally:
    cur.close()
    conn.close()
