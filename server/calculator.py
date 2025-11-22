"""
Health Score Calculator
Lógica de cálculo de health scores baseada em scorecards configuráveis
"""
from typing import Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import httpx
import logging

logger = logging.getLogger(__name__)


class HealthScoreCalculator:
    """Calculadora de Health Score"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def calculate_score(
        self,
        account_id: UUID,
        tenant_id: UUID,
        scorecard: Any
    ) -> Dict[str, Any]:
        """
        Calcular health score baseado no scorecard configurado
        """
        component_scores = {}
        total_score = 0.0
        total_weight = 0.0
        
        # Calcular score para cada componente
        for component in scorecard.components:
            try:
                component_value = await self._calculate_component_score(
                    account_id,
                    tenant_id,
                    component
                )
                
                # Aplicar peso
                weighted_score = component_value * (component.weight / 100.0)
                total_score += weighted_score
                total_weight += component.weight
                
                component_scores[component.name] = {
                    "value": component_value,
                    "weight": component.weight,
                    "weighted_score": weighted_score
                }
            
            except Exception as e:
                logger.error(f"Erro ao calcular componente {component.name}: {e}")
                component_scores[component.name] = {
                    "value": 0,
                    "weight": component.weight,
                    "error": str(e)
                }
        
        # Normalizar score final (0-100)
        if total_weight > 0:
            final_score = (total_score / total_weight) * 100
        else:
            final_score = 0
        
        # Determinar status (Verde, Amarelo, Vermelho)
        status = self._determine_status(final_score)
        
        return {
            "account_id": account_id,
            "tenant_id": tenant_id,
            "scorecard_id": scorecard.scorecard_id,
            "score_value": round(final_score, 2),
            "status": status,
            "component_scores": component_scores,
            "calculated_at": datetime.utcnow()
        }
    
    async def _calculate_component_score(
        self,
        account_id: UUID,
        tenant_id: UUID,
        component: Any
    ) -> float:
        """
        Calcular score de um componente individual
        """
        metric_source = component.metric_source
        calculation_logic = component.calculation_logic
        
        if metric_source == "product_events":
            return await self._calculate_adoption_score(
                account_id, tenant_id, calculation_logic
            )
        
        elif metric_source == "activities":
            return await self._calculate_engagement_score(
                account_id, tenant_id, calculation_logic
            )
        
        elif metric_source == "surveys":
            return await self._calculate_feedback_score(
                account_id, tenant_id, calculation_logic
            )
        
        elif metric_source == "support":
            return await self._calculate_support_score(
                account_id, tenant_id, calculation_logic
            )
        
        elif metric_source == "manual":
            return await self._get_manual_score(
                account_id, tenant_id, calculation_logic
            )
        
        else:
            logger.warning(f"Metric source desconhecido: {metric_source}")
            return 50.0  # Score neutro
    
    async def _calculate_adoption_score(
        self,
        account_id: UUID,
        tenant_id: UUID,
        logic: Dict
    ) -> float:
        """
        Calcular score de adoção de produto
        Busca dados do servico-ingestao-eventos
        """
        try:
            # TODO: Fazer chamada HTTP para servico-ingestao-eventos
            # Por enquanto, retornar valor mockado
            
            # Exemplo de lógica:
            # - Verificar logins nos últimos 7 dias
            # - Verificar uso de features críticas
            # - Comparar com benchmarks
            
            days = logic.get("period_days", 7)
            min_logins = logic.get("min_logins", 5)
            
            # Mock: assumir 80% de adoção
            return 80.0
        
        except Exception as e:
            logger.error(f"Erro ao calcular adoption score: {e}")
            return 50.0
    
    async def _calculate_engagement_score(
        self,
        account_id: UUID,
        tenant_id: UUID,
        logic: Dict
    ) -> float:
        """
        Calcular score de engajamento
        Busca dados do servico-atividades
        """
        try:
            # TODO: Fazer chamada HTTP para servico-atividades
            # Verificar:
            # - Última interação (email, chamada, reunião)
            # - Frequência de interações
            # - Resposta a outreach
            
            max_days_since_contact = logic.get("max_days_since_contact", 14)
            
            # Mock: assumir 70% de engajamento
            return 70.0
        
        except Exception as e:
            logger.error(f"Erro ao calcular engagement score: {e}")
            return 50.0
    
    async def _calculate_feedback_score(
        self,
        account_id: UUID,
        tenant_id: UUID,
        logic: Dict
    ) -> float:
        """
        Calcular score de feedback (NPS, CSAT)
        """
        try:
            # TODO: Buscar últimas respostas de surveys
            # Converter NPS/CSAT para score 0-100
            
            # Mock: assumir NPS de 8 (score 80)
            return 80.0
        
        except Exception as e:
            logger.error(f"Erro ao calcular feedback score: {e}")
            return 50.0
    
    async def _calculate_support_score(
        self,
        account_id: UUID,
        tenant_id: UUID,
        logic: Dict
    ) -> float:
        """
        Calcular score de suporte
        """
        try:
            # TODO: Buscar tickets de suporte
            # Penalizar por tickets críticos abertos
            # Recompensar por resolução rápida
            
            # Mock: assumir 90% (poucos tickets)
            return 90.0
        
        except Exception as e:
            logger.error(f"Erro ao calcular support score: {e}")
            return 50.0
    
    async def _get_manual_score(
        self,
        account_id: UUID,
        tenant_id: UUID,
        logic: Dict
    ) -> float:
        """
        Obter score manual (CSM Pulse)
        """
        try:
            # TODO: Buscar último score manual registrado pelo CSM
            # Retornar valor padrão se não houver
            
            default_value = logic.get("default_value", 50.0)
            return default_value
        
        except Exception as e:
            logger.error(f"Erro ao obter manual score: {e}")
            return 50.0
    
    def _determine_status(self, score: float) -> str:
        """
        Determinar status categórico baseado no score
        """
        if score >= 75:
            return "green"
        elif score >= 50:
            return "yellow"
        else:
            return "red"
