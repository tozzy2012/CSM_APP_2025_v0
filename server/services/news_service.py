"""
News Service
Handles fetching and analyzing news for accounts using OpenAI
"""
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from uuid import uuid4

from models import NewsItem, Account
from services.openai_service import OpenAIService


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
        # Check cache first (unless force refresh)
        if not force_refresh:
            cached_news = self._get_cached_news(account_id, max_age_hours=24)
            if cached_news:
                return cached_news
        
        # Get account details
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise ValueError(f"Account {account_id} not found")
        
        # Fetch news using OpenAI
        news_items = await self._fetch_news_from_openai(account)
        
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
        """Fetch news using OpenAI"""
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
                model="gpt-4-turbo-preview",
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
    
    def _build_news_prompt(self, account: Account) -> str:
        """Build prompt for OpenAI to fetch news"""
        company_name = account.name
        industry = account.industry or "tecnologia"
        
        prompt = f"""Busque notícias recentes e relevantes para um Customer Success Manager (CSM) sobre:

**Empresa do Cliente:** {company_name}
**Setor/Indústria:** {industry}

Por favor, retorne notícias dos últimos 30 dias que sejam relevantes para o CSM entender melhor o contexto de negócio do cliente. Inclua:

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
- **published_date**: Data aproximada (formato ISO 8601)
- **insights**: String com insights de negócio para o CSM

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
      "published_date": "2025-11-27T10:00:00Z",
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
                source_type="openai",
                relevance_score=item.get("relevance_score", 50),
                published_date=datetime.fromisoformat(item.get("published_date", datetime.utcnow().isoformat()).replace("Z", "+00:00")),
                news_metadata={"insights": item.get("insights", "")}
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
