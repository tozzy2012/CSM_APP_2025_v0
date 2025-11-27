import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL
# Force correct URL for testing
database_url = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"
print(f"Testing connection to: {database_url.split('@')[1] if '@' in database_url else 'INVALID URL'}")

try:
    engine = create_engine(database_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        
        # Check if tables exist
        result = connection.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"))
        count = result.scalar()
        print(f"📊 Found {count} tables in public schema")
        
        # Check accounts count
        try:
            result = connection.execute(text("SELECT count(*) FROM accounts"))
            accounts_count = result.scalar()
            print(f"👥 Found {accounts_count} accounts")
        except Exception as e:
            print(f"⚠️ Could not query accounts table: {e}")

except Exception as e:
    print(f"❌ Database connection failed: {e}")
