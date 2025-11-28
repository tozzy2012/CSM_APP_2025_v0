"""
News Service
Handles fetching and analyzing news for accounts using OpenAI
"""
import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from uuid import uuid4

from models import NewsItem, Account, Tenant
from services.openai_service import OpenAIService

logger = logging.getLogger(__name__)

# MODULE RELOAD MARKER - If you see this, the module has been reloaded
print("🔄🔄🔄 NEWS_SERVICE MODULE LOADED - PERPLEXITY VERSION 🔄🔄🔄")


class NewsService:
    """Service for fetching and managing news for accounts"""
    
    def __init__(self, db: Session, tenant_id: Optional[str] = None):
        self.db = db
        self.tenant_id = tenant_id
        self.openai_service = OpenAIService(db, tenant_id)
    
    async def fetch_news_for_account(self, account_id: str, force_refresh: bool = False) -> List[Dict]:
        """
        Fetch news for a specific account
        
        Args:
            account_id: Account ID to fetch news for
            force_refresh: If True, bypass cache and fetch new news
            
        Returns:
            List of news items
        """
        print(f"DEBUG: fetch_news_for_account called for {account_id}, force_refresh={force_refresh}")
        
        # Check cache first (unless force refresh)
        if not force_refresh:
            print("DEBUG: Checking cache...")
            cached_news = self._get_cached_news(account_id, max_age_hours=24)
            if cached_news:
                print(f"DEBUG: Returning {len(cached_news)} cached items")
                return cached_news
            print("DEBUG: Cache miss or empty")
        else:
            print("DEBUG: Force refresh enabled, skipping cache")
        
        # Get account details
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            print(f"DEBUG: Account {account_id} not found")
            raise ValueError(f"Account {account_id} not found")
        
        print(f"DEBUG: Account found: {account.name}")
        
        # Fetch news using OpenAI
        print("DEBUG: Calling _fetch_news_from_openai...")
        news_items = await self._fetch_news_from_openai(account)
        print(f"DEBUG: _fetch_news_from_openai returned {len(news_items)} items")
        
        # Save to database
        self._save_news_items(account_id, news_items)
        
        return news_items
    
    async def fetch_news_for_all_accounts(self, csm_filter: Optional[str] = None) -> Dict[str, List[Dict]]:
        """
        Fetch news for all accounts (optionally filtered by CSM)
        
        Args:
            csm_filter: Filter accounts by CSM name
            
        Returns:
            Dictionary mapping account_id to list of news items
        """
        # Get accounts
        query = self.db.query(Account)
        if csm_filter:
            query = query.filter(Account.csm == csm_filter)
        
        accounts = query.all()
        
        results = {}
        for account in accounts:
            try:
                # Get cached news (don't force refresh for bulk operations)
                news = self._get_cached_news(account.id, max_age_hours=24)
                if news:
                    results[account.id] = news
                else:
                    # If no cache, fetch new news
                    news = await self.fetch_news_for_account(account.id, force_refresh=False)
                    results[account.id] = news
            except Exception as e:
                print(f"Error fetching news for account {account.id}: {str(e)}")
                results[account.id] = []
        
        return results
    
    def _get_cached_news(self, account_id: str, max_age_hours: int = 24) -> Optional[List[Dict]]:
        """Get cached news items for an account"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        news_items = self.db.query(NewsItem).filter(
            and_(
                NewsItem.account_id == account_id,
                NewsItem.created_at >= cutoff_time
            )
        ).order_by(desc(NewsItem.relevance_score), desc(NewsItem.published_date)).all()
        
        if not news_items:
            return None
        
        return [self._news_item_to_dict(item) for item in news_items]
    
    async def _fetch_news_from_openai(self, account: Account) -> List[Dict]:
        """Fetch news using Perplexity (real-time) or OpenAI (synthetic fallback)"""
        try:
            # Load tenant settings to get API keys
            if not self.openai_service._openai_key:
                self.openai_service._load_default_tenant_settings()
            
            # Load tenant directly from database to get Perplexity key
            tenant = self.db.query(Tenant).first()
            
            print("="*80)
            print(f"DEBUG: Tenant found: {tenant is not None}")
            
            # Check if Perplexity API key is configured
            perplexity_key = None
            if tenant and tenant.settings:
                ai_settings = tenant.settings.get('ai', {})
                perplexity_key = ai_settings.get('perplexityApiKey')
                print(f"DEBUG: AI Settings keys: {list(ai_settings.keys())}")
                print(f"DEBUG: Perplexity key present: {bool(perplexity_key)}")
                if perplexity_key:
                    print(f"DEBUG: Perplexity key length: {len(str(perplexity_key))}")
                    print(f"DEBUG: Perplexity key starts with: {str(perplexity_key)[:10]}")
                logger.info(f"Tenant loaded. Perplexity key present: {bool(perplexity_key and len(str(perplexity_key)) > 10)}")
            else:
                print("DEBUG: Tenant NOT found or no settings")
                logger.warning("Tenant not found or has no settings")
            
            # TEMPORARY: FORCE PERPLEXITY USAGE FOR TESTING
            if perplexity_key:
                print(f"DEBUG: ✅ FORCING PERPLEXITY for {account.name}")
                logger.info(f"✅ FORCING Perplexity API for REAL-TIME news for account: {account.name}")
                try:
                    return await self._fetch_news_from_perplexity(account, perplexity_key)
                except Exception as perplexity_error:
                    print(f"DEBUG: ❌ Perplexity FAILED: {str(perplexity_error)}")
                    logger.error(f"Perplexity failed, falling back to OpenAI: {str(perplexity_error)}")
                    return await self._fetch_news_from_openai_legacy(account)
            else:
                print(f"DEBUG: ⚠️ NO Perplexity key, using OpenAI for {account.name}")
                logger.info(f"⚠️ Perplexity not configured. Using OpenAI SYNTHETIC news for account: {account.name}")
                return await self._fetch_news_from_openai_legacy(account)
                
        except Exception as e:
            print(f"DEBUG: ERROR in _fetch_news_from_openai: {str(e)}")
            logger.error(f"Error fetching news: {str(e)}")
            logger.error(traceback.format_exc())
            return []
            
    async def _fetch_news_from_openai_legacy(self, account: Account) -> List[Dict]:
        """Fetch news using OpenAI (legacy/synthetic)"""
        # Build prompt for OpenAI
        prompt = self._build_news_prompt(account)
        
        # Call OpenAI
        try:
            from openai import OpenAI
            
            # Load OpenAI settings
            if not self.openai_service._openai_key:
                self.openai_service._load_default_tenant_settings()
            
            if not self.openai_service._openai_key:
                raise ValueError("OpenAI API key not configured. Please add it in Settings > AI.")
            
            client = OpenAI(api_key=self.openai_service._openai_key)
            
            response = client.chat.completions.create(
                model="gpt-4o",  # Latest GPT-4 Omni model - faster and more capable
                messages=[
                    {"role": "system", "content": self._get_news_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more factual responses
                response_format={"type": "json_object"},
                max_tokens=3000
            )
            
            # Parse response
            result = json.loads(response.choices[0].message.content)
            news_items = result.get("news_items", [])
            
            return news_items
            
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {str(e)}")
    
    async def _fetch_news_from_perplexity(self, account: Account, api_key: str) -> List[Dict]:
        """Fetch real-time news using Perplexity API"""
        print(f"\n{'='*80}")
        print(f"🔵 PERPLEXITY CALLED for {account.name}")
        print(f"🔵 API Key: {api_key[:30]}...")
        print(f"{'='*80}\n")
        
        try:
            from openai import OpenAI
            
            # Build the prompt for real-time news
            prompt = self._build_perplexity_news_prompt(account)
            
            print(f"🔵 Creating Perplexity client...")
            # Perplexity uses OpenAI-compatible API
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.perplexity.ai"
            )
            
            print(f"🔵 Calling Perplexity API with model 'sonar'...")
            response = client.chat.completions.create(
                model="sonar",  # Perplexity's online search model
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that searches for real, current news. You MUST return the response in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                # response_format={"type": "json_object"}, # Perplexity API issue with this parameter
                max_tokens=3000
            )
            
            print(f"🔵 Perplexity API responded successfully!")
            # Parse response
            content = response.choices[0].message.content
            
            # Clean markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            result = json.loads(content)
            news_items = result.get("news_items", [])
            
            # Add source_type to each item
            for item in news_items:
                item["source_type"] = "perplexity"
            
            print(f"🔵 ✅ Parsed {len(news_items)} news items from Perplexity")
            logger.info(f"Fetched {len(news_items)} real-time news items from Perplexity for {account.name}")
            return news_items
            
        except Exception as e:
            print(f"\n{'='*80}")
            print(f"🔴 PERPLEXITY ERROR for {account.name}")
            print(f"🔴 Error type: {type(e).__name__}")
            print(f"🔴 Error message: {str(e)}")
            print(f"{'='*80}\n")
            
            logger.error(f"Error fetching Perplexity news: {str(e)}")
            logger.error(traceback.format_exc())
            # Fallback to OpenAI on error
            logger.info("Falling back to OpenAI due to Perplexity error")
            return await self._fetch_news_from_openai_legacy(account)
    
    def _build_perplexity_news_prompt(self, account: Account) -> str:
        """Build prompt for Perplexity to search real-time news"""
        from datetime import datetime, timedelta
        
        company_name = account.name
        industry = account.industry or "tecnologia"
        today = datetime.utcnow()
        thirty_days_ago = today - timedelta(days=30)
        
        date_str = today.strftime("%B %Y")
        
        prompt = f"""Search for REAL NEWS articles published in the last 30 days (since {thirty_days_ago.strftime("%Y-%m-%d")}) about:

**Company**: {company_name}
**Industry**: {industry}
**Current Date**: {today.strftime("%Y-%m-%d")}

Find 3-8 recent news articles in any of these categories:

1. **Company News** about {company_name}:
   - Product launches, partnerships, funding
   - Executive changes, M&A activity
   - Financial results or announcements

2. **Industry News** in {industry}:
   - Market trends and analysis
   - Regulatory changes
   - Technology developments

3. **Insights for CSM**:
   - How these news affect customer relationship
   - Growth or churn risk signals
   - Expansion opportunities

CRITICAL: 
- Return ONLY news with REAL, VERIFIABLE published dates from the last 30 days
- Include the SOURCE NAME (e.g., CNN, Globo, TechCrunch) and ARTICLE URL for EACH news item
- Do not invent news - if no recent news exists for {company_name}, focus on {industry} news

Return in JSON format:
{{
  "news_items": [
    {{
      "title": "Exact news headline",
      "summary": "2-3 sentence summary",
      "content": "Detailed description with facts",
      "news_type": "company|industry|market",
      "category": "financeiro|negocios|tecnologia|regulatorio|pessoas|outro",
      "relevance_score": 85,
      "published_date": "2025-11-28T10:00:00Z",
      "source_name": "CNN Business",
      "source_url": "https://example.com/article",
      "insights": "CSM-focused business insights"
    }}
  ]
}}

Prioritize quality and recency. If no recent company news exist, focus on industry/market news."""
        
        return prompt
    
    def _build_news_prompt(self, account: Account) -> str:
        """Build prompt for OpenAI to fetch news"""
        company_name = account.name
        industry = account.industry or "tecnologia"
        
        # Get current date for context
        from datetime import datetime
        today = datetime.utcnow()
        current_date_str = today.strftime("%d de %B de %Y")
        
        prompt = f"""Data atual: {current_date_str}

Busque notícias recentes e relevantes para um Customer Success Manager (CSM) sobre:

**Empresa do Cliente:** {company_name}
**Setor/Indústria:** {industry}

IMPORTANTE: Retorne notícias dos ÚLTIMOS 30 DIAS (novembro-dezembro de 2025) que sejam relevantes para o CSM entender melhor o contexto de negócio do cliente. As datas devem ser RECENTES (últimos 30 dias).

Inclua:

1. **Notícias diretas sobre a empresa** ({company_name})
   - Anúncios corporativos, financeiros, novos produtos
   - Mudanças executivas, fusões, aquisições
   - Performance financeira, investimentos

2. **Notícias do setor** ({industry})
   - Tendências de mercado
   - Eventos importantes da indústria
   - Mudanças regulatórias ou tecnológicas

3. **Insights de negócio**
   - Como essas notícias podem impactar a relação com o cliente
   - Oportunidades ou riscos identificados

Para cada notícia, forneça:
- **title**: Título claro e objetivo
- **summary**: Resumo executivo (2-3 frases)
- **content**: Descrição mais detalhada
- **news_type**: "company" (sobre a empresa), "industry" (sobre o setor), ou "market" (mercado geral)
- **category**: "financeiro", "negocios", "tecnologia", "regulatorio", "pessoas", ou "outro"
- **relevance_score**: 0-100 (quão relevante é para o CSM)
- **published_date**: Data RECENTE dos últimos 30 dias (formato ISO 8601: YYYY-MM-DDTHH:MM:SSZ)
- **insights**: String com insights de negócio para o CSM

CRÍTICO: As datas (published_date) devem ser dos ÚLTIMOS 30 DIAS, não de 2023 ou anos anteriores.

IMPORTANTE: Retorne no formato JSON com a estrutura:
{{
  "news_items": [
    {{
      "title": "...",
      "summary": "...",
      "content": "...",
      "news_type": "company|industry|market",
      "category": "financeiro|negocios|tecnologia|regulatorio|pessoas|outro",
      "relevance_score": 85,
      "published_date": "2025-11-{today.day:02d}T10:00:00Z",
      "insights": "Este evento pode abrir oportunidade de upsell..."
    }}
  ]
}}

Retorne entre 3-8 notícias mais relevantes. Priorize qualidade sobre quantidade."""
        
        return prompt
    
    def _get_news_system_prompt(self) -> str:
        """Get system prompt for news fetching"""
        return """Você é um analista de notícias B2B especializado em Customer Success.

Sua missão é encontrar notícias relevantes e fornecer insights acionáveis para CSMs sobre seus clientes.

Diretrizes:
1. Foque em notícias RECENTES (últimos 30 dias)
2. Priorize relevância para a relação CS-Cliente
3. Identifique oportunidades de expansão ou riscos de churn
4. Seja objetivo e factual
5. Forneça insights práticos e acionáveis

Mantenha um tom profissional e consultivo."""
    
    def _save_news_items(self, account_id: str, news_items: List[Dict]):
        """Save news items to database"""
        # Delete old news for this account (older than 7 days)
        cutoff_date = datetime.utcnow() - timedelta(days=7)
        self.db.query(NewsItem).filter(
            and_(
                NewsItem.account_id == account_id,
                NewsItem.created_at < cutoff_date
            )
        ).delete()
        
        # Save new news items
        for item in news_items:
            news_item = NewsItem(
                id=uuid4(),
                account_id=account_id,
                title=item.get("title", ""),
                summary=item.get("summary", ""),
                content=item.get("content", ""),
                news_type=item.get("news_type", "market"),
                category=item.get("category", "outro"),
                source_type=item.get("source_type", "openai"),
                relevance_score=item.get("relevance_score", 50),
                published_date=datetime.fromisoformat(item.get("published_date", datetime.utcnow().isoformat()).replace("Z", "+00:00")),
                news_metadata={
                    "insights": item.get("insights", ""),
                    "source_name": item.get("source_name"),
                    "source_url": item.get("source_url")
                }
            )
            self.db.add(news_item)
        
        self.db.commit()
    
    def _news_item_to_dict(self, news_item: NewsItem) -> Dict:
        """Convert NewsItem model to dictionary"""
        return {
            "id": str(news_item.id),
            "account_id": news_item.account_id,
            "title": news_item.title,
            "summary": news_item.summary,
            "content": news_item.content,
            "news_type": news_item.news_type,
            "category": news_item.category,
            "source_type": news_item.source_type,
            "relevance_score": news_item.relevance_score,
            "published_date": news_item.published_date.isoformat() if news_item.published_date else None,
            "insights": news_item.news_metadata.get("insights", "") if news_item.news_metadata else "",
            "created_at": news_item.created_at.isoformat() if news_item.created_at else None
        }
    
    def get_news_by_csm(self, csm_name: Optional[str] = None) -> List[Dict]:
        """
        Get all news items grouped by account, optionally filtered by CSM
        
        Args:
            csm_name: Filter by CSM name (None for all)
            
        Returns:
            List of dictionaries with account info and news items
        """
        # Build query for accounts
        query = self.db.query(Account)
        if csm_name and csm_name != "all":
            query = query.filter(Account.csm == csm_name)
        
        accounts = query.all()
        
        results = []
        for account in accounts:
            # Get news for this account (last 7 days)
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            news_items = self.db.query(NewsItem).filter(
                and_(
                    NewsItem.account_id == account.id,
                    NewsItem.created_at >= cutoff_date
                )
            ).order_by(desc(NewsItem.relevance_score), desc(NewsItem.published_date)).all()
            
            # Always add account, even if no news (so user can see it and refresh)
            results.append({
                "account": {
                    "id": account.id,
                    "name": account.name,
                    "industry": account.industry,
                    "csm": account.csm,
                    "health_score": account.health_score,
                    "status": account.status
                },
                "news_items": [self._news_item_to_dict(item) for item in news_items] if news_items else [],
                "total_news": len(news_items) if news_items else 0
            })
        
        return results
