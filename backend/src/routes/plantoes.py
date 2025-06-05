from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from src.models import get_db, Plantao, Medico, Hospital, TipoPlantao
from src.routes.auth import get_current_active_user, User

# Modelos Pydantic
class PlantaoBase(BaseModel):
    data_inicio: datetime
    data_fim: datetime
    valor: float
    medico_id: int
    hospital_id: int
    tipo_plantao_id: int
    status: str = "agendado"
    observacoes: Optional[str] = None

class PlantaoCreate(PlantaoBase):
    pass

class PlantaoUpdate(PlantaoBase):
    pass

class PlantaoResponse(PlantaoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Criar router
router = APIRouter()

# Rotas
@router.post("/", response_model=PlantaoResponse)
async def create_plantao(plantao: PlantaoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Verificar se o médico existe
    medico = db.query(Medico).filter(Medico.id == plantao.medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Verificar se o hospital existe
    hospital = db.query(Hospital).filter(Hospital.id == plantao.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital não encontrado")
    
    # Verificar se o tipo de plantão existe
    tipo_plantao = db.query(TipoPlantao).filter(TipoPlantao.id == plantao.tipo_plantao_id).first()
    if not tipo_plantao:
        raise HTTPException(status_code=404, detail="Tipo de plantão não encontrado")
    
    db_plantao = Plantao(
        data_inicio=plantao.data_inicio,
        data_fim=plantao.data_fim,
        valor=plantao.valor,
        medico_id=plantao.medico_id,
        hospital_id=plantao.hospital_id,
        tipo_plantao_id=plantao.tipo_plantao_id,
        status=plantao.status,
        observacoes=plantao.observacoes
    )
    db.add(db_plantao)
    db.commit()
    db.refresh(db_plantao)
    return db_plantao

@router.get("/", response_model=List[PlantaoResponse])
async def read_plantoes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    plantoes = db.query(Plantao).offset(skip).limit(limit).all()
    return plantoes

@router.get("/{plantao_id}", response_model=PlantaoResponse)
async def read_plantao(plantao_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plantao = db.query(Plantao).filter(Plantao.id == plantao_id).first()
    if db_plantao is None:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    return db_plantao

@router.put("/{plantao_id}", response_model=PlantaoResponse)
async def update_plantao(plantao_id: int, plantao: PlantaoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plantao = db.query(Plantao).filter(Plantao.id == plantao_id).first()
    if db_plantao is None:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    
    # Verificar se o médico existe
    medico = db.query(Medico).filter(Medico.id == plantao.medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Verificar se o hospital existe
    hospital = db.query(Hospital).filter(Hospital.id == plantao.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital não encontrado")
    
    # Verificar se o tipo de plantão existe
    tipo_plantao = db.query(TipoPlantao).filter(TipoPlantao.id == plantao.tipo_plantao_id).first()
    if not tipo_plantao:
        raise HTTPException(status_code=404, detail="Tipo de plantão não encontrado")
    
    for key, value in plantao.dict().items():
        setattr(db_plantao, key, value)
    
    db.commit()
    db.refresh(db_plantao)
    return db_plantao

@router.delete("/{plantao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plantao(plantao_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plantao = db.query(Plantao).filter(Plantao.id == plantao_id).first()
    if db_plantao is None:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    
    db.delete(db_plantao)
    db.commit()
    return None

