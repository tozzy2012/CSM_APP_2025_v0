"""
Manual migration script to remove unnecessary fields from clients table
"""
import sys
from sqlalchemy import create_engine, text
from config import settings

def run_migration():
    """Execute migration to remove address, revenue, and founded_year from clients"""
    engine = create_engine(settings.DATABASE_URL)
    
    migrations = [
        "ALTER TABLE clients DROP COLUMN IF EXISTS address;",
        "ALTER TABLE clients DROP COLUMN IF EXISTS revenue;",
        "ALTER TABLE clients DROP COLUMN IF EXISTS founded_year;",
    ]
    
    try:
        with engine.connect() as conn:
            for migration in migrations:
                print(f"Executing: {migration}")
                conn.execute(text(migration))
                conn.commit()
        
        print("✅ Migration completed successfully!")
        return True
    
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
