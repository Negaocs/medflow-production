from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class TipoPlantao(Base):
    __tablename__ = "tipos_plantao"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    duracao_horas = Column(Float, nullable=False)
    valor_padrao = Column(Float, nullable=True)
    cor = Column(String(20), nullable=True)  # Para representação visual no frontend
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    contratos_tipos_plantao = relationship("ContratoTipoPlantao", back_populates="tipo_plantao")
    plantoes = relationship("Plantao", back_populates="tipo_plantao")
    
    def __repr__(self):
        return f"<TipoPlantao {self.nome} - {self.duracao_horas}h>"

