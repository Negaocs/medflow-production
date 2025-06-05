from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel
import uuid
import json

# Importar modelos e schemas
from models import get_db
from models.user import User
from models.medico import Medico
from models.plantao import Plantao
from models.procedimento_particular import ProcedimentoParticular
from models.outros_modelos import ProducaoAdministrativa, DescontoCredito, ProLabore
from models.calculos_historico import ResultadoCalculoProducao, ItemCalculadoProducao
from models.calculos_historico import ResultadoCalculoProLabore, ItemCalculadoProLabore
from models.fiscais_usuarios import TabelaINSS, TabelaIRRF, VinculoFiscalMedico, ParametrosFiscaisEmpresa
from routes.auth import get_current_active_user

# Criar router
router = APIRouter()

# Modelos Pydantic
class ItemCalculo(BaseModel):
    tipo_item: str
    item_id: str
    descricao: str
    data: date
    valor_bruto: float
    valor_liquido: float
    detalhes: Optional[Dict[str, Any]] = None

class CalculoProducaoRequest(BaseModel):
    medico_id: str
    competencia: str  # Formato: YYYY-MM
    observacoes: Optional[str] = None

class CalculoProducaoResponse(BaseModel):
    id: str
    medico_id: str
    competencia: str
    data_calculo: datetime
    usuario_calculo_id: str
    valor_bruto_total: float
    valor_descontos_total: float
    valor_liquido_total: float
    observacoes: Optional[str] = None
    status: str
    data_finalizacao: Optional[datetime] = None
    usuario_finalizacao_id: Optional[str] = None
    itens_calculados: List[ItemCalculo] = []

class CalculoProLaboreRequest(BaseModel):
    medico_id: str
    competencia: str  # Formato: YYYY-MM
    observacoes: Optional[str] = None

class CalculoProLaboreResponse(BaseModel):
    id: str
    medico_id: str
    competencia: str
    data_calculo: datetime
    usuario_calculo_id: str
    valor_bruto_total: float
    valor_inss: float
    valor_irrf: float
    valor_outros_descontos: float
    valor_liquido_total: float
    observacoes: Optional[str] = None
    status: str
    data_finalizacao: Optional[datetime] = None
    usuario_finalizacao_id: Optional[str] = None
    itens_calculados: List[ItemCalculo] = []

# Funções auxiliares
def check_permission(user: User, action: str, db: Session):
    """Verifica se o usuário tem permissão para realizar a ação."""
    if user.perfil == "admin":
        return True
    
    # Implementar verificação de permissões baseada nos grupos do usuário
    # Por enquanto, apenas admin e operadores podem realizar cálculos
    return user.perfil == "operador"

def calcular_inss(valor_bruto: float, ano: int, db: Session):
    """Calcula o valor de INSS com base na tabela do ano vigente."""
    tabelas_inss = db.query(TabelaINSS).filter(
        TabelaINSS.ano_vigencia == ano,
        TabelaINSS.ativo == True
    ).order_by(TabelaINSS.faixa).all()
    
    if not tabelas_inss:
        # Se não encontrar tabela para o ano, usar a mais recente
        ano_mais_recente = db.query(TabelaINSS.ano_vigencia).order_by(
            TabelaINSS.ano_vigencia.desc()
        ).first()
        
        if ano_mais_recente:
            tabelas_inss = db.query(TabelaINSS).filter(
                TabelaINSS.ano_vigencia == ano_mais_recente[0],
                TabelaINSS.ativo == True
            ).order_by(TabelaINSS.faixa).all()
    
    if not tabelas_inss:
        raise HTTPException(status_code=404, detail="Tabela INSS não encontrada")
    
    valor_inss = 0
    for faixa in tabelas_inss:
        if valor_bruto <= faixa.valor_inicial:
            continue
        
        if faixa.valor_final is None or valor_bruto > faixa.valor_final:
            # Teto da faixa
            valor_base_faixa = faixa.valor_final - faixa.valor_inicial if faixa.valor_final else valor_bruto - faixa.valor_inicial
        else:
            valor_base_faixa = valor_bruto - faixa.valor_inicial
        
        valor_inss += valor_base_faixa * (faixa.aliquota / 100)
    
    return valor_inss

def calcular_irrf(valor_base: float, dependentes: int, ano: int, db: Session):
    """Calcula o valor de IRRF com base na tabela do ano vigente."""
    # Buscar valor de dedução por dependente
    parametros = db.query(ParametrosFiscaisEmpresa).filter(
        ParametrosFiscaisEmpresa.ano_vigencia == ano,
        ParametrosFiscaisEmpresa.ativo == True
    ).first()
    
    valor_deducao_dependente = 0
    if parametros and parametros.valor_deducao_dependente:
        valor_deducao_dependente = parametros.valor_deducao_dependente
    
    # Deduzir dependentes
    valor_base_irrf = valor_base - (dependentes * valor_deducao_dependente)
    if valor_base_irrf <= 0:
        return 0
    
    # Buscar tabela IRRF
    tabelas_irrf = db.query(TabelaIRRF).filter(
        TabelaIRRF.ano_vigencia == ano,
        TabelaIRRF.ativo == True
    ).order_by(TabelaIRRF.faixa).all()
    
    if not tabelas_irrf:
        # Se não encontrar tabela para o ano, usar a mais recente
        ano_mais_recente = db.query(TabelaIRRF.ano_vigencia).order_by(
            TabelaIRRF.ano_vigencia.desc()
        ).first()
        
        if ano_mais_recente:
            tabelas_irrf = db.query(TabelaIRRF).filter(
                TabelaIRRF.ano_vigencia == ano_mais_recente[0],
                TabelaIRRF.ativo == True
            ).order_by(TabelaIRRF.faixa).all()
    
    if not tabelas_irrf:
        raise HTTPException(status_code=404, detail="Tabela IRRF não encontrada")
    
    # Encontrar faixa correspondente
    faixa_aplicavel = None
    for faixa in tabelas_irrf:
        if faixa.valor_inicial <= valor_base_irrf and (faixa.valor_final is None or valor_base_irrf <= faixa.valor_final):
            faixa_aplicavel = faixa
            break
    
    if not faixa_aplicavel:
        return 0
    
    # Calcular IRRF
    valor_irrf = (valor_base_irrf * faixa_aplicavel.aliquota / 100) - faixa_aplicavel.valor_deducao
    return max(0, valor_irrf)

# Rotas
@router.post("/producao", response_model=CalculoProducaoResponse)
async def calcular_producao(
    request: CalculoProducaoRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != request.medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para calcular produção")
    
    # Verificar se médico existe
    medico = db.query(Medico).filter(Medico.id == request.medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Extrair ano e mês da competência
    try:
        ano, mes = map(int, request.competencia.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de competência inválido. Use YYYY-MM")
    
    # Buscar plantões da competência
    plantoes = db.query(Plantao).filter(
        Plantao.medico_id == request.medico_id,
        Plantao.competencia == request.competencia,
        Plantao.confirmado == True,
        Plantao.ativo == True
    ).all()
    
    # Buscar procedimentos particulares da competência
    procedimentos = db.query(ProcedimentoParticular).filter(
        ProcedimentoParticular.medico_id == request.medico_id,
        ProcedimentoParticular.competencia == request.competencia,
        ProcedimentoParticular.confirmado == True,
        ProcedimentoParticular.ativo == True
    ).all()
    
    # Buscar produção administrativa da competência
    producao_admin = db.query(ProducaoAdministrativa).filter(
        ProducaoAdministrativa.medico_id == request.medico_id,
        ProducaoAdministrativa.competencia == request.competencia,
        ProducaoAdministrativa.confirmado == True,
        ProducaoAdministrativa.ativo == True
    ).all()
    
    # Buscar descontos e créditos da competência
    descontos_creditos = db.query(DescontoCredito).filter(
        DescontoCredito.medico_id == request.medico_id,
        DescontoCredito.competencia == request.competencia,
        DescontoCredito.ativo == True
    ).all()
    
    # Calcular valores
    valor_bruto_total = 0
    valor_descontos_total = 0
    itens_calculados = []
    
    # Processar plantões
    for plantao in plantoes:
        valor_bruto_total += plantao.valor_total
        itens_calculados.append({
            "tipo_item": "plantao",
            "item_id": plantao.id,
            "descricao": f"Plantão em {plantao.hospital.nome if plantao.hospital else 'Hospital'} - {plantao.data.strftime('%d/%m/%Y')}",
            "data": plantao.data,
            "valor_bruto": plantao.valor_total,
            "valor_liquido": plantao.valor_total,
            "detalhes": {
                "hospital": plantao.hospital.nome if plantao.hospital else "Hospital",
                "tipo_plantao": plantao.tipo_plantao.nome if plantao.tipo_plantao else "Tipo de Plantão",
                "hora_inicio": plantao.hora_inicio.strftime("%H:%M") if plantao.hora_inicio else "",
                "hora_fim": plantao.hora_fim.strftime("%H:%M") if plantao.hora_fim else ""
            }
        })
    
    # Processar procedimentos particulares
    for proc in procedimentos:
        valor_bruto_total += proc.valor_liquido_repasse
        itens_calculados.append({
            "tipo_item": "procedimento",
            "item_id": proc.id,
            "descricao": f"Procedimento: {proc.tipo_procedimento} - {proc.nome_paciente}",
            "data": proc.data_procedimento,
            "valor_bruto": proc.valor_liquido_repasse,
            "valor_liquido": proc.valor_liquido_repasse,
            "detalhes": {
                "paciente": proc.nome_paciente,
                "tipo_procedimento": proc.tipo_procedimento,
                "valor_bruto_original": proc.valor_bruto,
                "percentual_repasse": proc.percentual_repasse
            }
        })
    
    # Processar produção administrativa
    for prod in producao_admin:
        valor_bruto_total += prod.valor_total
        itens_calculados.append({
            "tipo_item": "producao_administrativa",
            "item_id": prod.id,
            "descricao": prod.descricao,
            "data": prod.data_inicio,
            "valor_bruto": prod.valor_total,
            "valor_liquido": prod.valor_total,
            "detalhes": {
                "data_inicio": prod.data_inicio.isoformat() if prod.data_inicio else None,
                "data_fim": prod.data_fim.isoformat() if prod.data_fim else None
            }
        })
    
    # Processar descontos e créditos
    for dc in descontos_creditos:
        if dc.tipo == "desconto":
            valor_descontos_total += dc.valor
            itens_calculados.append({
                "tipo_item": "desconto",
                "item_id": dc.id,
                "descricao": f"Desconto: {dc.descricao}",
                "data": dc.data,
                "valor_bruto": -dc.valor,  # Negativo para descontos
                "valor_liquido": -dc.valor,
                "detalhes": None
            })
        else:  # crédito
            valor_bruto_total += dc.valor
            itens_calculados.append({
                "tipo_item": "credito",
                "item_id": dc.id,
                "descricao": f"Crédito: {dc.descricao}",
                "data": dc.data,
                "valor_bruto": dc.valor,
                "valor_liquido": dc.valor,
                "detalhes": None
            })
    
    # Calcular valor líquido total
    valor_liquido_total = valor_bruto_total - valor_descontos_total
    
    # Criar resultado do cálculo
    resultado_calculo = ResultadoCalculoProducao(
        id=str(uuid.uuid4()),
        medico_id=request.medico_id,
        competencia=request.competencia,
        data_calculo=datetime.now(),
        usuario_calculo_id=current_user.id,
        valor_bruto_total=valor_bruto_total,
        valor_descontos_total=valor_descontos_total,
        valor_liquido_total=valor_liquido_total,
        observacoes=request.observacoes,
        status="rascunho"
    )
    
    db.add(resultado_calculo)
    db.commit()
    db.refresh(resultado_calculo)
    
    # Criar itens calculados
    for item in itens_calculados:
        item_calculado = ItemCalculadoProducao(
            id=str(uuid.uuid4()),
            resultado_calculo_id=resultado_calculo.id,
            tipo_item=item["tipo_item"],
            item_id=item["item_id"],
            descricao=item["descricao"],
            data=item["data"],
            valor_bruto=item["valor_bruto"],
            valor_liquido=item["valor_liquido"],
            detalhes=json.dumps(item["detalhes"]) if item["detalhes"] else None
        )
        db.add(item_calculado)
    
    db.commit()
    
    # Preparar resposta
    return {
        "id": resultado_calculo.id,
        "medico_id": resultado_calculo.medico_id,
        "competencia": resultado_calculo.competencia,
        "data_calculo": resultado_calculo.data_calculo,
        "usuario_calculo_id": resultado_calculo.usuario_calculo_id,
        "valor_bruto_total": resultado_calculo.valor_bruto_total,
        "valor_descontos_total": resultado_calculo.valor_descontos_total,
        "valor_liquido_total": resultado_calculo.valor_liquido_total,
        "observacoes": resultado_calculo.observacoes,
        "status": resultado_calculo.status,
        "data_finalizacao": resultado_calculo.data_finalizacao,
        "usuario_finalizacao_id": resultado_calculo.usuario_finalizacao_id,
        "itens_calculados": itens_calculados
    }

@router.post("/prolabore", response_model=CalculoProLaboreResponse)
async def calcular_prolabore(
    request: CalculoProLaboreRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "create", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != request.medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para calcular pró-labore")
    
    # Verificar se médico existe
    medico = db.query(Medico).filter(Medico.id == request.medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico não encontrado")
    
    # Extrair ano e mês da competência
    try:
        ano, mes = map(int, request.competencia.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de competência inválido. Use YYYY-MM")
    
    # Buscar pró-labores da competência
    prolabores = db.query(ProLabore).filter(
        ProLabore.medico_id == request.medico_id,
        ProLabore.competencia == request.competencia,
        ProLabore.confirmado == True,
        ProLabore.ativo == True
    ).all()
    
    # Verificar se há pró-labores para calcular
    if not prolabores:
        raise HTTPException(status_code=404, detail="Nenhum pró-labore encontrado para esta competência")
    
    # Buscar vínculo fiscal do médico
    vinculo_fiscal = db.query(VinculoFiscalMedico).filter(
        VinculoFiscalMedico.medico_id == request.medico_id,
        VinculoFiscalMedico.ativo == True
    ).first()
    
    # Calcular valores
    valor_bruto_total = 0
    valor_inss_total = 0
    valor_irrf_total = 0
    valor_outros_descontos = 0
    itens_calculados = []
    
    # Processar pró-labores
    for prolabore in prolabores:
        valor_bruto = prolabore.valor_bruto
        valor_bruto_total += valor_bruto
        
        # Calcular INSS se aplicável
        valor_inss = 0
        if vinculo_fiscal and vinculo_fiscal.retem_inss:
            if vinculo_fiscal.percentual_inss_personalizado:
                valor_inss = valor_bruto * (vinculo_fiscal.percentual_inss_personalizado / 100)
            else:
                valor_inss = calcular_inss(valor_bruto, ano, db)
        
        valor_inss_total += valor_inss
        
        # Calcular IRRF se aplicável
        valor_irrf = 0
        if vinculo_fiscal and vinculo_fiscal.retem_irrf:
            valor_base_irrf = valor_bruto - valor_inss
            if vinculo_fiscal.percentual_irrf_personalizado:
                valor_irrf = valor_base_irrf * (vinculo_fiscal.percentual_irrf_personalizado / 100)
            else:
                valor_irrf = calcular_irrf(valor_base_irrf, medico.dependentes_irrf, ano, db)
        
        valor_irrf_total += valor_irrf
        
        # Calcular valor líquido
        valor_liquido = valor_bruto - valor_inss - valor_irrf
        
        itens_calculados.append({
            "tipo_item": "prolabore",
            "item_id": prolabore.id,
            "descricao": prolabore.descricao,
            "data": prolabore.data,
            "valor_bruto": valor_bruto,
            "valor_liquido": valor_liquido,
            "detalhes": {
                "valor_inss": valor_inss,
                "valor_irrf": valor_irrf,
                "tipo_vinculo": vinculo_fiscal.tipo_vinculo if vinculo_fiscal else "Não especificado"
            }
        })
    
    # Calcular valor líquido total
    valor_liquido_total = valor_bruto_total - valor_inss_total - valor_irrf_total - valor_outros_descontos
    
    # Criar resultado do cálculo
    resultado_calculo = ResultadoCalculoProLabore(
        id=str(uuid.uuid4()),
        medico_id=request.medico_id,
        competencia=request.competencia,
        data_calculo=datetime.now(),
        usuario_calculo_id=current_user.id,
        valor_bruto_total=valor_bruto_total,
        valor_inss=valor_inss_total,
        valor_irrf=valor_irrf_total,
        valor_outros_descontos=valor_outros_descontos,
        valor_liquido_total=valor_liquido_total,
        observacoes=request.observacoes,
        status="rascunho"
    )
    
    db.add(resultado_calculo)
    db.commit()
    db.refresh(resultado_calculo)
    
    # Criar itens calculados
    for item in itens_calculados:
        item_calculado = ItemCalculadoProLabore(
            id=str(uuid.uuid4()),
            resultado_calculo_id=resultado_calculo.id,
            prolabore_id=item["item_id"],
            descricao=item["descricao"],
            data=item["data"],
            valor_bruto=item["valor_bruto"],
            valor_inss=item["detalhes"]["valor_inss"],
            valor_irrf=item["detalhes"]["valor_irrf"],
            valor_outros_descontos=0,
            valor_liquido=item["valor_liquido"],
            detalhes=json.dumps(item["detalhes"])
        )
        db.add(item_calculado)
    
    db.commit()
    
    # Preparar resposta
    return {
        "id": resultado_calculo.id,
        "medico_id": resultado_calculo.medico_id,
        "competencia": resultado_calculo.competencia,
        "data_calculo": resultado_calculo.data_calculo,
        "usuario_calculo_id": resultado_calculo.usuario_calculo_id,
        "valor_bruto_total": resultado_calculo.valor_bruto_total,
        "valor_inss": resultado_calculo.valor_inss,
        "valor_irrf": resultado_calculo.valor_irrf,
        "valor_outros_descontos": resultado_calculo.valor_outros_descontos,
        "valor_liquido_total": resultado_calculo.valor_liquido_total,
        "observacoes": resultado_calculo.observacoes,
        "status": resultado_calculo.status,
        "data_finalizacao": resultado_calculo.data_finalizacao,
        "usuario_finalizacao_id": resultado_calculo.usuario_finalizacao_id,
        "itens_calculados": itens_calculados
    }

@router.put("/producao/{calculo_id}/finalizar")
async def finalizar_calculo_producao(
    calculo_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "update", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para finalizar cálculo")
    
    # Buscar cálculo
    calculo = db.query(ResultadoCalculoProducao).filter(ResultadoCalculoProducao.id == calculo_id).first()
    if not calculo:
        raise HTTPException(status_code=404, detail="Cálculo não encontrado")
    
    # Verificar se já está finalizado
    if calculo.status == "finalizado":
        raise HTTPException(status_code=400, detail="Cálculo já finalizado")
    
    # Finalizar cálculo
    calculo.status = "finalizado"
    calculo.data_finalizacao = datetime.now()
    calculo.usuario_finalizacao_id = current_user.id
    
    db.commit()
    
    return {"message": "Cálculo finalizado com sucesso"}

@router.put("/prolabore/{calculo_id}/finalizar")
async def finalizar_calculo_prolabore(
    calculo_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "update", db) and current_user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para finalizar cálculo")
    
    # Buscar cálculo
    calculo = db.query(ResultadoCalculoProLabore).filter(ResultadoCalculoProLabore.id == calculo_id).first()
    if not calculo:
        raise HTTPException(status_code=404, detail="Cálculo não encontrado")
    
    # Verificar se já está finalizado
    if calculo.status == "finalizado":
        raise HTTPException(status_code=400, detail="Cálculo já finalizado")
    
    # Finalizar cálculo
    calculo.status = "finalizado"
    calculo.data_finalizacao = datetime.now()
    calculo.usuario_finalizacao_id = current_user.id
    
    db.commit()
    
    return {"message": "Cálculo finalizado com sucesso"}

@router.get("/producao/medico/{medico_id}/competencia/{competencia}")
async def get_calculos_producao_medico(
    medico_id: str,
    competencia: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para visualizar cálculos")
    
    # Buscar cálculos
    calculos = db.query(ResultadoCalculoProducao).filter(
        ResultadoCalculoProducao.medico_id == medico_id,
        ResultadoCalculoProducao.competencia == competencia
    ).order_by(ResultadoCalculoProducao.data_calculo.desc()).all()
    
    result = []
    for calculo in calculos:
        # Buscar itens calculados
        itens = db.query(ItemCalculadoProducao).filter(
            ItemCalculadoProducao.resultado_calculo_id == calculo.id
        ).all()
        
        itens_formatados = []
        for item in itens:
            detalhes = json.loads(item.detalhes) if item.detalhes else None
            itens_formatados.append({
                "tipo_item": item.tipo_item,
                "item_id": item.item_id,
                "descricao": item.descricao,
                "data": item.data,
                "valor_bruto": item.valor_bruto,
                "valor_liquido": item.valor_liquido,
                "detalhes": detalhes
            })
        
        result.append({
            "id": calculo.id,
            "medico_id": calculo.medico_id,
            "competencia": calculo.competencia,
            "data_calculo": calculo.data_calculo,
            "usuario_calculo_id": calculo.usuario_calculo_id,
            "valor_bruto_total": calculo.valor_bruto_total,
            "valor_descontos_total": calculo.valor_descontos_total,
            "valor_liquido_total": calculo.valor_liquido_total,
            "observacoes": calculo.observacoes,
            "status": calculo.status,
            "data_finalizacao": calculo.data_finalizacao,
            "usuario_finalizacao_id": calculo.usuario_finalizacao_id,
            "itens_calculados": itens_formatados
        })
    
    return result

@router.get("/prolabore/medico/{medico_id}/competencia/{competencia}")
async def get_calculos_prolabore_medico(
    medico_id: str,
    competencia: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar permissão
    if not check_permission(current_user, "view", db) and current_user.perfil != "admin":
        if current_user.perfil != "medico" or current_user.medico_id_associado != medico_id:
            raise HTTPException(status_code=403, detail="Sem permissão para visualizar cálculos")
    
    # Buscar cálculos
    calculos = db.query(ResultadoCalculoProLabore).filter(
        ResultadoCalculoProLabore.medico_id == medico_id,
        ResultadoCalculoProLabore.competencia == competencia
    ).order_by(ResultadoCalculoProLabore.data_calculo.desc()).all()
    
    result = []
    for calculo in calculos:
        # Buscar itens calculados
        itens = db.query(ItemCalculadoProLabore).filter(
            ItemCalculadoProLabore.resultado_calculo_id == calculo.id
        ).all()
        
        itens_formatados = []
        for item in itens:
            detalhes = json.loads(item.detalhes) if item.detalhes else None
            itens_formatados.append({
                "tipo_item": "prolabore",
                "item_id": item.prolabore_id,
                "descricao": item.descricao,
                "data": item.data,
                "valor_bruto": item.valor_bruto,
                "valor_liquido": item.valor_liquido,
                "detalhes": detalhes
            })
        
        result.append({
            "id": calculo.id,
            "medico_id": calculo.medico_id,
            "competencia": calculo.competencia,
            "data_calculo": calculo.data_calculo,
            "usuario_calculo_id": calculo.usuario_calculo_id,
            "valor_bruto_total": calculo.valor_bruto_total,
            "valor_inss": calculo.valor_inss,
            "valor_irrf": calculo.valor_irrf,
            "valor_outros_descontos": calculo.valor_outros_descontos,
            "valor_liquido_total": calculo.valor_liquido_total,
            "observacoes": calculo.observacoes,
            "status": calculo.status,
            "data_finalizacao": calculo.data_finalizacao,
            "usuario_finalizacao_id": calculo.usuario_finalizacao_id,
            "itens_calculados": itens_formatados
        })
    
    return result

