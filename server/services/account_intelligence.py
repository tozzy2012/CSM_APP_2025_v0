"""
Account Intelligence Service
Aggregates and prepares account data for AI analysis
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from decimal import Decimal

from models import Account, Task, Activity, HealthScoreEvaluation
import crud


class AccountIntelligenceService:
    """Service for aggregating and preparing account data for AI analysis"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def build_account_context(self, account_id: str) -> Dict:
        """
        Builds complete context for an account
        
        Args:
            account_id: Account ID
            
        Returns:
            Dict with complete account context
        """
        # Get base account data
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise ValueError(f"Account {account_id} not found")
        
        # Build context
        # Build context
        try:
            import logging
            logger = logging.getLogger(__name__)
            
            logger.info(f"Building context for account {account_id}")
            
            account_data = self._get_account_data(account)
            logger.info("Got account data")
            
            financial = await self._get_financial_metrics(account)
            logger.info("Got financial metrics")
            
            health = await self._get_health_metrics(account)
            logger.info("Got health metrics")
            
            tasks = await self._get_task_metrics(account_id)
            logger.info("Got task metrics")
            
            activities = await self._get_activity_metrics(account_id)
            logger.info("Got activity metrics")
            
            engagement = await self._get_engagement_metrics(account_id)
            logger.info("Got engagement metrics")
            
            kickoff = self._get_kickoff_data(account)
            logger.info("Got kickoff data")

            context = {
                "account": account_data,
                "financial": financial,
                "health": health,
                "tasks": tasks,
                "activities": activities,
                "engagement": engagement,
                "tags": account.tags if hasattr(account, 'tags') else [],
                "kickoff": kickoff,
            }
        except Exception as e:
            import traceback
            logger.error(f"Error building context: {str(e)}")
            logger.error(traceback.format_exc())
            raise e
        
        # Detect risks and opportunities
        context["risks"] = await self._detect_risks(context)
        context["opportunities"] = await self._detect_opportunities(context)
        
        return context
    
    def _get_account_data(self, account: Account) -> Dict:
        """Extract basic account information"""
        return {
            "id": account.id,
            "name": account.name,
            "industry": account.industry,
            "type": account.type,
            "health_status": account.health_status,
            "csm": account.csm,
            "website": account.website,
            "created_at": account.created_at.isoformat() if account.created_at else None,
        }

    def _get_kickoff_data(self, account: Account) -> Dict:
        """Extract kickoff and SPICED information"""
        if not account.internal_kickoff:
            return {}
            
        k = account.internal_kickoff
        return {
            "sales_rep": k.get("salesRep"),
            "origin": k.get("saleOrigin"),
            "origin_other": k.get("saleOriginOther"),
            "negotiation": {
                "negotiated_with": k.get("negotiatedWith"),
                "details": k.get("negotiationDetails"),
                "promises": k.get("promisesMade"),
            },
            "expectations": {
                "outcomes": k.get("expectedOutcomes"),
                "success_criteria": k.get("successCriteria"),
            },
            "spiced": {
                "situation": k.get("customerSituation"),
                "pain": k.get("painPoints"),
                "impact": k.get("businessImpact"),
                "critical_event": k.get("criticalDeadline"),
                "decision": k.get("decisionCriteria"),
            },
            "risks": k.get("redFlags"),
            "champion": k.get("championIdentified"),
        }
    
    async def _get_financial_metrics(self, account: Account) -> Dict:
        """Calculate financial metrics and trends"""
        current_mrr = float(account.mrr) if account.mrr else 0.0
        
        # Calculate days to renewal
        days_to_renewal = None
        if account.contract_end:
            days_to_renewal = (account.contract_end - datetime.now().date()).days
        
        return {
            "current_mrr": current_mrr,
            "arr": current_mrr * 12,
            "contract_start": account.contract_start.isoformat() if account.contract_start else None,
            "contract_end": account.contract_end.isoformat() if account.contract_end else None,
            "days_to_renewal": days_to_renewal,
            # TODO: Add trend calculations when we have historical data
            "trend_30d": 0,
            "trend_60d": 0,
            "trend_90d": 0,
        }
    
    async def _get_health_metrics(self, account: Account) -> Dict:
        """Get health score metrics including latest evaluation details"""
        # Fetch latest health score evaluation
        latest_evaluation = crud.get_latest_health_score_evaluation(self.db, account.id)
        
        # Use evaluation score if available, otherwise default to 75
        current_score = latest_evaluation.total_score if latest_evaluation else 75
        
        health_data = {
            "current_score": current_score,
            "status": account.health_status or "green",
            "trend": "stable",  # TODO: Calculate from historical data
            "breakdown": {
                "product_usage": current_score,
                "engagement": current_score,
                "relationship": current_score,
                "financial_health": current_score,
            }
        }
        
        # Add detailed evaluation data if available
        if latest_evaluation:
            health_data["latest_evaluation"] = {
                "evaluated_by": latest_evaluation.evaluated_by,
                "evaluation_date": latest_evaluation.evaluation_date.isoformat() if latest_evaluation.evaluation_date else None,
                "classification": latest_evaluation.classification,
                "total_score": latest_evaluation.total_score,
                "responses": latest_evaluation.responses or {},
                "pilar_scores": latest_evaluation.pilar_scores or {},
            }
            
            # Update breakdown with pilar scores if available
            if latest_evaluation.pilar_scores:
                pilar_mapping = {
                    "Adoção e Engajamento": "product_usage",
                    "Percepção de Valor": "engagement", 
                    "Relacionamento e Satisfação": "relationship",
                    "Saúde Operacional": "financial_health",
                }
                for pilar_name, metric_key in pilar_mapping.items():
                    if pilar_name in latest_evaluation.pilar_scores:
                        health_data["breakdown"][metric_key] = latest_evaluation.pilar_scores[pilar_name]
        
        return health_data
    
    async def _get_task_metrics(self, account_id: str) -> Dict:
        """Aggregate task metrics"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        
        # Get all tasks for this account
        tasks = self.db.query(Task).filter(Task.account_id == account_id).all()
        
        total = len(tasks)
        open_tasks = [t for t in tasks if t.status in ['todo', 'in-progress']]
        completed = [t for t in tasks if t.status == 'completed']
        overdue = [t for t in open_tasks if t.due_date and t.due_date < now]
        
        # Count by priority
        by_priority = {
            "urgent": len([t for t in open_tasks if t.priority == 'urgent']),
            "high": len([t for t in open_tasks if t.priority == 'high']),
            "medium": len([t for t in open_tasks if t.priority == 'medium']),
            "low": len([t for t in open_tasks if t.priority == 'low']),
        }
        
        # Overdue details
        overdue_details = [
            {
                "title": t.title,
                "priority": t.priority,
                "days_overdue": (now - t.due_date).days if t.due_date else 0
            }
            for t in sorted(overdue, key=lambda x: x.due_date if x.due_date else now)[:5]
        ]
        
        return {
            "total": total,
            "open": len(open_tasks),
            "completed": len(completed),
            "overdue": len(overdue),
            "completion_rate_30d": self._calculate_completion_rate(tasks, 30),
            "by_priority": by_priority,
            "overdue_details": overdue_details,
        }
    
    async def _get_activity_metrics(self, account_id: str) -> Dict:
        """Aggregate activity metrics"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        
        # Get activities from last 30 days
        activities = self.db.query(Activity).filter(
            and_(
                Activity.account_id == account_id,
                Activity.created_at >= thirty_days_ago
            )
        ).all()
        
        # Count by type
        by_type = {}
        for activity_type in ['call', 'meeting', 'email', 'note', 'system']:
            by_type[f"{activity_type}s"] = len([a for a in activities if a.type == activity_type])
        
        # Find last interaction
        last_interaction = None
        days_ago = None
        if activities:
            latest = max(activities, key=lambda a: a.created_at)
            last_interaction = {
                "type": latest.type,
                "date": latest.created_at.isoformat(),
                "title": latest.title,
            }
            days_ago = (now - latest.created_at).days
        
        return {
            "total_30d": len(activities),
            "by_type": by_type,
            "last_interaction": last_interaction,
            "days_since_last_interaction": days_ago,
            "interaction_frequency": self._classify_frequency(len(activities)),
        }
    
    async def _get_engagement_metrics(self, account_id: str) -> Dict:
        """Get engagement metrics (placeholder for now)"""
        # TODO: Integrate with product usage data when available
        return {
            "data_available": False,
            "note": "Product usage tracking not yet implemented"
        }
    
    async def _detect_risks(self, context: Dict) -> List[Dict]:
        """Detect risk signals based on heuristics"""
        risks = []
        
        # Health score declining
        health = context.get("health", {})
        if health.get("current_score", 100) < 70:
            risks.append({
                "type": "low_health_score",
                "severity": "high" if health["current_score"] < 60 else "medium",
                "description": f"Health score está em {health['current_score']}/100",
                "detected_at": datetime.now().isoformat()
            })
        
        # Overdue tasks
        tasks = context.get("tasks", {})
        if tasks.get("overdue", 0) > 0:
            severity = "high" if tasks["overdue"] > 3 else "medium"
            risks.append({
                "type": "overdue_tasks",
                "severity": severity,
                "description": f"{tasks['overdue']} task(s) atrasada(s)",
                "detected_at": datetime.now().isoformat()
            })
        
        # Low activity
        activities = context.get("activities", {})
        if activities.get("total_30d", 0) < 5:
            risks.append({
                "type": "low_engagement",
                "severity": "medium",
                "description": f"Apenas {activities['total_30d']} interações nos últimos 30 dias",
                "detected_at": datetime.now().isoformat()
            })
        
        # No recent interaction
        days_since = activities.get("days_since_last_interaction")
        if days_since and days_since > 14:
            risks.append({
                "type": "no_recent_contact",
                "severity": "high",
                "description": f"Última interação há {days_since} dias",
                "detected_at": datetime.now().isoformat()
            })
        
        # Contract renewal approaching
        financial = context.get("financial", {})
        days_to_renewal = financial.get("days_to_renewal")
        if days_to_renewal and 0 < days_to_renewal < 60:
            risks.append({
                "type": "renewal_approaching",
                "severity": "medium",
                "description": f"Renovação em {days_to_renewal} dias",
                "detected_at": datetime.now().isoformat()
            })
        
        return risks
    
    async def _detect_opportunities(self, context: Dict) -> List[Dict]:
        """Detect expansion opportunities"""
        opportunities = []
        
        # High health score
        health = context.get("health", {})
        if health.get("current_score", 0) > 85:
            opportunities.append({
                "type": "upsell",
                "description": "Cliente com alta satisfação - momento ideal para upsell",
                "confidence": "high",
                "estimated_value": None
            })
        
        # High MRR with good engagement
        financial = context.get("financial", {})
        activities = context.get("activities", {})
        if financial.get("current_mrr", 0) > 3000 and activities.get("total_30d", 0) > 10:
            opportunities.append({
                "type": "expansion",
                "description": "Cliente engajado com alto MRR - potencial para expansion",
                "confidence": "medium",
                "estimated_value": financial["current_mrr"] * 0.3  # 30% expansion potential
            })
        
        return opportunities
    
    def _calculate_completion_rate(self, tasks: List[Task], days: int) -> float:
        """Calculate task completion rate for the last N days"""
        if not tasks:
            return 0.0
        
        from datetime import timezone
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        recent_tasks = [t for t in tasks if t.created_at and t.created_at >= cutoff]
        
        if not recent_tasks:
            return 0.0
        
        completed = len([t for t in recent_tasks if t.status == 'completed'])
        return round((completed / len(recent_tasks)) * 100, 1)
    
    def _classify_frequency(self, count: int) -> str:
        """Classify interaction frequency"""
        if count >= 20:
            return "very_high"
        elif count >= 10:
            return "high"
        elif count >= 5:
            return "medium"
        elif count > 0:
            return "low"
        else:
            return "none"
