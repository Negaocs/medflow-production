from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from src.models import get_db, Medico
from src.routes.auth import get_current_active_user, User

# Modelos Pydantic
class MedicoBase(BaseModel):
    nome: str
    crm: str
    cpf: str
    rg: Optional[str] = None
    data_nascimento: Optional[date] = None
    telefone: Optional[str] = None
    celular: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    especialidade: Optional[str] = None
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    pix: Optional[str] = None
    observacoes: Optional[str] = None
    is_active: bool = True

class MedicoCreate(MedicoBase):
    pass

class MedicoUpdate(MedicoBase):
    pass

class MedicoResponse(MedicoBase):
    id: int
    
    class Config:
        orm_mode = True

# Criar router
router = APIRouter()

# Rotas
@router.post("/", response_model=MedicoResponse)
async def create_medico(medico: MedicoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_medico = Medico(
        nome=medico.nome,
        crm=medico.crm,
        cpf=medico.cpf,
        rg=medico.rg,
        data_nascimento=medico.data_nascimento,
        telefone=medico.telefone,
        celular=medico.celular,
        email=medico.email,
        endereco=medico.endereco,
        cidade=medico.cidade,
        estado=medico.estado,
        cep=medico.cep,
        especialidade=medico.especialidade,
        banco=medico.banco,
        agencia=medico.agencia,
        conta=medico.conta,
        pix=medico.pix,
        observacoes=medico.observacoes,
        is_active=medico.is_active
    )
    db.add(db_medico)
    db.commit()
    db.refresh(db_medico)
    return db_medico

@router.get("/", response_model=List[MedicoResponse])
async def read_medicos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    medicos = db.query(Medico).offset(skip).limit(limit).all()
    return medicos

@router.get("/{medico_id}", response_model=MedicoResponse)
async def read_medico(medico_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if db_medico is None:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    return db_medico

@router.put("/{medico_id}", response_model=MedicoResponse)
async def update_medico(medico_id: int, medico: MedicoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if db_medico is None:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    for key, value in medico.dict().items():
        setattr(db_medico, key, value)
    
    db.commit()
    db.refresh(db_medico)
    return db_medico

@router.delete("/{medico_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medico(medico_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir médicos")
    
    db_medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if db_medico is None:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    db.delete(db_medico)
    db.commit()
    return None

