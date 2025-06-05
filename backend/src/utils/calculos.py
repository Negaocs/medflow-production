from typing import Dict, List, Any, Optional
from decimal import Decimal, ROUND_DOWN
import math

def calcular_inss(valor_bruto: float, tabela_inss: List[Dict[str, Any]]) -> float:
    """
    Calcula o valor do INSS com base na tabela de alíquotas.
    
    Args:
        valor_bruto: Valor bruto para cálculo
        tabela_inss: Lista de faixas da tabela INSS
            [
                {"faixa": 1, "valor_inicial": 0, "valor_final": 1320.00, "aliquota": 7.5, "parcela_deduzir": 0},
                {"faixa": 2, "valor_inicial": 1320.01, "valor_final": 2571.29, "aliquota": 9, "parcela_deduzir": 19.80},
                ...
            ]
    
    Returns:
        float: Valor do INSS calculado
    """
    # Ordenar tabela por faixa
    tabela_ordenada = sorted(tabela_inss, key=lambda x: x["faixa"])
    
    # Encontrar a faixa correspondente
    faixa_aplicavel = None
    for faixa in tabela_ordenada:
        if valor_bruto >= faixa["valor_inicial"] and valor_bruto <= faixa["valor_final"]:
            faixa_aplicavel = faixa
            break
    
    # Se não encontrou faixa, usar a última (teto)
    if not faixa_aplicavel and tabela_ordenada:
        faixa_aplicavel = tabela_ordenada[-1]
    
    # Calcular INSS
    if faixa_aplicavel:
        valor_inss = (valor_bruto * faixa_aplicavel["aliquota"] / 100) - faixa_aplicavel["parcela_deduzir"]
        # Arredondar para 2 casas decimais
        valor_inss = round(valor_inss, 2)
        return valor_inss
    
    return 0.0

def calcular_irrf(valor_base: float, tabela_irrf: List[Dict[str, Any]], dependentes: int = 0) -> float:
    """
    Calcula o valor do IRRF com base na tabela de alíquotas.
    
    Args:
        valor_base: Valor base para cálculo (já com INSS deduzido)
        tabela_irrf: Lista de faixas da tabela IRRF
            [
                {"faixa": 1, "valor_inicial": 0, "valor_final": 2112.00, "aliquota": 0, "parcela_deduzir": 0},
                {"faixa": 2, "valor_inicial": 2112.01, "valor_final": 2826.65, "aliquota": 7.5, "parcela_deduzir": 158.40},
                ...
            ]
        dependentes: Número de dependentes para dedução
    
    Returns:
        float: Valor do IRRF calculado
    """
    # Valor de dedução por dependente (2023)
    valor_deducao_dependente = 189.59
    
    # Deduzir valor dos dependentes
    valor_base_com_deducoes = valor_base - (dependentes * valor_deducao_dependente)
    
    # Ordenar tabela por faixa
    tabela_ordenada = sorted(tabela_irrf, key=lambda x: x["faixa"])
    
    # Encontrar a faixa correspondente
    faixa_aplicavel = None
    for faixa in tabela_ordenada:
        if valor_base_com_deducoes >= faixa["valor_inicial"] and valor_base_com_deducoes <= faixa["valor_final"]:
            faixa_aplicavel = faixa
            break
    
    # Se não encontrou faixa, usar a última (teto)
    if not faixa_aplicavel and tabela_ordenada:
        faixa_aplicavel = tabela_ordenada[-1]
    
    # Calcular IRRF
    if faixa_aplicavel:
        valor_irrf = (valor_base_com_deducoes * faixa_aplicavel["aliquota"] / 100) - faixa_aplicavel["parcela_deduzir"]
        # Arredondar para 2 casas decimais
        valor_irrf = round(valor_irrf, 2)
        return max(0, valor_irrf)  # Garantir que não seja negativo
    
    return 0.0

def calcular_producao_medica(
    plantoes: List[Dict[str, Any]],
    procedimentos: List[Dict[str, Any]],
    producao_administrativa: List[Dict[str, Any]],
    descontos_creditos: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calcula a produção médica total.
    
    Args:
        plantoes: Lista de plantões
        procedimentos: Lista de procedimentos particulares
        producao_administrativa: Lista de produções administrativas
        descontos_creditos: Lista de descontos e créditos
    
    Returns:
        Dict: Resultado do cálculo de produção
    """
    # Calcular valores brutos
    valor_bruto_plantoes = sum(p["valor_total"] for p in plantoes)
    valor_bruto_procedimentos = sum(p["valor_liquido_repasse"] for p in procedimentos)
    valor_bruto_producao_administrativa = sum(p["valor_total"] for p in producao_administrativa)
    
    # Calcular descontos e créditos
    valor_descontos = sum(dc["valor"] for dc in descontos_creditos if dc["tipo"] == "desconto")
    valor_creditos = sum(dc["valor"] for dc in descontos_creditos if dc["tipo"] == "credito")
    
    # Calcular totais
    valor_bruto_total = valor_bruto_plantoes + valor_bruto_procedimentos + valor_bruto_producao_administrativa + valor_creditos
    valor_liquido_total = valor_bruto_total - valor_descontos
    
    return {
        "valor_bruto_plantoes": round(valor_bruto_plantoes, 2),
        "valor_bruto_procedimentos": round(valor_bruto_procedimentos, 2),
        "valor_bruto_producao_administrativa": round(valor_bruto_producao_administrativa, 2),
        "valor_creditos": round(valor_creditos, 2),
        "valor_bruto_total": round(valor_bruto_total, 2),
        "valor_descontos": round(valor_descontos, 2),
        "valor_liquido_total": round(valor_liquido_total, 2)
    }

def calcular_prolabore(
    prolabores: List[Dict[str, Any]],
    tabela_inss: List[Dict[str, Any]],
    tabela_irrf: List[Dict[str, Any]],
    dependentes: int = 0,
    outros_descontos: float = 0
) -> Dict[str, Any]:
    """
    Calcula o pró-labore com descontos fiscais.
    
    Args:
        prolabores: Lista de pró-labores
        tabela_inss: Tabela de alíquotas do INSS
        tabela_irrf: Tabela de alíquotas do IRRF
        dependentes: Número de dependentes para IRRF
        outros_descontos: Outros descontos a serem aplicados
    
    Returns:
        Dict: Resultado do cálculo de pró-labore
    """
    # Calcular valor bruto total
    valor_bruto_total = sum(p["valor_bruto"] for p in prolabores)
    
    # Calcular INSS
    valor_inss = calcular_inss(valor_bruto_total, tabela_inss)
    
    # Calcular base para IRRF (valor bruto - INSS)
    base_irrf = valor_bruto_total - valor_inss
    
    # Calcular IRRF
    valor_irrf = calcular_irrf(base_irrf, tabela_irrf, dependentes)
    
    # Calcular valor líquido
    valor_liquido_total = valor_bruto_total - valor_inss - valor_irrf - outros_descontos
    
    return {
        "valor_bruto_total": round(valor_bruto_total, 2),
        "valor_inss": round(valor_inss, 2),
        "valor_irrf": round(valor_irrf, 2),
        "valor_outros_descontos": round(outros_descontos, 2),
        "valor_liquido_total": round(valor_liquido_total, 2)
    }

