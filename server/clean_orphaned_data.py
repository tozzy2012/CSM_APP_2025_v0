"""
Script para limpar dados antigos sem organization_id
"""
import os
os.environ["DATABASE_URL"] = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"

import sys
sys.path.append('/home/ricardolange/zapper-cs/CSM_APP_2025_v0/server')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Client, Account, Task, Activity, Playbook

# Usar credenciais do docker-compose
DATABASE_URL = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # Deletar todos dados sem organization_id (dados antigos/órfãos)
    
    # Clients
    clients_deleted = db.query(Client).filter(Client.organization_id == None).delete()
    print(f"🗑️  Deletados {clients_deleted} clients sem organization_id")
    
    # Accounts
    accounts_deleted = db.query(Account).filter(Account.organization_id == None).delete()
    print(f"🗑️  Deletados {accounts_deleted} accounts sem organization_id")
    
    # Tasks
    tasks_deleted = db.query(Task).filter(Task.organization_id == None).delete()
    print(f"🗑️  Deletadas {tasks_deleted} tasks sem organization_id")
    
    # Activities
    activities_deleted = db.query(Activity).filter(Activity.organization_id == None).delete()
    print(f"🗑️  Deletadas {activities_deleted} activities sem organization_id")
    
    # Playbooks sem org_id são globais, não deletar
    playbooks_count = db.query(Playbook).filter(Playbook.organization_id == None).count()
    print(f"ℹ️  {playbooks_count} playbooks globais mantidos (organization_id NULL é válido)")
    
    db.commit()
    print("\n✅ Banco limpo! Todos dados sem organization_id foram removidos.")
    print("   Agora cada organização começa com 0 clientes, 0 accounts, etc.")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    db.rollback()
finally:
    db.close()
