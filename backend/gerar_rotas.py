import os

# Entidades para gerar rotas CRUD
entidades = [
    {"nome": "Hospital", "modelo": "Hospital", "tag": "Hospitais", "plural": "hospitais"},
    {"nome": "TipoPlantao", "modelo": "TipoPlantao", "tag": "Tipos de Plantão", "plural": "tipos-plantao"},
    {"nome": "Contrato", "modelo": "Contrato", "tag": "Contratos", "plural": "contratos"},
    {"nome": "Plantao", "modelo": "Plantao", "tag": "Plantões", "plural": "plantoes"},
    {"nome": "ProcedimentoParticular", "modelo": "ProcedimentoParticular", "tag": "Procedimentos Particulares", "plural": "procedimentos"},
    {"nome": "ProducaoAdministrativa", "modelo": "ProducaoAdministrativa", "tag": "Produção Administrativa", "plural": "producao-administrativa"},
    {"nome": "DescontoCredito", "modelo": "DescontoCredito", "tag": "Descontos e Créditos", "plural": "descontos-creditos"},
    {"nome": "ProLabore", "modelo": "ProLabore", "tag": "Pró-Labores", "plural": "prolabores"},
    {"nome": "GrupoAcesso", "modelo": "GrupoAcesso", "tag": "Grupos de Acesso", "plural": "grupos-acesso"},
    {"nome": "TabelaINSS", "modelo": "TabelaINSS", "tag": "Tabelas INSS", "plural": "tabelas-inss"},
    {"nome": "TabelaIRRF", "modelo": "TabelaIRRF", "tag": "Tabelas IRRF", "plural": "tabelas-irrf"},
    {"nome": "ParametrosFiscaisEmpresa", "modelo": "ParametrosFiscaisEmpresa", "tag": "Parâmetros Fiscais Empresa", "plural": "parametros-fiscais-empresa"},
    {"nome": "VinculoFiscalMedico", "modelo": "VinculoFiscalMedico", "tag": "Vínculos Fiscais Médicos", "plural": "vinculos-fiscais-medicos"},
    {"nome": "ParametrosPDF", "modelo": "ParametrosPDF", "tag": "Parâmetros PDF", "plural": "parametros-pdf"},
]

# Diretório das rotas
dir_rotas = "src/routes"

# Template base para rotas CRUD
template = '''
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

# Importar modelos e schemas
from models import get_db
from models.user import User
from models.{entidade_lower} import {entidade_modelo}
# Adicionar outros imports de modelos necessários aqui
from routes.auth import get_current_active_user

# Criar router
router = APIRouter()

# Modelos Pydantic (Definir aqui os schemas Create, Update, Response)
class {entidade_modelo}Base(BaseModel):
    # Definir campos base aqui
    pass

class {entidade_modelo}Create({entidade_modelo}Base):
    pass

class {entidade_modelo}Update(BaseModel):
    # Definir campos opcionais para update aqui
    pass

class {entidade_modelo}Response({entidade_modelo}Base):
    id: str
    created_date: datetime
    updated_date: Optional[datetime] = None
    # Adicionar outros campos específicos da resposta

    class Config:
        orm_mode = True

# Funções auxiliares
def check_permission(user: User, action: str, db: Session):
    """Verifica se o usuário tem permissão para realizar a ação."""
    if user.perfil == "admin":
        return True
    # Implementar lógica de permissão específica para {entidade_tag}
    return False

# Rotas
@router.get("/", response_model=List[{entidade_modelo}Response])
async def get_{entidade_plural}(
    skip: int = 0, 
    limit: int = 100, 
    # Adicionar filtros específicos aqui
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db):
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar {entidade_tag}")
        
    query = db.query({entidade_modelo})
    # Aplicar filtros aqui
    
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/{item_id}", response_model={entidade_modelo}Response)
async def get_{entidade_singular}(
    item_id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    item = db.query({entidade_modelo}).filter({entidade_modelo}.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="{entidade_modelo} não encontrado")
    
    # Verificar permissão
    if not check_permission(current_user, "view", db):
        # Adicionar lógica se o usuário pode ver apenas seus próprios itens
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar este {entidade_singular}")
        
    return item

@router.post("/", response_model={entidade_modelo}Response)
async def create_{entidade_singular}(
    item: {entidade_modelo}Create, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db):
        raise HTTPException(status_code=403, detail="Sem permissão para criar {entidade_tag}")
        
    db_item = {entidade_modelo}(
        id=str(uuid.uuid4()),
        **item.dict()
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model={entidade_modelo}Response)
async def update_{entidade_singular}(
    item_id: str, 
    item: {entidade_modelo}Update, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    db_item = db.query({entidade_modelo}).filter({entidade_modelo}.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="{entidade_modelo} não encontrado")
        
    # Verificar permissão
    if not check_permission(current_user, "update", db):
        # Adicionar lógica se o usuário pode atualizar apenas seus próprios itens
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar este {entidade_singular}")
        
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
async def delete_{entidade_singular}(
    item_id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    db_item = db.query({entidade_modelo}).filter({entidade_modelo}.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="{entidade_modelo} não encontrado")
        
    # Verificar permissão
    if not check_permission(current_user, "delete", db):
        # Adicionar lógica se o usuário pode deletar apenas seus próprios itens
        raise HTTPException(status_code=403, detail="Sem permissão para excluir este {entidade_singular}")
        
    # Exclusão lógica (desativar) ou física
    # db_item.ativo = False # Exemplo de exclusão lógica
    db.delete(db_item) # Exemplo de exclusão física
    
    db.commit()
    return {"message": "{entidade_modelo} excluído com sucesso"}

'''

# Gerar arquivos de rotas
for entidade in entidades:
    nome_arquivo = entidade["plural"].replace("-", "_") + ".py"
    caminho_arquivo = os.path.join(dir_rotas, nome_arquivo)
    
    # Determinar nome singular (simplesmente removendo 's' ou 'es' no final)
    singular = entidade["plural"]
    if singular.endswith("es"):
        singular = singular[:-2]
    elif singular.endswith("s"):
        singular = singular[:-1]
    
    conteudo = template.format(
        entidade_lower=entidade["modelo"].lower(),
        entidade_modelo=entidade["modelo"],
        entidade_tag=entidade["tag"],
        entidade_plural=entidade["plural"].replace("-", "_"),
        entidade_singular=singular.replace("-", "_")
    )
    
    with open(caminho_arquivo, "w", encoding="utf-8") as f:
        f.write(conteudo)
    
    print(f"Arquivo de rotas gerado: {caminho_arquivo}")

print("\nGeração de arquivos de rotas concluída.")
print("Lembre-se de definir os schemas Pydantic e ajustar a lógica de permissão em cada arquivo.")
print("Não se esqueça de importar e incluir os novos routers no main.py.")
'''

# Executar o script para gerar os arquivos
# (Este script será executado manualmente ou em um passo separado)

# Exemplo de como importar e incluir no main.py:
# from routes import hospitais, tipos_plantao, ...
# app.include_router(hospitais.router, prefix="/api/hospitais", tags=["Hospitais"])
# app.include_router(tipos_plantao.router, prefix="/api/tipos-plantao", tags=["Tipos de Plantão"])
# ...

