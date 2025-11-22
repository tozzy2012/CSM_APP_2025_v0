"""
Autenticação e Autorização
Integração com Provedores de Identidade (Clerk/Kinde)
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Header
from jose import JWTError, jwt
import httpx
import logging

from .config import settings

logger = logging.getLogger(__name__)


class CurrentUser:
    """Modelo de usuário autenticado"""
    def __init__(self, user_id: UUID, tenant_id: UUID, email: str, roles: list = None):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.email = email
        self.roles = roles or []


async def verify_clerk_token(token: str) -> dict:
    """
    Verificar token JWT do Clerk
    """
    try:
        # Em produção, use a biblioteca oficial do Clerk
        # ou valide o JWT usando as chaves públicas do Clerk
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.clerk.dev/v1/sessions/verify",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido"
                )
    except Exception as e:
        logger.error(f"Erro ao verificar token Clerk: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha na autenticação"
        )


async def verify_kinde_token(token: str) -> dict:
    """
    Verificar token JWT do Kinde
    """
    try:
        # Decodificar JWT usando a chave pública do Kinde
        # Em produção, busque a chave pública do endpoint JWKS do Kinde
        payload = jwt.decode(
            token,
            settings.KINDE_CLIENT_SECRET,  # Use chave pública em produção
            algorithms=["RS256"],
            audience=settings.KINDE_CLIENT_ID
        )
        return payload
    except JWTError as e:
        logger.error(f"Erro ao verificar token Kinde: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


async def verify_token(token: str) -> dict:
    """
    Verificar token baseado no provedor configurado
    """
    if settings.IDENTITY_PROVIDER == "clerk":
        return await verify_clerk_token(token)
    elif settings.IDENTITY_PROVIDER == "kinde":
        return await verify_kinde_token(token)
    else:
        # Fallback: validação simples com JWT_SECRET_KEY
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> CurrentUser:
    """
    Dependency para obter usuário autenticado
    Uso: current_user: CurrentUser = Depends(get_current_user)
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Extrair token do header "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Esquema de autenticação inválido"
            )
        
        # Verificar token
        payload = await verify_token(token)
        
        # Extrair informações do usuário
        user_id = UUID(payload.get("sub") or payload.get("user_id"))
        tenant_id = UUID(payload.get("org_id") or payload.get("tenant_id"))
        email = payload.get("email")
        roles = payload.get("roles", [])
        
        if not user_id or not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: informações ausentes"
            )
        
        return CurrentUser(
            user_id=user_id,
            tenant_id=tenant_id,
            email=email,
            roles=roles
        )
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de token inválido"
        )
    except Exception as e:
        logger.error(f"Erro na autenticação: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha na autenticação"
        )


def require_role(required_role: str):
    """
    Decorator para verificar se o usuário tem uma role específica
    Uso: @require_role("admin")
    """
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if required_role not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissão negada. Role necessária: {required_role}"
            )
        return current_user
    return role_checker


# Aliases para roles comuns
get_admin_user = require_role("admin")
get_csm_user = require_role("csm")
