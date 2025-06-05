from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Carregar variáveis de ambiente
load_dotenv()

# Importar modelos e schemas
from models import get_db
from models.user import User
from models.outros_modelos import GrupoAcesso, UsuarioGrupo

# Configurações de segurança
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# Configuração de criptografia de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuração do OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Criar router
router = APIRouter()

# Modelos Pydantic
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    nome_completo: str
    email: str
    perfil: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

class UserCreate(BaseModel):
    nome_completo: str
    email: str
    senha: str
    perfil: str
    medico_id_associado: Optional[str] = None
    grupos_ids: List[str] = []

class UserUpdate(BaseModel):
    nome_completo: Optional[str] = None
    email: Optional[str] = None
    senha: Optional[str] = None
    perfil: Optional[str] = None
    medico_id_associado: Optional[str] = None
    ativo: Optional[bool] = None
    grupos_ids: List[str] = []

class UserResponse(BaseModel):
    id: str
    nome_completo: str
    email: str
    perfil: str
    medico_id_associado: Optional[str] = None
    ativo: bool
    created_date: datetime
    ultimo_login: Optional[datetime] = None
    grupos: List[str] = []

# Funções auxiliares
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.senha_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if email is None or user_id is None:
            raise credentials_exception
        token_data = TokenData(email=email, user_id=user_id)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.ativo:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return current_user

# Rotas
@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Atualizar último login
    user.ultimo_login = datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "nome_completo": user.nome_completo,
        "email": user.email,
        "perfil": user.perfil
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Obter grupos do usuário
    grupos_usuario = db.query(UsuarioGrupo).filter(UsuarioGrupo.usuario_id == current_user.id).all()
    grupos_ids = [grupo.grupo_id for grupo in grupos_usuario]
    
    return {
        "id": current_user.id,
        "nome_completo": current_user.nome_completo,
        "email": current_user.email,
        "perfil": current_user.perfil,
        "medico_id_associado": current_user.medico_id_associado,
        "ativo": current_user.ativo,
        "created_date": current_user.created_date,
        "ultimo_login": current_user.ultimo_login,
        "grupos": grupos_ids
    }

@router.get("/permissions")
async def get_user_permissions(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Obter grupos do usuário
    grupos_usuario = db.query(UsuarioGrupo).filter(UsuarioGrupo.usuario_id == current_user.id).all()
    
    # Obter permissões de cada grupo
    permissoes = {}
    for grupo_usuario in grupos_usuario:
        grupo = db.query(GrupoAcesso).filter(GrupoAcesso.id == grupo_usuario.grupo_id).first()
        if grupo and grupo.ativo:
            try:
                grupo_permissoes = eval(grupo.permissoes)  # Converter string JSON para dicionário
                for entidade, acoes in grupo_permissoes.items():
                    if entidade not in permissoes:
                        permissoes[entidade] = []
                    for acao in acoes:
                        if acao not in permissoes[entidade]:
                            permissoes[entidade].append(acao)
            except Exception as e:
                print(f"Erro ao processar permissões do grupo {grupo.id}: {str(e)}")
    
    # Adicionar permissões especiais baseadas no perfil
    if current_user.perfil == "admin":
        # Administradores têm acesso total
        entidades = ["medicos", "empresas", "hospitais", "plantoes", "contratos", "procedimentos", 
                    "producao_administrativa", "descontos_creditos", "prolabores", "calculos", 
                    "relatorios", "usuarios", "grupos", "configuracoes"]
        acoes = ["view", "create", "update", "delete"]
        
        for entidade in entidades:
            if entidade not in permissoes:
                permissoes[entidade] = []
            for acao in acoes:
                if acao not in permissoes[entidade]:
                    permissoes[entidade].append(acao)
    
    elif current_user.perfil == "medico" and current_user.medico_id_associado:
        # Médicos podem ver seus próprios dados
        permissoes["medicos"] = ["view"]
        permissoes["plantoes"] = ["view"]
        permissoes["procedimentos"] = ["view"]
        permissoes["producao_administrativa"] = ["view"]
        permissoes["descontos_creditos"] = ["view"]
        permissoes["prolabores"] = ["view"]
        permissoes["calculos"] = ["view"]
        permissoes["relatorios"] = ["view"]
    
    return {"permissions": permissoes}

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Verificar se o usuário atual tem permissão para criar usuários
    if current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para criar usuários")
    
    # Verificar se o email já existe
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já registrado")
    
    # Criar novo usuário
    new_user = User(
        nome_completo=user.nome_completo,
        email=user.email,
        senha_hash=get_password_hash(user.senha),
        perfil=user.perfil,
        medico_id_associado=user.medico_id_associado,
        ativo=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Adicionar aos grupos
    for grupo_id in user.grupos_ids:
        grupo = db.query(GrupoAcesso).filter(GrupoAcesso.id == grupo_id).first()
        if grupo:
            vinculo = UsuarioGrupo(
                usuario_id=new_user.id,
                grupo_id=grupo_id
            )
            db.add(vinculo)
    
    db.commit()
    
    return {
        "id": new_user.id,
        "nome_completo": new_user.nome_completo,
        "email": new_user.email,
        "perfil": new_user.perfil,
        "medico_id_associado": new_user.medico_id_associado,
        "ativo": new_user.ativo,
        "created_date": new_user.created_date,
        "ultimo_login": new_user.ultimo_login,
        "grupos": user.grupos_ids
    }

@router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Verificar se o usuário atual tem permissão para listar usuários
    if current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para listar usuários")
    
    users = db.query(User).all()
    result = []
    
    for user in users:
        # Obter grupos do usuário
        grupos_usuario = db.query(UsuarioGrupo).filter(UsuarioGrupo.usuario_id == user.id).all()
        grupos_ids = [grupo.grupo_id for grupo in grupos_usuario]
        
        result.append({
            "id": user.id,
            "nome_completo": user.nome_completo,
            "email": user.email,
            "perfil": user.perfil,
            "medico_id_associado": user.medico_id_associado,
            "ativo": user.ativo,
            "created_date": user.created_date,
            "ultimo_login": user.ultimo_login,
            "grupos": grupos_ids
        })
    
    return result

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Verificar se o usuário atual tem permissão para ver usuários
    if current_user.perfil != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Sem permissão para ver este usuário")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Obter grupos do usuário
    grupos_usuario = db.query(UsuarioGrupo).filter(UsuarioGrupo.usuario_id == user.id).all()
    grupos_ids = [grupo.grupo_id for grupo in grupos_usuario]
    
    return {
        "id": user.id,
        "nome_completo": user.nome_completo,
        "email": user.email,
        "perfil": user.perfil,
        "medico_id_associado": user.medico_id_associado,
        "ativo": user.ativo,
        "created_date": user.created_date,
        "ultimo_login": user.ultimo_login,
        "grupos": grupos_ids
    }

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user: UserUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Verificar se o usuário atual tem permissão para atualizar usuários
    if current_user.perfil != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar este usuário")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Atualizar campos
    if user.nome_completo is not None:
        db_user.nome_completo = user.nome_completo
    
    if user.email is not None and user.email != db_user.email:
        # Verificar se o novo email já existe
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="Email já registrado")
        db_user.email = user.email
    
    if user.senha is not None:
        db_user.senha_hash = get_password_hash(user.senha)
    
    if user.perfil is not None:
        db_user.perfil = user.perfil
    
    if user.medico_id_associado is not None:
        db_user.medico_id_associado = user.medico_id_associado
    
    if user.ativo is not None:
        db_user.ativo = user.ativo
    
    db.commit()
    db.refresh(db_user)
    
    # Atualizar grupos se o usuário atual for admin
    if current_user.perfil == "admin" and user.grupos_ids:
        # Remover vínculos existentes
        db.query(UsuarioGrupo).filter(UsuarioGrupo.usuario_id == user_id).delete()
        
        # Adicionar novos vínculos
        for grupo_id in user.grupos_ids:
            grupo = db.query(GrupoAcesso).filter(GrupoAcesso.id == grupo_id).first()
            if grupo:
                vinculo = UsuarioGrupo(
                    usuario_id=user_id,
                    grupo_id=grupo_id
                )
                db.add(vinculo)
        
        db.commit()
    
    # Obter grupos atualizados
    grupos_usuario = db.query(UsuarioGrupo).filter(UsuarioGrupo.usuario_id == user_id).all()
    grupos_ids = [grupo.grupo_id for grupo in grupos_usuario]
    
    return {
        "id": db_user.id,
        "nome_completo": db_user.nome_completo,
        "email": db_user.email,
        "perfil": db_user.perfil,
        "medico_id_associado": db_user.medico_id_associado,
        "ativo": db_user.ativo,
        "created_date": db_user.created_date,
        "ultimo_login": db_user.ultimo_login,
        "grupos": grupos_ids
    }

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Verificar se o usuário atual tem permissão para excluir usuários
    if current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para excluir usuários")
    
    # Não permitir excluir o próprio usuário
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Não é possível excluir o próprio usuário")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Exclusão lógica (desativar)
    db_user.ativo = False
    db.commit()
    
    return {"message": "Usuário desativado com sucesso"}

