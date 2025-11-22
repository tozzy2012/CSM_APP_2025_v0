"""
Configuração e Gerenciamento de Banco de Dados
"""
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import Pool
from typing import Generator
import logging

from config import settings

logger = logging.getLogger(__name__)

# Criar engine do SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,  # Verificar conexões antes de usar
)

# Criar SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Event listener para log de queries lentas
@event.listens_for(Pool, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log quando uma nova conexão é estabelecida"""
    logger.debug("Nova conexão de banco de dados estabelecida")


@event.listens_for(Pool, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log quando uma conexão é retirada do pool"""
    logger.debug("Conexão retirada do pool")


def get_db() -> Generator[Session, None, None]:
    """
    Dependency para obter sessão de banco de dados
    Uso: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def check_database_health() -> bool:
    """
    Verificar saúde da conexão com o banco de dados
    Retorna True se a conexão está OK
    """
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        logger.error(f"Erro ao verificar saúde do banco de dados: {e}")
        return False


def init_db():
    """
    Inicializar banco de dados (criar tabelas se não existirem)
    Nota: Em produção, use migrations (Alembic) ao invés disso
    """
    from models import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Banco de dados inicializado")
