from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Date, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("medflow-models")

# Carregar variáveis de ambiente
load_dotenv()

# Configurar hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Gera hash da senha."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha está correta."""
    return pwd_context.verify(plain_password, hashed_password)

# Configurar banco de dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./medflow.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Função para obter sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modelo de Usuário
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Modelo de Médico
class Medico(Base):
    __tablename__ = "medicos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    crm = Column(String(20), nullable=False)
    cpf = Column(String(14), nullable=False)
    rg = Column(String(20))
    data_nascimento = Column(Date)
    telefone = Column(String(20))
    celular = Column(String(20))
    email = Column(String(100))
    endereco = Column(String(200))
    cidade = Column(String(100))
    estado = Column(String(2))
    cep = Column(String(10))
    especialidade = Column(String(100))
    banco = Column(String(100))
    agencia = Column(String(20))
    conta = Column(String(20))
    pix = Column(String(100))
    observacoes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Modelo de Empresa
class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    razao_social = Column(String(200), nullable=False)
    cnpj = Column(String(18), nullable=False)
    endereco = Column(String(200))
    cidade = Column(String(100))
    estado = Column(String(2))
    cep = Column(String(10))
    telefone = Column(String(20))
    email = Column(String(100))
    website = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    hospitais = relationship("Hospital", back_populates="empresa")

# Modelo de Hospital
class Hospital(Base):
    __tablename__ = "hospitais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    endereco = Column(String(200))
    cidade = Column(String(100))
    estado = Column(String(2))
    cep = Column(String(10))
    telefone = Column(String(20))
    email = Column(String(100))
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    empresa = relationship("Empresa", back_populates="hospitais")
    plantoes = relationship("Plantao", back_populates="hospital")

# Modelo de Tipo de Plantão
class TipoPlantao(Base):
    __tablename__ = "tipos_plantao"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    plantoes = relationship("Plantao", back_populates="tipo_plantao")

# Modelo de Plantão
class Plantao(Base):
    __tablename__ = "plantoes"

    id = Column(Integer, primary_key=True, index=True)
    data_inicio = Column(DateTime(timezone=True), nullable=False)
    data_fim = Column(DateTime(timezone=True), nullable=False)
    valor = Column(Float, nullable=False)
    medico_id = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitais.id"), nullable=False)
    tipo_plantao_id = Column(Integer, ForeignKey("tipos_plantao.id"), nullable=False)
    status = Column(String(20), default="agendado")  # agendado, realizado, cancelado
    observacoes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    medico = relationship("Medico")
    hospital = relationship("Hospital", back_populates="plantoes")
    tipo_plantao = relationship("TipoPlantao", back_populates="plantoes")

# Função para inicializar o banco de dados
def init_database():
    """Inicializa o banco de dados e cria usuário admin se não existir."""
    try:
        logger.info("Criando tabelas...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tabelas criadas com sucesso")
        
        # Criar sessão
        db = SessionLocal()
        
        # Verificar se usuário admin existe
        admin_user = db.query(User).filter_by(email="admin@medflow.com").first()
        if not admin_user:
            logger.info("Criando usuário admin...")
            admin_user = User(
                nome="Administrador",
                email="admin@medflow.com",
                senha_hash=get_password_hash("admin123"),
                is_admin=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Usuário admin criado com sucesso")
        else:
            logger.info("Usuário admin já existe")
        
        # Verificar se usuário médico existe
        medico_user = db.query(User).filter_by(email="medico@medflow.com").first()
        if not medico_user:
            logger.info("Criando usuário médico...")
            medico_user = User(
                nome="Médico Teste",
                email="medico@medflow.com",
                senha_hash=get_password_hash("medico123"),
                is_admin=False,
                is_active=True
            )
            db.add(medico_user)
            db.commit()
            logger.info("Usuário médico criado com sucesso")
        else:
            logger.info("Usuário médico já existe")
        
        db.close()
        logger.info("Inicialização do banco de dados concluída com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {str(e)}", exc_info=True)
        raise

