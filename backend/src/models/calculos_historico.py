from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class ResultadoCalculoProducao(Base):
    __tablename__ = "resultados_calculo_producao"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    data_calculo = Column(DateTime(timezone=True), server_default=func.now())
    usuario_calculo_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    valor_bruto_total = Column(Float, nullable=False)
    valor_descontos_total = Column(Float, nullable=False)
    valor_liquido_total = Column(Float, nullable=False)
    observacoes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False)  # rascunho, finalizado, cancelado
    data_finalizacao = Column(DateTime(timezone=True), nullable=True)
    usuario_finalizacao_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    
    # Relacionamentos
    medico = relationship("Medico")
    usuario_calculo = relationship("User", foreign_keys=[usuario_calculo_id])
    usuario_finalizacao = relationship("User", foreign_keys=[usuario_finalizacao_id])
    itens_calculados = relationship("ItemCalculadoProducao", back_populates="resultado_calculo")
    
    def __repr__(self):
        return f"<ResultadoCalculoProducao {self.medico_id} - {self.competencia}>"

class ItemCalculadoProducao(Base):
    __tablename__ = "itens_calculados_producao"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resultado_calculo_id = Column(String(36), ForeignKey("resultados_calculo_producao.id"), nullable=False)
    tipo_item = Column(String(50), nullable=False)  # plantao, procedimento, producao_administrativa, desconto, credito
    item_id = Column(String(36), nullable=False)  # ID do item original
    descricao = Column(String(200), nullable=False)
    data = Column(Date, nullable=False)
    valor_bruto = Column(Float, nullable=False)
    valor_liquido = Column(Float, nullable=False)
    detalhes = Column(JSON, nullable=True)  # Detalhes adicionais em formato JSON
    
    # Relacionamentos
    resultado_calculo = relationship("ResultadoCalculoProducao", back_populates="itens_calculados")
    
    def __repr__(self):
        return f"<ItemCalculadoProducao {self.tipo_item} - {self.descricao}>"

class ResultadoCalculoProLabore(Base):
    __tablename__ = "resultados_calculo_prolabore"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    data_calculo = Column(DateTime(timezone=True), server_default=func.now())
    usuario_calculo_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    valor_bruto_total = Column(Float, nullable=False)
    valor_inss = Column(Float, nullable=False)
    valor_irrf = Column(Float, nullable=False)
    valor_outros_descontos = Column(Float, nullable=False)
    valor_liquido_total = Column(Float, nullable=False)
    observacoes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False)  # rascunho, finalizado, cancelado
    data_finalizacao = Column(DateTime(timezone=True), nullable=True)
    usuario_finalizacao_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    
    # Relacionamentos
    medico = relationship("Medico")
    usuario_calculo = relationship("User", foreign_keys=[usuario_calculo_id])
    usuario_finalizacao = relationship("User", foreign_keys=[usuario_finalizacao_id])
    itens_calculados = relationship("ItemCalculadoProLabore", back_populates="resultado_calculo")
    
    def __repr__(self):
        return f"<ResultadoCalculoProLabore {self.medico_id} - {self.competencia}>"

class ItemCalculadoProLabore(Base):
    __tablename__ = "itens_calculados_prolabore"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resultado_calculo_id = Column(String(36), ForeignKey("resultados_calculo_prolabore.id"), nullable=False)
    prolabore_id = Column(String(36), ForeignKey("prolabores.id"), nullable=False)
    descricao = Column(String(200), nullable=False)
    data = Column(Date, nullable=False)
    valor_bruto = Column(Float, nullable=False)
    valor_inss = Column(Float, nullable=False)
    valor_irrf = Column(Float, nullable=False)
    valor_outros_descontos = Column(Float, nullable=False)
    valor_liquido = Column(Float, nullable=False)
    detalhes = Column(JSON, nullable=True)  # Detalhes adicionais em formato JSON
    
    # Relacionamentos
    resultado_calculo = relationship("ResultadoCalculoProLabore", back_populates="itens_calculados")
    prolabore = relationship("ProLabore")
    
    def __repr__(self):
        return f"<ItemCalculadoProLabore {self.descricao}>"

class HistoricoOperacao(Base):
    __tablename__ = "historico_operacoes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    tipo_operacao = Column(String(50), nullable=False)  # create, update, delete, login, etc.
    entidade = Column(String(50), nullable=False)  # nome da tabela/entidade
    entidade_id = Column(String(36), nullable=True)  # ID do registro afetado
    dados_anteriores = Column(JSON, nullable=True)  # Dados antes da operação
    dados_novos = Column(JSON, nullable=True)  # Dados após a operação
    data_hora = Column(DateTime(timezone=True), server_default=func.now())
    ip_origem = Column(String(50), nullable=True)
    
    # Relacionamentos
    usuario = relationship("User")
    
    def __repr__(self):
        return f"<HistoricoOperacao {self.tipo_operacao} - {self.entidade} - {self.data_hora}>"

