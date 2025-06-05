from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class Medico(Base):
    __tablename__ = "medicos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    crm = Column(String(20), nullable=False)
    estado_crm = Column(String(2), nullable=False)
    telefone = Column(String(20), nullable=True)
    email = Column(String(100), unique=True, nullable=False)
    data_nascimento = Column(Date, nullable=True)
    endereco = Column(Text, nullable=True)
    banco = Column(String(50), nullable=True)
    agencia = Column(String(20), nullable=True)
    conta = Column(String(20), nullable=True)
    pix = Column(String(100), nullable=True)
    dependentes_irrf = Column(Integer, default=0)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    usuario = relationship("User", back_populates="medico", uselist=False)
    empresas = relationship("MedicoEmpresa", back_populates="medico")
    plantoes = relationship("Plantao", back_populates="medico")
    procedimentos = relationship("ProcedimentoParticular", back_populates="medico")
    producao_administrativa = relationship("ProducaoAdministrativa", back_populates="medico")
    prolabores = relationship("ProLabore", back_populates="medico")
    descontos_creditos = relationship("DescontoCredito", back_populates="medico")
    vinculos_fiscais = relationship("VinculoFiscalMedico", back_populates="medico")
    
    def __repr__(self):
        return f"<Medico {self.nome} - CRM {self.crm}/{self.estado_crm}>"

