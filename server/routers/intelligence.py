"""
Account Intelligence Router
API endpoints for account analysis and insights
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from services.account_intelligence import AccountIntelligenceService
from services.openai_service import OpenAIService

router = APIRouter(prefix="/api/v1/accounts", tags=["intelligence"])


@router.get("/{account_id}/intelligence")
async def get_account_intelligence(
    account_id: str,
    db: Session = Depends(get_db)
):
    """
    Get aggregated intelligence data for an account
    
    Returns complete context with metrics, risks, and opportunities
    """
    try:
        service = AccountIntelligenceService(db)
        context = await service.build_account_context(account_id)
        return context
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building context: {str(e)}")


@router.post("/{account_id}/analyze")
async def analyze_account_with_ai(
    account_id: str,
    tenant_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Analyze account using AI
    
    Returns intelligent analysis with:
    - Churn risk assessment
    - Expansion opportunities
    - Next best actions
    - Strategic insights
    """
    try:
        # Build context
        intelligence_service = AccountIntelligenceService(db)
        context = await intelligence_service.build_account_context(account_id)
        
        # Analyze with AI
        ai_service = OpenAIService(db, tenant_id)
        analysis = await ai_service.analyze_account(context)
        
        # Combine context and analysis
        return {
            "context": context,
            "ai_analysis": analysis,
            "analyzed_at": context.get("account", {}).get("id")  # TODO: Add timestamp
        }
        
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing account: {str(e)}")
