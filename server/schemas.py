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
# CLIENT SCHEMAS
# ============================================================================

class PowerMapContact(BaseModel):
    """Schema para contato do mapa de poder"""
    id: str
    name: str
    role: str
    department: str
    influence: str  # champion | influencer | neutral | blocker
    email: str
    phone: str
    notes: str


class ClientContact(BaseModel):
    """Schema para contato do cliente"""
    id: str
    type: str  # phone | whatsapp | email | other
    value: str
    label: str
    isPrimary: bool


class Address(BaseModel):
    """Schema para endereço"""
    street: str
    number: str
    complement: str
    neighborhood: str
    city: str
    state: str
    zipCode: str
    country: str


class ClientBase(BaseModel):
    """Schema base para Client"""
    organization_id: str = Field(..., alias="organizationId")
    name: str = Field(..., min_length=1, max_length=255)
    legal_name: str = Field(..., alias="legalName", min_length=1, max_length=255)
    cnpj: str = Field(..., min_length=1, max_length=18)
    industry: Optional[str] = None
    website: Optional[str] = None
    address: Optional[Address] = None
    company_size: Optional[str] = Field(None, alias="companySize")
    revenue: Optional[str] = None
    founded_year: Optional[int] = Field(None, alias="foundedYear")
    power_map: List[PowerMapContact] = Field(default=[], alias="powerMap")
    contacts: List[ClientContact] = Field(default=[])
    notes: Optional[str] = None
    tags: List[str] = Field(default=[])
    created_by: Optional[str] = Field(None, alias="createdBy")

    model_config = ConfigDict(populate_by_name=True)


class ClientCreate(ClientBase):
    """Schema para criação de Client"""
    pass


class ClientUpdate(BaseModel):
    """Schema para atualização de Client"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    legal_name: Optional[str] = Field(None, alias="legalName", min_length=1, max_length=255)
    cnpj: Optional[str] = Field(None, min_length=1, max_length=18)
    industry: Optional[str] = None
    website: Optional[str] = None
    address: Optional[Address] = None
    company_size: Optional[str] = Field(None, alias="companySize")
    revenue: Optional[str] = None
    founded_year: Optional[int] = Field(None, alias="foundedYear")
    power_map: Optional[List[PowerMapContact]] = Field(None, alias="powerMap")
    contacts: Optional[List[ClientContact]] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

    model_config = ConfigDict(populate_by_name=True)


class ClientResponse(ClientBase):
    """Schema de resposta para Client"""
    id: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ============================================================================
# ACCOUNT SCHEMAS
# ============================================================================

class AccountBase(BaseModel):
    """Schema base para Account"""
    organization_id: str = Field(..., alias="organizationId")
    client_id: str = Field(..., alias="clientId")
    name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = None
    stage: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    health_status: Optional[str] = Field(None, alias="healthStatus")
    health_score: int = Field(default=75, alias="healthScore")
    mrr: float = Field(default=0.0)
    contract_value: float = Field(default=0.0, alias="contractValue")
    contract_start: Optional[date] = Field(None, alias="contractStart")
    contract_end: Optional[date] = Field(None, alias="contractEnd")
    csm: Optional[str] = None
    employees: int = Field(default=0)
    website: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class AccountCreate(AccountBase):
    """Schema para criação de Account"""
    pass


class AccountUpdate(BaseModel):
    """Schema para atualização de Account"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    industry: Optional[str] = None
    stage: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    health_status: Optional[str] = Field(None, alias="healthStatus")
    health_score: Optional[int] = Field(None, alias="healthScore")
    mrr: Optional[float] = None
    contract_value: Optional[float] = Field(None, alias="contractValue")
    contract_start: Optional[date] = Field(None, alias="contractStart")
    contract_end: Optional[date] = Field(None, alias="contractEnd")
    csm: Optional[str] = None
    employees: Optional[int] = None
    website: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class AccountResponse(AccountBase):
    """Schema de resposta para Account"""
    id: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


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


# Helper para camelCase
def to_camel(string: str) -> str:
    words = string.split('_')
    return words[0] + ''.join(word.capitalize() for word in words[1:])

# ============================================================================
# ACTIVITY SCHEMAS
# ============================================================================

class ActivityBase(BaseModel):
    """Schema base de Activity"""
    title: str
    description: Optional[str] = None
    type: str  # email, call, meeting, note, system
    status: str = "pending"  # pending, in-progress, completed, cancelled
    assignee: Optional[str] = None
    team: Optional[str] = None
    due_date: Optional[datetime] = None
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


class ActivityCreate(ActivityBase):
    """Schema para criação de Activity"""
    account_id: str


class ActivityUpdate(BaseModel):
    """Schema para atualização de Activity"""
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    assignee: Optional[str] = None
    team: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


class ActivityResponse(ActivityBase):
    """Schema de resposta de Activity"""
    id: str
    organization_id: str
    account_id: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


# ============================================================================
# TASK SCHEMAS
# ============================================================================

class TaskBase(BaseModel):
    """Schema base de Task"""
    title: str
    description: Optional[str] = None
    status: str = "todo"  # todo, in-progress, completed, cancelled
    priority: str = "medium"  # urgent, high, medium, low
    assignee: Optional[str] = None
    due_date: datetime
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


class TaskCreate(TaskBase):
    """Schema para criação de Task"""
    account_id: Optional[str] = None


class TaskUpdate(BaseModel):
    """Schema para atualização de Task"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    account_id: Optional[str] = None
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


class TaskResponse(TaskBase):
    """Schema de resposta de Task"""
    id: str
    organization_id: str
    account_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )
