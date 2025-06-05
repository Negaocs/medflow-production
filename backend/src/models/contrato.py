from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id = Column(String(36), ForeignKey("empresas.id"), nullable=False)
    hospital_id = Column(String(36), ForeignKey("hospitais.id"), nullable=False)
    numero_contrato = Column(String(50), nullable=True)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=True)
    descricao = Column(Text, nullable=True)
    valor_total = Column(Float, nullable=True)
    observacoes = Column(Text, nullable=True)
    arquivo_url = Column(String(255), nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa", back_populates="contratos")
    hospital = relationship("Hospital", back_populates="contratos")
    tipos_plantao = relationship("ContratoTipoPlantao", back_populates="contrato")
    plantoes = relationship("Plantao", back_populates="contrato")
    
    def __repr__(self):
        return f"<Contrato {self.numero_contrato} - {self.empresa_id} - {self.hospital_id}>"

class ContratoTipoPlantao(Base):
    __tablename__ = "contratos_tipos_plantao"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contrato_id = Column(String(36), ForeignKey("contratos.id"), nullable=False)
    tipo_plantao_id = Column(String(36), ForeignKey("tipos_plantao.id"), nullable=False)
    valor = Column(Float, nullable=False)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    contrato = relationship("Contrato", back_populates="tipos_plantao")
    tipo_plantao = relationship("TipoPlantao", back_populates="contratos_tipos_plantao")
    
    def __repr__(self):
        return f"<ContratoTipoPlantao {self.contrato_id} - {self.tipo_plantao_id}>"

