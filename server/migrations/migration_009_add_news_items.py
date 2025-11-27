"""
Database Migration: Add news_items table for Radar CS feature
"""
from sqlalchemy import text
from database import get_db

def upgrade():
    """Apply migration"""
    db = next(get_db())
    
    try:
        # Create news_items table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS news_items (
                id UUID PRIMARY KEY,
                account_id TEXT NOT NULL,
                title TEXT NOT NULL,
                summary TEXT,
                content TEXT,
                news_type TEXT NOT NULL,
                category TEXT,
                source_type TEXT DEFAULT 'openai',
                relevance_score INTEGER DEFAULT 50,
                published_date TIMESTAMP,
                news_metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
            )
        """))
        
        # Create index on account_id for faster queries
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_news_items_account_id 
            ON news_items(account_id)
        """))
        
        # Create index on created_at for time-based queries
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_news_items_created_at 
            ON news_items(created_at DESC)
        """))
        
        # Create index on relevance_score for sorting
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_news_items_relevance_score 
            ON news_items(relevance_score DESC)
        """))
        
        db.commit()
        print("✅ Migration applied: news_items table created successfully")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        db.close()


def downgrade():
    """Revert migration"""
    db = next(get_db())
    
    try:
        # Drop indexes
        db.execute(text("DROP INDEX IF EXISTS idx_news_items_account_id"))
        db.execute(text("DROP INDEX IF EXISTS idx_news_items_created_at"))
        db.execute(text("DROP INDEX IF EXISTS idx_news_items_relevance_score"))
        
        # Drop table
        db.execute(text("DROP TABLE IF EXISTS news_items"))
        
        db.commit()
        print("✅ Migration reverted: news_items table dropped successfully")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration revert failed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Running migration: add_news_items_table")
    upgrade()
