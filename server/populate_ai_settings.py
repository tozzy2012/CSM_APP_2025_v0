import requests
import json

SENIOR_CSM_PROMPT = """Você é um Customer Success Manager Sênior com vasta experiência em retenção de clientes B2B e expansão de receita (Upsell/Cross-sell).

Sua análise deve ser:
1. Estratégica: Focada nos objetivos de negócio do cliente.
2. Baseada em Dados: Utilize as métricas fornecidas para justificar conclusões.
3. Orientada para Ação: Sugira próximos passos claros e playbooks específicos.

Ao analisar contas, identifique proativamente:
- Riscos de Churn (sinais de alerta)
- Oportunidades de Expansão (novos casos de uso)
- Saúde do Relacionamento (engajamento com stakeholders)

Mantenha um tom profissional, consultivo e direto."""

def update_settings():
    # Get default tenant
    response = requests.get("http://localhost:8000/api/v1/tenants/default")
    if response.status_code != 200:
        print(f"Error getting tenant: {response.text}")
        return

    tenant = response.json()
    tenant_id = tenant["tenant_id"]
    
    # Update settings
    new_settings = {
        "ai": {
            "openaiApiKey": "", # Keep empty or preserve if exists
            "systemPrompt": SENIOR_CSM_PROMPT,
            "creativityLevel": 0.5
        }
    }
    
    # Preserve existing API key if any (though currently empty)
    if "ai" in tenant.get("settings", {}):
        new_settings["ai"]["openaiApiKey"] = tenant["settings"]["ai"].get("openaiApiKey", "")

    update_response = requests.put(
        f"http://localhost:8000/api/v1/tenants/{tenant_id}",
        json={"settings": new_settings}
    )
    
    if update_response.status_code == 200:
        print("Successfully updated tenant settings with Senior CSM prompt.")
        print(json.dumps(update_response.json(), indent=2))
    else:
        print(f"Error updating tenant: {update_response.text}")

if __name__ == "__main__":
    update_settings()
