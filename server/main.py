from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import text, select, select
"""
Microsserviço de CRM - FastAPI Application
"""
from fastapi import FastAPI
from fastapi import Depends, HTTPException, status, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import logging
import traceback

from config import settings
from database import get_db, check_database_health, init_db
from auth import get_current_user, CurrentUser
import crud, schemas, models

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
    redoc_url="/redoc",
)

# --- CORS para frontend local ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        *settings.CORS_ORIGINS,
    ],
    allow_origin_regex=r"https?://.*",  # Allow all http/https origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- fim CORS ---
# Force reload

# EVENTOS DE INICIALIZAÇÃO E SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Executado ao iniciar a aplicação"""
    logger.info(f"Iniciando {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")
    init_db()


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
# ROTAS DE CLIENTS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/clients",
    response_model=List[schemas.ClientResponse],
    summary="Listar Clients",
    description="Retorna lista de clients filtrados por organização"
)
async def list_clients(
    organization_id: Optional[str] = Query(None, description="Filtrar por organização"),
    db: Session = Depends(get_db)
):
    """Lista todos os clients, opcionalmente filtrados por organização"""
    try:
        query = db.query(models.Client)
        if organization_id:
            query = query.filter(models.Client.organization_id == organization_id)
        clients = query.all()
        return clients
    except Exception as e:
        logger.error(f"Erro ao listar clients: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar clients: {str(e)}"
        )


@app.get(
    f"{settings.API_PREFIX}/clients/{{client_id}}",
    response_model=schemas.ClientResponse,
    summary="Obter Client",
    description="Retorna um client específico por ID"
)
async def get_client(
    client_id: str,
    db: Session = Depends(get_db)
):
    """Retorna um client específico"""
    try:
        client = db.query(models.Client).filter(models.Client.id == client_id).first()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client {client_id} não encontrado"
            )
        return client
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar client {client_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar client: {str(e)}"
        )


@app.post(
    f"{settings.API_PREFIX}/clients",
    response_model=schemas.ClientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Client",
    description="Cria um novo client"
)
async def create_client(
    client_data: schemas.ClientCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo client"""
    try:
        # Gerar ID único
        import time
        client_id = str(int(time.time() * 1000))
        
        # Converter dados para dict
        client_dict = client_data.model_dump(by_alias=False)
        
        # Criar modelo
        db_client = models.Client(
            id=client_id,
            **client_dict
        )
        
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        
        logger.info(f"Client criado com sucesso: {client_id}")
        return db_client
        
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar client: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar client: {str(e)}"
        )


@app.put(
    f"{settings.API_PREFIX}/clients/{{client_id}}",
    response_model=schemas.ClientResponse,
    summary="Atualizar Client",
    description="Atualiza um client existente"
)
async def update_client(
    client_id: str,
    client_data: schemas.ClientUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza um client existente"""
    try:
        # Buscar client
        db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
        if not db_client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client {client_id} não encontrado"
            )
        
        # Atualizar campos
        update_data = client_data.model_dump(by_alias=False, exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_client, field, value)
        
        db_client.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_client)
        
        logger.info(f"Client atualizado com sucesso: {client_id}")
        return db_client
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar client {client_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar client: {str(e)}"
        )


@app.delete(
    f"{settings.API_PREFIX}/clients/{{client_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar Client",
    description="Deleta um client"
)
async def delete_client(
    client_id: str,
    db: Session = Depends(get_db)
):
    """Deleta um client"""
    try:
        db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
        if not db_client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client {client_id} não encontrado"
            )
        
        db.delete(db_client)
        db.commit()
        
        logger.info(f"Client deletado com sucesso: {client_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar client {client_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar client: {str(e)}"
        )




# ============================================================================
# ROTAS DE ACCOUNTS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/accounts",
    response_model=List[schemas.AccountResponse],
    summary="Listar Accounts",
    description="Retorna lista de accounts filtrados por organização"
)
async def list_accounts(
    organization_id: Optional[str] = Query(None, description="Filtrar por organização"),
    db: Session = Depends(get_db)
):
    """Lista todos os accounts, opcionalmente filtrados por organização"""
    try:
        query = db.query(models.Account)
        if organization_id:
            query = query.filter(models.Account.organization_id == organization_id)
        accounts = query.all()
        return accounts
    except Exception as e:
        logger.error(f"Erro ao listar accounts: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar accounts: {str(e)}"
        )


@app.get(
    f"{settings.API_PREFIX}/accounts/{{account_id}}",
    response_model=schemas.AccountResponse,
    summary="Obter Account",
    description="Retorna um account específico por ID"
)
async def get_account(
    account_id: str,
    db: Session = Depends(get_db)
):
    """Retorna um account específico"""
    try:
        account = db.query(models.Account).filter(models.Account.id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account {account_id} não encontrado"
            )
        return account
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar account {account_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar account: {str(e)}"
        )


@app.post(
    f"{settings.API_PREFIX}/accounts",
    response_model=schemas.AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Account",
    description="Cria um novo account"
)
async def create_account(
    account_data: schemas.AccountCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo account"""
    try:
        # Gerar ID único
        import time
        account_id = str(int(time.time() * 1000))
        
        # Converter dados para dict
        account_dict = account_data.model_dump(by_alias=False)
        
        # Validar que o client existe
        client = db.query(models.Client).filter(
            models.Client.id == account_dict['client_id']
        ).first()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Client {account_dict['client_id']} não encontrado"
            )
        
        # Criar modelo
        db_account = models.Account(
            id=account_id,
            **account_dict
        )
        
        db.add(db_account)
        db.commit()
        db.refresh(db_account)
        
        logger.info(f"Account criado com sucesso: {account_id}")
        return db_account
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar account: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar account: {str(e)}"
        )


@app.put(
    f"{settings.API_PREFIX}/accounts/{{account_id}}",
    response_model=schemas.AccountResponse,
    summary="Atualizar Account",
    description="Atualiza um account existente"
)
async def update_account(
    account_id: str,
    account_data: schemas.AccountUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza um account existente"""
    try:
        # Buscar account
        db_account = db.query(models.Account).filter(models.Account.id == account_id).first()
        if not db_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account {account_id} não encontrado"
            )
        
        # Atualizar campos
        update_data = account_data.model_dump(by_alias=False, exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_account, field, value)
        
        db_account.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_account)
        
        logger.info(f"Account atualizado com sucesso: {account_id}")
        return db_account
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar account {account_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar account: {str(e)}"
        )


@app.delete(
    f"{settings.API_PREFIX}/accounts/{{account_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar Account",
    description="Deleta um account"
)
async def delete_account(
    account_id: str,
    db: Session = Depends(get_db)
):
    """Deleta um account"""
    try:
        db_account = db.query(models.Account).filter(models.Account.id == account_id).first()
        if not db_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account {account_id} não encontrado"
            )
        
        db.delete(db_account)
        db.commit()
        
        logger.info(f"Account deletado com sucesso: {account_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar account {account_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar account: {str(e)}"
        )



# ============================================================================
# # ROTAS DE CONTACTS (mantidas para compatibilidade)
# # ============================================================================
# 
# # @app.get(
# #     f"{settings.API_PREFIX}/accounts/{{account_id}}/contacts",
# #     response_model=List[schemas.ContactResponse],
# #     tags=["Contacts"]
# # )
# # async def list_contacts(
# #     account_id: UUID,
# #     skip: int = Query(0, ge=0),
# #     limit: int = Query(20, ge=1, le=100),
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Listar contacts de uma account"""
# #     # Verificar se a account existe e pertence ao tenant
# #     account = crud.get_account(db, account_id, current_user.tenant_id)
# #     if not account:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Account não encontrada"
# #         )
# #     
# #     contacts = crud.get_contacts_by_account(db, account_id, current_user.tenant_id, skip, limit)
# #     return contacts
# # 
# # 
# # @app.get(
# #     f"{settings.API_PREFIX}/contacts/{{contact_id}}",
# #     response_model=schemas.ContactResponse,
# #     tags=["Contacts"]
# # )
# # async def get_contact(
# #     contact_id: UUID,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Buscar contact por ID"""
# #     contact = crud.get_contact(db, contact_id, current_user.tenant_id)
# #     if not contact:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Contact não encontrado"
# #         )
# #     return contact
# # 
# # 
# # @app.post(
# #     f"{settings.API_PREFIX}/contacts",
# #     response_model=schemas.ContactResponse,
# #     status_code=status.HTTP_201_CREATED,
# #     tags=["Contacts"]
# # )
# # async def create_contact(
# #     contact: schemas.ContactCreate,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Criar novo contact"""
# #     # Validar tenant_id
# #     if contact.tenant_id != current_user.tenant_id:
# #         raise HTTPException(
# #             status_code=status.HTTP_403_FORBIDDEN,
# #             detail="Não autorizado"
# #         )
# #     
# #     # Verificar se a account existe
# #     account = crud.get_account(db, contact.account_id, current_user.tenant_id)
# #     if not account:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Account não encontrada"
# #         )
# #     
# #     # Verificar se o email já existe
# #     existing_contact = crud.get_contact_by_email(db, contact.email, current_user.tenant_id)
# #     if existing_contact:
# #         raise HTTPException(
# #             status_code=status.HTTP_409_CONFLICT,
# #             detail="Email já cadastrado"
# #         )
# #     
# #     return crud.create_contact(db, contact)
# # 
# # 
# # @app.put(
# #     f"{settings.API_PREFIX}/contacts/{{contact_id}}",
# #     response_model=schemas.ContactResponse,
# #     tags=["Contacts"]
# # )
# # async def update_contact(
# #     contact_id: UUID,
# #     contact_update: schemas.ContactUpdate,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Atualizar contact"""
# #     contact = crud.update_contact(db, contact_id, current_user.tenant_id, contact_update)
# #     if not contact:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Contact não encontrado"
# #         )
# #     return contact
# # 
# # 
# # @app.delete(
# #     f"{settings.API_PREFIX}/contacts/{{contact_id}}",
# #     status_code=status.HTTP_204_NO_CONTENT,
# #     tags=["Contacts"]
# # )
# # async def delete_contact(
# #     contact_id: UUID,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Deletar contact"""
# #     success = crud.delete_contact(db, contact_id, current_user.tenant_id)
# #     if not success:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Contact não encontrado"
# #         )
# # 
# # 
# # # ============================================================================
# # # ROTAS DE SUBSCRIPTIONS
# # # ============================================================================
# # 
# # @app.get(
# #     f"{settings.API_PREFIX}/accounts/{{account_id}}/subscriptions",
# #     response_model=List[schemas.SubscriptionResponse],
# #     tags=["Subscriptions"]
# # )
# # async def list_subscriptions(
# #     account_id: UUID,
# #     status: Optional[str] = None,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Listar subscriptions de uma account"""
# #     # Verificar se a account existe
# #     account = crud.get_account(db, account_id, current_user.tenant_id)
# #     if not account:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Account não encontrada"
# #         )
# #     
# #     subscriptions = crud.get_subscriptions_by_account(db, account_id, current_user.tenant_id, status)
# #     return subscriptions
# # 
# # 
# # @app.get(
# #     f"{settings.API_PREFIX}/subscriptions/{{subscription_id}}",
# #     response_model=schemas.SubscriptionResponse,
# #     tags=["Subscriptions"]
# # )
# # async def get_subscription(
# #     subscription_id: UUID,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Buscar subscription por ID"""
# #     subscription = crud.get_subscription(db, subscription_id, current_user.tenant_id)
# #     if not subscription:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Subscription não encontrada"
# #         )
# #     return subscription
# # 
# # 
# # @app.post(
# #     f"{settings.API_PREFIX}/subscriptions",
# #     response_model=schemas.SubscriptionResponse,
# #     status_code=status.HTTP_201_CREATED,
# #     tags=["Subscriptions"]
# # )
# # async def create_subscription(
# #     subscription: schemas.SubscriptionCreate,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Criar nova subscription"""
# #     # Validar tenant_id
# #     if subscription.tenant_id != current_user.tenant_id:
# #         raise HTTPException(
# #             status_code=status.HTTP_403_FORBIDDEN,
# #             detail="Não autorizado"
# #         )
# #     
# #     # Verificar se a account existe
# #     account = crud.get_account(db, subscription.account_id, current_user.tenant_id)
# #     if not account:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Account não encontrada"
# #         )
# #     
# #     return crud.create_subscription(db, subscription)
# # 
# # 
# # @app.put(
# #     f"{settings.API_PREFIX}/subscriptions/{{subscription_id}}",
# #     response_model=schemas.SubscriptionResponse,
# #     tags=["Subscriptions"]
# # )
# # async def update_subscription(
# #     subscription_id: UUID,
# #     subscription_update: schemas.SubscriptionUpdate,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Atualizar subscription"""
# #     subscription = crud.update_subscription(db, subscription_id, current_user.tenant_id, subscription_update)
# #     if not subscription:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Subscription não encontrada"
# #         )
# #     return subscription
# # 
# # 
# # @app.delete(
# #     f"{settings.API_PREFIX}/subscriptions/{{subscription_id}}",
# #     status_code=status.HTTP_204_NO_CONTENT,
# #     tags=["Subscriptions"]
# # )
# # async def delete_subscription(
# #     subscription_id: UUID,
# #     current_user: CurrentUser = Depends(get_current_user),
# #     db: Session = Depends(get_db)
# # ):
# #     """Deletar subscription"""
# #     success = crud.delete_subscription(db, subscription_id, current_user.tenant_id)
# #     if not success:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Subscription não encontrada"
# #         )


# ============================================================================
# ACTIVITIES ROUTES
# ============================================================================

@app.post(
    f"{settings.API_PREFIX}/activities",
    response_model=schemas.ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Activities"]
)
async def create_activity(
    activity: schemas.ActivityCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar nova activity"""
    from uuid import uuid4
    activity_id = str(uuid4())
    
    # Use default organization if empty (for super-admin)
    org_id = current_user.organization_id or "default-org-001"
    
    return crud.create_activity(
        db, 
        activity, 
        org_id,
        activity_id,
        current_user.user_id
    )


@app.get(
    f"{settings.API_PREFIX}/activities",
    response_model=List[schemas.ActivityResponse],
    tags=["Activities"]
)
async def list_activities(
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar activities"""
    return crud.get_activities(db, current_user.organization_id, skip, limit)


@app.get(
    f"{settings.API_PREFIX}/activities/{{activity_id}}",
    response_model=schemas.ActivityResponse,
    tags=["Activities"]
)
async def get_activity(
    activity_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buscar activity por ID"""
    activity = crud.get_activity(db, activity_id, current_user.organization_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity não encontrada"
        )
    return activity


@app.get(
    f"{settings.API_PREFIX}/accounts/{{account_id}}/activities",
    response_model=List[schemas.ActivityResponse],
    tags=["Activities"]
)
async def get_account_activities(
    account_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buscar activities de um account"""
    return crud.get_activities_by_account(db, account_id, current_user.organization_id)


@app.put(
    f"{settings.API_PREFIX}/activities/{{activity_id}}",
    response_model=schemas.ActivityResponse,
    tags=["Activities"]
)
async def update_activity(
    activity_id: str,
    activity_update: schemas.ActivityUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar activity"""
    activity = crud.update_activity(db, activity_id, current_user.organization_id, activity_update)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity não encontrada"
        )
    return activity


@app.delete(
    f"{settings.API_PREFIX}/activities/{{activity_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Activities"]
)
async def delete_activity(
    activity_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar activity"""
    success = crud.delete_activity(db, activity_id, current_user.organization_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity não encontrada"
        )


# ============================================================================
# TASKS ROUTES
# ============================================================================

@app.post(
    f"{settings.API_PREFIX}/tasks",
    response_model=schemas.TaskResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Tasks"]
)
async def create_task(
    task: schemas.TaskCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar nova task"""
    from uuid import uuid4
    task_id = str(uuid4())
    
    # Use default organization if empty (for super-admin)
    org_id = current_user.organization_id or "default-org-001"
    
    logger.info(f"Creating task for org {org_id}, account {task.account_id}")
    
    return crud.create_task(
        db, 
        task, 
        org_id,
        task_id,
        current_user.user_id
    )


@app.get(
    f"{settings.API_PREFIX}/tasks",
    response_model=List[schemas.TaskResponse],
    tags=["Tasks"]
)
async def list_tasks(
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar tasks"""
    return crud.get_tasks(db, current_user.organization_id, skip, limit)


@app.get(
    f"{settings.API_PREFIX}/tasks/{{task_id}}",
    response_model=schemas.TaskResponse,
    tags=["Tasks"]
)
async def get_task(
    task_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buscar task por ID"""
    task = crud.get_task(db, task_id, current_user.organization_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task não encontrada"
        )
    return task


@app.get(
    f"{settings.API_PREFIX}/accounts/{{account_id}}/tasks",
    response_model=List[schemas.TaskResponse],
    tags=["Tasks"]
)
async def get_account_tasks(
    account_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buscar tasks de um account"""
    return crud.get_tasks_by_account(db, account_id, current_user.organization_id)


@app.put(
    f"{settings.API_PREFIX}/tasks/{{task_id}}",
    response_model=schemas.TaskResponse,
    tags=["Tasks"]
)
async def update_task(
    task_id: str,
    task_update: schemas.TaskUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar task"""
    task = crud.update_task(db, task_id, current_user.organization_id, task_update)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task não encontrada"
        )
    return task


@app.delete(
    f"{settings.API_PREFIX}/tasks/{{task_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Tasks"]
)
async def delete_task(
    task_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar task"""
    success = crud.delete_task(db, task_id, current_user.organization_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task não encontrada"
        )


# ============================================================================
# ROTAS DE PLAYBOOKS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/playbooks",
    tags=["Playbooks"]
)
async def list_playbooks(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar todos os playbooks"""
    try:
        logger.info("🔵 Listando playbooks...")
        result = db.execute(text("""
            SELECT id, name, description, content, category, tags, version, 
                   author, views, is_active, created_at, updated_at
            FROM playbooks
            ORDER BY created_at DESC
        """))
        playbooks = []
        for row in result:
            playbooks.append({
                "id": str(row[0]),
                "name": row[1],
                "description": row[2],
                "content": row[3],
                "category": row[4],
                "tags": row[5] if row[5] else [],
                "version": row[6],
                "author": row[7],
                "views": row[8],
                "is_active": row[9],
                "createdAt": row[10].isoformat() if row[10] else None,
                "updatedAt": row[11].isoformat() if row[11] else None,
            })
        logger.info(f"🟢 Playbooks encontrados: {len(playbooks)}")
        logger.info(f"🟢 Dados: {playbooks}")
        return playbooks
    except Exception as e:
        logger.error(f"Erro ao listar playbooks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    f"{settings.API_PREFIX}/playbooks/{{playbook_id}}",
    tags=["Playbooks"]
)
async def get_playbook(
    playbook_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter um playbook específico"""
    try:
        result = db.execute(text("""
            SELECT id, name, description, content, category, tags, version, 
                   author, views, is_active, created_at, updated_at
            FROM playbooks
            WHERE id = :playbook_id
        """), {"playbook_id": playbook_id})
        
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Playbook não encontrado")
        
        return {
            "id": str(row[0]),
            "name": row[1],
            "description": row[2],
            "content": row[3],
            "category": row[4],
            "tags": row[5] if row[5] else [],
            "version": row[6],
            "author": row[7],
            "views": row[8],
            "is_active": row[9],
            "createdAt": row[10].isoformat() if row[10] else None,
            "updatedAt": row[11].isoformat() if row[11] else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar playbook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    f"{settings.API_PREFIX}/playbooks",
    status_code=status.HTTP_201_CREATED,
    tags=["Playbooks"]
)
async def create_playbook(
    playbook_data: dict,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar novo playbook"""
    try:
        import json
        
        result = db.execute(text("""
            INSERT INTO playbooks (
                name, description, content, category, tags, version, author, is_active
            ) VALUES (
                :name, :description, :content, :category, :tags, :version, :author, :is_active
            ) RETURNING id, name, description, content, category, tags, version, 
                        author, views, is_active, created_at, updated_at
        """), {
            "name": playbook_data.get("name"),
            "description": playbook_data.get("description", ""),
            "content": playbook_data.get("content", ""),
            "category": playbook_data.get("category", ""),
            "tags": json.dumps(playbook_data.get("tags", [])),
            "version": playbook_data.get("version", "1.0"),
            "author": playbook_data.get("author", current_user.email),
            "is_active": playbook_data.get("is_active", True),
        })
        
        db.commit()
        row = result.fetchone()
        
        return {
            "id": str(row[0]),
            "name": row[1],
            "description": row[2],
            "content": row[3],
            "category": row[4],
            "tags": row[5] if row[5] else [],
            "version": row[6],
            "author": row[7],
            "views": row[8],
            "is_active": row[9],
            "createdAt": row[10].isoformat() if row[10] else None,
            "updatedAt": row[11].isoformat() if row[11] else None,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar playbook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put(
    f"{settings.API_PREFIX}/playbooks/{{playbook_id}}",
    tags=["Playbooks"]
)
async def update_playbook(
    playbook_id: int,
    playbook_data: dict,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar playbook existente"""
    try:
        import json
        
        # Construir query dinamicamente baseado nos campos fornecidos
        update_fields = []
        params = {"playbook_id": playbook_id}
        
        if "name" in playbook_data:
            update_fields.append("name = :name")
            params["name"] = playbook_data["name"]
        if "description" in playbook_data:
            update_fields.append("description = :description")
            params["description"] = playbook_data["description"]
        if "content" in playbook_data:
            update_fields.append("content = :content")
            params["content"] = playbook_data["content"]
        if "category" in playbook_data:
            update_fields.append("category = :category")
            params["category"] = playbook_data["category"]
        if "tags" in playbook_data:
            update_fields.append("tags = :tags")
            params["tags"] = json.dumps(playbook_data["tags"])
        if "version" in playbook_data:
            update_fields.append("version = :version")
            params["version"] = playbook_data["version"]
        if "is_active" in playbook_data:
            update_fields.append("is_active = :is_active")
            params["is_active"] = playbook_data["is_active"]
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
        
        query = f"""
            UPDATE playbooks 
            SET {', '.join(update_fields)}
            WHERE id = :playbook_id
            RETURNING id, name, description, content, category, tags, version, 
                      author, views, is_active, created_at, updated_at
        """
        
        result = db.execute(text(query), params)
        db.commit()
        
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Playbook não encontrado")
        
        return {
            "id": str(row[0]),
            "name": row[1],
            "description": row[2],
            "content": row[3],
            "category": row[4],
            "tags": row[5] if row[5] else [],
            "version": row[6],
            "author": row[7],
            "views": row[8],
            "is_active": row[9],
            "createdAt": row[10].isoformat() if row[10] else None,
            "updatedAt": row[11].isoformat() if row[11] else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar playbook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete(
    f"{settings.API_PREFIX}/playbooks/{{playbook_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Playbooks"]
)
async def delete_playbook(
    playbook_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar playbook"""
    try:
        result = db.execute(text("""
            DELETE FROM playbooks WHERE id = :playbook_id
        """), {"playbook_id": playbook_id})
        
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Playbook não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar playbook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    f"{settings.API_PREFIX}/playbooks/{{playbook_id}}/increment-views",
    tags=["Playbooks"]
)
async def increment_playbook_views(
    playbook_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Incrementar contador de visualizações"""
    try:
        result = db.execute(text("""
            UPDATE playbooks 
            SET views = views + 1
            WHERE id = :playbook_id
            RETURNING views
        """), {"playbook_id": playbook_id})
        
        db.commit()
        row = result.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Playbook não encontrado")
        
        return {"views": row[0]}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao incrementar views: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
