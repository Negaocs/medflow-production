from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class Hospital(Base):
    __tablename__ = "hospitais"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    endereco = Column(Text, nullable=True)
    cidade = Column(String(50), nullable=True)
    estado = Column(String(2), nullable=True)
    cep = Column(String(10), nullable=True)
    responsavel = Column(String(100), nullable=True)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    contratos = relationship("Contrato", back_populates="hospital")
    plantoes = relationship("Plantao", back_populates="hospital")
    
    def __repr__(self):
        return f"<Hospital {self.nome}>"

