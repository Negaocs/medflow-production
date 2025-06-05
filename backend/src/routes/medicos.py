from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

# Importar modelos e schemas
from models import get_db
from models.user import User
from models.medico import Medico
from models.outros_modelos import MedicoEmpresa
from routes.auth import get_current_active_user

# Criar router
router = APIRouter()

# Modelos Pydantic
class MedicoBase(BaseModel):
    nome: str
    cpf: str
    crm: str
    estado_crm: str
    telefone: Optional[str] = None
    email: str
    data_nascimento: Optional[str] = None
    endereco: Optional[str] = None
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    pix: Optional[str] = None
    dependentes_irrf: int = 0
    usuario_sistema_id: Optional[str] = None
    ativo: bool = True

class MedicoCreate(MedicoBase):
    empresas_ids: List[str] = []

class MedicoUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    crm: Optional[str] = None
    estado_crm: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_nascimento: Optional[str] = None
    endereco: Optional[str] = None
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    pix: Optional[str] = None
    dependentes_irrf: Optional[int] = None
    usuario_sistema_id: Optional[str] = None
    ativo: Optional[bool] = None
    empresas_ids: List[str] = []

class MedicoResponse(MedicoBase):
    id: str
    created_date: datetime
    updated_date: Optional[datetime] = None
    empresas_ids: List[str] = []

    class Config:
        orm_mode = True

# Funções auxiliares
def check_permission(user: User, action: str, db: Session):
    """Verifica se o usuário tem permissão para realizar a ação."""
    if user.perfil == "admin":
        return True
    
    # Implementar verificação de permissões baseada nos grupos do usuário
    # Por enquanto, apenas admin pode gerenciar médicos
    return False

# Rotas
@router.get("/", response_model=List[MedicoResponse])
async def get_medicos(
    skip: int = 0, 
    limit: int = 100, 
    nome: Optional[str] = None,
    cpf: Optional[str] = None,
    crm: Optional[str] = None,
    ativo: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Construir query base
    query = db.query(Medico)
    
    # Aplicar filtros
    if nome:
        query = query.filter(Medico.nome.ilike(f"%{nome}%"))
    if cpf:
        query = query.filter(Medico.cpf.ilike(f"%{cpf}%"))
    if crm:
        query = query.filter(Medico.crm.ilike(f"%{crm}%"))
    if ativo is not None:
        query = query.filter(Medico.ativo == ativo)
    
    # Aplicar paginação
    medicos = query.offset(skip).limit(limit).all()
    
    # Preparar resposta
    result = []
    for medico in medicos:
        # Obter empresas vinculadas
        vinculos = db.query(MedicoEmpresa).filter(
            MedicoEmpresa.medico_id == medico.id,
            MedicoEmpresa.ativo == True
        ).all()
        empresas_ids = [vinculo.empresa_id for vinculo in vinculos]
        
        # Converter data_nascimento para string se não for None
        data_nascimento_str = None
        if medico.data_nascimento:
            data_nascimento_str = medico.data_nascimento.isoformat()
        
        result.append({
            "id": medico.id,
            "nome": medico.nome,
            "cpf": medico.cpf,
            "crm": medico.crm,
            "estado_crm": medico.estado_crm,
            "telefone": medico.telefone,
            "email": medico.email,
            "data_nascimento": data_nascimento_str,
            "endereco": medico.endereco,
            "banco": medico.banco,
            "agencia": medico.agencia,
            "conta": medico.conta,
            "pix": medico.pix,
            "dependentes_irrf": medico.dependentes_irrf,
            "usuario_sistema_id": medico.usuario.id if medico.usuario else None,
            "ativo": medico.ativo,
            "created_date": medico.created_date,
            "updated_date": medico.updated_date,
            "empresas_ids": empresas_ids
        })
    
    return result

@router.get("/{medico_id}", response_model=MedicoResponse)
async def get_medico(
    medico_id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Verificar permissão
    if current_user.perfil != "admin" and (current_user.perfil != "medico" or current_user.medico_id_associado != medico_id):
        raise HTTPException(status_code=403, detail="Sem permissão para acessar este médico")
    
    # Obter empresas vinculadas
    vinculos = db.query(MedicoEmpresa).filter(
        MedicoEmpresa.medico_id == medico.id,
        MedicoEmpresa.ativo == True
    ).all()
    empresas_ids = [vinculo.empresa_id for vinculo in vinculos]
    
    # Converter data_nascimento para string se não for None
    data_nascimento_str = None
    if medico.data_nascimento:
        data_nascimento_str = medico.data_nascimento.isoformat()
    
    return {
        "id": medico.id,
        "nome": medico.nome,
        "cpf": medico.cpf,
        "crm": medico.crm,
        "estado_crm": medico.estado_crm,
        "telefone": medico.telefone,
        "email": medico.email,
        "data_nascimento": data_nascimento_str,
        "endereco": medico.endereco,
        "banco": medico.banco,
        "agencia": medico.agencia,
        "conta": medico.conta,
        "pix": medico.pix,
        "dependentes_irrf": medico.dependentes_irrf,
        "usuario_sistema_id": medico.usuario.id if medico.usuario else None,
        "ativo": medico.ativo,
        "created_date": medico.created_date,
        "updated_date": medico.updated_date,
        "empresas_ids": empresas_ids
    }

@router.post("/", response_model=MedicoResponse)
async def create_medico(
    medico: MedicoCreate, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para criar médicos")
    
    # Verificar se CPF já existe
    existing_cpf = db.query(Medico).filter(Medico.cpf == medico.cpf).first()
    if existing_cpf:
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Verificar se email já existe
    existing_email = db.query(Medico).filter(Medico.email == medico.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Criar novo médico
    db_medico = Medico(
        id=str(uuid.uuid4()),
        nome=medico.nome,
        cpf=medico.cpf,
        crm=medico.crm,
        estado_crm=medico.estado_crm,
        telefone=medico.telefone,
        email=medico.email,
        data_nascimento=datetime.fromisoformat(medico.data_nascimento) if medico.data_nascimento else None,
        endereco=medico.endereco,
        banco=medico.banco,
        agencia=medico.agencia,
        conta=medico.conta,
        pix=medico.pix,
        dependentes_irrf=medico.dependentes_irrf,
        ativo=medico.ativo
    )
    
    db.add(db_medico)
    db.commit()
    db.refresh(db_medico)
    
    # Vincular às empresas
    for empresa_id in medico.empresas_ids:
        vinculo = MedicoEmpresa(
            id=str(uuid.uuid4()),
            medico_id=db_medico.id,
            empresa_id=empresa_id,
            data_vinculo=datetime.now().date(),
            ativo=True
        )
        db.add(vinculo)
    
    # Vincular ao usuário do sistema, se fornecido
    if medico.usuario_sistema_id:
        usuario = db.query(User).filter(User.id == medico.usuario_sistema_id).first()
        if usuario:
            usuario.medico_id_associado = db_medico.id
            usuario.perfil = "medico"
            db.commit()
    
    db.commit()
    
    # Preparar resposta
    data_nascimento_str = None
    if db_medico.data_nascimento:
        data_nascimento_str = db_medico.data_nascimento.isoformat()
    
    return {
        "id": db_medico.id,
        "nome": db_medico.nome,
        "cpf": db_medico.cpf,
        "crm": db_medico.crm,
        "estado_crm": db_medico.estado_crm,
        "telefone": db_medico.telefone,
        "email": db_medico.email,
        "data_nascimento": data_nascimento_str,
        "endereco": db_medico.endereco,
        "banco": db_medico.banco,
        "agencia": db_medico.agencia,
        "conta": db_medico.conta,
        "pix": db_medico.pix,
        "dependentes_irrf": db_medico.dependentes_irrf,
        "usuario_sistema_id": medico.usuario_sistema_id,
        "ativo": db_medico.ativo,
        "created_date": db_medico.created_date,
        "updated_date": db_medico.updated_date,
        "empresas_ids": medico.empresas_ids
    }

@router.put("/{medico_id}", response_model=MedicoResponse)
async def update_medico(
    medico_id: str, 
    medico: MedicoUpdate, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "update", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para atualizar este médico")
    
    # Buscar médico
    db_medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not db_medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Verificar CPF único
    if medico.cpf and medico.cpf != db_medico.cpf:
        existing_cpf = db.query(Medico).filter(Medico.cpf == medico.cpf).first()
        if existing_cpf:
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Verificar email único
    if medico.email and medico.email != db_medico.email:
        existing_email = db.query(Medico).filter(Medico.email == medico.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Atualizar campos
    if medico.nome is not None:
        db_medico.nome = medico.nome
    if medico.cpf is not None:
        db_medico.cpf = medico.cpf
    if medico.crm is not None:
        db_medico.crm = medico.crm
    if medico.estado_crm is not None:
        db_medico.estado_crm = medico.estado_crm
    if medico.telefone is not None:
        db_medico.telefone = medico.telefone
    if medico.email is not None:
        db_medico.email = medico.email
    if medico.data_nascimento is not None:
        db_medico.data_nascimento = datetime.fromisoformat(medico.data_nascimento)
    if medico.endereco is not None:
        db_medico.endereco = medico.endereco
    if medico.banco is not None:
        db_medico.banco = medico.banco
    if medico.agencia is not None:
        db_medico.agencia = medico.agencia
    if medico.conta is not None:
        db_medico.conta = medico.conta
    if medico.pix is not None:
        db_medico.pix = medico.pix
    if medico.dependentes_irrf is not None:
        db_medico.dependentes_irrf = medico.dependentes_irrf
    if medico.ativo is not None:
        db_medico.ativo = medico.ativo
    
    # Atualizar vínculos com empresas
    if medico.empresas_ids:
        # Obter vínculos atuais
        vinculos_atuais = db.query(MedicoEmpresa).filter(
            MedicoEmpresa.medico_id == medico_id
        ).all()
        
        # Desativar vínculos que não estão na lista
        for vinculo in vinculos_atuais:
            if vinculo.empresa_id not in medico.empresas_ids and vinculo.ativo:
                vinculo.ativo = False
                vinculo.data_desvinculo = datetime.now().date()
            elif vinculo.empresa_id in medico.empresas_ids and not vinculo.ativo:
                vinculo.ativo = True
                vinculo.data_desvinculo = None
        
        # Adicionar novos vínculos
        empresas_vinculadas = [v.empresa_id for v in vinculos_atuais]
        for empresa_id in medico.empresas_ids:
            if empresa_id not in empresas_vinculadas:
                novo_vinculo = MedicoEmpresa(
                    id=str(uuid.uuid4()),
                    medico_id=medico_id,
                    empresa_id=empresa_id,
                    data_vinculo=datetime.now().date(),
                    ativo=True
                )
                db.add(novo_vinculo)
    
    # Atualizar vínculo com usuário do sistema
    if medico.usuario_sistema_id is not None:
        # Se havia um usuário vinculado anteriormente, desvincular
        if db_medico.usuario:
            db_medico.usuario.medico_id_associado = None
            if db_medico.usuario.perfil == "medico":
                db_medico.usuario.perfil = "operador"
        
        # Vincular ao novo usuário
        if medico.usuario_sistema_id:
            usuario = db.query(User).filter(User.id == medico.usuario_sistema_id).first()
            if usuario:
                usuario.medico_id_associado = medico_id
                usuario.perfil = "medico"
    
    db.commit()
    db.refresh(db_medico)
    
    # Obter empresas vinculadas atualizadas
    vinculos = db.query(MedicoEmpresa).filter(
        MedicoEmpresa.medico_id == medico_id,
        MedicoEmpresa.ativo == True
    ).all()
    empresas_ids = [vinculo.empresa_id for vinculo in vinculos]
    
    # Preparar resposta
    data_nascimento_str = None
    if db_medico.data_nascimento:
        data_nascimento_str = db_medico.data_nascimento.isoformat()
    
    return {
        "id": db_medico.id,
        "nome": db_medico.nome,
        "cpf": db_medico.cpf,
        "crm": db_medico.crm,
        "estado_crm": db_medico.estado_crm,
        "telefone": db_medico.telefone,
        "email": db_medico.email,
        "data_nascimento": data_nascimento_str,
        "endereco": db_medico.endereco,
        "banco": db_medico.banco,
        "agencia": db_medico.agencia,
        "conta": db_medico.conta,
        "pix": db_medico.pix,
        "dependentes_irrf": db_medico.dependentes_irrf,
        "usuario_sistema_id": db_medico.usuario.id if db_medico.usuario else None,
        "ativo": db_medico.ativo,
        "created_date": db_medico.created_date,
        "updated_date": db_medico.updated_date,
        "empresas_ids": empresas_ids
    }

@router.delete("/{medico_id}")
async def delete_medico(
    medico_id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "delete", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para excluir médicos")
    
    # Buscar médico
    db_medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not db_medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Exclusão lógica (desativar)
    db_medico.ativo = False
    
    # Desativar vínculos com empresas
    vinculos = db.query(MedicoEmpresa).filter(
        MedicoEmpresa.medico_id == medico_id,
        MedicoEmpresa.ativo == True
    ).all()
    
    for vinculo in vinculos:
        vinculo.ativo = False
        vinculo.data_desvinculo = datetime.now().date()
    
    db.commit()
    
    return {"message": "Médico desativado com sucesso"}

