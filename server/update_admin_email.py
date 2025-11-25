"""
Script para atualizar email do super admin
"""
import os
os.environ["DATABASE_URL"] = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"

import sys
sys.path.append('/home/ricardolange/zapper-cs/CSM_APP_2025_v0/server')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User

# Usar credenciais do docker-compose
DATABASE_URL = "postgresql://zapper_user:zapper_password@localhost:5432/zapper_cs"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # Encontrar super admin
    admin = db.query(User).filter(User.role == "SUPER_ADMIN").first()
    
    if admin:
        print(f"Encontrado: {admin.email}")
        admin.email = "admin@system.local"
        db.commit()
        print(f"✅ Email atualizado para: {admin.email}")
        print(f"   Login: admin@system.local")
        print(f"   Senha: adminadmin")
    else:
        print("❌ Super admin não encontrado")
        
except Exception as e:
    print(f"❌ Erro: {e}")
    db.rollback()
finally:
    db.close()
