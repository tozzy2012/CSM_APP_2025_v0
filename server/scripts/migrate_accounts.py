"""
Migration script to update accounts table for CS application
Run this with: docker-compose exec backend python scripts/migrate_accounts.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    """Update accounts table for CS application"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Drop existing accounts table if it exists (for clean migration)
        logger.info("Dropping existing accounts table if exists...")
        conn.execute(text("DROP TABLE IF EXISTS accounts CASCADE"))
        conn.commit()
        
        # Create new accounts table
        logger.info("Creating accounts table...")
        conn.execute(text("""
            CREATE TABLE accounts (
                id VARCHAR(255) PRIMARY KEY,
                organization_id VARCHAR(255) NOT NULL,
                client_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                industry VARCHAR(255),
                stage VARCHAR(50),
                type VARCHAR(50),
                status VARCHAR(100),
                health_status VARCHAR(50),
                health_score INTEGER DEFAULT 75,
                mrr DECIMAL(10, 2) DEFAULT 0,
                contract_value DECIMAL(10, 2) DEFAULT 0,
                contract_start DATE,
                contract_end DATE,
                csm VARCHAR(255),
                employees INTEGER DEFAULT 0,
                website VARCHAR(500),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
        """))
        conn.commit()
        
        logger.info("Accounts table created successfully!")
        
        # Create indexes
        logger.info("Creating indexes...")
        conn.execute(text("""
            CREATE INDEX idx_accounts_organization_id ON accounts(organization_id)
        """))
        conn.execute(text("""
            CREATE INDEX idx_accounts_client_id ON accounts(client_id)
        """))
        conn.commit()
        
        logger.info("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
