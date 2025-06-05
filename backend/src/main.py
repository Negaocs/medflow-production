from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import os
import logging
import json

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importar modelos e schemas
from models import Base, engine, get_db
from routes import auth, medicos, empresas, hospitais, tipos_plantao, contratos, plantoes
from routes import procedimentos, producao_administrativa, descontos_creditos, prolabores
from routes import calculos, relatorios, importacao_exportacao

# Criar tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# Inicializar aplicação FastAPI
app = FastAPI(
    title="MedFlow API",
    description="API para o sistema MedFlow de gestão médica",
    version="1.0.0"
)

# Configurar CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://medflow-frontend.onrender.com",
    "*"  # Permitir todas as origens em desenvolvimento (remover em produção)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(medicos.router, prefix="/api/medicos", tags=["Médicos"])
app.include_router(empresas.router, prefix="/api/empresas", tags=["Empresas"])
app.include_router(hospitais.router, prefix="/api/hospitais", tags=["Hospitais"])
app.include_router(tipos_plantao.router, prefix="/api/tipos-plantao", tags=["Tipos de Plantão"])
app.include_router(contratos.router, prefix="/api/contratos", tags=["Contratos"])
app.include_router(plantoes.router, prefix="/api/plantoes", tags=["Plantões"])
app.include_router(procedimentos.router, prefix="/api/procedimentos", tags=["Procedimentos Particulares"])
app.include_router(producao_administrativa.router, prefix="/api/producao-administrativa", tags=["Produção Administrativa"])
app.include_router(descontos_creditos.router, prefix="/api/descontos-creditos", tags=["Descontos e Créditos"])
app.include_router(prolabores.router, prefix="/api/prolabores", tags=["Pró-Labores"])
app.include_router(calculos.router, prefix="/api/calculos", tags=["Cálculos"])
app.include_router(relatorios.router, prefix="/api/relatorios", tags=["Relatórios"])
app.include_router(importacao_exportacao.router, prefix="/api/importacao-exportacao", tags=["Importação e Exportação"])

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do MedFlow"}

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

def init_database():
    """Inicializa o banco de dados com dados básicos necessários."""
    try:
        db = next(get_db())
        
        # Verificar se já existem dados básicos
        from models.user import User
        admin_user = db.query(User).filter(User.email == "admin@medflow.com").first()
        
        if not admin_user:
            # Importar utilitários
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            # Criar usuário admin
            from models.user import User
            admin = User(
                nome_completo="Administrador",
                email="admin@medflow.com",
                senha_hash=pwd_context.hash("admin123"),
                perfil="admin",
                ativo=True
            )
            db.add(admin)
            
            # Criar grupo de acesso admin
            from models.outros_modelos import GrupoAcesso
            grupo_admin = GrupoAcesso(
                nome="Administradores",
                descricao="Grupo com acesso total ao sistema",
                permissoes=json.dumps({
                    "medicos": ["view", "create", "update", "delete"],
                    "empresas": ["view", "create", "update", "delete"],
                    "hospitais": ["view", "create", "update", "delete"],
                    "plantoes": ["view", "create", "update", "delete"],
                    "contratos": ["view", "create", "update", "delete"],
                    "procedimentos": ["view", "create", "update", "delete"],
                    "producao_administrativa": ["view", "create", "update", "delete"],
                    "descontos_creditos": ["view", "create", "update", "delete"],
                    "prolabores": ["view", "create", "update", "delete"],
                    "calculos": ["view", "create", "update", "delete"],
                    "relatorios": ["view", "create", "update", "delete"],
                    "usuarios": ["view", "create", "update", "delete"],
                    "grupos": ["view", "create", "update", "delete"],
                    "configuracoes": ["view", "create", "update", "delete"]
                }),
                ativo=True
            )
            db.add(grupo_admin)
            
            # Commit das alterações
            db.commit()
            
            # Vincular usuário ao grupo (após commit para ter os IDs)
            from models.outros_modelos import UsuarioGrupo
            vinculo = UsuarioGrupo(
                usuario_id=admin.id,
                grupo_id=grupo_admin.id
            )
            db.add(vinculo)
            db.commit()
            
            logger.info("Banco de dados inicializado com sucesso!")
        else:
            logger.info("Banco de dados já inicializado.")
            
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {str(e)}")
        db.rollback()

# Inicializar banco de dados ao iniciar a aplicação
@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando aplicação MedFlow API...")
    init_database()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

