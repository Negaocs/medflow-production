from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from src.models import get_db, Empresa
from src.routes.auth import get_current_active_user, User

# Modelos Pydantic
class EmpresaBase(BaseModel):
    nome: str
    razao_social: str
    cnpj: str
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    is_active: bool = True

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(EmpresaBase):
    pass

class EmpresaResponse(EmpresaBase):
    id: int
    
    class Config:
        orm_mode = True

# Criar router
router = APIRouter()

# Rotas
@router.post("/", response_model=EmpresaResponse)
async def create_empresa(empresa: EmpresaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para criar empresas")
    
    db_empresa = Empresa(
        nome=empresa.nome,
        razao_social=empresa.razao_social,
        cnpj=empresa.cnpj,
        endereco=empresa.endereco,
        cidade=empresa.cidade,
        estado=empresa.estado,
        cep=empresa.cep,
        telefone=empresa.telefone,
        email=empresa.email,
        website=empresa.website,
        is_active=empresa.is_active
    )
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

@router.get("/", response_model=List[EmpresaResponse])
async def read_empresas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    empresas = db.query(Empresa).offset(skip).limit(limit).all()
    return empresas

@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def read_empresa(empresa_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return db_empresa

@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def update_empresa(empresa_id: int, empresa: EmpresaUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar empresas")
    
    db_empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    for key, value in empresa.dict().items():
        setattr(db_empresa, key, value)
    
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

@router.delete("/{empresa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_empresa(empresa_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir empresas")
    
    db_empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    db.delete(db_empresa)
    db.commit()
    return None

