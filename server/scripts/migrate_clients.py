"""
Migration script to create/update clients table
Run this with: docker-compose exec backend python scripts/migrate_clients.py
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
    """Create or update clients table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Drop existing clients table if it exists (for clean migration)
        logger.info("Dropping existing clients table if exists...")
        conn.execute(text("DROP TABLE IF EXISTS clients CASCADE"))
        conn.commit()
        
        # Create new clients table
        logger.info("Creating clients table...")
        conn.execute(text("""
            CREATE TABLE clients (
                id VARCHAR(255) PRIMARY KEY,
                organization_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                legal_name VARCHAR(255) NOT NULL,
                cnpj VARCHAR(18) NOT NULL,
                industry VARCHAR(255),
                website VARCHAR(500),
                address JSONB,
                company_size VARCHAR(50),
                revenue VARCHAR(100),
                founded_year INTEGER,
                power_map JSONB DEFAULT '[]'::jsonb,
                contacts JSONB DEFAULT '[]'::jsonb,
                notes TEXT,
                tags JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_by VARCHAR(255)
            )
        """))
        conn.commit()
        
        logger.info("Clients table created successfully!")
        
        # Create index on organization_id for faster queries
        logger.info("Creating index on organization_id...")
        conn.execute(text("""
            CREATE INDEX idx_clients_organization_id ON clients(organization_id)
        """))
        conn.commit()
        
        logger.info("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
