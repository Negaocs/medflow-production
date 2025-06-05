from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class MedicoEmpresa(Base):
    __tablename__ = "medicos_empresas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    empresa_id = Column(String(36), ForeignKey("empresas.id"), nullable=False)
    data_vinculo = Column(Date, nullable=False)
    data_desvinculo = Column(Date, nullable=True)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="empresas")
    empresa = relationship("Empresa", back_populates="medicos")
    
    def __repr__(self):
        return f"<MedicoEmpresa {self.medico_id} - {self.empresa_id}>"

class ProducaoAdministrativa(Base):
    __tablename__ = "producao_administrativa"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    descricao = Column(String(200), nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=True)
    valor_total = Column(Float, nullable=False)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    confirmado = Column(Boolean, default=False)
    data_confirmacao = Column(DateTime(timezone=True), nullable=True)
    usuario_confirmacao_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="producao_administrativa")
    usuario_confirmacao = relationship("User")
    
    def __repr__(self):
        return f"<ProducaoAdministrativa {self.medico_id} - {self.descricao}>"

class ProLabore(Base):
    __tablename__ = "prolabores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    descricao = Column(String(200), nullable=False)
    data = Column(Date, nullable=False)
    valor_bruto = Column(Float, nullable=False)
    valor_liquido = Column(Float, nullable=False)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    confirmado = Column(Boolean, default=False)
    data_confirmacao = Column(DateTime(timezone=True), nullable=True)
    usuario_confirmacao_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="prolabores")
    usuario_confirmacao = relationship("User")
    
    def __repr__(self):
        return f"<ProLabore {self.medico_id} - {self.descricao}>"

class DescontoCredito(Base):
    __tablename__ = "descontos_creditos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medico_id = Column(String(36), ForeignKey("medicos.id"), nullable=False)
    tipo = Column(String(10), nullable=False)  # "desconto" ou "credito"
    descricao = Column(String(200), nullable=False)
    data = Column(Date, nullable=False)
    valor = Column(Float, nullable=False)
    competencia = Column(String(7), nullable=False)  # Formato: YYYY-MM
    observacoes = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="descontos_creditos")
    
    def __repr__(self):
        return f"<DescontoCredito {self.tipo} - {self.medico_id} - {self.descricao}>"

class GrupoAcesso(Base):
    __tablename__ = "grupos_acesso"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    permissoes = Column(Text, nullable=False)  # JSON com as permissões
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    usuarios = relationship("UsuarioGrupo", back_populates="grupo")
    
    def __repr__(self):
        return f"<GrupoAcesso {self.nome}>"

class UsuarioGrupo(Base):
    __tablename__ = "usuarios_grupos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    grupo_id = Column(String(36), ForeignKey("grupos_acesso.id"), nullable=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    usuario = relationship("User", back_populates="grupos")
    grupo = relationship("GrupoAcesso", back_populates="usuarios")
    
    def __repr__(self):
        return f"<UsuarioGrupo {self.usuario_id} - {self.grupo_id}>"

