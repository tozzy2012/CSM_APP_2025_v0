"""
Script para criar super admin inicial
"""
import os
os.environ["DATABASE_URL"] = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"

import sys
sys.path.append('/home/ricardolange/zapper-cs/CSM_APP_2025_v0/server')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, Base
from password_utils import hash_password
import datetime

# Usar credenciais do docker-compose
DATABASE_URL = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Criar todas as tabelas
print("Criando tabelas...")
Base.metadata.create_all(bind=engine)
print("✅ Tabelas criadas!")

# Criar sessão
db = SessionLocal()

try:
    # Verificar se super admin já existe
    existing_admin = db.query(User).filter(User.email == "admin@csm.com").first()
    
    if existing_admin:
        print("⚠️  Super admin já existe!")
        print(f"   Email: {existing_admin.email}")
        print(f"   Nome: {existing_admin.name}")
    else:
        # Criar super admin
        super_admin = User(
            id="super-admin-001",
            email="admin@csm.com",
            password_hash=hash_password("adminadmin"),
            name="Super Administrador",
            active=True
        )
        
        db.add(super_admin)
        db.commit()
        
        print("✅ Super admin criado com sucesso!")
        print("   Email: admin@csm.com")
        print("   Senha: adminadmin")
        
except Exception as e:
    print(f"❌ Erro: {e}")
    db.rollback()
finally:
    db.close()
