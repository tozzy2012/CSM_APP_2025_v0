import os
import sys
from sqlalchemy import create_engine, text

# Add server directory to path
sys.path.insert(0, os.path.join(os.getcwd(), 'server'))

# Use the Docker password as we are running from outside (or use localhost if running locally with port mapping)
# Assuming we run this with the correct env var or hardcoded for this task
DATABASE_URL = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"

def clean_news():
    print("🧹 Deleting ALL news items...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        query = text("DELETE FROM news_items")
        result = conn.execute(query)
        conn.commit()
        print(f"✅ Deleted {result.rowcount} rows.")

if __name__ == "__main__":
    clean_news()

if __name__ == "__main__":
    clean_news()
