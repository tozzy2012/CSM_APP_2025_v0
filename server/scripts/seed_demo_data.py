import sys
import os
import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
import json

# Add parent directory to path so we can import from server
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Client, Account, Activity, Task, HealthScoreEvaluation, User

def seed_demo_data():
    db = SessionLocal()
    print("Iniciando enriquecimento de dados para demo...")

    # 1. Get CSMs
    csms = db.query(User).all()
    if not csms:
        print("Nenhum usuário encontrado. Criando usuários fictícios...")
        csm_ids = ["user1", "user2", "user3"]
        csm_names = ["Ricardo Lange", "Ariádne Bognar", "Carlos Eduardo"]
    else:
        csm_ids = [u.id for u in csms]
        csm_names = [u.name for u in csms]
        while len(csm_ids) < 3:
             csm_ids.append(csm_ids[0])
             csm_names.append(csm_names[0])

    print(f"Distribuindo contas entre: {csm_names}")

    # 2. Get Accounts
    accounts = db.query(Account).all()
    print(f"Encontradas {len(accounts)} contas.")

    # Activity Templates
    activity_types = ["call", "meeting", "email", "note"]
    activity_titles = [
        "Reunião Mensal de Resultados",
        "QBR - Quarter Business Review",
        "Alinhamento de Estratégia",
        "Treinamento de Novos Usuários",
        "Follow-up sobre Renovação",
        "Discussão sobre Nova Feature",
        "Resolução de Incidente",
        "Planejamento de Expansão",
        "Check-in Semanal",
        "Apresentação de Roadmap"
    ]
    
    # Task Templates
    task_titles = [
        "Preparar apresentação para QBR",
        "Enviar proposta de renovação",
        "Agendar treinamento com time de marketing",
        "Analisar métricas de uso do último mês",
        "Atualizar plano de sucesso",
        "Responder email do CEO",
        "Verificar status do ticket de suporte",
        "Criar playbook de onboarding",
        "Mapear novos stakeholders",
        "Enviar convite para evento anual"
    ]

    # Health Score Questions Configuration (from HealthScoreSettings.tsx)
    questions_config = [
        {"id": "1", "category": "Adoção", "weight": 10},
        {"id": "2", "category": "Adoção", "weight": 15},
        {"id": "3", "category": "Valor", "weight": 15},
        {"id": "4", "category": "Valor", "weight": 15},
        {"id": "5", "category": "Relacionamento", "weight": 10},
        {"id": "6", "category": "Relacionamento", "weight": 10},
        {"id": "7", "category": "Operacional", "weight": 8},
        {"id": "8", "category": "Operacional", "weight": 7},
        {"id": "9", "category": "Crescimento", "weight": 5},
        {"id": "10", "category": "Crescimento", "weight": 5},
    ]

    for i, account in enumerate(accounts):
        # A. Distribute CSMs
        csm_idx = i % len(csm_ids)
        account.csm = csm_names[csm_idx]
        current_csm_id = csm_ids[csm_idx]

        # B. Update Contract End Date (Future)
        days_future = random.randint(30, 730)
        account.contract_end = (datetime.now() + timedelta(days=days_future)).date()
        
        # Cleanup existing demo data for this account to avoid duplicates on re-run
        db.query(Activity).filter(Activity.account_id == account.id).delete()
        db.query(Task).filter(Task.account_id == account.id).delete()
        db.query(HealthScoreEvaluation).filter(HealthScoreEvaluation.account_id == account.id).delete()

        # C. Generate Activities (Past and Future)
        for _ in range(random.randint(5, 10)):
            act_date = datetime.now() - timedelta(days=random.randint(1, 180))
            activity = Activity(
                id=str(uuid.uuid4()),
                account_id=account.id,
                title=random.choice(activity_titles),
                description="Atividade registrada automaticamente para fins de demonstração.",
                type=random.choice(activity_types),
                status="completed",
                assignee=current_csm_id,
                due_date=act_date,
                completed_at=act_date,
                created_at=act_date,
                created_by=current_csm_id
            )
            db.add(activity)

        for _ in range(random.randint(1, 3)):
            act_date = datetime.now() + timedelta(days=random.randint(1, 30))
            activity = Activity(
                id=str(uuid.uuid4()),
                account_id=account.id,
                title=random.choice(activity_titles),
                description="Atividade agendada.",
                type=random.choice(activity_types),
                status="pending",
                assignee=current_csm_id,
                due_date=act_date,
                created_at=datetime.now(),
                created_by=current_csm_id
            )
            db.add(activity)

        # D. Generate Tasks
        for _ in range(random.randint(2, 5)):
            due_date = datetime.now() + timedelta(days=random.randint(-5, 15))
            status = "completed" if due_date < datetime.now() else "todo"
            task = Task(
                id=str(uuid.uuid4()),
                account_id=account.id,
                title=random.choice(task_titles),
                description="Tarefa gerada para demo.",
                status=status,
                priority=random.choice(["low", "medium", "high", "urgent"]),
                assignee=current_csm_id,
                due_date=due_date,
                completed_at=due_date if status == "completed" else None,
                created_at=datetime.now(),
                created_by=current_csm_id
            )
            db.add(task)

        # E. Generate Historical Health Scores (Retroactive)
        # Generate 6 months of history
        base_target = random.randint(40, 90)
        trend = random.choice([-1, 0, 1]) # Improving, Stable, Worsening
        
        final_score = 0
        final_classification = ""

        for month_offset in range(6, -1, -1): # 6 months ago to now
            eval_date = datetime.now() - timedelta(days=month_offset * 30)
            
            # Fluctuate target score
            change = random.randint(-5, 10) if trend == 1 else random.randint(-10, 5)
            if trend == 0: change = random.randint(-5, 5)
            
            current_target = max(0, min(100, base_target + change))
            base_target = current_target # Update base for next iteration
            
            # Generate responses that average to current_target
            responses = {}
            pilar_sums = {}
            pilar_counts = {}
            weighted_sum = 0
            total_weight = 0

            for q in questions_config:
                # Generate a score close to the target, with some variance
                # Variance is higher for middle scores, lower for extremes
                variance = random.randint(-15, 15)
                q_score = max(0, min(100, current_target + variance))
                
                responses[q["id"]] = q_score
                
                weighted_sum += q_score * q["weight"]
                total_weight += q["weight"]
                
                # Track pilar stats
                cat = q["category"]
                if cat not in pilar_sums:
                    pilar_sums[cat] = 0
                    pilar_counts[cat] = 0
                pilar_sums[cat] += q_score
                pilar_counts[cat] += 1

            # Calculate actual total score from weighted average
            calculated_score = int(weighted_sum / total_weight) if total_weight > 0 else 0
            
            # Calculate pilar scores
            pilar_scores = {cat: int(pilar_sums[cat] / pilar_counts[cat]) for cat in pilar_sums}

            classification = "healthy"
            if calculated_score < 50: classification = "critical"
            elif calculated_score < 70: classification = "at-risk"
            
            hs_eval = HealthScoreEvaluation(
                id=str(uuid.uuid4()),
                account_id=account.id,
                evaluated_by=current_csm_id,
                evaluation_date=eval_date,
                total_score=calculated_score,
                classification=classification,
                responses=responses,
                pilar_scores=pilar_scores,
                created_at=eval_date
            )
            db.add(hs_eval)
            
            if month_offset == 0:
                final_score = calculated_score
                final_classification = classification
        
        # Update current account health score to match latest
        account.health_score = final_score
        account.health_status = final_classification

    try:
        db.commit()
        print("Dados enriquecidos com sucesso!")
    except Exception as e:
        print(f"Erro ao salvar dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
