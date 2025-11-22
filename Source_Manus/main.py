"""
Microsserviço de CRM - FastAPI Application
"""
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import logging

from .config import settings
from .database import get_db, check_database_health, init_db
from .auth import get_current_user, CurrentUser
from . import crud, schemas, models

# Configurar logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Criar aplicação FastAPI
app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.SERVICE_VERSION,
    description="Microsserviço de CRM - Gerenciamento de Contas, Contatos e Assinaturas",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# EVENTOS DE INICIALIZAÇÃO E SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Executado ao iniciar a aplicação"""
    logger.info(f"Iniciando {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")
    # init_db()  # Descomentar para criar tabelas automaticamente (dev only)


@app.on_event("shutdown")
async def shutdown_event():
    """Executado ao desligar a aplicação"""
    logger.info(f"Desligando {settings.SERVICE_NAME}")


# ============================================================================
# ROTAS DE HEALTH CHECK
# ============================================================================

@app.get("/health", response_model=schemas.HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    db_status = "healthy" if await check_database_health() else "unhealthy"
    
    return schemas.HealthCheckResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
        timestamp=datetime.utcnow(),
        database=db_status,
        cache="healthy"  # TODO: Implementar verificação do Redis
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "status": "running"
    }


# ============================================================================
# ROTAS DE ACCOUNTS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/accounts",
    response_model=List[schemas.AccountResponse],
    tags=["Accounts"]
)
async def list_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    lifecycle_stage: Optional[str] = None,
    csm_owner_id: Optional[UUID] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar todas as accounts do tenant"""
    accounts = crud.get_accounts(
        db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        lifecycle_stage=lifecycle_stage,
        csm_owner_id=csm_owner_id
    )
    return accounts


@app.get(
    f"{settings.API_PREFIX}/accounts/{{account_id}}",
    response_model=schemas.AccountResponse,
    tags=["Accounts"]
)
async def get_account(
    account_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buscar account por ID"""
    account = crud.get_account(db, account_id, current_user.tenant_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account não encontrada"
        )
    return account


@app.post(
    f"{settings.API_PREFIX}/accounts",
    response_model=schemas.AccountResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Accounts"]
)
async def create_account(
    account: schemas.AccountCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar nova account"""
    # Validar que o tenant_id corresponde ao usuário autenticado
    if account.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não autorizado a criar account para outro tenant"
        )
    
    return crud.create_account(db, account)


@app.put(
    f"{settings.API_PREFIX}/accounts/{{account_id}}",
    response_model=schemas.AccountResponse,
    tags=["Accounts"]
)
async def update_account(
    account_id: UUID,
    account_update: schemas.AccountUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar account"""
    account = crud.update_account(db, account_id, current_user.tenant_id, account_update)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account não encontrada"
        )
    return account


@app.delete(
    f"{settings.API_PREFIX}/accounts/{{account_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Accounts"]
)
async def delete_account(
    account_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar account"""
    success = crud.delete_account(db, account_id, current_user.tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account não encontrada"
        )


# ============================================================================
# ROTAS DE CONTACTS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/accounts/{{account_id}}/contacts",
    response_model=List[schemas.ContactResponse],
    tags=["Contacts"]
)
async def list_contacts(
    account_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar contacts de uma account"""
    # Verificar se a account existe e pertence ao tenant
    account = crud.get_account(db, account_id, current_user.tenant_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account não encontrada"
        )
    
    contacts = crud.get_contacts_by_account(db, account_id, current_user.tenant_id, skip, limit)
    return contacts


@app.get(
    f"{settings.API_PREFIX}/contacts/{{contact_id}}",
    response_model=schemas.ContactResponse,
    tags=["Contacts"]
)
async def get_contact(
    contact_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buscar contact por ID"""
    contact = crud.get_contact(db, contact_id, current_user.tenant_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact não encontrado"
        )
    return contact


@app.post(
    f"{settings.API_PREFIX}/contacts",
    response_model=schemas.ContactResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Contacts"]
)
async def create_contact(
    contact: schemas.ContactCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar novo contact"""
    # Validar tenant_id
    if contact.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não autorizado"
        )
    
    # Verificar se a account existe
    account = crud.get_account(db, contact.account_id, current_user.tenant_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account não encontrada"
        )
    
    # Verificar se o email já existe
    existing_contact = crud.get_contact_by_email(db, contact.email, current_user.tenant_id)
    if existing_contact:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado"
        )
    
    return crud.create_contact(db, contact)


@app.put(
    f"{settings.API_PREFIX}/contacts/{{contact_id}}",
    response_model=schemas.ContactResponse,
    tags=["Contacts"]
)
async def update_contact(
    contact_id: UUID,
    contact_update: schemas.ContactUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar contact"""
    contact = crud.update_contact(db, contact_id, current_user.tenant_id, contact_update)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact não encontrado"
        )
    return contact


@app.delete(
    f"{settings.API_PREFIX}/contacts/{{contact_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Contacts"]
)
async def delete_contact(
    contact_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar contact"""
    success = crud.delete_contact(db, contact_id, current_user.tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact não encontrado"
        )


# ============================================================================
# ROTAS DE SUBSCRIPTIONS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/accounts/{{account_id}}/subscriptions",
    response_model=List[schemas.SubscriptionResponse],
    tags=["Subscriptions"]
)
async def list_subscriptions(
    account_id: UUID,
    status: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar subscriptions de uma account"""
    # Verificar se a account existe
    account = crud.get_account(db, account_id, current_user.tenant_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account não encontrada"
        )
    
    subscriptions = crud.get_subscriptions_by_account(db, account_id, current_user.tenant_id, status)
    return subscriptions


@app.get(
    f"{settings.API_PREFIX}/subscriptions/{{subscription_id}}",
    response_model=schemas.SubscriptionResponse,
    tags=["Subscriptions"]
)
async def get_subscription(
    subscription_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buscar subscription por ID"""
    subscription = crud.get_subscription(db, subscription_id, current_user.tenant_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription não encontrada"
        )
    return subscription


@app.post(
    f"{settings.API_PREFIX}/subscriptions",
    response_model=schemas.SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Subscriptions"]
)
async def create_subscription(
    subscription: schemas.SubscriptionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar nova subscription"""
    # Validar tenant_id
    if subscription.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não autorizado"
        )
    
    # Verificar se a account existe
    account = crud.get_account(db, subscription.account_id, current_user.tenant_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account não encontrada"
        )
    
    return crud.create_subscription(db, subscription)


@app.put(
    f"{settings.API_PREFIX}/subscriptions/{{subscription_id}}",
    response_model=schemas.SubscriptionResponse,
    tags=["Subscriptions"]
)
async def update_subscription(
    subscription_id: UUID,
    subscription_update: schemas.SubscriptionUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar subscription"""
    subscription = crud.update_subscription(db, subscription_id, current_user.tenant_id, subscription_update)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription não encontrada"
        )
    return subscription


@app.delete(
    f"{settings.API_PREFIX}/subscriptions/{{subscription_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Subscriptions"]
)
async def delete_subscription(
    subscription_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar subscription"""
    success = crud.delete_subscription(db, subscription_id, current_user.tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription não encontrada"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
