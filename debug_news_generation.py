import sys
import os
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add server directory to path
sys.path.insert(0, os.path.join(os.getcwd(), 'server'))

# OVERRIDE DATABASE URL FOR LOCAL DEBUGGING
# Password found in docker-compose.yml
os.environ["DATABASE_URL"] = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"

from database import SessionLocal
from models import Account, Tenant
from services.news_service import NewsService

async def debug_news():
    print("=" * 80)
    print("DEBUGGING NEWS GENERATION")
    print("=" * 80)
    
    db = SessionLocal()
    try:
        # Get the account
        account_id = "1764262447472"
        account = db.query(Account).filter(Account.id == account_id).first()
        
        if not account:
            print(f"❌ Account {account_id} not found")
            return
            
        print(f"✅ Account found: {account.name}")
        
        # Check Tenant settings
        tenant = db.query(Tenant).first()
        if tenant and tenant.settings:
            ai = tenant.settings.get('ai', {})
            pkey = ai.get('perplexityApiKey', '')
            print(f"✅ Perplexity Key in DB: {bool(pkey)}")
            if pkey:
                print(f"   Key: {pkey[:20]}...")
        else:
            print("❌ No tenant settings found")
            
        # Initialize Service
        service = NewsService(db)
        
        # Force Fetch
        print("\n🚀 Calling fetch_news_for_account(force_refresh=True)...")
        news = await service.fetch_news_for_account(account_id, force_refresh=True)
        
        print("\n" + "=" * 80)
        print(f"✅ RESULT: Got {len(news)} news items")
        if news:
            print(f"   First item title: {news[0].get('title')}")
            print(f"   First item meta: {news[0].get('news_metadata')}")
            print(f"   Source Type: {news[0].get('source_type')}")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(debug_news())
