"""
OpenAI Service
Handles AI analysis of account data using OpenAI's API
"""
import json
import os
from typing import Dict, Optional
from openai import OpenAI, AsyncOpenAI
from sqlalchemy.orm import Session

from models import Tenant


class OpenAIService:
    """Service for interacting with OpenAI API"""
    
    def __init__(self, db: Session, tenant_id: Optional[str] = None):
        self.db = db
        self.tenant_id = tenant_id
        self._openai_key = None
        self._system_prompt = None
        self._creativity_level = 0.5
        
        # Load tenant settings if provided
        if tenant_id:
            self._load_tenant_settings(tenant_id)
    
    def _load_tenant_settings(self, tenant_id: str):
        """Load OpenAI settings from tenant"""
        tenant = self.db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
        
        if tenant and tenant.settings:
            ai_settings = tenant.settings.get('ai', {})
            self._openai_key = ai_settings.get('openaiApiKey')
            self._system_prompt = ai_settings.get('systemPrompt')
            self._creativity_level = ai_settings.get('creativityLevel', 0.5)
    
    def _load_default_tenant_settings(self):
        """Load settings from default tenant"""
        tenant = self.db.query(Tenant).first()
        if tenant and tenant.settings:
            ai_settings = tenant.settings.get('ai', {})
            self._openai_key = ai_settings.get('openaiApiKey')
            self._system_prompt = ai_settings.get('systemPrompt')
            self._creativity_level = ai_settings.get('creativityLevel', 0.5)
    
    async def analyze_account(self, context: Dict) -> Dict:
        """
        Analyze account using OpenAI
        
        Args:
            context: Complete account context from AccountIntelligenceService
            
        Returns:
            AI analysis with insights, risks, recommendations
        """
        # Load default tenant settings if not loaded
        if not self._openai_key:
            self._load_default_tenant_settings()
        
        if not self._openai_key:
            raise ValueError("OpenAI API key not configured. Please add it in Settings > AI.")
        
        # Build prompt
        prompt = self._build_analysis_prompt(context)
        
        # Initialize client
        client = OpenAI(api_key=self._openai_key)
        
        try:
            # Call OpenAI
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=float(self._creativity_level),
                response_format={"type": "json_object"},
                max_tokens=2000
            )
            
            # Parse response
            analysis = json.loads(response.choices[0].message.content)
            
            # Add metadata
            analysis["_metadata"] = {
                "model": "gpt-4-turbo-preview",
                "temperature": self._creativity_level,
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
            
            return analysis
            
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {str(e)}")
    
    def _get_system_prompt(self) -> str:
        """Get system prompt (from settings or default)"""
        if self._system_prompt:
            return self._system_prompt
        
        # Default prompt
        return """Você é um Customer Success Manager Sênior com vasta experiência em retenção de clientes B2B e expansão de receita (Upsell/Cross-sell).

Sua análise deve ser:
1. Estratégica: Focada nos objetivos de negócio do cliente.
2. Baseada em Dados: Utilize as métricas fornecidas para justificar conclusões.
3. Orientada para Ação: Sugira próximos passos claros e playbooks específicos.

Ao analisar contas, identifique proativamente:
- Riscos de Churn (sinais de alerta)
- Oportunidades de Expansão (novos casos de uso)
- Saúde do Relacionamento (engajamento com stakeholders)

Mantenha um tom profissional, consultivo e direto."""
    
    def _build_analysis_prompt(self, context: Dict) -> str:
        """Build analysis prompt from context"""
        account = context.get("account", {})
        financial = context.get("financial", {})
        health = context.get("health", {})
        tasks = context.get("tasks", {})
        activities = context.get("activities", {})
        risks = context.get("risks", [])
        opportunities = context.get("opportunities", [])
        
        # Format risks
        risks_str = "\n".join([
            f"  - [{r['severity'].upper()}] {r['description']}"
            for r in risks
        ]) if risks else "  Nenhum risco detectado automaticamente"
        
        # Format opportunities
        opps_str = "\n".join([
            f"  - [{o['confidence'].upper()}] {o['description']}"
            for o in opportunities
        ]) if opportunities else "  Nenhuma oportunidade detectada automaticamente"
        
        # Format overdue tasks
        overdue_str = "\n".join([
            f"  - [{t['priority'].upper()}] {t['title']} ({t['days_overdue']} dias)"
            for t in tasks.get("overdue_details", [])[:3]
        ]) if tasks.get("overdue", 0) > 0 else "  Sem tarefas atrasadas"
        
        # Format Kickoff Data
        kickoff = context.get("kickoff", {})
        spiced = kickoff.get("spiced", {})
        negotiation = kickoff.get("negotiation", {})
        expectations = kickoff.get("expectations", {})
        
        kickoff_str = f"""
### Kick Off Interno & SPICED
- Vendedor: {kickoff.get('sales_rep', 'N/A')}
- Origem: {kickoff.get('origin', 'N/A')} {f"({kickoff.get('origin_other')})" if kickoff.get('origin') == 'outro' else ''}
- Champion Identificado: {kickoff.get('champion', 'N/A')}

#### SPICED Framework:
- Situation: {spiced.get('situation', 'N/A')}
- Pain: {spiced.get('pain', 'N/A')}
- Impact: {spiced.get('impact', 'N/A')}
- Critical Event: {spiced.get('critical_event', 'N/A')}
- Decision: {spiced.get('decision', 'N/A')}

#### Negociação e Expectativas:
- Negociado com: {negotiation.get('negotiated_with', 'N/A')}
- Detalhes: {negotiation.get('details', 'N/A')}
- Promessas: {negotiation.get('promises', 'N/A')}
- Expectativas: {expectations.get('outcomes', 'N/A')}
- Critérios de Sucesso: {expectations.get('success_criteria', 'N/A')}
- Riscos/Red Flags: {kickoff.get('risks', 'N/A')}
"""

        prompt = f"""Analise profundamente este cliente B2B SaaS:

## DADOS DO CLIENTE

### Informações Básicas
- Nome: {account.get('name', 'N/A')}
- Indústria: {account.get('industry', 'N/A')}
- Tipo: {account.get('type', 'N/A')}
- Status de Saúde: {account.get('health_status', 'N/A')}
- CSM Responsável: {account.get('csm', 'N/A')}

{kickoff_str}

### Financeiro
- MRR Atual: R$ {financial.get('current_mrr', 0):,.2f}
- ARR: R$ {financial.get('arr', 0):,.2f}
- Início do Contrato: {financial.get('contract_start', 'N/A')}
- Fim do Contrato: {financial.get('contract_end', 'N/A')}
- Dias até Renovação: {financial.get('days_to_renewal', 'N/A')}

### Health Score
- Score Atual: {health.get('current_score', 75)}/100
- Status: {health.get('status', 'N/A')}
- Tendência: {health.get('trend', 'N/A')}

### Atividades (Últimos 30 dias)
- Total de Interações: {activities.get('total_30d', 0)}
- Calls: {activities.get('by_type', {}).get('calls', 0)}
- Meetings: {activities.get('by_type', {}).get('meetings', 0)}
- Emails: {activities.get('by_type', {}).get('emails', 0)}
- Última Interação: {activities.get('days_since_last_interaction', 'N/A')} dia(s) atrás
- Frequência: {activities.get('interaction_frequency', 'N/A')}

### Tasks
- Total de Tasks: {tasks.get('total', 0)}
- Abertas: {tasks.get('open', 0)}
- Concluídas: {tasks.get('completed', 0)}
- Atrasadas: {tasks.get('overdue', 0)}
- Taxa de Conclusão (30d): {tasks.get('completion_rate_30d', 0)}%

#### Tasks Atrasadas (Top 3):
{overdue_str}

#### Distribuição por Prioridade:
- Urgente: {tasks.get('by_priority', {}).get('urgent', 0)}
- Alta: {tasks.get('by_priority', {}).get('high', 0)}
- Média: {tasks.get('by_priority', {}).get('medium', 0)}
- Baixa: {tasks.get('by_priority', {}).get('low', 0)}

### Sinais de Risco Detectados (Automático)
{risks_str}

### Oportunidades Detectadas (Automático)
{opps_str}

## ANÁLISE SOLICITADA

Com base nestes dados, forneça uma análise COMPLETA em formato JSON com a seguinte estrutura:

{{
  "summary": "Resumo executivo da situação do cliente (2-3 parágrafos)",
  
  "health_assessment": {{
    "overall_health": "healthy|at_risk|critical",
    "key_strengths": ["força 1", "força 2", "força 3"],
    "key_concerns": ["preocupação 1", "preocupação 2"]
  }},
  
  "churn_risk": {{
    "score": 0-100,
    "level": "low|medium|high|critical",
    "primary_factors": [
      {{"factor": "nome do fator", "impact": "alto|médio|baixo", "description": "detalhes"}}
    ],
    "mitigationactions": [
      {{"action": "ação específica", "priority": "urgent|high|medium", "expected_impact": "descrição"}}
    ]
  }},
  
  "expansion_opportunities": [
    {{
      "type": "upsell|cross-sell|expansion",
      "description": "descrição detalhada",
      "estimated_value": 1000,
      "confidence": "high|medium|low",
      "next_steps": ["passo 1", "passo 2"]
    }}
  ],
  
  "next_best_actions": [
    {{
      "action": "ação específica e clara",
      "rationale": "porque esta ação é importante agora",
      "timeline": "imediato|esta semana|este mês",
      "expected_outcome": "resultado esperado"
    }}
  ],
  
  "strategic_insights": [
    "insight estratégico 1 baseado em padrões dos dados",
    "insight estratégico 2 que o CSM pode não ter percebido",
    "insight estratégico 3 relacionando múltiplas dimensões"
  ]
}}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois."""
        
    def generate_playbook(self, topic: str, category: str) -> str:
        """
        Generate a playbook using OpenAI
        
        Args:
            topic: The topic of the playbook
            category: The category of the playbook
            
        Returns:
            HTML content of the playbook
        """
        # Load default tenant settings if not loaded
        if not self._openai_key:
            self._load_default_tenant_settings()
        
        if not self._openai_key:
            raise ValueError("OpenAI API key not configured. Please add it in Settings > AI.")
            
        # Initialize client
        client = OpenAI(api_key=self._openai_key)
        
        prompt = f"""
        Crie um playbook detalhado e estruturado para Customer Success sobre o tema: "{topic}".
        Categoria: {category}
        
        INSTRUÇÕES:
        1. Use as melhores práticas de Customer Success baseadas nos principais autores da área (como Lincoln Murphy, Gainsight, etc).
        2. O conteúdo deve ser altamente prático e acionável.
        3. Formate a saída EXCLUSIVAMENTE como HTML válido para ser inserido em um editor de texto rico.
        4. Use tags como <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>.
        5. NÃO inclua tags <html>, <head> ou <body>. Apenas o conteúdo do corpo.
        6. Estruture com:
           - Objetivo do Playbook
           - Gatilhos de Entrada (Quando usar)
           - Stakeholders Envolvidos
           - Passo a Passo Detalhado (Fases)
           - KPIs de Sucesso
           - Gatilhos de Saída
           - Templates de Email (se aplicável)
           
        Seja criativo, profissional e direto.
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "Você é um especialista mundial em Customer Success e operações de CS. Você cria playbooks de classe mundial."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000
            )
            
            content = response.choices[0].message.content
            
            # Remove markdown code blocks if present
            if content.startswith("```html"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            return content.strip()
            
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {str(e)}")

