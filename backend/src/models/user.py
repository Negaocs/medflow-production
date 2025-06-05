from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base
import uuid

class User(Base):
    __tablename__ = "usuarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_completo = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    perfil = Column(String(20), nullable=False)  # admin, operador, medico
    medico_id_associado = Column(String(36), ForeignKey("medicos.id"), nullable=True)
    ativo = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relacionamentos
    medico = relationship("Medico", back_populates="usuario")
    grupos = relationship("UsuarioGrupo", back_populates="usuario")
    
    def __repr__(self):
        return f"<User {self.nome_completo}>"

