from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text, Float, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class Plantao(Base):
    __tablename__ = "plantoes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    hospital_id = Column(String(36), ForeignKey("hospitais.id"), nullable=False)
    contrato_id = Column(String(36), ForeignKey("contratos.id"), nullable=False)
    tipo_plantao_id = Column(String(36), ForeignKey("tipos_plantao.id"), nullable=False)
    data = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fim = Column(Time, nullable=False)
    valor_unitario = Column(Float, nullable=False)
    valor_total = Column(Float, nullable=False)
    observacoes = Column(Text, nullable=True)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    confirmado = Column(Boolean, default=False)
    data_confirmacao = Column(DateTime(timezone=True), nullable=True)
    usuario_confirmacao_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="plantoes")
    hospital = relationship("Hospital", back_populates="plantoes")
    contrato = relationship("Contrato", back_populates="plantoes")
    tipo_plantao = relationship("TipoPlantao", back_populates="plantoes")
    usuario_confirmacao = relationship("User")
    
    def __repr__(self):
        return f"<Plantao {self.medico_id} - {self.hospital_id} - {self.data}>"

