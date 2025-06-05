from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class ProcedimentoParticular(Base):
    __tablename__ = "procedimentos_particulares"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    nome_paciente = Column(String(100), nullable=False)
    data_procedimento = Column(Date, nullable=False)
    tipo_procedimento = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    valor_bruto = Column(Float, nullable=False)
    percentual_repasse = Column(Float, nullable=True)
    valor_liquido_repasse = Column(Float, nullable=False)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    confirmado = Column(Boolean, default=False)
    data_confirmacao = Column(DateTime(timezone=True), nullable=True)
    usuario_confirmacao_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="procedimentos")
    usuario_confirmacao = relationship("User")
    
    def __repr__(self):
        return f"<ProcedimentoParticular {self.medico_id} - {self.nome_paciente} - {self.data_procedimento}>"

