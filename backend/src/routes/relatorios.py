from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel
import uuid
import json
import calendar
from sqlalchemy import func, and_, or_, desc

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
class RelatorioProducaoMedicoResponse(BaseModel):
    medico_id: str
    nome_medico: str
    competencia: str
    total_plantoes: int
    total_procedimentos: int
    total_producao_administrativa: int
    valor_bruto_plantoes: float
    valor_bruto_procedimentos: float
    valor_bruto_producao_administrativa: float
    valor_bruto_total: float
    valor_descontos: float
    valor_liquido_total: float
    detalhes: Optional[Dict[str, Any]] = None

class RelatorioProducaoEmpresaResponse(BaseModel):
    empresa_id: str
    nome_empresa: str
    competencia: str
    total_medicos: int
    total_plantoes: int
    total_procedimentos: int
    valor_bruto_plantoes: float
    valor_bruto_procedimentos: float
    valor_bruto_total: float
    detalhes: Optional[Dict[str, Any]] = None

class RelatorioProducaoHospitalResponse(BaseModel):
    hospital_id: str
    nome_hospital: str
    competencia: str
    total_medicos: int
    total_plantoes: int
    valor_bruto_plantoes: float
    detalhes: Optional[Dict[str, Any]] = None

class RelatorioProLaboreResponse(BaseModel):
    medico_id: str
    nome_medico: str
    competencia: str
    total_prolabores: int
    valor_bruto_total: float
    valor_inss: float
    valor_irrf: float
    valor_outros_descontos: float
    valor_liquido_total: float
    detalhes: Optional[Dict[str, Any]] = None

# Funções auxiliares
def check_permission(user: User, action: str, db: Session):
    """Verifica se o usuário tem permissão para realizar a ação."""
    if user.perfil == "admin":
        return True
    
    # Implementar verificação de permissões baseada nos grupos do usuário
    # Por enquanto, apenas admin e operadores podem visualizar relatórios
    return user.perfil == "operador"

def get_ultimo_dia_mes(ano: int, mes: int):
    """Retorna o último dia do mês."""
    return calendar.monthrange(ano, mes)[1]

# Rotas
@router.get("/producao/medico/{medico_id}/competencia/{competencia}", response_model=RelatorioProducaoMedicoResponse)
async def get_relatorio_producao_medico(
    medico_id: str,
    competencia: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para visualizar relatórios")
    
    # Verificar se médico existe
    medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Extrair ano e mês da competência
    try:
        ano, mes = map(int, competencia.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de competência inválido. Use YYYY-MM")
    
    # Buscar plantões da competência
    plantoes = db.query(Plantao).filter(
        Plantao.medico_id == medico_id,
        Plantao.competencia == competencia,
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).all()
    
    # Buscar procedimentos particulares da competência
    procedimentos = db.query(ProcedimentoParticular).filter(
        ProcedimentoParticular.medico_id == medico_id,
        ProcedimentoParticular.competencia == competencia,
        ProcedimentoParticular.confirmado == True,
        ProcedimentoParticular.ativo == True
    ).all()
    
    # Buscar produção administrativa da competência
    producao_admin = db.query(ProducaoAdministrativa).filter(
        ProducaoAdministrativa.medico_id == medico_id,
        ProducaoAdministrativa.competencia == competencia,
        ProducaoAdministrativa.confirmado == True,
        ProducaoAdministrativa.ativo == True
    ).all()
    
    # Buscar descontos e créditos da competência
    descontos_creditos = db.query(DescontoCredito).filter(
        DescontoCredito.medico_id == medico_id,
        DescontoCredito.competencia == competencia,
        DescontoCredito.ativo == True
    ).all()
    
    # Calcular valores
    valor_bruto_plantoes = sum(p.valor_total for p in plantoes)
    valor_bruto_procedimentos = sum(p.valor_liquido_repasse for p in procedimentos)
    valor_bruto_producao_administrativa = sum(p.valor_total for p in producao_admin)
    
    valor_descontos = sum(dc.valor for dc in descontos_creditos if dc.tipo == "desconto")
    valor_creditos = sum(dc.valor for dc in descontos_creditos if dc.tipo == "credito")
    
    valor_bruto_total = valor_bruto_plantoes + valor_bruto_procedimentos + valor_bruto_producao_administrativa + valor_creditos
    valor_liquido_total = valor_bruto_total - valor_descontos
    
    # Preparar detalhes
    detalhes = {
        "plantoes": [
            {
                "id": p.id,
                "hospital": p.hospital.nome if p.hospital else "Hospital",
                "tipo_plantao": p.tipo_plantao.nome if p.tipo_plantao else "Tipo de Plantão",
                "data": p.data.isoformat(),
                "hora_inicio": p.hora_inicio.strftime("%H:%M") if p.hora_inicio else "",
                "hora_fim": p.hora_fim.strftime("%H:%M") if p.hora_fim else "",
                "valor_total": p.valor_total
            }
            for p in plantoes
        ],
        "procedimentos": [
            {
                "id": p.id,
                "tipo_procedimento": p.tipo_procedimento,
                "nome_paciente": p.nome_paciente,
                "data_procedimento": p.data_procedimento.isoformat(),
                "valor_bruto": p.valor_bruto,
                "percentual_repasse": p.percentual_repasse,
                "valor_liquido_repasse": p.valor_liquido_repasse
            }
            for p in procedimentos
        ],
        "producao_administrativa": [
            {
                "id": p.id,
                "descricao": p.descricao,
                "data_inicio": p.data_inicio.isoformat() if p.data_inicio else None,
                "data_fim": p.data_fim.isoformat() if p.data_fim else None,
                "valor_total": p.valor_total
            }
            for p in producao_admin
        ],
        "descontos_creditos": [
            {
                "id": dc.id,
                "tipo": dc.tipo,
                "descricao": dc.descricao,
                "data": dc.data.isoformat(),
                "valor": dc.valor
            }
            for dc in descontos_creditos
        ]
    }
    
    return {
        "medico_id": medico_id,
        "nome_medico": medico.nome,
        "competencia": competencia,
        "total_plantoes": len(plantoes),
        "total_procedimentos": len(procedimentos),
        "total_producao_administrativa": len(producao_admin),
        "valor_bruto_plantoes": valor_bruto_plantoes,
        "valor_bruto_procedimentos": valor_bruto_procedimentos,
        "valor_bruto_producao_administrativa": valor_bruto_producao_administrativa,
        "valor_bruto_total": valor_bruto_total,
        "valor_descontos": valor_descontos,
        "valor_liquido_total": valor_liquido_total,
        "detalhes": detalhes
    }

@router.get("/producao/empresa/{empresa_id}/competencia/{competencia}", response_model=RelatorioProducaoEmpresaResponse)
async def get_relatorio_producao_empresa(
    empresa_id: str,
    competencia: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar relatórios")
    
    # Verificar se empresa existe
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # Extrair ano e mês da competência
    try:
        ano, mes = map(int, competencia.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de competência inválido. Use YYYY-MM")
    
    # Buscar plantões da competência para a empresa
    plantoes = db.query(Plantao).filter(
        Plantao.empresa_id == empresa_id,
        Plantao.competencia == competencia,
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).all()
    
    # Buscar procedimentos particulares da competência para a empresa
    procedimentos = db.query(ProcedimentoParticular).filter(
        ProcedimentoParticular.empresa_id == empresa_id,
        ProcedimentoParticular.competencia == competencia,
        ProcedimentoParticular.confirmado == True,
        ProcedimentoParticular.ativo == True
    ).all()
    
    # Calcular valores
    valor_bruto_plantoes = sum(p.valor_total for p in plantoes)
    valor_bruto_procedimentos = sum(p.valor_liquido_repasse for p in procedimentos)
    valor_bruto_total = valor_bruto_plantoes + valor_bruto_procedimentos
    
    # Contar médicos únicos
    medicos_ids = set()
    for p in plantoes:
        medicos_ids.add(p.medico_id)
    for p in procedimentos:
        medicos_ids.add(p.medico_id)
    
    total_medicos = len(medicos_ids)
    
    # Preparar detalhes
    detalhes = {
        "medicos": [
            {
                "id": medico_id,
                "nome": db.query(Medico.nome).filter(Medico.id == medico_id).scalar() or "Médico",
                "total_plantoes": sum(1 for p in plantoes if p.medico_id == medico_id),
                "total_procedimentos": sum(1 for p in procedimentos if p.medico_id == medico_id),
                "valor_bruto_plantoes": sum(p.valor_total for p in plantoes if p.medico_id == medico_id),
                "valor_bruto_procedimentos": sum(p.valor_liquido_repasse for p in procedimentos if p.medico_id == medico_id),
                "valor_bruto_total": sum(p.valor_total for p in plantoes if p.medico_id == medico_id) + 
                                    sum(p.valor_liquido_repasse for p in procedimentos if p.medico_id == medico_id)
            }
            for medico_id in medicos_ids
        ]
    }
    
    return {
        "empresa_id": empresa_id,
        "nome_empresa": empresa.nome_fantasia,
        "competencia": competencia,
        "total_medicos": total_medicos,
        "total_plantoes": len(plantoes),
        "total_procedimentos": len(procedimentos),
        "valor_bruto_plantoes": valor_bruto_plantoes,
        "valor_bruto_procedimentos": valor_bruto_procedimentos,
        "valor_bruto_total": valor_bruto_total,
        "detalhes": detalhes
    }

@router.get("/producao/hospital/{hospital_id}/competencia/{competencia}", response_model=RelatorioProducaoHospitalResponse)
async def get_relatorio_producao_hospital(
    hospital_id: str,
    competencia: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar relatórios")
    
    # Verificar se hospital existe
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital não encontrado")
    
    # Extrair ano e mês da competência
    try:
        ano, mes = map(int, competencia.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de competência inválido. Use YYYY-MM")
    
    # Buscar plantões da competência para o hospital
    plantoes = db.query(Plantao).filter(
        Plantao.hospital_id == hospital_id,
        Plantao.competencia == competencia,
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).all()
    
    # Calcular valores
    valor_bruto_plantoes = sum(p.valor_total for p in plantoes)
    
    # Contar médicos únicos
    medicos_ids = set(p.medico_id for p in plantoes)
    total_medicos = len(medicos_ids)
    
    # Preparar detalhes
    detalhes = {
        "medicos": [
            {
                "id": medico_id,
                "nome": db.query(Medico.nome).filter(Medico.id == medico_id).scalar() or "Médico",
                "total_plantoes": sum(1 for p in plantoes if p.medico_id == medico_id),
                "valor_bruto_plantoes": sum(p.valor_total for p in plantoes if p.medico_id == medico_id)
            }
            for medico_id in medicos_ids
        ],
        "tipos_plantao": [
            {
                "id": tipo_id,
                "nome": db.query(Plantao.tipo_plantao.nome).filter(Plantao.tipo_plantao_id == tipo_id).scalar() or "Tipo de Plantão",
                "total_plantoes": sum(1 for p in plantoes if p.tipo_plantao_id == tipo_id),
                "valor_bruto_plantoes": sum(p.valor_total for p in plantoes if p.tipo_plantao_id == tipo_id)
            }
            for tipo_id in set(p.tipo_plantao_id for p in plantoes)
        ]
    }
    
    return {
        "hospital_id": hospital_id,
        "nome_hospital": hospital.nome,
        "competencia": competencia,
        "total_medicos": total_medicos,
        "total_plantoes": len(plantoes),
        "valor_bruto_plantoes": valor_bruto_plantoes,
        "detalhes": detalhes
    }

@router.get("/prolabore/medico/{medico_id}/competencia/{competencia}", response_model=RelatorioProLaboreResponse)
async def get_relatorio_prolabore_medico(
    medico_id: str,
    competencia: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para visualizar relatórios")
    
    # Verificar se médico existe
    medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Extrair ano e mês da competência
    try:
        ano, mes = map(int, competencia.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de competência inválido. Use YYYY-MM")
    
    # Buscar pró-labores da competência
    prolabores = db.query(ProLabore).filter(
        ProLabore.medico_id == medico_id,
        ProLabore.competencia == competencia,
        ProLabore.confirmado == True,
        ProLabore.ativo == True
    ).all()
    
    # Buscar cálculos de pró-labore finalizados
    calculo = db.query(ResultadoCalculoProLabore).filter(
        ResultadoCalculoProLabore.medico_id == medico_id,
        ResultadoCalculoProLabore.competencia == competencia,
        ResultadoCalculoProLabore.status == "finalizado"
    ).order_by(ResultadoCalculoProLabore.data_finalizacao.desc()).first()
    
    # Calcular valores
    valor_bruto_total = sum(p.valor_bruto for p in prolabores)
    
    # Se houver cálculo finalizado, usar os valores dele
    if calculo:
        valor_inss = calculo.valor_inss
        valor_irrf = calculo.valor_irrf
        valor_outros_descontos = calculo.valor_outros_descontos
        valor_liquido_total = calculo.valor_liquido_total
    else:
        # Valores padrão se não houver cálculo
        valor_inss = 0
        valor_irrf = 0
        valor_outros_descontos = 0
        valor_liquido_total = valor_bruto_total
    
    # Preparar detalhes
    detalhes = {
        "prolabores": [
            {
                "id": p.id,
                "descricao": p.descricao,
                "data": p.data.isoformat(),
                "valor_bruto": p.valor_bruto,
                "empresa": db.query(Empresa.nome_fantasia).filter(Empresa.id == p.empresa_id).scalar() if p.empresa_id else "Empresa"
            }
            for p in prolabores
        ],
        "calculo_id": calculo.id if calculo else None,
        "data_calculo": calculo.data_finalizacao.isoformat() if calculo and calculo.data_finalizacao else None,
        "usuario_calculo": db.query(User.nome_completo).filter(User.id == calculo.usuario_finalizacao_id).scalar() if calculo and calculo.usuario_finalizacao_id else None
    }
    
    return {
        "medico_id": medico_id,
        "nome_medico": medico.nome,
        "competencia": competencia,
        "total_prolabores": len(prolabores),
        "valor_bruto_total": valor_bruto_total,
        "valor_inss": valor_inss,
        "valor_irrf": valor_irrf,
        "valor_outros_descontos": valor_outros_descontos,
        "valor_liquido_total": valor_liquido_total,
        "detalhes": detalhes
    }

@router.get("/dashboard/medico/{medico_id}")
async def get_dashboard_medico(
    medico_id: str,
    ano: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para visualizar dashboard")
    
    # Verificar se médico existe
    medico = db.query(Medico).filter(Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Definir ano atual se não fornecido
    if not ano:
        ano = datetime.now().year
    
    # Buscar dados para o dashboard
    
    # 1. Total de plantões por mês
    plantoes_por_mes = []
    for mes in range(1, 13):
        competencia = f"{ano}-{mes:02d}"
        total = db.query(func.count(Plantao.id)).filter(
            Plantao.medico_id == medico_id,
            Plantao.competencia == competencia,
            Plantao.confirmado == True,
            Plantao.ativo == True
        ).scalar() or 0
        
        plantoes_por_mes.append({
            "mes": mes,
            "nome_mes": calendar.month_name[mes],
            "total": total
        })
    
    # 2. Valor bruto por mês
    valor_bruto_por_mes = []
    for mes in range(1, 13):
        competencia = f"{ano}-{mes:02d}"
        
        # Plantões
        valor_plantoes = db.query(func.sum(Plantao.valor_total)).filter(
            Plantao.medico_id == medico_id,
            Plantao.competencia == competencia,
            Plantao.confirmado == True,
            Plantao.ativo == True
        ).scalar() or 0
        
        # Procedimentos
        valor_procedimentos = db.query(func.sum(ProcedimentoParticular.valor_liquido_repasse)).filter(
            ProcedimentoParticular.medico_id == medico_id,
            ProcedimentoParticular.competencia == competencia,
            ProcedimentoParticular.confirmado == True,
            ProcedimentoParticular.ativo == True
        ).scalar() or 0
        
        # Produção administrativa
        valor_producao_admin = db.query(func.sum(ProducaoAdministrativa.valor_total)).filter(
            ProducaoAdministrativa.medico_id == medico_id,
            ProducaoAdministrativa.competencia == competencia,
            ProducaoAdministrativa.confirmado == True,
            ProducaoAdministrativa.ativo == True
        ).scalar() or 0
        
        # Pró-labore
        valor_prolabore = db.query(func.sum(ProLabore.valor_bruto)).filter(
            ProLabore.medico_id == medico_id,
            ProLabore.competencia == competencia,
            ProLabore.confirmado == True,
            ProLabore.ativo == True
        ).scalar() or 0
        
        valor_bruto_por_mes.append({
            "mes": mes,
            "nome_mes": calendar.month_name[mes],
            "valor_plantoes": valor_plantoes,
            "valor_procedimentos": valor_procedimentos,
            "valor_producao_admin": valor_producao_admin,
            "valor_prolabore": valor_prolabore,
            "valor_total": valor_plantoes + valor_procedimentos + valor_producao_admin + valor_prolabore
        })
    
    # 3. Distribuição por hospital
    distribuicao_hospitais = []
    hospitais = db.query(
        Hospital.id,
        Hospital.nome,
        func.count(Plantao.id).label("total_plantoes"),
        func.sum(Plantao.valor_total).label("valor_total")
    ).join(Plantao, Plantao.hospital_id == Hospital.id).filter(
        Plantao.medico_id == medico_id,
        Plantao.competencia.like(f"{ano}-%"),
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).group_by(Hospital.id, Hospital.nome).all()
    
    for hospital in hospitais:
        distribuicao_hospitais.append({
            "hospital_id": hospital.id,
            "nome_hospital": hospital.nome,
            "total_plantoes": hospital.total_plantoes,
            "valor_total": hospital.valor_total or 0
        })
    
    # 4. Distribuição por empresa
    distribuicao_empresas = []
    empresas = db.query(
        Empresa.id,
        Empresa.nome_fantasia,
        func.count(Plantao.id).label("total_plantoes"),
        func.sum(Plantao.valor_total).label("valor_plantoes")
    ).join(Plantao, Plantao.empresa_id == Empresa.id).filter(
        Plantao.medico_id == medico_id,
        Plantao.competencia.like(f"{ano}-%"),
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).group_by(Empresa.id, Empresa.nome_fantasia).all()
    
    for empresa in empresas:
        # Procedimentos da empresa
        valor_procedimentos = db.query(func.sum(ProcedimentoParticular.valor_liquido_repasse)).filter(
            ProcedimentoParticular.medico_id == medico_id,
            ProcedimentoParticular.empresa_id == empresa.id,
            ProcedimentoParticular.competencia.like(f"{ano}-%"),
            ProcedimentoParticular.confirmado == True,
            ProcedimentoParticular.ativo == True
        ).scalar() or 0
        
        # Pró-labore da empresa
        valor_prolabore = db.query(func.sum(ProLabore.valor_bruto)).filter(
            ProLabore.medico_id == medico_id,
            ProLabore.empresa_id == empresa.id,
            ProLabore.competencia.like(f"{ano}-%"),
            ProLabore.confirmado == True,
            ProLabore.ativo == True
        ).scalar() or 0
        
        distribuicao_empresas.append({
            "empresa_id": empresa.id,
            "nome_empresa": empresa.nome_fantasia,
            "total_plantoes": empresa.total_plantoes,
            "valor_plantoes": empresa.valor_plantoes or 0,
            "valor_procedimentos": valor_procedimentos,
            "valor_prolabore": valor_prolabore,
            "valor_total": (empresa.valor_plantoes or 0) + valor_procedimentos + valor_prolabore
        })
    
    # 5. Resumo anual
    total_plantoes = sum(item["total"] for item in plantoes_por_mes)
    total_valor_bruto = sum(item["valor_total"] for item in valor_bruto_por_mes)
    
    # Calcular média mensal (considerando apenas meses com valores)
    meses_com_valores = sum(1 for item in valor_bruto_por_mes if item["valor_total"] > 0)
    media_mensal = total_valor_bruto / meses_com_valores if meses_com_valores > 0 else 0
    
    resumo_anual = {
        "ano": ano,
        "total_plantoes": total_plantoes,
        "total_valor_bruto": total_valor_bruto,
        "media_mensal": media_mensal,
        "total_hospitais": len(distribuicao_hospitais),
        "total_empresas": len(distribuicao_empresas)
    }
    
    return {
        "medico_id": medico_id,
        "nome_medico": medico.nome,
        "ano": ano,
        "plantoes_por_mes": plantoes_por_mes,
        "valor_bruto_por_mes": valor_bruto_por_mes,
        "distribuicao_hospitais": distribuicao_hospitais,
        "distribuicao_empresas": distribuicao_empresas,
        "resumo_anual": resumo_anual
    }

@router.get("/dashboard/empresa/{empresa_id}")
async def get_dashboard_empresa(
    empresa_id: str,
    ano: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar dashboard")
    
    # Verificar se empresa existe
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # Definir ano atual se não fornecido
    if not ano:
        ano = datetime.now().year
    
    # Buscar dados para o dashboard
    
    # 1. Total de plantões por mês
    plantoes_por_mes = []
    for mes in range(1, 13):
        competencia = f"{ano}-{mes:02d}"
        total = db.query(func.count(Plantao.id)).filter(
            Plantao.empresa_id == empresa_id,
            Plantao.competencia == competencia,
            Plantao.confirmado == True,
            Plantao.ativo == True
        ).scalar() or 0
        
        plantoes_por_mes.append({
            "mes": mes,
            "nome_mes": calendar.month_name[mes],
            "total": total
        })
    
    # 2. Valor bruto por mês
    valor_bruto_por_mes = []
    for mes in range(1, 13):
        competencia = f"{ano}-{mes:02d}"
        
        # Plantões
        valor_plantoes = db.query(func.sum(Plantao.valor_total)).filter(
            Plantao.empresa_id == empresa_id,
            Plantao.competencia == competencia,
            Plantao.confirmado == True,
            Plantao.ativo == True
        ).scalar() or 0
        
        # Procedimentos
        valor_procedimentos = db.query(func.sum(ProcedimentoParticular.valor_liquido_repasse)).filter(
            ProcedimentoParticular.empresa_id == empresa_id,
            ProcedimentoParticular.competencia == competencia,
            ProcedimentoParticular.confirmado == True,
            ProcedimentoParticular.ativo == True
        ).scalar() or 0
        
        # Pró-labore
        valor_prolabore = db.query(func.sum(ProLabore.valor_bruto)).filter(
            ProLabore.empresa_id == empresa_id,
            ProLabore.competencia == competencia,
            ProLabore.confirmado == True,
            ProLabore.ativo == True
        ).scalar() or 0
        
        valor_bruto_por_mes.append({
            "mes": mes,
            "nome_mes": calendar.month_name[mes],
            "valor_plantoes": valor_plantoes,
            "valor_procedimentos": valor_procedimentos,
            "valor_prolabore": valor_prolabore,
            "valor_total": valor_plantoes + valor_procedimentos + valor_prolabore
        })
    
    # 3. Distribuição por médico
    distribuicao_medicos = []
    medicos = db.query(
        Medico.id,
        Medico.nome,
        func.count(Plantao.id).label("total_plantoes"),
        func.sum(Plantao.valor_total).label("valor_plantoes")
    ).join(Plantao, Plantao.medico_id == Medico.id).filter(
        Plantao.empresa_id == empresa_id,
        Plantao.competencia.like(f"{ano}-%"),
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).group_by(Medico.id, Medico.nome).all()
    
    for medico in medicos:
        # Procedimentos do médico
        valor_procedimentos = db.query(func.sum(ProcedimentoParticular.valor_liquido_repasse)).filter(
            ProcedimentoParticular.medico_id == medico.id,
            ProcedimentoParticular.empresa_id == empresa_id,
            ProcedimentoParticular.competencia.like(f"{ano}-%"),
            ProcedimentoParticular.confirmado == True,
            ProcedimentoParticular.ativo == True
        ).scalar() or 0
        
        # Pró-labore do médico
        valor_prolabore = db.query(func.sum(ProLabore.valor_bruto)).filter(
            ProLabore.medico_id == medico.id,
            ProLabore.empresa_id == empresa_id,
            ProLabore.competencia.like(f"{ano}-%"),
            ProLabore.confirmado == True,
            ProLabore.ativo == True
        ).scalar() or 0
        
        distribuicao_medicos.append({
            "medico_id": medico.id,
            "nome_medico": medico.nome,
            "total_plantoes": medico.total_plantoes,
            "valor_plantoes": medico.valor_plantoes or 0,
            "valor_procedimentos": valor_procedimentos,
            "valor_prolabore": valor_prolabore,
            "valor_total": (medico.valor_plantoes or 0) + valor_procedimentos + valor_prolabore
        })
    
    # 4. Distribuição por hospital
    distribuicao_hospitais = []
    hospitais = db.query(
        Hospital.id,
        Hospital.nome,
        func.count(Plantao.id).label("total_plantoes"),
        func.sum(Plantao.valor_total).label("valor_total")
    ).join(Plantao, Plantao.hospital_id == Hospital.id).filter(
        Plantao.empresa_id == empresa_id,
        Plantao.competencia.like(f"{ano}-%"),
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).group_by(Hospital.id, Hospital.nome).all()
    
    for hospital in hospitais:
        distribuicao_hospitais.append({
            "hospital_id": hospital.id,
            "nome_hospital": hospital.nome,
            "total_plantoes": hospital.total_plantoes,
            "valor_total": hospital.valor_total or 0
        })
    
    # 5. Resumo anual
    total_plantoes = sum(item["total"] for item in plantoes_por_mes)
    total_valor_bruto = sum(item["valor_total"] for item in valor_bruto_por_mes)
    
    # Calcular média mensal (considerando apenas meses com valores)
    meses_com_valores = sum(1 for item in valor_bruto_por_mes if item["valor_total"] > 0)
    media_mensal = total_valor_bruto / meses_com_valores if meses_com_valores > 0 else 0
    
    resumo_anual = {
        "ano": ano,
        "total_plantoes": total_plantoes,
        "total_valor_bruto": total_valor_bruto,
        "media_mensal": media_mensal,
        "total_medicos": len(distribuicao_medicos),
        "total_hospitais": len(distribuicao_hospitais)
    }
    
    return {
        "empresa_id": empresa_id,
        "nome_empresa": empresa.nome_fantasia,
        "ano": ano,
        "plantoes_por_mes": plantoes_por_mes,
        "valor_bruto_por_mes": valor_bruto_por_mes,
        "distribuicao_medicos": distribuicao_medicos,
        "distribuicao_hospitais": distribuicao_hospitais,
        "resumo_anual": resumo_anual
    }

