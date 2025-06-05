from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import logging
from datetime import datetime, timedelta

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("medflow-api")

# Importar modelos e rotas
from src.models import get_db, init_database, User
from src.routes import auth, medicos, empresas, hospitais, plantoes, procedimentos, contratos
from src.routes import tipos_plantao, producao_administrativa, prolabores, descontos_creditos
from src.routes import calculos, relatorios, importacao_exportacao

# Criar aplicação FastAPI
app = FastAPI(
    title="MedFlow API",
    description="API para o sistema MedFlow de gestão de produção médica",
    version="1.0.0"
)

# Configurar CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para logging de requisições
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds() * 1000
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.2f}ms")
    return response

# Middleware para tratamento de exceções
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro não tratado: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erro interno do servidor. Por favor, tente novamente mais tarde."}
    )

# Rota raiz
@app.get("/")
async def root():
    return {
        "message": "Bem-vindo à API do MedFlow",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.now().isoformat()
    }

# Rota de verificação de saúde
@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Verificar conexão com o banco de dados
        db.execute("SELECT 1").fetchall()
        
        return {
            "status": "ok",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro na verificação de saúde: {str(e)}")
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Incluir rotas
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(medicos.router, prefix="/api/medicos", tags=["Médicos"])
app.include_router(empresas.router, prefix="/api/empresas", tags=["Empresas"])
app.include_router(hospitais.router, prefix="/api/hospitais", tags=["Hospitais"])
app.include_router(plantoes.router, prefix="/api/plantoes", tags=["Plantões"])
app.include_router(procedimentos.router, prefix="/api/procedimentos", tags=["Procedimentos"])
app.include_router(contratos.router, prefix="/api/contratos", tags=["Contratos"])
app.include_router(tipos_plantao.router, prefix="/api/tipos-plantao", tags=["Tipos de Plantão"])
app.include_router(producao_administrativa.router, prefix="/api/producao-administrativa", tags=["Produção Administrativa"])
app.include_router(prolabores.router, prefix="/api/prolabores", tags=["Pró-Labores"])
app.include_router(descontos_creditos.router, prefix="/api/descontos-creditos", tags=["Descontos e Créditos"])
app.include_router(calculos.router, prefix="/api/calculos", tags=["Cálculos"])
app.include_router(relatorios.router, prefix="/api/relatorios", tags=["Relatórios"])
app.include_router(importacao_exportacao.router, prefix="/api/importacao-exportacao", tags=["Importação e Exportação"])

# Inicializar banco de dados
@app.on_event("startup")
async def startup_event():
    logger.info("Inicializando aplicação...")
    try:
        init_database()
        logger.info("Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {str(e)}", exc_info=True)

# Ponto de entrada para execução direta
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

