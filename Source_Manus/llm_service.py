"""
Serviço de LLM (Large Language Model)
Integração com OpenAI para IA Generativa
"""
import os
import logging
from typing import Dict, Any, List
from openai import OpenAI

logger = logging.getLogger(__name__)


class LLMService:
    """
    Serviço de IA Generativa usando OpenAI
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OPENAI_API_KEY não configurada")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
        
        # Configurações
        self.model = "gpt-4.1-mini"  # Modelo configurado no ambiente
        self.temperature = 0.7
        self.max_tokens = 500
    
    async def generate_nba(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gerar recomendação de Next-Best-Action usando LLM
        
        Args:
            context: Contexto da account (health score, atividades, etc.)
        
        Returns:
            Dict com action_type, priority, reasoning
        """
        if not self.client:
            return self._fallback_nba(context)
        
        try:
            # Construir prompt
            prompt = self._build_nba_prompt(context)
            
            # Chamar LLM
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente de Customer Success especializado em recomendar ações para CSMs. Analise o contexto do cliente e sugira a próxima melhor ação."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Parsear resposta
            content = response.choices[0].message.content
            
            # Extrair ação e prioridade (simplificado)
            action_type, priority, reasoning = self._parse_nba_response(content)
            
            return {
                "action_type": action_type,
                "priority": priority,
                "reasoning": reasoning,
                "context": {"llm_response": content}
            }
        
        except Exception as e:
            logger.error(f"Erro ao gerar NBA com LLM: {e}")
            return self._fallback_nba(context)
    
    async def summarize_activities(self, activities: List[Dict]) -> str:
        """
        Sumarizar atividades (emails, chamadas, notas) usando LLM
        
        Args:
            activities: Lista de atividades
        
        Returns:
            String com sumarização
        """
        if not self.client or not activities:
            return "Nenhuma atividade para sumarizar."
        
        try:
            # Construir prompt
            prompt = self._build_summarization_prompt(activities)
            
            # Chamar LLM
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente que sumariza interações com clientes de forma concisa e informativa."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,  # Mais determinístico para sumarização
                max_tokens=300
            )
            
            summary = response.choices[0].message.content
            return summary
        
        except Exception as e:
            logger.error(f"Erro ao sumarizar atividades com LLM: {e}")
            return "Erro ao gerar sumarização."
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analisar sentimento de texto (emails, tickets)
        
        Returns:
            Dict com sentiment (positive, neutral, negative) e score
        """
        if not self.client:
            return {"sentiment": "neutral", "score": 0.5}
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Analise o sentimento do texto e responda apenas com: positive, neutral ou negative."
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                temperature=0.3,
                max_tokens=10
            )
            
            sentiment = response.choices[0].message.content.strip().lower()
            
            # Mapear para score
            score_map = {"positive": 0.8, "neutral": 0.5, "negative": 0.2}
            score = score_map.get(sentiment, 0.5)
            
            return {"sentiment": sentiment, "score": score}
        
        except Exception as e:
            logger.error(f"Erro ao analisar sentimento: {e}")
            return {"sentiment": "neutral", "score": 0.5}
    
    def _build_nba_prompt(self, context: Dict[str, Any]) -> str:
        """Construir prompt para NBA"""
        prompt = f"""
Analise o seguinte cliente e recomende a próxima melhor ação para o CSM:

Health Score: {context.get('health_score', 'N/A')}
Dias desde último contato: {context.get('days_since_last_contact', 'N/A')}
Taxa de adoção: {context.get('adoption_rate', 'N/A')}
Tickets de suporte abertos: {context.get('support_tickets_open', 'N/A')}

Forneça:
1. Tipo de ação recomendada (call, email, schedule_qbr, send_playbook, etc.)
2. Prioridade (low, medium, high, urgent)
3. Justificativa detalhada

Responda em formato estruturado.
"""
        return prompt
    
    def _build_summarization_prompt(self, activities: List[Dict]) -> str:
        """Construir prompt para sumarização"""
        activities_text = "\n".join([
            f"- {act.get('activity_type', 'activity')}: {act.get('subject', '')} - {act.get('description', '')[:100]}"
            for act in activities[:20]  # Limitar a 20 atividades
        ])
        
        prompt = f"""
Sumarize as seguintes interações com o cliente nos últimos dias:

{activities_text}

Forneça um resumo conciso destacando:
- Principais tópicos discutidos
- Status do relacionamento
- Próximos passos mencionados
- Quaisquer preocupações ou riscos
"""
        return prompt
    
    def _parse_nba_response(self, content: str) -> tuple:
        """Parsear resposta do LLM para NBA"""
        # Simplificado - em produção, usar parsing mais robusto
        content_lower = content.lower()
        
        # Determinar action_type
        if "call" in content_lower or "ligar" in content_lower:
            action_type = "call"
        elif "email" in content_lower:
            action_type = "email"
        elif "qbr" in content_lower or "reunião" in content_lower:
            action_type = "schedule_qbr"
        else:
            action_type = "follow_up"
        
        # Determinar priority
        if "urgent" in content_lower or "crítico" in content_lower:
            priority = "urgent"
        elif "high" in content_lower or "alta" in content_lower:
            priority = "high"
        elif "low" in content_lower or "baixa" in content_lower:
            priority = "low"
        else:
            priority = "medium"
        
        reasoning = content
        
        return action_type, priority, reasoning
    
    def _fallback_nba(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """NBA fallback quando LLM não está disponível"""
        health_score = context.get("health_score", 50)
        days_since_contact = context.get("days_since_last_contact", 0)
        
        if health_score < 50:
            return {
                "action_type": "call",
                "priority": "urgent",
                "reasoning": "Health score baixo requer contato imediato para entender problemas.",
                "context": {}
            }
        elif days_since_contact > 14:
            return {
                "action_type": "email",
                "priority": "medium",
                "reasoning": "Cliente sem contato recente, enviar email de check-in.",
                "context": {}
            }
        else:
            return {
                "action_type": "follow_up",
                "priority": "low",
                "reasoning": "Cliente estável, manter acompanhamento regular.",
                "context": {}
            }
