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
    # Relacionamentos
    # accounts = relationship("Account", back_populates="tenant", cascade="all, delete-orphan")
    # contacts = relationship("Contact", back_populates="tenant", cascade="all, delete-orphan")
    # subscriptions = relationship("Subscription", back_populates="tenant", cascade="all, delete-orphan")


class Client(Base):
    """Modelo de Cliente (usado pela nova funcionalidade)"""
    __tablename__ = "clients"
    
    id = Column(String(255), primary_key=True)
    organization_id = Column(String(255), nullable=False)
    
    # Dados da Empresa
    name = Column(String(255), nullable=False)  # Nome Fantasia
    legal_name = Column(String(255), nullable=False)  # Razão Social
    cnpj = Column(String(18), nullable=False)
    industry = Column(String(255))
    website = Column(String(500))
    
    # Endereço (JSON)
    address = Column(JSON)
    
    # Informações Comerciais
    company_size = Column(String(50))
    revenue = Column(String(100))
    founded_year = Column(Integer)
    
    # Mapa de Poder e Contatos (JSON)
    power_map = Column(JSON, default=[])
    contacts = Column(JSON, default=[])
    
    # Informações Adicionais
    notes = Column(Text)
    tags = Column(JSON, default=[])
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String(255))


class Account(Base):
    """Modelo de Account (Cliente ativo no CS)"""
    __tablename__ = "accounts"
    
    id = Column(String(255), primary_key=True)
    organization_id = Column(String(255), nullable=False)
    client_id = Column(String(255), nullable=False)
    
    # Dados do Account
    name = Column(String(255), nullable=False)
    industry = Column(String(255))
    stage = Column(String(50))
    type = Column(String(50))
    status = Column(String(100))
    health_status = Column(String(50))
    health_score = Column(Integer, default=75)
    
    # Financeiro
    mrr = Column(Numeric(10, 2), default=0)
    contract_value = Column(Numeric(10, 2), default=0)
    contract_start = Column(Date)
    contract_end = Column(Date)
    
    # CS
    csm = Column(String(255))
    employees = Column(Integer, default=0)
    website = Column(String(500))
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# class Contact(Base):
#     """Modelo de Contato"""
#     __tablename__ = "contacts"
    
#     contact_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
#     account_id = Column(PGUUID(as_uuid=True), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False)
#     tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
#     first_name = Column(String(100), nullable=False)
#     last_name = Column(String(100), nullable=False)
#     email = Column(String(255), nullable=False)
#     phone = Column(String(50))
#     job_title = Column(String(100))
#     is_primary = Column(Boolean, default=False)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
#     # Relacionamentos
#     account = relationship("Account", back_populates="contacts")
#     tenant = relationship("Tenant", back_populates="contacts")


# class Subscription(Base):
#     """Modelo de Assinatura"""
#     __tablename__ = "subscriptions"
    
#     subscription_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
#     account_id = Column(PGUUID(as_uuid=True), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False)
#     tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
#     product_name = Column(String(255), nullable=False)
#     plan_name = Column(String(100), nullable=False)
#     mrr = Column(Numeric(10, 2), nullable=False)
#     arr = Column(Numeric(10, 2), nullable=False)
#     currency = Column(String(3), default="USD")
#     start_date = Column(Date, nullable=False)
#     renewal_date = Column(Date, nullable=False)
#     status = Column(String(50), default="active")
#     licenses_purchased = Column(Integer, default=1)
#     licenses_active = Column(Integer, default=0)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
#     # Relacionamentos
#     account = relationship("Account", back_populates="subscriptions")
#     tenant = relationship("Tenant", back_populates="subscriptions")


class Activity(Base):
    """Modelo de Atividade"""
    __tablename__ = "activities"
    
    id = Column(String(255), primary_key=True)
    organization_id = Column(String(255), nullable=False)
    account_id = Column(String(255), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    
    # Dados da Atividade
    title = Column(String(500), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # email, call, meeting, note, system
    status = Column(String(50), default="pending")  # pending, in-progress, completed, cancelled
    
    # Atribuição
    assignee = Column(String(255))  # ID do usuário responsável
    team = Column(String(255))  # ID do time
    
    # Datas
    due_date = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String(255))


class Task(Base):
    """Modelo de Tarefa"""
    __tablename__ = "tasks"
    
    id = Column(String(255), primary_key=True)
    organization_id = Column(String(255), nullable=False)
    account_id = Column(String(255), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True)
    
    # Dados da Tarefa
    title = Column(String(500), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="todo")  # todo, in-progress, completed, cancelled
    priority = Column(String(50), default="medium")  # urgent, high, medium, low
    
    # Atribuição
    assignee = Column(String(255))  # ID do usuário responsável
    
    # Datas
    due_date = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String(255))
