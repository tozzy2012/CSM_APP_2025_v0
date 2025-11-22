"""
Modelos de Dados do Microsserviço de CRM
SQLAlchemy ORM Models
"""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Numeric, Date, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Tenant(Base):
    """Modelo de Tenant (Organização)"""
    __tablename__ = "tenants"
    
    tenant_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    subdomain = Column(String(100), unique=True, nullable=False)
    plan = Column(String(50), nullable=False, default="starter")
    status = Column(String(50), nullable=False, default="active")
    settings = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    accounts = relationship("Account", back_populates="tenant", cascade="all, delete-orphan")
    contacts = relationship("Contact", back_populates="tenant", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="tenant", cascade="all, delete-orphan")


class Account(Base):
    """Modelo de Conta (Cliente do Tenant)"""
    __tablename__ = "accounts"
    
    account_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    domain = Column(String(255))
    industry = Column(String(100))
    company_size = Column(String(50))
    address = Column(Text)
    lifecycle_stage = Column(String(50), default="onboarding")
    csm_owner_id = Column(PGUUID(as_uuid=True))  # ID do CSM (sistema externo)
    logo_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    tenant = relationship("Tenant", back_populates="accounts")
    contacts = relationship("Contact", back_populates="account", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="account", cascade="all, delete-orphan")


class Contact(Base):
    """Modelo de Contato"""
    __tablename__ = "contacts"
    
    contact_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    account_id = Column(PGUUID(as_uuid=True), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    job_title = Column(String(100))
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    account = relationship("Account", back_populates="contacts")
    tenant = relationship("Tenant", back_populates="contacts")


class Subscription(Base):
    """Modelo de Assinatura"""
    __tablename__ = "subscriptions"
    
    subscription_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    account_id = Column(PGUUID(as_uuid=True), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(255), nullable=False)
    plan_name = Column(String(100), nullable=False)
    mrr = Column(Numeric(10, 2), nullable=False)
    arr = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    start_date = Column(Date, nullable=False)
    renewal_date = Column(Date, nullable=False)
    status = Column(String(50), default="active")
    licenses_purchased = Column(Integer, default=1)
    licenses_active = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    account = relationship("Account", back_populates="subscriptions")
    tenant = relationship("Tenant", back_populates="subscriptions")
