"""
Autenticação Simplificada (sem multi-tenancy)
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
import logging

from config import settings
from database import get_db
from models import User

logger = logging.getLogger(__name__)


class CurrentUser:
    """Modelo de usuário autenticado simplificado"""
    def __init__(self, user_id: str, email: str):
        self.user_id = str(user_id)
        self.email = email


async def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
) -> CurrentUser:
    """
    Dependency para obter usuário autenticado (simplificado)
    Uso: current_user: CurrentUser = Depends(get_current_user)
    """
    if x_user_id:
        try:
            # Query database to get user
            db = next(get_db())
            user = db.query(User).filter(User.id == x_user_id, User.active == True).first()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Usuário não encontrado ou inativo: {x_user_id}"
                )
            
            return CurrentUser(
                user_id=user.id,
                email=user.email
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erro na autenticação: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Falha na autenticação"
            )
    
    # Se não houver X-User-ID, retorna erro
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Header X-User-ID não fornecido"
    )
