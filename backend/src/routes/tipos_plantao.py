from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from src.models import get_db, TipoPlantao
from src.routes.auth import get_current_active_user, User

# Modelos Pydantic
class TipoPlantaoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    is_active: bool = True

class TipoPlantaoCreate(TipoPlantaoBase):
    pass

class TipoPlantaoUpdate(TipoPlantaoBase):
    pass

class TipoPlantaoResponse(TipoPlantaoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Criar router
router = APIRouter()

# Rotas
@router.post("/", response_model=TipoPlantaoResponse)
async def create_tipo_plantao(tipo_plantao: TipoPlantaoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para criar tipos de plantão")
    
    db_tipo_plantao = TipoPlantao(
        nome=tipo_plantao.nome,
        descricao=tipo_plantao.descricao,
        is_active=tipo_plantao.is_active
    )
    db.add(db_tipo_plantao)
    db.commit()
    db.refresh(db_tipo_plantao)
    return db_tipo_plantao

@router.get("/", response_model=List[TipoPlantaoResponse])
async def read_tipos_plantao(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    tipos_plantao = db.query(TipoPlantao).offset(skip).limit(limit).all()
    return tipos_plantao

@router.get("/{tipo_plantao_id}", response_model=TipoPlantaoResponse)
async def read_tipo_plantao(tipo_plantao_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_tipo_plantao = db.query(TipoPlantao).filter(TipoPlantao.id == tipo_plantao_id).first()
    if db_tipo_plantao is None:
        raise HTTPException(status_code=404, detail="Tipo de plantão não encontrado")
    return db_tipo_plantao

@router.put("/{tipo_plantao_id}", response_model=TipoPlantaoResponse)
async def update_tipo_plantao(tipo_plantao_id: int, tipo_plantao: TipoPlantaoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar tipos de plantão")
    
    db_tipo_plantao = db.query(TipoPlantao).filter(TipoPlantao.id == tipo_plantao_id).first()
    if db_tipo_plantao is None:
        raise HTTPException(status_code=404, detail="Tipo de plantão não encontrado")
    
    for key, value in tipo_plantao.dict().items():
        setattr(db_tipo_plantao, key, value)
    
    db.commit()
    db.refresh(db_tipo_plantao)
    return db_tipo_plantao

@router.delete("/{tipo_plantao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tipo_plantao(tipo_plantao_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir tipos de plantão")
    
    db_tipo_plantao = db.query(TipoPlantao).filter(TipoPlantao.id == tipo_plantao_id).first()
    if db_tipo_plantao is None:
        raise HTTPException(status_code=404, detail="Tipo de plantão não encontrado")
    
    db.delete(db_tipo_plantao)
    db.commit()
    return None

