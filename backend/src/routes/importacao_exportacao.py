from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel
import uuid
import json
import csv
import io
import os
import tempfile
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter

# Importar modelos e schemas
from models import get_db
from models.user import User
from models.medico import Medico
from models.empresa import Empresa
from models.hospital import Hospital
from models.plantao import Plantao
from models.procedimento_particular import ProcedimentoParticular
from models.outros_modelos import ProducaoAdministrativa, DescontoCredito, ProLabore
from models.calculos_historico import ResultadoCalculoProducao, ResultadoCalculoProLabore
from routes.auth import get_current_active_user

# Criar router
router = APIRouter()

# Modelos Pydantic
class ImportacaoResponse(BaseModel):
    total_registros: int
    registros_importados: int
    registros_com_erro: int
    erros: List[str]
    detalhes: Optional[Dict[str, Any]] = None

class ExportacaoRequest(BaseModel):
    tipo_exportacao: str
    filtros: Optional[Dict[str, Any]] = None
    formato: str = "xlsx"  # xlsx, csv

# Funções auxiliares
def check_permission(user: User, action: str, db: Session):
    """Verifica se o usuário tem permissão para realizar a ação."""
    if user.perfil == "admin":
        return True
    
    # Implementar verificação de permissões baseada nos grupos do usuário
    # Por enquanto, apenas admin pode importar/exportar
    return False

def validar_cpf(cpf: str) -> bool:
    """Valida um CPF."""
    # Remover caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, cpf))
    
    # Verificar se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verificar se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Calcular primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf[i]) * (10 - i)
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Verificar primeiro dígito
    if digito1 != int(cpf[9]):
        return False
    
    # Calcular segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf[i]) * (11 - i)
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verificar segundo dígito
    return digito2 == int(cpf[10])

def validar_cnpj(cnpj: str) -> bool:
    """Valida um CNPJ."""
    # Remover caracteres não numéricos
    cnpj = ''.join(filter(str.isdigit, cnpj))
    
    # Verificar se tem 14 dígitos
    if len(cnpj) != 14:
        return False
    
    # Verificar se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        return False
    
    # Calcular primeiro dígito verificador
    pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = 0
    for i in range(12):
        soma += int(cnpj[i]) * pesos[i]
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Verificar primeiro dígito
    if digito1 != int(cnpj[12]):
        return False
    
    # Calcular segundo dígito verificador
    pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = 0
    for i in range(13):
        soma += int(cnpj[i]) * pesos[i]
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verificar segundo dígito
    return digito2 == int(cnpj[13])

def processar_arquivo_csv(file, db: Session):
    """Processa um arquivo CSV."""
    content = file.file.read().decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(content))
    return list(csv_reader)

def processar_arquivo_excel(file, db: Session):
    """Processa um arquivo Excel."""
    content = file.file.read()
    df = pd.read_excel(io.BytesIO(content))
    return df.to_dict('records')

# Rotas
@router.post("/importar/medicos", response_model=ImportacaoResponse)
async def importar_medicos(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para importar médicos")
    
    # Verificar tipo de arquivo
    if file.filename.endswith('.csv'):
        registros = processar_arquivo_csv(file, db)
    elif file.filename.endswith('.xlsx'):
        registros = processar_arquivo_excel(file, db)
    else:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use CSV ou XLSX.")
    
    # Processar registros
    total_registros = len(registros)
    registros_importados = 0
    registros_com_erro = 0
    erros = []
    
    for i, registro in enumerate(registros):
        try:
            # Validar campos obrigatórios
            if not registro.get('nome'):
                erros.append(f"Linha {i+2}: Campo 'nome' é obrigatório")
                registros_com_erro += 1
                continue
            
            if not registro.get('cpf'):
                erros.append(f"Linha {i+2}: Campo 'cpf' é obrigatório")
                registros_com_erro += 1
                continue
            
            # Validar CPF
            cpf = ''.join(filter(str.isdigit, str(registro.get('cpf', ''))))
            if not validar_cpf(cpf):
                erros.append(f"Linha {i+2}: CPF inválido: {registro.get('cpf')}")
                registros_com_erro += 1
                continue
            
            # Verificar se CPF já existe
            medico_existente = db.query(Medico).filter(Medico.cpf == cpf).first()
            if medico_existente:
                erros.append(f"Linha {i+2}: CPF já cadastrado: {registro.get('cpf')}")
                registros_com_erro += 1
                continue
            
            # Criar médico
            novo_medico = Medico(
                id=str(uuid.uuid4()),
                nome=registro.get('nome'),
                cpf=cpf,
                crm=registro.get('crm', ''),
                estado_crm=registro.get('estado_crm', ''),
                telefone=registro.get('telefone', ''),
                email=registro.get('email', ''),
                data_nascimento=datetime.strptime(registro.get('data_nascimento'), '%Y-%m-%d').date() if registro.get('data_nascimento') else None,
                endereco=registro.get('endereco', ''),
                banco=registro.get('banco', ''),
                agencia=registro.get('agencia', ''),
                conta=registro.get('conta', ''),
                pix=registro.get('pix', ''),
                dependentes_irrf=int(registro.get('dependentes_irrf', 0)),
                ativo=True
            )
            
            db.add(novo_medico)
            registros_importados += 1
            
        except Exception as e:
            erros.append(f"Linha {i+2}: Erro ao processar registro: {str(e)}")
            registros_com_erro += 1
    
    # Commit das alterações
    db.commit()
    
    return {
        "total_registros": total_registros,
        "registros_importados": registros_importados,
        "registros_com_erro": registros_com_erro,
        "erros": erros,
        "detalhes": None
    }

@router.post("/importar/empresas", response_model=ImportacaoResponse)
async def importar_empresas(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para importar empresas")
    
    # Verificar tipo de arquivo
    if file.filename.endswith('.csv'):
        registros = processar_arquivo_csv(file, db)
    elif file.filename.endswith('.xlsx'):
        registros = processar_arquivo_excel(file, db)
    else:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use CSV ou XLSX.")
    
    # Processar registros
    total_registros = len(registros)
    registros_importados = 0
    registros_com_erro = 0
    erros = []
    
    for i, registro in enumerate(registros):
        try:
            # Validar campos obrigatórios
            if not registro.get('nome_fantasia'):
                erros.append(f"Linha {i+2}: Campo 'nome_fantasia' é obrigatório")
                registros_com_erro += 1
                continue
            
            if not registro.get('razao_social'):
                erros.append(f"Linha {i+2}: Campo 'razao_social' é obrigatório")
                registros_com_erro += 1
                continue
            
            if not registro.get('cnpj'):
                erros.append(f"Linha {i+2}: Campo 'cnpj' é obrigatório")
                registros_com_erro += 1
                continue
            
            # Validar CNPJ
            cnpj = ''.join(filter(str.isdigit, str(registro.get('cnpj', ''))))
            if not validar_cnpj(cnpj):
                erros.append(f"Linha {i+2}: CNPJ inválido: {registro.get('cnpj')}")
                registros_com_erro += 1
                continue
            
            # Verificar se CNPJ já existe
            empresa_existente = db.query(Empresa).filter(Empresa.cnpj == cnpj).first()
            if empresa_existente:
                erros.append(f"Linha {i+2}: CNPJ já cadastrado: {registro.get('cnpj')}")
                registros_com_erro += 1
                continue
            
            # Criar empresa
            nova_empresa = Empresa(
                id=str(uuid.uuid4()),
                nome_fantasia=registro.get('nome_fantasia'),
                razao_social=registro.get('razao_social'),
                cnpj=cnpj,
                inscricao_estadual=registro.get('inscricao_estadual', ''),
                inscricao_municipal=registro.get('inscricao_municipal', ''),
                telefone=registro.get('telefone', ''),
                email=registro.get('email', ''),
                endereco=registro.get('endereco', ''),
                cidade=registro.get('cidade', ''),
                estado=registro.get('estado', ''),
                cep=registro.get('cep', ''),
                responsavel=registro.get('responsavel', ''),
                logo_url=registro.get('logo_url', ''),
                ativo=True
            )
            
            db.add(nova_empresa)
            registros_importados += 1
            
        except Exception as e:
            erros.append(f"Linha {i+2}: Erro ao processar registro: {str(e)}")
            registros_com_erro += 1
    
    # Commit das alterações
    db.commit()
    
    return {
        "total_registros": total_registros,
        "registros_importados": registros_importados,
        "registros_com_erro": registros_com_erro,
        "erros": erros,
        "detalhes": None
    }

@router.post("/importar/plantoes", response_model=ImportacaoResponse)
async def importar_plantoes(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para importar plantões")
    
    # Verificar tipo de arquivo
    if file.filename.endswith('.csv'):
        registros = processar_arquivo_csv(file, db)
    elif file.filename.endswith('.xlsx'):
        registros = processar_arquivo_excel(file, db)
    else:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use CSV ou XLSX.")
    
    # Processar registros
    total_registros = len(registros)
    registros_importados = 0
    registros_com_erro = 0
    erros = []
    
    for i, registro in enumerate(registros):
        try:
            # Validar campos obrigatórios
            if not registro.get('medico_id'):
                erros.append(f"Linha {i+2}: Campo 'medico_id' é obrigatório")
                registros_com_erro += 1
                continue
            
            if not registro.get('hospital_id'):
                erros.append(f"Linha {i+2}: Campo 'hospital_id' é obrigatório")
                registros_com_erro += 1
                continue
            
            if not registro.get('tipo_plantao_id'):
                erros.append(f"Linha {i+2}: Campo 'tipo_plantao_id' é obrigatório")
                registros_com_erro += 1
                continue
            
            if not registro.get('data'):
                erros.append(f"Linha {i+2}: Campo 'data' é obrigatório")
                registros_com_erro += 1
                continue
            
            if not registro.get('valor_total'):
                erros.append(f"Linha {i+2}: Campo 'valor_total' é obrigatório")
                registros_com_erro += 1
                continue
            
            # Verificar se médico existe
            medico = db.query(Medico).filter(Medico.id == registro.get('medico_id')).first()
            if not medico:
                erros.append(f"Linha {i+2}: Médico não encontrado: {registro.get('medico_id')}")
                registros_com_erro += 1
                continue
            
            # Verificar se hospital existe
            hospital = db.query(Hospital).filter(Hospital.id == registro.get('hospital_id')).first()
            if not hospital:
                erros.append(f"Linha {i+2}: Hospital não encontrado: {registro.get('hospital_id')}")
                registros_com_erro += 1
                continue
            
            # Extrair competência (YYYY-MM) da data
            data = datetime.strptime(registro.get('data'), '%Y-%m-%d').date()
            competencia = f"{data.year}-{data.month:02d}"
            
            # Criar plantão
            novo_plantao = Plantao(
                id=str(uuid.uuid4()),
                medico_id=registro.get('medico_id'),
                hospital_id=registro.get('hospital_id'),
                empresa_id=registro.get('empresa_id'),
                tipo_plantao_id=registro.get('tipo_plantao_id'),
                data=data,
                hora_inicio=datetime.strptime(registro.get('hora_inicio'), '%H:%M').time() if registro.get('hora_inicio') else None,
                hora_fim=datetime.strptime(registro.get('hora_fim'), '%H:%M').time() if registro.get('hora_fim') else None,
                valor_total=float(registro.get('valor_total')),
                observacoes=registro.get('observacoes', ''),
                competencia=competencia,
                confirmado=True,
                ativo=True
            )
            
            db.add(novo_plantao)
            registros_importados += 1
            
        except Exception as e:
            erros.append(f"Linha {i+2}: Erro ao processar registro: {str(e)}")
            registros_com_erro += 1
    
    # Commit das alterações
    db.commit()
    
    return {
        "total_registros": total_registros,
        "registros_importados": registros_importados,
        "registros_com_erro": registros_com_erro,
        "erros": erros,
        "detalhes": None
    }

@router.post("/exportar", response_model=Dict[str, Any])
async def exportar_dados(
    request: ExportacaoRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para exportar dados")
    
    # Verificar tipo de exportação
    if request.tipo_exportacao not in ["medicos", "empresas", "hospitais", "plantoes", "procedimentos", "prolabores"]:
        raise HTTPException(status_code=400, detail="Tipo de exportação inválido")
    
    # Verificar formato
    if request.formato not in ["xlsx", "csv"]:
        raise HTTPException(status_code=400, detail="Formato inválido. Use 'xlsx' ou 'csv'")
    
    # Gerar nome do arquivo temporário
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"export_{request.tipo_exportacao}_{timestamp}.{request.formato}"
    filepath = os.path.join(tempfile.gettempdir(), filename)
    
    # Buscar dados conforme o tipo de exportação
    if request.tipo_exportacao == "medicos":
        # Buscar médicos
        query = db.query(Medico)
        
        # Aplicar filtros
        if request.filtros:
            if request.filtros.get("ativo") is not None:
                query = query.filter(Medico.ativo == request.filtros.get("ativo"))
            
            if request.filtros.get("nome"):
                query = query.filter(Medico.nome.ilike(f"%{request.filtros.get('nome')}%"))
            
            if request.filtros.get("cpf"):
                query = query.filter(Medico.cpf.ilike(f"%{request.filtros.get('cpf')}%"))
        
        medicos = query.all()
        
        # Preparar dados para exportação
        dados = []
        for medico in medicos:
            dados.append({
                "id": medico.id,
                "nome": medico.nome,
                "cpf": medico.cpf,
                "crm": medico.crm,
                "estado_crm": medico.estado_crm,
                "telefone": medico.telefone,
                "email": medico.email,
                "data_nascimento": medico.data_nascimento.isoformat() if medico.data_nascimento else None,
                "endereco": medico.endereco,
                "banco": medico.banco,
                "agencia": medico.agencia,
                "conta": medico.conta,
                "pix": medico.pix,
                "dependentes_irrf": medico.dependentes_irrf,
                "ativo": medico.ativo,
                "created_date": medico.created_date.isoformat(),
                "updated_date": medico.updated_date.isoformat() if medico.updated_date else None
            })
        
        # Exportar para o formato solicitado
        if request.formato == "xlsx":
            df = pd.DataFrame(dados)
            df.to_excel(filepath, index=False)
        else:  # csv
            df = pd.DataFrame(dados)
            df.to_csv(filepath, index=False)
    
    elif request.tipo_exportacao == "empresas":
        # Buscar empresas
        query = db.query(Empresa)
        
        # Aplicar filtros
        if request.filtros:
            if request.filtros.get("ativo") is not None:
                query = query.filter(Empresa.ativo == request.filtros.get("ativo"))
            
            if request.filtros.get("nome"):
                query = query.filter(
                    Empresa.nome_fantasia.ilike(f"%{request.filtros.get('nome')}%") |
                    Empresa.razao_social.ilike(f"%{request.filtros.get('nome')}%")
                )
            
            if request.filtros.get("cnpj"):
                query = query.filter(Empresa.cnpj.ilike(f"%{request.filtros.get('cnpj')}%"))
        
        empresas = query.all()
        
        # Preparar dados para exportação
        dados = []
        for empresa in empresas:
            dados.append({
                "id": empresa.id,
                "nome_fantasia": empresa.nome_fantasia,
                "razao_social": empresa.razao_social,
                "cnpj": empresa.cnpj,
                "inscricao_estadual": empresa.inscricao_estadual,
                "inscricao_municipal": empresa.inscricao_municipal,
                "telefone": empresa.telefone,
                "email": empresa.email,
                "endereco": empresa.endereco,
                "cidade": empresa.cidade,
                "estado": empresa.estado,
                "cep": empresa.cep,
                "responsavel": empresa.responsavel,
                "logo_url": empresa.logo_url,
                "ativo": empresa.ativo,
                "created_date": empresa.created_date.isoformat(),
                "updated_date": empresa.updated_date.isoformat() if empresa.updated_date else None
            })
        
        # Exportar para o formato solicitado
        if request.formato == "xlsx":
            df = pd.DataFrame(dados)
            df.to_excel(filepath, index=False)
        else:  # csv
            df = pd.DataFrame(dados)
            df.to_csv(filepath, index=False)
    
    elif request.tipo_exportacao == "plantoes":
        # Buscar plantões
        query = db.query(Plantao)
        
        # Aplicar filtros
        if request.filtros:
            if request.filtros.get("ativo") is not None:
                query = query.filter(Plantao.ativo == request.filtros.get("ativo"))
            
            if request.filtros.get("confirmado") is not None:
                query = query.filter(Plantao.confirmado == request.filtros.get("confirmado"))
            
            if request.filtros.get("medico_id"):
                query = query.filter(Plantao.medico_id == request.filtros.get("medico_id"))
            
            if request.filtros.get("hospital_id"):
                query = query.filter(Plantao.hospital_id == request.filtros.get("hospital_id"))
            
            if request.filtros.get("empresa_id"):
                query = query.filter(Plantao.empresa_id == request.filtros.get("empresa_id"))
            
            if request.filtros.get("competencia"):
                query = query.filter(Plantao.competencia == request.filtros.get("competencia"))
            
            if request.filtros.get("data_inicio") and request.filtros.get("data_fim"):
                query = query.filter(
                    Plantao.data >= datetime.strptime(request.filtros.get("data_inicio"), "%Y-%m-%d").date(),
                    Plantao.data <= datetime.strptime(request.filtros.get("data_fim"), "%Y-%m-%d").date()
                )
        
        plantoes = query.all()
        
        # Preparar dados para exportação
        dados = []
        for plantao in plantoes:
            dados.append({
                "id": plantao.id,
                "medico_id": plantao.medico_id,
                "medico_nome": plantao.medico.nome if plantao.medico else None,
                "hospital_id": plantao.hospital_id,
                "hospital_nome": plantao.hospital.nome if plantao.hospital else None,
                "empresa_id": plantao.empresa_id,
                "empresa_nome": plantao.empresa.nome_fantasia if plantao.empresa else None,
                "tipo_plantao_id": plantao.tipo_plantao_id,
                "tipo_plantao_nome": plantao.tipo_plantao.nome if plantao.tipo_plantao else None,
                "data": plantao.data.isoformat(),
                "hora_inicio": plantao.hora_inicio.strftime("%H:%M") if plantao.hora_inicio else None,
                "hora_fim": plantao.hora_fim.strftime("%H:%M") if plantao.hora_fim else None,
                "valor_total": plantao.valor_total,
                "observacoes": plantao.observacoes,
                "competencia": plantao.competencia,
                "confirmado": plantao.confirmado,
                "ativo": plantao.ativo,
                "created_date": plantao.created_date.isoformat(),
                "updated_date": plantao.updated_date.isoformat() if plantao.updated_date else None
            })
        
        # Exportar para o formato solicitado
        if request.formato == "xlsx":
            df = pd.DataFrame(dados)
            df.to_excel(filepath, index=False)
        else:  # csv
            df = pd.DataFrame(dados)
            df.to_csv(filepath, index=False)
    
    # Retornar URL para download
    return {
        "filename": filename,
        "filepath": filepath,
        "tipo_exportacao": request.tipo_exportacao,
        "formato": request.formato,
        "total_registros": len(dados) if 'dados' in locals() else 0,
        "message": "Arquivo gerado com sucesso"
    }

@router.get("/download/{filename}")
async def download_arquivo(
    filename: str,
    current_user: User = Depends(get_current_active_user)
):
    # Verificar permissão
    if current_user.perfil not in ["admin", "operador"]:
        raise HTTPException(status_code=403, detail="Sem permissão para baixar arquivos")
    
    # Verificar se o arquivo existe
    filepath = os.path.join(tempfile.gettempdir(), filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    # Retornar o arquivo
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type='application/octet-stream'
    )

