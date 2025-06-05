from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class TabelaINSS(Base):
    __tablename__ = "tabelas_inss"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ano_vigencia = Column(Integer, nullable=False)
    faixa = Column(Integer, nullable=False)
    valor_inicial = Column(Float, nullable=False)
    valor_final = Column(Float, nullable=True)
    aliquota = Column(Float, nullable=False)
    valor_deducao = Column(Float, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<TabelaINSS {self.ano_vigencia} - Faixa {self.faixa}>"

class TabelaIRRF(Base):
    __tablename__ = "tabelas_irrf"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ano_vigencia = Column(Integer, nullable=False)
    faixa = Column(Integer, nullable=False)
    valor_inicial = Column(Float, nullable=False)
    valor_final = Column(Float, nullable=True)
    aliquota = Column(Float, nullable=False)
    valor_deducao = Column(Float, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<TabelaIRRF {self.ano_vigencia} - Faixa {self.faixa}>"

class ParametrosFiscaisEmpresa(Base):
    __tablename__ = "parametros_fiscais_empresa"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id = Column(String(36), ForeignKey("empresas.id"), nullable=False)
    percentual_iss = Column(Float, nullable=True)
    percentual_inss_empresa = Column(Float, nullable=True)
    percentual_irrf_empresa = Column(Float, nullable=True)
    valor_deducao_dependente = Column(Float, nullable=True)
    ano_vigencia = Column(Integer, nullable=False)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa", back_populates="parametros_fiscais")
    
    def __repr__(self):
        return f"<ParametrosFiscaisEmpresa {self.empresa_id} - {self.ano_vigencia}>"

class VinculoFiscalMedico(Base):
    __tablename__ = "vinculos_fiscais_medicos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    tipo_vinculo = Column(String(50), nullable=False)  # PJ, CLT, Autônomo, etc.
    retem_inss = Column(Boolean, default=False)
    retem_irrf = Column(Boolean, default=False)
    retem_iss = Column(Boolean, default=False)
    percentual_inss_personalizado = Column(Float, nullable=True)
    percentual_irrf_personalizado = Column(Float, nullable=True)
    percentual_iss_personalizado = Column(Float, nullable=True)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="vinculos_fiscais")
    
    def __repr__(self):
        return f"<VinculoFiscalMedico {self.medico_id} - {self.tipo_vinculo}>"

class ParametrosPDF(Base):
    __tablename__ = "parametros_pdf"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_parametro = Column(String(100), nullable=False)
    valor = Column(Text, nullable=False)
    descricao = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<ParametrosPDF {self.nome_parametro}>"

