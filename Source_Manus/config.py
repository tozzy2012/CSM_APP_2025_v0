"""
Configurações do Microsserviço de CRM
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Informações do Serviço
    SERVICE_NAME: str = "servico-crm"
    SERVICE_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Banco de Dados
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/zapper_cs_db"
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_ECHO: bool = False
    
    # Redis (Cache)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_TTL: int = 300  # 5 minutos
    
    # RabbitMQ (Message Broker)
    RABBITMQ_URL: str = os.getenv(
        "RABBITMQ_URL",
        "amqp://guest:guest@localhost:5672/"
    )
    
    # Autenticação (JWT)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    
    # Provedor de Identidade (Clerk/Kinde)
    IDENTITY_PROVIDER: str = os.getenv("IDENTITY_PROVIDER", "clerk")  # clerk, kinde, zitadel
    CLERK_SECRET_KEY: Optional[str] = os.getenv("CLERK_SECRET_KEY")
    KINDE_DOMAIN: Optional[str] = os.getenv("KINDE_DOMAIN")
    KINDE_CLIENT_ID: Optional[str] = os.getenv("KINDE_CLIENT_ID")
    KINDE_CLIENT_SECRET: Optional[str] = os.getenv("KINDE_CLIENT_SECRET")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Paginação
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Ambiente
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development, staging, production
    
    class Config:
        case_sensitive = True
        env_file = ".env"


# Instância global de configurações
settings = Settings()
