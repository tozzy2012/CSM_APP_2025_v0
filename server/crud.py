"""
Camada CRUD - Operações de Banco de Dados
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
import logging
import models, schemas
import models, schemas
import uuid

logger = logging.getLogger(__name__)


# ============================================================================
# TENANT CRUD
# ============================================================================

def get_tenant(db: Session, tenant_id: UUID) -> Optional[models.Tenant]:
    """Buscar tenant por ID"""
    return db.query(models.Tenant).filter(models.Tenant.tenant_id == tenant_id).first()


def get_tenant_by_subdomain(db: Session, subdomain: str) -> Optional[models.Tenant]:
    """Buscar tenant por subdomain"""
    return db.query(models.Tenant).filter(models.Tenant.subdomain == subdomain).first()


def get_tenants(db: Session, skip: int = 0, limit: int = 100) -> List[models.Tenant]:
    """Listar tenants com paginação"""
    return db.query(models.Tenant).offset(skip).limit(limit).all()


def create_tenant(db: Session, tenant: schemas.TenantCreate) -> models.Tenant:
    """Criar novo tenant"""
    db_tenant = models.Tenant(**tenant.model_dump())
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


def update_tenant(db: Session, tenant_id: UUID, tenant_update: schemas.TenantUpdate) -> Optional[models.Tenant]:
    """Atualizar tenant"""
    db_tenant = get_tenant(db, tenant_id)
    if not db_tenant:
        return None
    
    update_data = tenant_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tenant, field, value)
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


def delete_tenant(db: Session, tenant_id: UUID) -> bool:
    """Deletar tenant"""
    db_tenant = get_tenant(db, tenant_id)
    if not db_tenant:
        return False
    
    db.delete(db_tenant)
    db.commit()
    return True


# ============================================================================
# ACCOUNT CRUD
# ============================================================================

def get_account(db: Session, account_id: UUID, tenant_id: UUID) -> Optional[models.Account]:
    """Buscar account por ID (com isolamento de tenant)"""
    return db.query(models.Account).filter(
        and_(
            models.Account.account_id == account_id,
            models.Account.tenant_id == tenant_id
        )
    ).first()


def get_accounts(
    db: Session,
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    lifecycle_stage: Optional[str] = None,
    csm_owner_id: Optional[UUID] = None
) -> List[models.Account]:
    """Listar accounts com filtros e paginação"""
    query = db.query(models.Account).filter(models.Account.tenant_id == tenant_id)
    
    if lifecycle_stage:
        query = query.filter(models.Account.lifecycle_stage == lifecycle_stage)
    
    if csm_owner_id:
        query = query.filter(models.Account.csm_owner_id == csm_owner_id)
    
    return query.offset(skip).limit(limit).all()


def count_accounts(
    db: Session,
    tenant_id: UUID,
    lifecycle_stage: Optional[str] = None,
    csm_owner_id: Optional[UUID] = None
) -> int:
    """Contar accounts com filtros"""
    query = db.query(models.Account).filter(models.Account.tenant_id == tenant_id)
    
    if lifecycle_stage:
        query = query.filter(models.Account.lifecycle_stage == lifecycle_stage)
    
    if csm_owner_id:
        query = query.filter(models.Account.csm_owner_id == csm_owner_id)
    
    return query.count()


def create_account(db: Session, account: schemas.AccountCreate) -> models.Account:
    """Criar nova account"""
    db_account = models.Account(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def update_account(
    db: Session,
    account_id: UUID,
    tenant_id: UUID,
    account_update: schemas.AccountUpdate
) -> Optional[models.Account]:
    """Atualizar account"""
    db_account = get_account(db, account_id, tenant_id)
    if not db_account:
        return None
    
    update_data = account_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)
    
    db.commit()
    db.refresh(db_account)
    return db_account


def delete_account(db: Session, account_id: UUID, tenant_id: UUID) -> bool:
    """Deletar account"""
    db_account = get_account(db, account_id, tenant_id)
    if not db_account:
        return False
    
    db.delete(db_account)
    db.commit()
    return True


# ============================================================================
# ============================================================================
# # CONTACT CRUD
# # ============================================================================
# 
# # def get_contact(db: Session, contact_id: UUID, tenant_id: UUID) -> Optional[models.Contact]:
# #     """Buscar contact por ID (com isolamento de tenant)"""
# #     return db.query(models.Contact).filter(
# #         and_(
# #             models.Contact.contact_id == contact_id,
# #             models.Contact.tenant_id == tenant_id
# #         )
# #     ).first()
# # 
# # 
# # def get_contacts_by_account(
# #     db: Session,
# #     account_id: UUID,
# #     tenant_id: UUID,
# #     skip: int = 0,
# #     limit: int = 100
# # ) -> List[models.Contact]:
# #     """Listar contacts de uma account"""
# #     return db.query(models.Contact).filter(
# #         and_(
# #             models.Contact.account_id == account_id,
# #             models.Contact.tenant_id == tenant_id
# #         )
# #     ).offset(skip).limit(limit).all()
# # 
# # 
# # def get_contact_by_email(db: Session, email: str, tenant_id: UUID) -> Optional[models.Contact]:
# #     """Buscar contact por email"""
# #     return db.query(models.Contact).filter(
# #         and_(
# #             models.Contact.email == email,
# #             models.Contact.tenant_id == tenant_id
# #         )
# #     ).first()
# # 
# # 
# # def create_contact(db: Session, contact: schemas.ContactCreate) -> models.Contact:
# #     """Criar novo contact"""
# #     db_contact = models.Contact(**contact.model_dump())
# #     db.add(db_contact)
# #     db.commit()
# #     db.refresh(db_contact)
# #     return db_contact
# # 
# # 
# # def update_contact(
# #     db: Session,
# #     contact_id: UUID,
# #     tenant_id: UUID,
# #     contact_update: schemas.ContactUpdate
# # ) -> Optional[models.Contact]:
# #     """Atualizar contact"""
# #     db_contact = get_contact(db, contact_id, tenant_id)
# #     if not db_contact:
# #         return None
# #     
# #     update_data = contact_update.model_dump(exclude_unset=True)
# #     for field, value in update_data.items():
# #         setattr(db_contact, field, value)
# #     
# #     db.commit()
# #     db.refresh(db_contact)
# #     return db_contact
# # 
# # 
# # def delete_contact(db: Session, contact_id: UUID, tenant_id: UUID) -> bool:
# #     """Deletar contact"""
# #     db_contact = get_contact(db, contact_id, tenant_id)
# #     if not db_contact:
# #         return False
# #     
# #     db.delete(db_contact)
# #     db.commit()
# #     return True


# ============================================================================
# # SUBSCRIPTION CRUD
# # ============================================================================
# 
# # def get_subscription(db: Session, subscription_id: UUID, tenant_id: UUID) -> Optional[models.Subscription]:
# #     """Buscar subscription por ID (com isolamento de tenant)"""
# #     return db.query(models.Subscription).filter(
# #         and_(
# #             models.Subscription.subscription_id == subscription_id,
# #             models.Subscription.tenant_id == tenant_id
# #         )
# #     ).first()
# # 
# # 
# # def get_subscriptions_by_account(
# #     db: Session,
# #     account_id: UUID,
# #     tenant_id: UUID,
# #     status: Optional[str] = None
# # ) -> List[models.Subscription]:
# #     """Listar subscriptions de uma account"""
# #     query = db.query(models.Subscription).filter(
# #         and_(
# #             models.Subscription.account_id == account_id,
# #             models.Subscription.tenant_id == tenant_id
# #         )
# #     )
# #     
# #     if status:
# #         query = query.filter(models.Subscription.status == status)
# #     
# #     return query.all()
# # 
# # 
# # def get_active_subscription(db: Session, account_id: UUID, tenant_id: UUID) -> Optional[models.Subscription]:
# #     """Buscar subscription ativa de uma account"""
# #     return db.query(models.Subscription).filter(
# #         and_(
# #             models.Subscription.account_id == account_id,
# #             models.Subscription.tenant_id == tenant_id,
# #             models.Subscription.status == "active"
# #         )
# #     ).first()
# # 
# # 
# # def create_subscription(db: Session, subscription: schemas.SubscriptionCreate) -> models.Subscription:
# #     """Criar nova subscription"""
# #     db_subscription = models.Subscription(**subscription.model_dump())
# #     db.add(db_subscription)
# #     db.commit()
# #     db.refresh(db_subscription)
# #     return db_subscription
# # 
# # 
# # def update_subscription(
# #     db: Session,
# #     subscription_id: UUID,
# #     tenant_id: UUID,
# #     subscription_update: schemas.SubscriptionUpdate
# # ) -> Optional[models.Subscription]:
# #     """Atualizar subscription"""
# #     db_subscription = get_subscription(db, subscription_id, tenant_id)
# #     if not db_subscription:
# #         return None
# #     
# #     update_data = subscription_update.model_dump(exclude_unset=True)
# #     for field, value in update_data.items():
# #         setattr(db_subscription, field, value)
# #     
# #     db.commit()
# #     db.refresh(db_subscription)
# #     return db_subscription
# # 
# # 
# # def delete_subscription(db: Session, subscription_id: UUID, tenant_id: UUID) -> bool:
# #     """Deletar subscription"""
# #     db_subscription = get_subscription(db, subscription_id, tenant_id)
# #     if not db_subscription:
# #         return False
# #     
# #     db.delete(db_subscription)
# #     db.commit()
# #     return True


# ============================================================================
# ACTIVITY CRUD
# ============================================================================

def get_activity(db: Session, activity_id: str, organization_id: str) -> Optional[models.Activity]:
    """Buscar activity por ID"""
    return db.query(models.Activity).filter(
        and_(
            models.Activity.id == activity_id,
            models.Activity.organization_id == organization_id
        )
    ).first()


def get_activities(db: Session, organization_id: str, skip: int = 0, limit: int = 100) -> List[models.Activity]:
    """Listar activities com paginação"""
    return db.query(models.Activity).filter(
        models.Activity.organization_id == organization_id
    ).offset(skip).limit(limit).all()


def get_activities_by_account(db: Session, account_id: str, organization_id: str) -> List[models.Activity]:
    """Buscar activities por account"""
    return db.query(models.Activity).filter(
        and_(
            models.Activity.account_id == account_id,
            models.Activity.organization_id == organization_id
        )
    ).all()


def create_activity(db: Session, activity: schemas.ActivityCreate, organization_id: str, activity_id: str, created_by: str = None) -> models.Activity:
    """Criar nova activity"""
    db_activity = models.Activity(
        id=activity_id,
        organization_id=organization_id,
        created_by=str(created_by) if created_by else None,
        **activity.model_dump()
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity


def update_activity(db: Session, activity_id: str, activity_update: schemas.ActivityUpdate) -> Optional[models.Activity]:
    """Atualizar activity"""
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not db_activity:
        return None
    
    update_data = activity_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_activity, field, value)
    
    db.commit()
    db.refresh(db_activity)
    return db_activity


def delete_activity(db: Session, activity_id: str, organization_id: str) -> bool:
    """Deletar activity"""
    db_activity = get_activity(db, activity_id, organization_id)
    if not db_activity:
        return False
    
    db.delete(db_activity)
    db.commit()
    return True


# ============================================================================
# TASK CRUD
# ============================================================================

def get_task(db: Session, task_id: str, organization_id: str) -> Optional[models.Task]:
    """Buscar task por ID"""
    return db.query(models.Task).filter(
        and_(
            models.Task.id == task_id,
            models.Task.organization_id == organization_id
        )
    ).first()


def get_tasks(db: Session, organization_id: str, skip: int = 0, limit: int = 100) -> List[models.Task]:
    """Listar tasks com paginação"""
    return db.query(models.Task).filter(
        models.Task.organization_id == organization_id
    ).offset(skip).limit(limit).all()


def get_tasks_by_account(db: Session, account_id: str, organization_id: str) -> List[models.Task]:
    """Buscar tasks por account"""
    return db.query(models.Task).filter(
        and_(
            models.Task.account_id == account_id,
            models.Task.organization_id == organization_id
        )
    ).all()


def create_task(db: Session, task: schemas.TaskCreate, organization_id: str, task_id: str, created_by: str = None) -> models.Task:
    """Criar nova task"""
    # DEBUG: Check if account exists
    if task.account_id:
        account = db.query(models.Account).filter(models.Account.id == task.account_id).first()
        if not account:
            logger.warning(f"DEBUG: Account {task.account_id} NOT FOUND in DB!")
        else:
            logger.info(f"DEBUG: Account {task.account_id} FOUND in DB. ID: '{account.id}'")

    db_task = models.Task(
        id=task_id,
        organization_id=organization_id,
        created_by=str(created_by) if created_by else None,
        **task.model_dump()
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: str, task_update: schemas.TaskUpdate) -> Optional[models.Task]:
    """Atualizar task"""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        return None
    
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: str, organization_id: str) -> bool:
    """Deletar task"""
    db_task = get_task(db, task_id, organization_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True


# ============================================================================
# HEALTH SCORE EVALUATION CRUD
# ============================================================================

def create_health_score_evaluation(
    db: Session,
    evaluation_id: str,
    account_id: str,
    evaluated_by: str,
    total_score: int,
    classification: str,
    responses: dict,
    pilar_scores: dict
) -> models.HealthScoreEvaluation:
    """Criar nova avaliação de health score"""
    db_evaluation = models.HealthScoreEvaluation(
        id=evaluation_id,
        account_id=account_id,
        evaluated_by=evaluated_by,
        total_score=total_score,
        classification=classification,
        responses=responses,
        pilar_scores=pilar_scores
    )
    db.add(db_evaluation)
    
    # Update account health score
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if account:
        account.health_score = total_score
        # Update status based on classification if needed
        # account.health_status = classification
        
    db.commit()
    db.refresh(db_evaluation)
    return db_evaluation


def get_health_score_evaluations(
    db: Session,
    account_id: str,
    limit: int = 10
) -> List[models.HealthScoreEvaluation]:
    """Buscar histórico de avaliações de health score para um account"""
    return db.query(models.HealthScoreEvaluation).filter(
        models.HealthScoreEvaluation.account_id == account_id
    ).order_by(
        models.HealthScoreEvaluation.evaluation_date.desc()
    ).limit(limit).all()


def get_latest_health_score_evaluation(
    db: Session,
    account_id: str
) -> Optional[models.HealthScoreEvaluation]:
    """Buscar a avaliação mais recente de health score para um account"""
    return db.query(models.HealthScoreEvaluation).filter(
        models.HealthScoreEvaluation.account_id == account_id
    ).order_by(
        models.HealthScoreEvaluation.evaluation_date.desc()
    ).first()


# ============================================================================
# INVITE CRUD
# ============================================================================

def create_invite(
    db: Session,
    invite: schemas.InviteCreate,
    token: str,
    expires_at: datetime,
    invited_by: str = None
) -> models.Invite:
    """Criar novo convite"""
    db_invite = models.Invite(
        email=invite.email,
        token=token,
        role=invite.role,
        organization_id=invite.organization_id,
        invited_by=invited_by,
        expires_at=expires_at
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite


def get_invite_by_token(db: Session, token: str) -> Optional[models.Invite]:
    """Buscar convite por token"""
    return db.query(models.Invite).filter(models.Invite.token == token).first()


def get_invite_by_email(db: Session, email: str) -> Optional[models.Invite]:
    """Buscar convite por email (apenas pendentes)"""
    return db.query(models.Invite).filter(
        and_(
            models.Invite.email == email,
            models.Invite.status == "pending"
        )
    ).first()


def get_invites(db: Session, skip: int = 0, limit: int = 100) -> List[models.Invite]:
    """Listar convites"""
    return db.query(models.Invite).order_by(
        models.Invite.created_at.desc()
    ).offset(skip).limit(limit).all()


def count_invites(db: Session) -> int:
    """Contar total de convites"""
    return db.query(models.Invite).count()


def update_invite_status(
    db: Session,
    invite_id: UUID,
    status: str,
    accepted_at: Optional[datetime] = None
) -> Optional[models.Invite]:
    """Atualizar status do convite"""
    db_invite = db.query(models.Invite).filter(models.Invite.id == invite_id).first()
    if not db_invite:
        return None
    
    db_invite.status = status
    if accepted_at:
        db_invite.accepted_at = accepted_at
        
    db.commit()
    db.refresh(db_invite)
    return db_invite


def revoke_invite(db: Session, invite_id: UUID) -> bool:
    """Revogar convite (marcar como revoked)"""
    return update_invite_status(db, invite_id, "revoked") is not None


def delete_invite(db: Session, invite_id: UUID) -> bool:
    """Deletar convite permanentemente"""
    db_invite = db.query(models.Invite).filter(models.Invite.id == invite_id).first()
    if not db_invite:
        return False
    
    db.delete(db_invite)
    db.commit()
    return True


def update_invite(db: Session, invite_id: UUID, invite_data: schemas.InviteUpdate) -> Optional[models.Invite]:
    """Atualizar dados do convite"""
    db_invite = db.query(models.Invite).filter(models.Invite.id == invite_id).first()
    if not db_invite:
        return None
    
    update_data = invite_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_invite, field, value)
        
    db.commit()
    db.refresh(db_invite)
    return db_invite
