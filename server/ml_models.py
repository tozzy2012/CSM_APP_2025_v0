"""
Modelos de Machine Learning
Churn Prediction e Expansion Detection
"""
import logging
import numpy as np
from typing import Dict, Any
import joblib
import os

logger = logging.getLogger(__name__)


class ChurnPredictor:
    """
    Modelo de Previsão de Churn
    Em produção, carregar modelo treinado (.pkl ou .joblib)
    """
    
    def __init__(self, model_path: str = None):
        self.version = "1.0.0"
        self.model = None
        self.model_path = model_path or os.getenv("CHURN_MODEL_PATH")
        
        # Tentar carregar modelo treinado
        if self.model_path and os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Modelo de churn carregado: {self.model_path}")
            except Exception as e:
                logger.warning(f"Erro ao carregar modelo de churn: {e}")
                self.model = None
        else:
            logger.warning("Modelo de churn não encontrado, usando heurísticas")
    
    def predict(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prever probabilidade de churn
        
        Args:
            account_data: Dicionário com features da account
        
        Returns:
            Dict com probability, risk_level e factors
        """
        if self.model:
            # Usar modelo treinado
            return self._predict_with_model(account_data)
        else:
            # Usar heurísticas (fallback)
            return self._predict_with_heuristics(account_data)
    
    def _predict_with_model(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Previsão usando modelo ML treinado"""
        try:
            # Preparar features
            features = self._prepare_features(account_data)
            
            # Fazer previsão
            probability = float(self.model.predict_proba(features)[0][1])
            
            # Determinar risk level
            risk_level = self._determine_risk_level(probability)
            
            # Obter feature importance (se disponível)
            factors = self._get_contributing_factors(account_data, features)
            
            return {
                "probability": probability,
                "risk_level": risk_level,
                "factors": factors
            }
        
        except Exception as e:
            logger.error(f"Erro na previsão com modelo: {e}")
            return self._predict_with_heuristics(account_data)
    
    def _predict_with_heuristics(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Previsão usando regras heurísticas (fallback)
        Baseado em sinais conhecidos de churn
        """
        churn_score = 0.0
        factors = []
        
        # Fator 1: Health Score baixo
        health_score = account_data.get("health_score", 100)
        if health_score < 50:
            churn_score += 0.3
            factors.append({"factor": "health_score_low", "impact": 0.3, "value": health_score})
        elif health_score < 70:
            churn_score += 0.15
            factors.append({"factor": "health_score_medium", "impact": 0.15, "value": health_score})
        
        # Fator 2: Falta de engajamento
        days_since_contact = account_data.get("days_since_last_contact", 0)
        if days_since_contact > 30:
            churn_score += 0.25
            factors.append({"factor": "no_recent_contact", "impact": 0.25, "value": days_since_contact})
        elif days_since_contact > 14:
            churn_score += 0.1
            factors.append({"factor": "infrequent_contact", "impact": 0.1, "value": days_since_contact})
        
        # Fator 3: Baixa adoção de produto
        adoption_rate = account_data.get("adoption_rate", 1.0)
        if adoption_rate < 0.3:
            churn_score += 0.25
            factors.append({"factor": "low_adoption", "impact": 0.25, "value": adoption_rate})
        elif adoption_rate < 0.5:
            churn_score += 0.1
            factors.append({"factor": "medium_adoption", "impact": 0.1, "value": adoption_rate})
        
        # Fator 4: Tickets de suporte abertos
        support_tickets = account_data.get("support_tickets_open", 0)
        if support_tickets > 3:
            churn_score += 0.2
            factors.append({"factor": "many_support_tickets", "impact": 0.2, "value": support_tickets})
        
        # Normalizar para 0-1
        probability = min(churn_score, 1.0)
        risk_level = self._determine_risk_level(probability)
        
        return {
            "probability": probability,
            "risk_level": risk_level,
            "factors": factors
        }
    
    def _prepare_features(self, account_data: Dict[str, Any]) -> np.ndarray:
        """Preparar features para o modelo"""
        # Exemplo de features
        features = [
            account_data.get("health_score", 50) / 100.0,
            account_data.get("days_since_last_contact", 0) / 30.0,
            account_data.get("adoption_rate", 0.5),
            account_data.get("support_tickets_open", 0) / 10.0,
        ]
        return np.array(features).reshape(1, -1)
    
    def _get_contributing_factors(self, account_data: Dict[str, Any], features: np.ndarray) -> list:
        """Obter fatores que contribuem para o churn"""
        # Simplificado - em produção, usar SHAP ou feature importance
        return [
            {"factor": "health_score", "impact": 0.3},
            {"factor": "engagement", "impact": 0.25},
            {"factor": "adoption", "impact": 0.25},
            {"factor": "support", "impact": 0.2}
        ]
    
    def _determine_risk_level(self, probability: float) -> str:
        """Determinar nível de risco categórico"""
        if probability >= 0.75:
            return "critical"
        elif probability >= 0.5:
            return "high"
        elif probability >= 0.25:
            return "medium"
        else:
            return "low"


class ExpansionDetector:
    """
    Detector de Oportunidades de Expansão
    Identifica sinais de upsell e cross-sell
    """
    
    def __init__(self, model_path: str = None):
        self.version = "1.0.0"
        self.model = None
        self.model_path = model_path or os.getenv("EXPANSION_MODEL_PATH")
        
        if self.model_path and os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Modelo de expansão carregado: {self.model_path}")
            except Exception as e:
                logger.warning(f"Erro ao carregar modelo de expansão: {e}")
                self.model = None
        else:
            logger.warning("Modelo de expansão não encontrado, usando heurísticas")
    
    def detect(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detectar oportunidade de expansão
        
        Returns:
            Dict com type, confidence, reasoning e signals
        """
        if self.model:
            return self._detect_with_model(account_data)
        else:
            return self._detect_with_heuristics(account_data)
    
    def _detect_with_model(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detecção usando modelo ML"""
        # TODO: Implementar quando modelo estiver treinado
        return self._detect_with_heuristics(account_data)
    
    def _detect_with_heuristics(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detecção usando regras heurísticas
        Sinais de expansão:
        - Alta adoção (power users)
        - Health score alto
        - Engajamento frequente
        - Uso próximo ao limite de licenças
        """
        confidence = 0.0
        signals = []
        opportunity_type = "upsell"
        
        # Sinal 1: Alta adoção
        adoption_rate = account_data.get("adoption_rate", 0.5)
        if adoption_rate > 0.8:
            confidence += 0.3
            signals.append({"signal": "high_adoption", "value": adoption_rate})
        
        # Sinal 2: Health score alto
        health_score = account_data.get("health_score", 50)
        if health_score > 80:
            confidence += 0.25
            signals.append({"signal": "high_health_score", "value": health_score})
        
        # Sinal 3: Uso de licenças próximo ao limite
        licenses_used = account_data.get("licenses_active", 0)
        licenses_total = account_data.get("licenses_purchased", 1)
        if licenses_total > 0:
            usage_ratio = licenses_used / licenses_total
            if usage_ratio > 0.9:
                confidence += 0.3
                signals.append({"signal": "high_license_usage", "value": usage_ratio})
                opportunity_type = "add_licenses"
        
        # Sinal 4: Engajamento positivo
        days_since_contact = account_data.get("days_since_last_contact", 30)
        if days_since_contact < 7:
            confidence += 0.15
            signals.append({"signal": "recent_engagement", "value": days_since_contact})
        
        # Estimar valor da oportunidade
        current_mrr = account_data.get("mrr", 0)
        estimated_value = current_mrr * 0.3  # 30% de aumento estimado
        
        reasoning = self._generate_reasoning(signals, opportunity_type)
        
        return {
            "type": opportunity_type,
            "confidence": min(confidence, 1.0),
            "estimated_value": estimated_value,
            "reasoning": reasoning,
            "signals": signals
        }
    
    def _generate_reasoning(self, signals: list, opportunity_type: str) -> str:
        """Gerar explicação textual da oportunidade"""
        signal_descriptions = {
            "high_adoption": "Alto uso do produto indica satisfação e potencial para upgrade",
            "high_health_score": "Cliente saudável com baixo risco de churn",
            "high_license_usage": "Uso de licenças próximo ao limite indica necessidade de expansão",
            "recent_engagement": "Engajamento recente facilita conversas sobre expansão"
        }
        
        reasons = [signal_descriptions.get(s["signal"], "") for s in signals if s["signal"] in signal_descriptions]
        
        return ". ".join(reasons) + "."
