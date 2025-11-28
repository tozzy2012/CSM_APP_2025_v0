from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import text, select, select
"""
Microsserviço de CRM - FastAPI Application
"""
from fastapi import FastAPI
from fastapi import Depends, HTTPException, status, Query, UploadFile, File
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import logging
import traceback
import csv
import io
import codecs
import codecs
from fastapi.responses import StreamingResponse
import pandas as pd

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
# ROTAS DE USERS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/users",
    response_model=List[schemas.UserResponse],
    summary="Listar Usuários",
    description="Lista todos os usuários cadastrados"
)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todos os usuários"""
    try:
        users = db.query(models.User).offset(skip).limit(limit).all()
        return users
    except Exception as e:
        logger.error(f"Erro ao listar usuários: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar usuários: {str(e)}"
        )


# ============================================================================
# ROTAS DE SSO AUTHENTICATION (WorkOS)
# ============================================================================

import sso_auth
import secrets

@app.post(
    f"{settings.API_PREFIX}/auth/sso/authorize",
    summary="Get SSO Authorization URL",
    description="Get WorkOS authorization URL for SSO login"
)
async def sso_authorize(request: schemas.SSOAuthorizeRequest):
    """Get SSO authorization URL"""
    try:
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Get authorization URL from WorkOS
        authorization_url = sso_auth.get_authorization_url(
            provider=request.provider,
            state=state
        )
        
        return {
            "authorization_url": authorization_url,
            "state": state
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating SSO authorization URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get(
    f"{settings.API_PREFIX}/auth/sso/callback",
    summary="SSO Callback",
    description="Handle SSO callback from WorkOS"
)
async def sso_callback(
    code: str = Query(..., description="Authorization code from WorkOS"),
    db: Session = Depends(get_db)
):
    """Handle SSO callback"""
    try:
        logger.info(f"🔵 SSO Callback received with code: {code[:10]}...")
        
        # Exchange code for user profile and create/update user
        result = sso_auth.handle_sso_callback(code, db)
        
        logger.info(f"🟢 SSO callback successful for user: {result.get('user', {}).get('email')}")
        return result
    except HTTPException as he:
        logger.error(f"📛 SSO HTTPException: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"📛 Error in SSO callback: {str(e)}")
        logger.error(f"📛 Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"📛 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# ROTAS DE INVITES
# ============================================================================

@app.post(
    f"{settings.API_PREFIX}/invites",
    response_model=schemas.InviteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Convite",
    description="Cria um novo convite e envia email"
)
async def create_invite(
    invite_data: schemas.InviteCreate,
    # current_user: CurrentUser = Depends(get_current_user), # TODO: Enable auth
    db: Session = Depends(get_db)
):
    """Cria um novo convite"""
    try:
        # Check if email already has pending invite
        existing = crud.get_invite_by_email(db, invite_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um convite pendente para este email"
            )
            
        # Check if user already exists
        user = db.query(models.User).filter(models.User.email == invite_data.email).first()
        if user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Usuário já cadastrado na plataforma"
            )
            
        # Generate token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=settings.INVITE_EXPIRY_DAYS)
        
        # Create invite
        invite = crud.create_invite(
            db=db,
            invite=invite_data,
            token=token,
            expires_at=expires_at,
            invited_by=None # str(current_user.id)
        )
        
        # Send email
        import email_service
        sent = await email_service.send_invite_email(
            to_email=invite.email,
            invite_token=invite.token,
            invited_by_name="Admin" # current_user.name
        )
        
        if not sent:
            logger.warning(f"Failed to send invite email to {invite.email}")
            
        return invite
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invite: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar convite: {str(e)}"
        )


@app.get(
    f"{settings.API_PREFIX}/invites",
    response_model=List[schemas.InviteResponse],
    summary="Listar Convites",
    description="Lista todos os convites"
)
async def list_invites(
    skip: int = 0,
    limit: int = 100,
    # current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista convites"""
    return crud.get_invites(db, skip, limit)


@app.delete(
    f"{settings.API_PREFIX}/invites/{{invite_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revogar Convite",
    description="Revoga um convite pendente"
)
async def revoke_invite(
    invite_id: UUID,
    # current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoga convite"""
    success = crud.revoke_invite(db, invite_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Convite não encontrado"
        )
    return None


@app.delete(
    f"{settings.API_PREFIX}/invites/{{invite_id}}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Convite Permanentemente",
    description="Exclui um convite do banco de dados permanentemente"
)
async def delete_invite_permanent(
    invite_id: UUID,
    # current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exclui convite permanentemente"""
    success = crud.delete_invite(db, invite_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Convite não encontrado"
        )
    return None


@app.patch(
    f"{settings.API_PREFIX}/invites/{{invite_id}}",
    response_model=schemas.InviteResponse,
    summary="Atualizar Convite",
    description="Atualiza dados de um convite (ex: role)"
)
async def update_invite(
    invite_id: UUID,
    invite_data: schemas.InviteUpdate,
    # current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualiza convite"""
    invite = crud.update_invite(db, invite_id, invite_data)
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Convite não encontrado"
        )
    return invite


@app.get(
    f"{settings.API_PREFIX}/invites/validate/{{token}}",
    response_model=schemas.InviteResponse,
    summary="Validar Token de Convite",
    description="Verifica se um token de convite é válido"
)
async def validate_invite_token(
    token: str,
    db: Session = Depends(get_db)
):
    """Valida token de convite"""
    invite = crud.get_invite_by_token(db, token)
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Convite inválido"
        )
        
    if invite.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Este convite já foi {invite.status}"
        )
        
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este convite expirou"
        )
        
    return invite


# ============================================================================
# ROTAS DE CLIENTS
# ============================================================================

from routers import tenants, intelligence
app.include_router(tenants.router, prefix=settings.API_PREFIX)
app.include_router(intelligence.router)

@app.get(
    f"{settings.API_PREFIX}/clients",
    response_model=List[schemas.ClientResponse],
    summary="Listar Clients",
    description="Retorna lista de clients"
)
async def list_clients(
    db: Session = Depends(get_db)
):
    """Lista todos os clients"""
    try:
        clients = db.query(models.Client).all()
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
# ROTAS DE IMPORTAÇÃO DE CLIENTES
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/clients/import/template",
    summary="Download Template de Importação",
    description="Retorna um arquivo Excel modelo para importação de clientes"
)
async def get_clients_import_template():
    """Retorna template Excel para importação de clientes"""
    headers = [
        "name", "legal_name", "cnpj", "industry", 
        "website", "company_size", "notes", "tags"
    ]
    
    # Criar DataFrame com exemplo
    df = pd.DataFrame([{
        "name": "Empresa Exemplo Ltda",
        "legal_name": "Razão Social Exemplo",
        "cnpj": "12.345.678/0001-90",
        "industry": "Tecnologia",
        "website": "https://exemplo.com.br",
        "company_size": "medium",
        "notes": "Cliente estratégico",
        "tags": "tech,saas,prioridade"
    }], columns=headers)
    
    # Salvar em buffer de memória
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    
    output.seek(0)
    
    response = StreamingResponse(
        iter([output.getvalue()]), 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    
    response.headers["Content-Disposition"] = "attachment; filename=template_clientes.xlsx"
    
    return response


@app.post(
    f"{settings.API_PREFIX}/clients/import",
    summary="Importar Clientes via CSV",
    description="Importa clientes a partir de um arquivo CSV"
)
async def import_clients(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Importa clientes via CSV ou Excel"""
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            # Ler conteúdo do arquivo
            content = await file.read()
            
            # Decodificar conteúdo
            decoded_content = None
            for encoding in ['utf-8-sig', 'utf-8', 'latin-1']:
                try:
                    decoded_content = content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
                    
            if decoded_content is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Codificação do arquivo não suportada."
                )
                
            # Detectar delimitador
            try:
                dialect = csv.Sniffer().sniff(decoded_content[:1024], delimiters=";,")
                delimiter = dialect.delimiter
            except:
                delimiter = ';' # Fallback
                
            # Ler CSV para lista de dicts
            csv_reader = csv.DictReader(io.StringIO(decoded_content), delimiter=delimiter)
            data_rows = list(csv_reader)
            fieldnames = csv_reader.fieldnames
            
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            # Ler Excel
            content = await file.read()
            df = pd.read_excel(io.BytesIO(content))
            
            # Converter NaN para string vazia ou None
            df = df.fillna("")
            
            # Converter para lista de dicts
            data_rows = df.to_dict('records')
            fieldnames = list(df.columns)
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Arquivo deve ser CSV ou Excel (.xlsx)"
            )
        
        # Verificar headers (normalizando para lowercase e strip)
        if not fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Arquivo vazio ou inválido"
            )
            
        # Normalizar headers do arquivo para comparação
        file_headers = [str(h).strip().lower() for h in fieldnames]
        required_fields = ["name", "legal_name", "cnpj"]
        
        missing_fields = [field for field in required_fields if field not in file_headers]
        
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Campos obrigatórios ausentes: {', '.join(missing_fields)}"
            )
        
        results = {
            "success": 0,
            "errors": 0,
            "duplicates": 0,
            "details": []
        }
        
        from uuid import uuid4
        
        for row_num, row in enumerate(data_rows, start=2):
            try:
                # Normalizar chaves da linha para lowercase
                row_normalized = {str(k).strip().lower(): v for k, v in row.items() if k}
                
                # Validar dados básicos
                if not row_normalized.get("name") or not row_normalized.get("cnpj"):
                    results["errors"] += 1
                    results["details"].append(f"Linha {row_num}: Nome ou CNPJ ausente")
                    continue
                
                # Limpar CNPJ (apenas números)
                cnpj_clean = ''.join(filter(str.isdigit, row_normalized.get("cnpj", "")))
                
                # Verificar duplicidade
                existing_client = db.query(models.Client).filter(
                    models.Client.cnpj.like(f"%{cnpj_clean}%")
                ).first()
                
                if existing_client:
                    results["duplicates"] += 1
                    results["details"].append(f"Linha {row_num}: CNPJ {row_normalized.get('cnpj')} já existe (Cliente: {existing_client.name})")
                    continue
                
                # Processar tags
                tags_str = row_normalized.get("tags", "")
                tags_list = [t.strip() for t in tags_str.split(",")] if tags_str else []
                
                # Criar cliente
                new_client = models.Client(
                    id=str(uuid4()),
                    name=row_normalized.get("name"),
                    legal_name=row_normalized.get("legal_name", row_normalized.get("name")),
                    cnpj=row_normalized.get("cnpj"),
                    industry=row_normalized.get("industry"),
                    website=row_normalized.get("website"),
                    company_size=row_normalized.get("company_size", "small"),
                    notes=row_normalized.get("notes"),
                    tags=tags_list,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                db.add(new_client)
                results["success"] += 1
                
            except Exception as e:
                results["errors"] += 1
                results["details"].append(f"Linha {row_num}: Erro ao processar - {str(e)}")
        
        db.commit()
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na importação de clientes: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar arquivo: {str(e)}"
        )


# ============================================================================
# ROTAS DE ACCOUNTS
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/accounts",
    response_model=List[schemas.AccountResponse],
    summary="Listar Accounts",
    description="Retorna lista de accounts"
)
async def list_accounts(
    db: Session = Depends(get_db)
):
    """Lista todos os accounts"""
    try:
        accounts = db.query(models.Account).all()
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
# #         )\n\n\n# ============================================================================
# ROTAS DE NEWS (RADAR CS)
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/news",
    summary="Listar Notícias",
    description="Retorna notícias agrupadas por account, com filtro opcional por CSM"
)
async def list_news(
    csm: Optional[str] = Query(None, description="Filtrar por CSM (opcional)"),
    db: Session = Depends(get_db)
):
    """Lista notícias agrupadas por account"""
    try:
        from services.news_service import NewsService
        
        news_service = NewsService(db)
        results = news_service.get_news_by_csm(csm)
        
        return {
            "items": results,
            "total_accounts": len(results),
            "total_news": sum(r["total_news"] for r in results)
        }
        
    except Exception as e:
        logger.error(f"Erro ao listar notícias: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar notícias: {str(e)}"
        )


@app.post(
    f"{settings.API_PREFIX}/news/refresh/{{account_id}}",
    summary="Buscar Notícias para Account",
    description="Busca novas notícias para um account específico usando OpenAI"
)
async def refresh_news_for_account(
    account_id: str,
    force: bool = Query(False, description="Forçar refresh mesmo com cache válido"),
    db: Session = Depends(get_db)
):
    """Busca novas notícias para um account"""
    try:
        from services.news_service import NewsService
        
        # Verificar se account existe
        account = db.query(models.Account).filter(models.Account.id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account {account_id} não encontrado"
            )
        
        news_service = NewsService(db)
        news_items = await news_service.fetch_news_for_account(account_id, force_refresh=force)
        
        return {
            "account_id": account_id,
            "account_name": account.name,
            "news_count": len(news_items),
            "news_items": news_items
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar notícias para account {account_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar notícias: {str(e)}"
        )


@app.post(
    f"{settings.API_PREFIX}/news/refresh-all",
    summary="Buscar Notícias para Todos os Accounts",
    description="Busca notícias para todos os accounts (processo demorado)"
)
async def refresh_all_news(
    csm: Optional[str] = Query(None, description="Filtrar por CSM (opcional)"),
    db: Session = Depends(get_db)
):
    """Busca notícias para todos os accounts"""
    try:
        from services.news_service import NewsService
        
        news_service = NewsService(db)
        results = await news_service.fetch_news_for_all_accounts(csm_filter=csm)
        
        total_news = sum(len(items) for items in results.values())
        
        return {
            "accounts_processed": len(results),
            "total_news_fetched": total_news,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar notícias para todos os accounts: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar notícias: {str(e)}"
        )


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
    try:
        from uuid import uuid4
        activity_id = str(uuid4())
        
        # Criar activity dict
        activity_dict = activity.model_dump(by_alias=False)
        
        # Criar model
        db_activity = models.Activity(
            id=activity_id,
            created_by=current_user.user_id,
            **activity_dict
        )
        
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)
        
        return db_activity
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar activity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar activity: {str(e)}"
        )


@app.get(
    f"{settings.API_PREFIX}/activities",
    response_model=List[schemas.ActivityResponse],
    tags=["Activities"]
)
async def list_activities(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todas as activities"""
    try:
        activities = db.query(models.Activity).offset(skip).limit(limit).all()
        return activities
    except Exception as e:
        logger.error(f"Erro ao listar activities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar activities: {str(e)}"
        )


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
    activity = crud.update_activity(db, activity_id, activity_update)
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
    try:
        from uuid import uuid4
        task_id = str(uuid4())
        
        # Criar task dict
        task_dict = task.model_dump(by_alias=False)
        
        # Criar model
        db_task = models.Task(
            id=task_id,
            created_by=current_user.user_id,
            **task_dict
        )
        
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        logger.info(f"Task criada com sucesso: {task_id}")
        return db_task
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar task: {str(e)}"
        )


@app.get(
    f"{settings.API_PREFIX}/tasks",
    response_model=List[schemas.TaskResponse],
    tags=["Tasks"]
)
async def list_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todas as tasks"""
    try:
        tasks = db.query(models.Task).offset(skip).limit(limit).all()
        return tasks
    except Exception as e:
        logger.error(f"Erro ao listar tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar tasks: {str(e)}"
        )


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
    task =crud.update_task(db, task_id, task_update)
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


# ============================================================================
# HEALTH SCORE EVALUATION ROUTES
# ============================================================================

@app.post(
    f"{settings.API_PREFIX}/health-scores",
    response_model=schemas.HealthScoreEvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Health Scores"]
)
async def create_health_score_evaluation(
    evaluation: schemas.HealthScoreEvaluationCreate,
    db: Session = Depends(get_db)
):
    """Criar avaliação de health score com respostas detalhadas"""
    try:
        from uuid import uuid4
        
        # Validar se o account exists
        account = db.query(models.Account).filter(models.Account.id == evaluation.account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account não encontrado"
            )
        
        # Calcular scores
        responses_dict = evaluation.responses
        scores = list(responses_dict.values())
        total_score = round(sum(scores) / len(scores)) if scores else 0
        
        # Calcular scores por pilar (baseado nas questions do frontend)
        pilar_questions = {
            "Adoção e Engajamento": [1, 2],
            "Percepção de Valor": [3, 4],
            "Relacionamento e Satisfação": [5, 6],
            "Saúde Operacional": [7, 8],
            "Potencial de Crescimento": [9, 10],
        }
        
        pilar_scores = {}
        for pilar, question_ids in pilar_questions.items():
            pilar_score_values = [responses_dict.get(q_id, 0) for q_id in question_ids if q_id in responses_dict]
            if pilar_score_values:
                pilar_scores[pilar] = round(sum(pilar_score_values) / len(pilar_score_values))
        
        # Determinar classificação
        classification = 'critical'
        if total_score >= 90:
            classification = 'champion'
        elif total_score >= 70:
            classification = 'healthy'
        elif total_score >= 50:
            classification = 'attention'
        elif total_score >= 30:
            classification = 'at-risk'
        
        # Criar avaliação
        evaluation_id = str(uuid4())
        db_evaluation = crud.create_health_score_evaluation(
            db=db,
            evaluation_id=evaluation_id,
            account_id=evaluation.account_id,
            evaluated_by=evaluation.evaluated_by,
            total_score=total_score,
            classification=classification,
            responses=responses_dict,
            pilar_scores=pilar_scores
        )
        
        # Atualizar health score do account
        account.health_score = total_score
        db.commit()
        
        logger.info(f"Health score evaluation created: {evaluation_id} for account {evaluation.account_id} with score {total_score}")
        
        return db_evaluation
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar health score evaluation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar health score evaluation: {str(e)}"
        )


@app.get(
    f"{settings.API_PREFIX}/accounts/{{account_id}}/health-scores",
    response_model=List[schemas.HealthScoreEvaluationResponse],
    tags=["Health Scores"]
)
async def get_account_health_score_history(
    account_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Obter histórico de avaliações de health score de um account"""
    try:
        # Validar se o account exists
        account = db.query(models.Account).filter(models.Account.id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account não encontrado"
            )
        
        evaluations = crud.get_health_score_evaluations(db, account_id, limit)
        return evaluations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar histórico de health scores: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar histórico: {str(e)}"
        )


if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
