from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

# Importar modelos e schemas
from models import get_db
from models.user import User
from models.empresa import Empresa
from models.outros_modelos import MedicoEmpresa
from routes.auth import get_current_active_user

# Criar router
router = APIRouter()

# Modelos Pydantic
class EmpresaBase(BaseModel):
    nome_fantasia: str
    razao_social: str
    cnpj: str
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    responsavel: Optional[str] = None
    logo_url: Optional[str] = None
    ativo: bool = True

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(BaseModel):
    nome_fantasia: Optional[str] = None
    razao_social: Optional[str] = None
    cnpj: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    responsavel: Optional[str] = None
    logo_url: Optional[str] = None
    ativo: Optional[bool] = None

class EmpresaResponse(EmpresaBase):
    id: str
    created_date: datetime
    updated_date: Optional[datetime] = None
    medicos_count: int = 0

    class Config:
        orm_mode = True

# Funções auxiliares
def check_permission(user: User, action: str, db: Session):
    """Verifica se o usuário tem permissão para realizar a ação."""
    if user.perfil == "admin":
        return True
    
    # Implementar verificação de permissões baseada nos grupos do usuário
    # Por enquanto, apenas admin pode gerenciar empresas
    return False

# Rotas
@router.get("/", response_model=List[EmpresaResponse])
async def get_empresas(
    skip: int = 0, 
    limit: int = 100, 
    nome: Optional[str] = None,
    cnpj: Optional[str] = None,
    ativo: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Construir query base
    query = db.query(Empresa)
    
    # Aplicar filtros
    if nome:
        query = query.filter(Empresa.nome_fantasia.ilike(f"%{nome}%") | Empresa.razao_social.ilike(f"%{nome}%"))
    if cnpj:
        query = query.filter(Empresa.cnpj.ilike(f"%{cnpj}%"))
    if ativo is not None:
        query = query.filter(Empresa.ativo == ativo)
    
    # Aplicar paginação
    empresas = query.offset(skip).limit(limit).all()
    
    # Preparar resposta
    result = []
    for empresa in empresas:
        # Contar médicos vinculados ativos
        medicos_count = db.query(MedicoEmpresa).filter(
            MedicoEmpresa.empresa_id == empresa.id,
            MedicoEmpresa.ativo == True
        ).count()
        
        result.append({
            "id": empresa.id,
            "nome_fantasia": empresa.nome_fantasia,
            "razao_social": empresa.razao_social,
            "cnpj": empresa.cnpj,
            "inscricao_estadual": empresa.inscricao_estadual,
            "inscricao_municipal": empresa.inscricao_municipal,
            "telefone": empresa.telefone,
            "email": empresa.email,
            "endereco": empresa.endereco,
            "cidade": empresa.cidade,
            "estado": empresa.estado,
            "cep": empresa.cep,
            "responsavel": empresa.responsavel,
            "logo_url": empresa.logo_url,
            "ativo": empresa.ativo,
            "created_date": empresa.created_date,
            "updated_date": empresa.updated_date,
            "medicos_count": medicos_count
        })
    
    return result

@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def get_empresa(
    empresa_id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # Contar médicos vinculados ativos
    medicos_count = db.query(MedicoEmpresa).filter(
        MedicoEmpresa.empresa_id == empresa.id,
        MedicoEmpresa.ativo == True
    ).count()
    
    return {
        "id": empresa.id,
        "nome_fantasia": empresa.nome_fantasia,
        "razao_social": empresa.razao_social,
        "cnpj": empresa.cnpj,
        "inscricao_estadual": empresa.inscricao_estadual,
        "inscricao_municipal": empresa.inscricao_municipal,
        "telefone": empresa.telefone,
        "email": empresa.email,
        "endereco": empresa.endereco,
        "cidade": empresa.cidade,
        "estado": empresa.estado,
        "cep": empresa.cep,
        "responsavel": empresa.responsavel,
        "logo_url": empresa.logo_url,
        "ativo": empresa.ativo,
        "created_date": empresa.created_date,
        "updated_date": empresa.updated_date,
        "medicos_count": medicos_count
    }

@router.post("/", response_model=EmpresaResponse)
async def create_empresa(
    empresa: EmpresaCreate, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para criar empresas")
    
    # Verificar se CNPJ já existe
    existing_cnpj = db.query(Empresa).filter(Empresa.cnpj == empresa.cnpj).first()
    if existing_cnpj:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    # Criar nova empresa
    db_empresa = Empresa(
        id=str(uuid.uuid4()),
        nome_fantasia=empresa.nome_fantasia,
        razao_social=empresa.razao_social,
        cnpj=empresa.cnpj,
        inscricao_estadual=empresa.inscricao_estadual,
        inscricao_municipal=empresa.inscricao_municipal,
        telefone=empresa.telefone,
        email=empresa.email,
        endereco=empresa.endereco,
        cidade=empresa.cidade,
        estado=empresa.estado,
        cep=empresa.cep,
        responsavel=empresa.responsavel,
        logo_url=empresa.logo_url,
        ativo=empresa.ativo
    )
    
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    
    return {
        "id": db_empresa.id,
        "nome_fantasia": db_empresa.nome_fantasia,
        "razao_social": db_empresa.razao_social,
        "cnpj": db_empresa.cnpj,
        "inscricao_estadual": db_empresa.inscricao_estadual,
        "inscricao_municipal": db_empresa.inscricao_municipal,
        "telefone": db_empresa.telefone,
        "email": db_empresa.email,
        "endereco": db_empresa.endereco,
        "cidade": db_empresa.cidade,
        "estado": db_empresa.estado,
        "cep": db_empresa.cep,
        "responsavel": db_empresa.responsavel,
        "logo_url": db_empresa.logo_url,
        "ativo": db_empresa.ativo,
        "created_date": db_empresa.created_date,
        "updated_date": db_empresa.updated_date,
        "medicos_count": 0
    }

@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def update_empresa(
    empresa_id: str, 
    empresa: EmpresaUpdate, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "update", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar empresas")
    
    # Buscar empresa
    db_empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # Verificar CNPJ único
    if empresa.cnpj and empresa.cnpj != db_empresa.cnpj:
        existing_cnpj = db.query(Empresa).filter(Empresa.cnpj == empresa.cnpj).first()
        if existing_cnpj:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    # Atualizar campos
    if empresa.nome_fantasia is not None:
        db_empresa.nome_fantasia = empresa.nome_fantasia
    if empresa.razao_social is not None:
        db_empresa.razao_social = empresa.razao_social
    if empresa.cnpj is not None:
        db_empresa.cnpj = empresa.cnpj
    if empresa.inscricao_estadual is not None:
        db_empresa.inscricao_estadual = empresa.inscricao_estadual
    if empresa.inscricao_municipal is not None:
        db_empresa.inscricao_municipal = empresa.inscricao_municipal
    if empresa.telefone is not None:
        db_empresa.telefone = empresa.telefone
    if empresa.email is not None:
        db_empresa.email = empresa.email
    if empresa.endereco is not None:
        db_empresa.endereco = empresa.endereco
    if empresa.cidade is not None:
        db_empresa.cidade = empresa.cidade
    if empresa.estado is not None:
        db_empresa.estado = empresa.estado
    if empresa.cep is not None:
        db_empresa.cep = empresa.cep
    if empresa.responsavel is not None:
        db_empresa.responsavel = empresa.responsavel
    if empresa.logo_url is not None:
        db_empresa.logo_url = empresa.logo_url
    if empresa.ativo is not None:
        db_empresa.ativo = empresa.ativo
    
    db.commit()
    db.refresh(db_empresa)
    
    # Contar médicos vinculados ativos
    medicos_count = db.query(MedicoEmpresa).filter(
        MedicoEmpresa.empresa_id == empresa_id,
        MedicoEmpresa.ativo == True
    ).count()
    
    return {
        "id": db_empresa.id,
        "nome_fantasia": db_empresa.nome_fantasia,
        "razao_social": db_empresa.razao_social,
        "cnpj": db_empresa.cnpj,
        "inscricao_estadual": db_empresa.inscricao_estadual,
        "inscricao_municipal": db_empresa.inscricao_municipal,
        "telefone": db_empresa.telefone,
        "email": db_empresa.email,
        "endereco": db_empresa.endereco,
        "cidade": db_empresa.cidade,
        "estado": db_empresa.estado,
        "cep": db_empresa.cep,
        "responsavel": db_empresa.responsavel,
        "logo_url": db_empresa.logo_url,
        "ativo": db_empresa.ativo,
        "created_date": db_empresa.created_date,
        "updated_date": db_empresa.updated_date,
        "medicos_count": medicos_count
    }

@router.delete("/{empresa_id}")
async def delete_empresa(
    empresa_id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "delete", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para excluir empresas")
    
    # Buscar empresa
    db_empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # Verificar se há médicos vinculados ativos
    medicos_vinculados = db.query(MedicoEmpresa).filter(
        MedicoEmpresa.empresa_id == empresa_id,
        MedicoEmpresa.ativo == True
    ).count()
    
    if medicos_vinculados > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Não é possível excluir a empresa pois existem {medicos_vinculados} médicos vinculados ativos"
        )
    
    # Exclusão lógica (desativar)
    db_empresa.ativo = False
    db.commit()
    
    return {"message": "Empresa desativada com sucesso"}

