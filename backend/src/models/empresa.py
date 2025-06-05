from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_fantasia = Column(String(100), nullable=False)
    razao_social = Column(String(150), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=False)
    inscricao_estadual = Column(String(20), nullable=True)
    inscricao_municipal = Column(String(20), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    endereco = Column(Text, nullable=True)
    cidade = Column(String(50), nullable=True)
    estado = Column(String(2), nullable=True)
    cep = Column(String(10), nullable=True)
    responsavel = Column(String(100), nullable=True)
    logo_url = Column(String(255), nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medicos = relationship("MedicoEmpresa", back_populates="empresa")
    contratos = relationship("Contrato", back_populates="empresa")
    parametros_fiscais = relationship("ParametrosFiscaisEmpresa", back_populates="empresa", uselist=False)
    
    def __repr__(self):
        return f"<Empresa {self.nome_fantasia}>"

