from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from src.models import get_db, Hospital, Empresa
from src.routes.auth import get_current_active_user, User

# Modelos Pydantic
class HospitalBase(BaseModel):
    nome: str
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    empresa_id: int
    is_active: bool = True

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(HospitalBase):
    pass

class HospitalResponse(HospitalBase):
    id: int
    
    class Config:
        orm_mode = True

# Criar router
router = APIRouter()

# Rotas
@router.post("/", response_model=HospitalResponse)
async def create_hospital(hospital: HospitalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para criar hospitais")
    
    # Verificar se a empresa existe
    empresa = db.query(Empresa).filter(Empresa.id == hospital.empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    db_hospital = Hospital(
        nome=hospital.nome,
        endereco=hospital.endereco,
        cidade=hospital.cidade,
        estado=hospital.estado,
        cep=hospital.cep,
        telefone=hospital.telefone,
        email=hospital.email,
        empresa_id=hospital.empresa_id,
        is_active=hospital.is_active
    )
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    return db_hospital

@router.get("/", response_model=List[HospitalResponse])
async def read_hospitais(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    hospitais = db.query(Hospital).offset(skip).limit(limit).all()
    return hospitais

@router.get("/{hospital_id}", response_model=HospitalResponse)
async def read_hospital(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if db_hospital is None:
        raise HTTPException(status_code=404, detail="Hospital não encontrado")
    return db_hospital

@router.put("/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(hospital_id: int, hospital: HospitalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar hospitais")
    
    db_hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if db_hospital is None:
        raise HTTPException(status_code=404, detail="Hospital não encontrado")
    
    # Verificar se a empresa existe
    empresa = db.query(Empresa).filter(Empresa.id == hospital.empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    for key, value in hospital.dict().items():
        setattr(db_hospital, key, value)
    
    db.commit()
    db.refresh(db_hospital)
    return db_hospital

@router.delete("/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospital(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir hospitais")
    
    db_hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if db_hospital is None:
        raise HTTPException(status_code=404, detail="Hospital não encontrado")
    
    db.delete(db_hospital)
    db.commit()
    return None

