"""
Schemas Pydantic para Validação e Serialização
"""
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal


# ============================================================================
# TENANT SCHEMAS
# ============================================================================

class TenantBase(BaseModel):
    """Schema base para Tenant"""
    name: str = Field(..., min_length=1, max_length=255)
    subdomain: str = Field(..., min_length=1, max_length=100)
    plan: str = Field(default="starter", pattern="^(starter|professional|enterprise)$")
    status: str = Field(default="active", pattern="^(active|suspended|cancelled)$")
    settings: Optional[dict] = {}


class TenantCreate(TenantBase):
    """Schema para criação de Tenant"""
    pass


class TenantUpdate(BaseModel):
    """Schema para atualização de Tenant"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    plan: Optional[str] = Field(None, pattern="^(starter|professional|enterprise)$")
    status: Optional[str] = Field(None, pattern="^(active|suspended|cancelled)$")
    settings: Optional[dict] = None


class TenantResponse(TenantBase):
    """Schema de resposta para Tenant"""
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ACCOUNT SCHEMAS
# ============================================================================

class AccountBase(BaseModel):
    """Schema base para Account"""
    name: str = Field(..., min_length=1, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, pattern="^(1-10|11-50|51-200|201-1000|1000\\+)$")
    address: Optional[str] = None
    lifecycle_stage: str = Field(
        default="onboarding",
        pattern="^(onboarding|adoption|renewal|expansion|churn)$"
    )
    csm_owner_id: Optional[UUID] = None
    logo_url: Optional[str] = None


class AccountCreate(AccountBase):
    """Schema para criação de Account"""
    tenant_id: UUID


class AccountUpdate(BaseModel):
    """Schema para atualização de Account"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, pattern="^(1-10|11-50|51-200|201-1000|1000\\+)$")
    address: Optional[str] = None
    lifecycle_stage: Optional[str] = Field(
        None,
        pattern="^(onboarding|adoption|renewal|expansion|churn)$"
    )
    csm_owner_id: Optional[UUID] = None
    logo_url: Optional[str] = None


class AccountResponse(AccountBase):
    """Schema de resposta para Account"""
    account_id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AccountWithDetails(AccountResponse):
    """Schema de resposta com detalhes relacionados"""
    contacts: List["ContactResponse"] = []
    subscriptions: List["SubscriptionResponse"] = []


# ============================================================================
# CONTACT SCHEMAS
# ============================================================================

class ContactBase(BaseModel):
    """Schema base para Contact"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    is_primary: bool = False


class ContactCreate(ContactBase):
    """Schema para criação de Contact"""
    account_id: UUID
    tenant_id: UUID


class ContactUpdate(BaseModel):
    """Schema para atualização de Contact"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    is_primary: Optional[bool] = None


class ContactResponse(ContactBase):
    """Schema de resposta para Contact"""
    contact_id: UUID
    account_id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SUBSCRIPTION SCHEMAS
# ============================================================================

class SubscriptionBase(BaseModel):
    """Schema base para Subscription"""
    product_name: str = Field(..., min_length=1, max_length=255)
    plan_name: str = Field(..., min_length=1, max_length=100)
    mrr: Decimal = Field(..., ge=0, decimal_places=2)
    arr: Decimal = Field(..., ge=0, decimal_places=2)
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    start_date: date
    renewal_date: date
    status: str = Field(default="active", pattern="^(active|cancelled|expired)$")
    licenses_purchased: int = Field(default=1, ge=1)
    licenses_active: int = Field(default=0, ge=0)


class SubscriptionCreate(SubscriptionBase):
    """Schema para criação de Subscription"""
    account_id: UUID
    tenant_id: UUID


class SubscriptionUpdate(BaseModel):
    """Schema para atualização de Subscription"""
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    plan_name: Optional[str] = Field(None, min_length=1, max_length=100)
    mrr: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    arr: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$")
    start_date: Optional[date] = None
    renewal_date: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(active|cancelled|expired)$")
    licenses_purchased: Optional[int] = Field(None, ge=1)
    licenses_active: Optional[int] = Field(None, ge=0)


class SubscriptionResponse(SubscriptionBase):
    """Schema de resposta para Subscription"""
    subscription_id: UUID
    account_id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# PAGINATION SCHEMAS
# ============================================================================

class PaginationParams(BaseModel):
    """Parâmetros de paginação"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Resposta paginada genérica"""
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# HEALTH CHECK SCHEMAS
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Schema de resposta para health check"""
    status: str
    service: str
    version: str
    timestamp: datetime
    database: str = "unknown"
    cache: str = "unknown"
