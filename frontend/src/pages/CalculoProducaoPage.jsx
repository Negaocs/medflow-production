
import React, { useState, useEffect, useCallback } from "react";
import {
  Plantao,
  ProcedimentoParticular,
  ProducaoAdministrativa, // New import
  DescontoCredito, // New import
  Medico,
  Empresa,
  Hospital as HospitalEntity,
  TabelaINSS,
  TabelaIRRF,
  ParametrosFiscaisEmpresa,
  ResultadoCalculoProducao,
  ItemCalculadoProducao,
  User,
  Contrato
} from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from "@/components/ui/table";
import {
  Calculator,
  Filter,
  RefreshCw,
  Save,
  ListTree,
  Eye,
  DollarSign,
  Percent,
  ShieldCheck,
  FileText,
  Loader2,
  AlertTriangle,
  Info,
  Printer,
  Calendar, // New icon
  Stethoscope, // New icon
  Briefcase, // New icon
  Receipt, // New icon
  TrendingUp, // New icon
  TrendingDown // New icon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, parseISO, lastDayOfMonth, isValid } from "date-fns";
import { PermissionGuard, PERMISSIONS } from "@/components/auth/PermissionChecker";

// Funções utilitárias de formatação
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return "R$ 0,00";
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatCompetencia = (competencia) => {
    if (!competencia) return "N/A";
    try {
      const [year, month] = competencia.split('-');
      const date = parseISO(`${year}-${month}-01`);
      return format(date, "MMMM/yyyy");
    } catch {
      return competencia;
    }
};

export default function CalculoProducaoPage() {
  // Estados para filtros
  const [competencia, setCompetencia] = useState(format(new Date(), "yyyy-MM"));
  const [empresaId, setEmpresaId] = useState(null); // Usar null para "nenhum filtro"
  const [hospitalId, setHospitalId] = useState(null); // Usar null para "nenhum filtro"
  const [medicoId, setMedicoId] = useState(null); // Usar null para "nenhum filtro"

  // Estados para opções de cálculo
  const [aplicarParametrosFiscais, setAplicarParametrosFiscais] = useState(true);
  const [calcularINSSMedico, setCalcularINSSMedico] = useState(true);
  const [calcularIRRFMedico, setCalcularIRRFMedico] = useState(true);
  const [considerarRecorrentes, setConsiderarRecorrentes] = useState(true); // New state

  // Estados para dados de dropdowns
  const [empresas, setEmpresas] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [medicos, setMedicos] = useState([]);

  // Estados de controle da UI e dados
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [simulacaoResultados, setSimulacaoResultados] = useState(null);
  const [erroSimulacao, setErroSimulacao] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [historicoCalculos, setHistoricoCalculos] = useState([]);

  // Carregar dados para filtros
  useEffect(() => {
    const loadFilterData = async () => {
      setIsLoadingFilters(true);
      try {
        const [empresasData, hospitaisData, medicosData, userData] = await Promise.all([
          Empresa.filter({ ativo: true }, "nome_fantasia"),
          HospitalEntity.filter({ ativo: true }, "nome"),
          Medico.filter({ ativo: true }, "nome"),
          User.me()
        ]);
        setEmpresas(empresasData);
        setHospitais(hospitaisData);
        setMedicos(medicosData);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Erro ao carregar dados para filtros:", error);
        setErroSimulacao("Falha ao carregar dados de apoio. Tente recarregar a página.");
      } finally {
        setIsLoadingFilters(false);
      }
    };
    loadFilterData();
    loadHistoricoCalculos();
  }, []);

  const loadHistoricoCalculos = async (filters = {}) => {
    try {
      const historico = await ResultadoCalculoProducao.filter({ status: "consolidado", ...filters }, "-data_calculo");
      setHistoricoCalculos(historico);
    } catch (error) {
      console.error("Erro ao carregar histórico de cálculos:", error);
    }
  };

  // Função para buscar plantões com base nos filtros
  const buscarPlantoes = async () => {
    const filtros = { competencia: competencia, confirmado: true, resultado_calculo_producao_id: null };

    if (medicoId) filtros.medico_id = medicoId;
    if (empresaId) filtros.empresa_pagamento_id = empresaId;

    let plantoes = await Plantao.filter(filtros);

    // Se hospital foi selecionado, filtrar pelos contratos desse hospital
    if (hospitalId) {
      const contratosDoHospital = await Contrato.filter({ hospital_id: hospitalId, ativo: true });
      const contratoIds = contratosDoHospital.map(c => c.id);
      plantoes = plantoes.filter(p => contratoIds.includes(p.contrato_id));
    }

    return plantoes;
  };

  // Função para buscar procedimentos particulares com base nos filtros
  const buscarProcedimentosParticulares = async () => {
    const filtros = { competencia: competencia, confirmado: true, resultado_calculo_producao_id: null };

    if (medicoId) filtros.medico_id = medicoId;

    let procedimentos = [];
    if (empresaId) {
      // Buscar por empresa prestadora OU pagadora
      const procByEmpresa = await ProcedimentoParticular.filter({ ...filtros, empresa_id: empresaId });
      const procByEmpresaPagamento = await ProcedimentoParticular.filter({ ...filtros, empresa_pagamento_id: empresaId });

      // Combinar e remover duplicatas
      const allProcs = [...procByEmpresa, ...procByEmpresaPagamento];
      const uniqueProcsMap = new Map(allProcs.map(p => [p.id, p]));
      procedimentos = Array.from(uniqueProcsMap.values());
    } else {
      procedimentos = await ProcedimentoParticular.filter(filtros);
    }

    if (hospitalId) {
      procedimentos = procedimentos.filter(p => p.hospital_id === hospitalId);
    }

    return procedimentos;
  };

  // NEW: Função para buscar produção administrativa
  const buscarProducaoAdministrativa = async () => {
    const filtros = { competencia: competencia, confirmado: true, resultado_calculo_producao_id: null };

    if (medicoId) filtros.medico_id = medicoId;
    if (empresaId) filtros.empresa_id = empresaId;

    const producoes = await ProducaoAdministrativa.filter(filtros);
    return producoes;
  };

  // NEW: Função para buscar descontos e créditos
  const buscarDescontosCreditos = async () => {
    let filtros = { competencia: competencia, resultado_calculo_producao_id: null };

    if (medicoId) filtros.medico_id = medicoId;
    if (empresaId) filtros.empresa_id = empresaId;

    let descontosCreditos = await DescontoCredito.filter(filtros);

    // Se considerarRecorrentes estiver ativo, buscar também os recorrentes de competências anteriores
    if (considerarRecorrentes) {
      const [year, month] = competencia.split('-');
      const competenciaAtualNumerica = parseInt(year) * 12 + parseInt(month); // YYYY*12 + MM-1 for 0-indexed month or just MM for 1-indexed month

      // Buscar recorrentes que ainda não foram consolidados e cuja competência é anterior ou igual à atual
      const recorrentes = await DescontoCredito.filter({
        recorrente: true,
        resultado_calculo_producao_id: null,
        ...(medicoId && { medico_id: medicoId }),
        ...(empresaId && { empresa_id: empresaId })
      });

      const recorrentesVigentes = recorrentes.filter(dc => {
        if (!dc.competencia) return false;
        try {
          const [dcYear, dcMonth] = dc.competencia.split('-');
          const dcCompetenciaNumerica = parseInt(dcYear) * 12 + parseInt(dcMonth);
          return dcCompetenciaNumerica <= competenciaAtualNumerica;
        } catch {
          return false;
        }
      });

      descontosCreditos = [...descontosCreditos, ...recorrentesVigentes];

      // Remover duplicatas baseado no ID
      const uniqueMap = new Map(descontosCreditos.map(dc => [dc.id, dc]));
      descontosCreditos = Array.from(uniqueMap.values());
    }

    return descontosCreditos;
  };


  // Função para buscar parâmetros fiscais vigentes
  const buscarParametrosFiscais = async (empresaId, competencia) => {
    try {
      if (!empresaId || !competencia) return null;
      const vigenciaData = parseISO(`${competencia}-01`); // Primeiro dia do mês da competência
      const parametros = await ParametrosFiscaisEmpresa.filter({ empresa_id: empresaId });

      // Filtrar por vigência
      const parametroVigente = parametros.find(p => {
        const inicioVigencia = parseISO(p.vigencia_inicio);
        const fimVigencia = p.vigencia_fim ? parseISO(p.vigencia_fim) : null;

        return vigenciaData >= inicioVigencia && (!fimVigencia || vigenciaData <= fimVigencia);
      });

      return parametroVigente;
    } catch (error) {
      console.error("Erro ao buscar parâmetros fiscais:", error);
      return null;
    }
  };

  // Função para buscar tabelas INSS vigentes
  const buscarTabelaINSS = async (competencia) => {
    try {
      const vigenciaData = parseISO(`${competencia}-01`);
      const tabelas = await TabelaINSS.list();

      const tabelasVigentes = tabelas.filter(t => {
        const inicioVigencia = parseISO(t.vigencia_inicio);
        const fimVigencia = t.vigencia_fim ? parseISO(t.vigencia_fim) : null;

        return vigenciaData >= inicioVigencia && (!fimVigencia || vigenciaData <= fimVigencia);
      });

      return tabelasVigentes.sort((a, b) => a.salario_de - b.salario_de);
    } catch (error) {
      console.error("Erro ao buscar tabela INSS:", error);
      return [];
    }
  };

  // Função para buscar tabelas IRRF vigentes
  const buscarTabelaIRRF = async (competencia) => {
    try {
      const vigenciaData = parseISO(`${competencia}-01`);
      const tabelas = await TabelaIRRF.list();

      const tabelasVigentes = tabelas.filter(t => {
        const inicioVigencia = parseISO(t.vigencia_inicio);
        const fimVigencia = t.vigencia_fim ? parseISO(t.vigencia_fim) : null;

        return vigenciaData >= inicioVigencia && (!fimVigencia || vigenciaData <= fimVigencia);
      });

      return tabelasVigentes.sort((a, b) => a.base_calculo_de - b.base_calculo_de);
    } catch (error) {
      console.error("Erro ao buscar tabela IRRF:", error);
      return [];
    }
  };

  // Função para calcular INSS do médico
  const calcularINSSDoMedico = (valorBase, tabelaINSS) => {
    if (!tabelaINSS || tabelaINSS.length === 0 || valorBase <= 0) return 0;

    let inssCalculado = 0;

    for (const faixa of tabelaINSS) {
        const limiteInferiorFaixa = faixa.salario_de;
        const limiteSuperiorFaixa = faixa.salario_ate || Infinity;
        const aliquota = faixa.aliquota / 100;
        const parcelaDeduzir = faixa.parcela_deduzir || 0; // Para INSS, geralmente não tem parcela a deduzir, mas para compatibilidade.

        if (valorBase > limiteInferiorFaixa) {
            if (valorBase <= limiteSuperiorFaixa || (limiteSuperiorFaixa === Infinity && valorBase >= limiteInferiorFaixa)) {
                inssCalculado = valorBase * aliquota - parcelaDeduzir;
                break; // Found the right bracket, stop.
            }
        }
    }

    // INSS tem um teto, o teto é o valor máximo que pode ser recolhido
    const tetoINSS = tabelaINSS.length > 0 && tabelaINSS[tabelaINSS.length - 1].valor_maximo_inss;

    if (tetoINSS && inssCalculado > tetoINSS) {
      return tetoINSS;
    }

    return Math.max(0, inssCalculado); // Garante que o INSS não seja negativo
  };

  // Função para calcular IRRF do médico
  const calcularIRRFDoMedico = (valorBase, tabelaIRRF, dependentes = 0) => {
    if (!tabelaIRRF || tabelaIRRF.length === 0 || valorBase <= 0) return 0;

    // Valor padrão para dedução por dependente (geralmente atualizado anualmente)
    const deducaoPorDependenteValor = 189.59;

    // A base de cálculo para IRRF já considera deduções legais (INSS, etc.)
    // Então, deduzir dependentes da base antes de aplicar a tabela
    const baseCalculoComDeducoes = valorBase - (dependentes * deducaoPorDependenteValor);

    // Encontrar a faixa correta
    const faixaCorreta = tabelaIRRF.find(f =>
      baseCalculoComDeducoes >= f.base_calculo_de && baseCalculoComDeducoes <= (f.base_calculo_ate || Infinity)
    );

    if (!faixaCorreta) return 0;

    const irrfBruto = baseCalculoComDeducoes * (faixaCorreta.aliquota / 100);
    const irrfLiquido = Math.max(0, irrfBruto - (faixaCorreta.parcela_deduzir || 0));

    return irrfLiquido;
  };

  // Função principal de simulação ATUALIZADA
  const handleSimularCalculo = async () => {
    if (!competencia) {
      setErroSimulacao("Por favor, selecione uma competência.");
      return;
    }

    setIsLoading(true);
    setErroSimulacao("");
    setSimulacaoResultados(null);
    
    try {
      // 1. Buscar todos os tipos de dados
      const [plantoes, procedimentos, producoes, descontosCreditos] = await Promise.all([
        buscarPlantoes(),
        buscarProcedimentosParticulares(),
        buscarProducaoAdministrativa(),
        buscarDescontosCreditos()
      ]);

      const totalItens = plantoes.length + procedimentos.length + producoes.length + descontosCreditos.length;
      
      if (totalItens === 0) {
        setErroSimulacao(`Nenhum lançamento confirmado encontrado para a competência ${formatCompetencia(competencia)} com os filtros aplicados.`);
        setIsLoading(false);
        return;
      }

      // 2. Buscar tabelas fiscais se necessário
      let tabelaINSS = [];
      let tabelaIRRF = [];
      
      if (calcularINSSMedico) {
        tabelaINSS = await buscarTabelaINSS(competencia);
      }
      
      if (calcularIRRFMedico) {
        tabelaIRRF = await buscarTabelaIRRF(competencia);
      }

      // 3. Processar itens e agrupar por médico e empresa
      const resultadosPorMedicoEmpresa = {};
      const todosItensCalculados = [];

      // Processar plantões
      for (const plantao of plantoes) {
        const contrato = await Contrato.get(plantao.contrato_id);
        const empresaPagadoraId = plantao.empresa_pagamento_id || contrato?.empresa_id;

        if (!empresaPagadoraId || !plantao.medico_id) continue;

        const chave = `${plantao.medico_id}_${empresaPagadoraId}`;

        if (!resultadosPorMedicoEmpresa[chave]) {
          resultadosPorMedicoEmpresa[chave] = {
            medico_id: plantao.medico_id,
            empresa_pagadora_id: empresaPagadoraId,
            total_bruto_plantoes: 0,
            total_bruto_procedimentos: 0,
            total_bruto_producoes: 0,
            total_creditos: 0,
            total_descontos: 0,
            total_inss_medico: 0,
            total_irrf_medico: 0,
            total_impostos_empresa: 0,
            total_taxa_administrativa: 0,
            valor_liquido_repasse: 0,
            itens_plantoes: [],
            itens_procedimentos: [],
            itens_producoes: [],
            itens_descontos_creditos: []
          };
        }

        const resultado = resultadosPorMedicoEmpresa[chave];
        const valorBrutoPlantao = plantao.valor_total || 0;

        let valorINSSPlantao = 0;
        let valorIRRFPlantao = 0;

        if (calcularINSSMedico && tabelaINSS.length > 0) {
            valorINSSPlantao = calcularINSSDoMedico(valorBrutoPlantao, tabelaINSS);
        }
        if (calcularIRRFMedico && tabelaIRRF.length > 0) {
            const medico = medicos.find(m => m.id === plantao.medico_id);
            const dependentes = medico?.dependentes_irrf || 0;
            valorIRRFPlantao = calcularIRRFDoMedico(valorBrutoPlantao - valorINSSPlantao, tabelaIRRF, dependentes);
        }

        const valorLiquidoPlantao = valorBrutoPlantao - valorINSSPlantao - valorIRRFPlantao;

        resultado.total_bruto_plantoes += valorBrutoPlantao;
        resultado.total_inss_medico += valorINSSPlantao;
        resultado.total_irrf_medico += valorIRRFPlantao;

        resultado.itens_plantoes.push({
          ...plantao,
          valor_bruto_original: valorBrutoPlantao,
          valor_inss_calculado: valorINSSPlantao,
          valor_irrf_calculado: valorIRRFPlantao,
          valor_liquido_item: valorLiquidoPlantao
        });
      }

      // Processar procedimentos particulares - USANDO VALORES JÁ CALCULADOS
      for (const procedimento of procedimentos) {
        const empresaPagadoraId = procedimento.empresa_pagamento_id || procedimento.empresa_id;
        
        if (!empresaPagadoraId || !procedimento.medico_id) continue;

        const chave = `${procedimento.medico_id}_${empresaPagadoraId}`;
        
        if (!resultadosPorMedicoEmpresa[chave]) {
          resultadosPorMedicoEmpresa[chave] = {
            medico_id: procedimento.medico_id,
            empresa_pagadora_id: empresaPagadoraId,
            total_bruto_plantoes: 0,
            total_bruto_procedimentos: 0,
            total_bruto_producoes: 0,
            total_creditos: 0,
            total_descontos: 0,
            total_inss_medico: 0,
            total_irrf_medico: 0,
            total_impostos_empresa: 0,
            total_taxa_administrativa: 0,
            valor_liquido_repasse: 0,
            itens_plantoes: [],
            itens_procedimentos: [],
            itens_producoes: [],
            itens_descontos_creditos: []
          };
        }
        
        const resultado = resultadosPorMedicoEmpresa[chave];
        
        // USAR VALORES JÁ CALCULADOS E SALVOS NO PROCEDIMENTO
        const valorBrutoProcedimento = procedimento.valor_bruto || 0;
        const valorMatMed = procedimento.valor_mat_med || 0;
        const impostosEmpresa = procedimento.valor_impostos_empresa || 0;
        const taxaAdministrativa = procedimento.valor_taxa_administrativa_empresa || 0;
        const valorLiquidoEstimado = procedimento.valor_liquido_repasse || 0;
        
        // Agora calcular apenas INSS e IRRF do médico sobre o valor líquido estimado
        let valorINSSMedico = 0;
        let valorIRRFMedico = 0;
        
        if (calcularINSSMedico && tabelaINSS.length > 0) {
          valorINSSMedico = calcularINSSDoMedico(valorLiquidoEstimado, tabelaINSS);
        }
        
        if (calcularIRRFMedico && tabelaIRRF.length > 0) {
          const medico = medicos.find(m => m.id === procedimento.medico_id);
          const dependentes = medico?.dependentes_irrf || 0;
          valorIRRFMedico = calcularIRRFDoMedico(valorLiquidoEstimado - valorINSSMedico, tabelaIRRF, dependentes);
        }
        
        const valorLiquidoFinalRepasse = valorLiquidoEstimado - valorINSSMedico - valorIRRFMedico;
        
        // Somar aos totais
        resultado.total_bruto_procedimentos += valorBrutoProcedimento;
        resultado.total_inss_medico += valorINSSMedico;
        resultado.total_irrf_medico += valorIRRFMedico;
        resultado.total_impostos_empresa += impostosEmpresa;
        resultado.total_taxa_administrativa += taxaAdministrativa;
        
        resultado.itens_procedimentos.push({
          ...procedimento,
          valor_bruto_original: valorBrutoProcedimento,
          valor_mat_med_original: valorMatMed,
          valor_impostos_empresa_original: impostosEmpresa,
          valor_taxa_administrativa_original: taxaAdministrativa,
          valor_liquido_estimado_original: valorLiquidoEstimado,
          valor_inss_calculado: valorINSSMedico,
          valor_irrf_calculado: valorIRRFMedico,
          valor_liquido_item: valorLiquidoFinalRepasse
        });
      }

      // Processar produção administrativa
      for (const producao of producoes) {
        const empresaPagadoraId = producao.empresa_pagamento_id || producao.empresa_id;

        if (!empresaPagadoraId || !producao.medico_id) continue;

        const chave = `${producao.medico_id}_${empresaPagadoraId}`;

        if (!resultadosPorMedicoEmpresa[chave]) {
          resultadosPorMedicoEmpresa[chave] = {
            medico_id: producao.medico_id,
            empresa_pagadora_id: empresaPagadoraId,
            total_bruto_plantoes: 0,
            total_bruto_procedimentos: 0,
            total_bruto_producoes: 0,
            total_creditos: 0,
            total_descontos: 0,
            total_inss_medico: 0,
            total_irrf_medico: 0,
            total_impostos_empresa: 0,
            total_taxa_administrativa: 0,
            valor_liquido_repasse: 0,
            itens_plantoes: [],
            itens_procedimentos: [],
            itens_producoes: [],
            itens_descontos_creditos: []
          };
        }

        const resultado = resultadosPorMedicoEmpresa[chave];
        const valorBrutoProducao = producao.valor_total || 0;

        let valorINSS = 0;
        let valorIRRF = 0;

        if (producao.tributavel && calcularINSSMedico && tabelaINSS.length > 0) {
          valorINSS = calcularINSSDoMedico(valorBrutoProducao, tabelaINSS);
        }

        if (producao.tributavel && calcularIRRFMedico && tabelaIRRF.length > 0) {
          const medico = medicos.find(m => m.id === producao.medico_id);
          const dependentes = medico?.dependentes_irrf || 0;
          valorIRRF = calcularIRRFDoMedico(valorBrutoProducao - valorINSS, tabelaIRRF, dependentes);
        }

        const valorLiquidoProducao = valorBrutoProducao - valorINSS - valorIRRF;

        resultado.total_bruto_producoes += valorBrutoProducao;
        resultado.total_inss_medico += valorINSS;
        resultado.total_irrf_medico += valorIRRF;

        resultado.itens_producoes.push({
          ...producao,
          valor_bruto_original: valorBrutoProducao,
          valor_inss_calculado: valorINSS,
          valor_irrf_calculado: valorIRRF,
          valor_liquido_item: valorLiquidoProducao
        });
      }

      // Processar descontos e créditos
      for (const desconto of descontosCreditos) {
        if (!desconto.empresa_id || !desconto.medico_id) continue;

        const chave = `${desconto.medico_id}_${desconto.empresa_id}`;

        if (!resultadosPorMedicoEmpresa[chave]) {
          resultadosPorMedicoEmpresa[chave] = {
            medico_id: desconto.medico_id,
            empresa_pagadora_id: desconto.empresa_id,
            total_bruto_plantoes: 0,
            total_bruto_procedimentos: 0,
            total_bruto_producoes: 0,
            total_creditos: 0,
            total_descontos: 0,
            total_inss_medico: 0,
            total_irrf_medico: 0,
            total_impostos_empresa: 0,
            total_taxa_administrativa: 0,
            valor_liquido_repasse: 0,
            itens_plantoes: [],
            itens_procedimentos: [],
            itens_producoes: [],
            itens_descontos_creditos: []
          };
        }

        const resultado = resultadosPorMedicoEmpresa[chave];
        const valorDesconto = desconto.valor || 0;

        if (desconto.tipo === 'credito') {
          resultado.total_creditos += valorDesconto;
        } else { // tipo === 'desconto'
          resultado.total_descontos += valorDesconto;
        }

        resultado.itens_descontos_creditos.push({
          ...desconto,
          valor_original: valorDesconto
        });
      }

      // 4. Calcular totais finais para cada grupo Medico/Empresa e agregação global
      let totalBrutoPlantoesGlobal = 0;
      let totalBrutoProcedimentosGlobal = 0;
      let totalBrutoProducoesGlobal = 0;
      let totalCreditosGlobal = 0;
      let totalDescontosGlobal = 0;
      let totalDescontosINSSGlobal = 0;
      let totalDescontosIRRFGlobal = 0;
      let totalImpostosEmpresaGlobal = 0;
      let totalTaxaAdministrativaGlobal = 0;
      let totalMatMedGlobal = 0; // NOVO: Para somar o Mat/Med
      let valorLiquidoRepasseGlobal = 0;

      Object.values(resultadosPorMedicoEmpresa).forEach(resultadoGroup => {
        const subtotalServicosProducao =
            resultadoGroup.total_bruto_plantoes +
            resultadoGroup.total_bruto_procedimentos +
            resultadoGroup.total_bruto_producoes;

        resultadoGroup.valor_liquido_repasse =
            subtotalServicosProducao +
            resultadoGroup.total_creditos -
            resultadoGroup.total_descontos -
            resultadoGroup.total_inss_medico -
            resultadoGroup.total_irrf_medico -
            resultadoGroup.total_impostos_empresa -
            resultadoGroup.total_taxa_administrativa;

        totalBrutoPlantoesGlobal += resultadoGroup.total_bruto_plantoes;
        totalBrutoProcedimentosGlobal += resultadoGroup.total_bruto_procedimentos;
        totalBrutoProducoesGlobal += resultadoGroup.total_bruto_producoes;
        totalCreditosGlobal += resultadoGroup.total_creditos;
        totalDescontosGlobal += resultadoGroup.total_descontos;
        totalDescontosINSSGlobal += resultadoGroup.total_inss_medico;
        totalDescontosIRRFGlobal += resultadoGroup.total_irrf_medico;
        totalImpostosEmpresaGlobal += resultadoGroup.total_impostos_empresa;
        totalTaxaAdministrativaGlobal += resultadoGroup.total_taxa_administrativa;
        valorLiquidoRepasseGlobal += resultadoGroup.valor_liquido_repasse;

        // Somar Mat/Med dos procedimentos deste grupo
        resultadoGroup.itens_procedimentos.forEach(proc => {
          totalMatMedGlobal += (proc.valor_mat_med_original || 0);
        });

        // Criar itens detalhados para a UI
        resultadoGroup.itens_plantoes.forEach(item => {
          const medicoNome = medicos.find(m => m.id === item.medico_id)?.nome || 'N/A';
          const contratoInfo = item.contrato_id ? ` (Contrato ${item.contrato_id})` : '';
          todosItensCalculados.push({
            idOriginal: item.id,
            tipo: "Plantão",
            descricao: `${medicoNome} - ${item.quantidade}x plantão${contratoInfo}`,
            valorBruto: item.valor_bruto_original,
            inss: item.valor_inss_calculado,
            irrf: item.valor_irrf_calculado,
            outrosDescontos: 0,
            valorLiquido: item.valor_liquido_item,
            medico_id: item.medico_id,
            empresa_id: resultadoGroup.empresa_pagadora_id,
            detalhes: `Qtd: ${item.quantidade}, Valor Unit: ${formatCurrency(item.valor_unitario || 0)}`
          });
        });

        resultadoGroup.itens_procedimentos.forEach(item => {
          const medicoNome = medicos.find(m => m.id === item.medico_id)?.nome || 'N/A';
          const hospitalNome = hospitais.find(h => h.id === item.hospital_id)?.nome || 'N/A';
          todosItensCalculados.push({
            idOriginal: item.id,
            tipo: "Procedimento",
            descricao: `${item.nome_paciente} (${medicoNome}) - ${hospitalNome}`,
            valorBruto: item.valor_bruto_original,
            inss: item.valor_inss_calculado,
            irrf: item.valor_irrf_calculado,
            outrosDescontos: (item.valor_mat_med_original || 0) + (item.valor_impostos_empresa_original || 0) + (item.valor_taxa_administrativa_original || 0),
            valorLiquido: item.valor_liquido_item,
            medico_id: item.medico_id,
            empresa_id: item.empresa_id,
            hospital_id: item.hospital_id,
            detalhes: `Mat/Med: ${formatCurrency(item.valor_mat_med_original)}, Imp: ${formatCurrency(item.valor_impostos_empresa_original)}, Taxa: ${formatCurrency(item.valor_taxa_administrativa_original)}`
          });
        });

        resultadoGroup.itens_producoes.forEach(item => {
          const medicoNome = medicos.find(m => m.id === item.medico_id)?.nome || 'N/A';
          todosItensCalculados.push({
            idOriginal: item.id,
            tipo: "Produção Adm.",
            descricao: `${item.descricao_atividade} (${medicoNome})`,
            valorBruto: item.valor_bruto_original,
            inss: item.valor_inss_calculado,
            irrf: item.valor_irrf_calculado,
            outrosDescontos: 0,
            valorLiquido: item.valor_liquido_item,
            medico_id: item.medico_id,
            empresa_id: resultadoGroup.empresa_pagadora_id,
            detalhes: `Horas: ${item.horas_dedicadas || 0}h, Tipo: ${item.tipo_producao || 'N/A'}`
          });
        });

        resultadoGroup.itens_descontos_creditos.forEach(item => {
          const medicoNome = medicos.find(m => m.id === item.medico_id)?.nome || 'N/A';
          todosItensCalculados.push({
            idOriginal: item.id,
            tipo: item.tipo === 'credito' ? "Crédito" : "Desconto",
            descricao: `${item.descricao} (${medicoNome})`,
            valorBruto: item.tipo === 'credito' ? item.valor_original : 0,
            inss: 0,
            irrf: 0,
            outrosDescontos: item.tipo === 'desconto' ? item.valor_original : 0,
            valorLiquido: item.tipo === 'credito' ? item.valor_original : -item.valor_original,
            medico_id: item.medico_id,
            empresa_id: item.empresa_id,
            detalhes: `${item.recorrente ? 'Recorrente' : 'Único'}, ${item.tributavel ? 'Tributável' : 'Não Tributável'}`
          });
        });
      });

      // 5. Preparar resultado final
      setSimulacaoResultados({
        resumoGeral: {
          totalBrutoPlantoes: totalBrutoPlantoesGlobal,
          totalBrutoProcedimentos: totalBrutoProcedimentosGlobal,
          totalBrutoProducoes: totalBrutoProducoesGlobal,
          totalCreditos: totalCreditosGlobal,
          totalDescontos: totalDescontosGlobal,
          totalDescontosINSS: totalDescontosINSSGlobal,
          totalDescontosIRRF: totalDescontosIRRFGlobal,
          totalImpostosEmpresa: totalImpostosEmpresaGlobal,
          totalTaxaAdministrativa: totalTaxaAdministrativaGlobal,
          totalMatMed: totalMatMedGlobal, // NOVO: Adicionar Mat/Med ao resumo
          valorLiquidoRepasse: valorLiquidoRepasseGlobal,
          qtdPlantoes: plantoes.length,
          qtdProcedimentos: procedimentos.length,
          qtdProducoes: producoes.length,
          qtdDescontosCreditos: descontosCreditos.length,
        },
        itensDetalhados: todosItensCalculados.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.descricao.localeCompare(b.descricao)),
        parametrosUsados: {
          competencia, empresaId, hospitalId, medicoId,
          aplicarParametrosFiscais, calcularINSSMedico, calcularIRRFMedico, considerarRecorrentes
        },
        fullBreakdown: {
          resultados_por_medico: Object.values(resultadosPorMedicoEmpresa),
          totais_gerais: {
            total_bruto: totalBrutoPlantoesGlobal + totalBrutoProcedimentosGlobal + totalBrutoProducoesGlobal + totalCreditosGlobal - totalDescontosGlobal,
            total_inss: totalDescontosINSSGlobal,
            total_irrf: totalDescontosIRRFGlobal,
            total_impostos_empresa: totalImpostosEmpresaGlobal,
            total_taxa_administrativa: totalTaxaAdministrativaGlobal,
            total_liquido: valorLiquidoRepasseGlobal,
          }
        }
      });

    } catch (error) {
      console.error("Erro durante simulação:", error);
      setErroSimulacao(`Erro durante a simulação: ${error.message}.`);
      setSimulacaoResultados(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para consolidar o cálculo
  const handleConsolidarCalculo = async () => {
    if (!simulacaoResultados || !currentUser || !simulacaoResultados.fullBreakdown) {
      setErroSimulacao("Não há simulação para consolidar ou usuário não identificado.");
      return;
    }
    setIsLoading(true);
    setErroSimulacao("");

    try {
      const { resumoGeral, parametrosUsados, fullBreakdown } = simulacaoResultados;
      const { resultados_por_medico, totais_gerais } = fullBreakdown;

      // 1. Criar o registro mestre do cálculo
      const resultadoMestre = await ResultadoCalculoProducao.create({
        competencia_producao: parametrosUsados.competencia,
        data_calculo: new Date().toISOString(),
        medico_id: parametrosUsados.medicoId || null,
        empresa_id: parametrosUsados.empresaId || null, // Se um filtro de empresa global foi aplicado
        total_bruto_plantoes: resumoGeral.totalBrutoPlantoes,
        total_bruto_procedimentos: resumoGeral.totalBrutoProcedimentos,
        total_bruto_producoes_administrativas: resumoGeral.totalBrutoProducoes, // NEW
        total_creditos_medico: resumoGeral.totalCreditos, // NEW
        total_descontos_medico: resumoGeral.totalDescontos, // NEW
        total_bruto_geral: totais_gerais.total_bruto,
        total_descontos_inss_medico: totais_gerais.total_inss,
        total_descontos_irrf_medico: totais_gerais.total_irrf,
        total_impostos_retidos_empresa: totais_gerais.total_impostos_empresa,
        total_taxa_administrativa: totais_gerais.total_taxa_administrativa,
        valor_liquido_total_repasse: totais_gerais.total_liquido,
        status: "consolidado",
        usuario_responsavel_id: currentUser.id,
        nome_usuario_responsavel: currentUser.nome_completo,
        parametros_simulacao: parametrosUsados,
        observacoes: `Cálculo consolidado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`
      });

      // 2. Criar os itens calculados e atualizar os originais
      for (const resultadoGroup of resultados_por_medico) {
        // Itens de plantão
        for (const plantao of resultadoGroup.itens_plantoes) {
          await ItemCalculadoProducao.create({
            resultado_calculo_producao_id: resultadoMestre.id,
            item_original_id: plantao.id,
            tipo_item: "plantao",
            medico_id: plantao.medico_id,
            empresa_prestadora_id: null, // Plantão normalmente não tem empresa prestadora direta no contrato
            empresa_pagadora_id: resultadoGroup.empresa_pagadora_id,
            hospital_id: plantao.hospital_id || null,
            valor_bruto_item: plantao.valor_bruto_original || 0,
            valor_base_calculo_inss: plantao.valor_bruto_original || 0,
            valor_inss_retido_medico: plantao.valor_inss_calculado || 0,
            valor_base_calculo_irrf: (plantao.valor_bruto_original || 0) - (plantao.valor_inss_calculado || 0),
            valor_irrf_retido_medico: plantao.valor_irrf_calculado || 0,
            valor_liquido_repasse_item: plantao.valor_liquido_item || 0,
            aliquotas_aplicadas_info: null
          });

          // Atualizar plantão para marcar como calculado
          await Plantao.update(plantao.id, { resultado_calculo_producao_id: resultadoMestre.id });
        }

        // Itens de procedimento
        for (const procedimento of resultadoGroup.itens_procedimentos) {
          await ItemCalculadoProducao.create({
            resultado_calculo_producao_id: resultadoMestre.id,
            item_original_id: procedimento.id,
            tipo_item: "procedimento_particular",
            medico_id: procedimento.medico_id,
            empresa_prestadora_id: procedimento.empresa_id || null,
            empresa_pagadora_id: procedimento.empresa_pagamento_id || procedimento.empresa_id,
            hospital_id: procedimento.hospital_id || null,
            valor_bruto_item: procedimento.valor_bruto_original || 0,
            valor_base_calculo_inss: procedimento.valor_liquido_estimado_original || 0,
            valor_inss_retido_medico: procedimento.valor_inss_calculado || 0,
            valor_base_calculo_irrf: (procedimento.valor_liquido_estimado_original || 0) - (procedimento.valor_inss_calculado || 0),
            valor_irrf_retido_medico: procedimento.valor_irrf_calculado || 0,
            valor_iss_retido_empresa: procedimento.valor_impostos_empresa_original || 0,
            valor_taxa_administrativa_retida: procedimento.valor_taxa_administrativa_original || 0,
            valor_mat_med_retido: procedimento.valor_mat_med_original || 0,
            valor_liquido_repasse_item: procedimento.valor_liquido_item || 0,
            aliquotas_aplicadas_info: null
          });

          // Atualizar procedimento para marcar como calculado
          await ProcedimentoParticular.update(procedimento.id, { resultado_calculo_producao_id: resultadoMestre.id });
        }

        // NEW: Itens de produção administrativa
        for (const producao of resultadoGroup.itens_producoes) {
          await ItemCalculadoProducao.create({
            resultado_calculo_producao_id: resultadoMestre.id,
            item_original_id: producao.id,
            tipo_item: "producao_administrativa",
            medico_id: producao.medico_id,
            empresa_prestadora_id: producao.empresa_id || null,
            empresa_pagadora_id: resultadoGroup.empresa_pagadora_id,
            hospital_id: null, // Prod. Adm. not tied to hospital
            valor_bruto_item: producao.valor_bruto_original || 0,
            valor_base_calculo_inss: producao.tributavel ? (producao.valor_bruto_original || 0) : 0,
            valor_inss_retido_medico: producao.tributavel ? (producao.valor_inss_calculado || 0) : 0,
            valor_base_calculo_irrf: producao.tributavel ? ((producao.valor_bruto_original || 0) - (producao.valor_inss_calculado || 0)) : 0,
            valor_irrf_retido_medico: producao.tributavel ? (producao.valor_irrf_calculado || 0) : 0,
            valor_liquido_repasse_item: producao.valor_liquido_item || 0,
            aliquotas_aplicadas_info: null
          });

          // Atualizar ProducaoAdministrativa para marcar como calculado
          await ProducaoAdministrativa.update(producao.id, { resultado_calculo_producao_id: resultadoMestre.id });
        }

        // NEW: Itens de desconto/crédito
        for (const dc of resultadoGroup.itens_descontos_creditos) {
            await ItemCalculadoProducao.create({
                resultado_calculo_producao_id: resultadoMestre.id,
                item_original_id: dc.id,
                tipo_item: "desconto_credito",
                medico_id: dc.medico_id,
                empresa_prestadora_id: dc.empresa_id || null,
                empresa_pagadora_id: dc.empresa_id || null,
                hospital_id: dc.hospital_id || null,
                valor_credito_item: dc.tipo === 'credito' ? (dc.valor_original || 0) : 0,
                valor_desconto_item: dc.tipo === 'desconto' ? (dc.valor_original || 0) : 0,
                valor_liquido_repasse_item: dc.tipo === 'credito' ? (dc.valor_original || 0) : -(dc.valor_original || 0),
                observacao_item: dc.descricao,
                aliquotas_aplicadas_info: null
            });
            // NOTE: DescontoCredito record is NOT updated with resultado_calculo_producao_id here.
            // This means recurring discounts will be picked up each month unless a 'processed' flag or end date is added to the entity.
            // For one-time discounts, this means they could be re-processed if not marked as confirmed/processed/calculated.
            // The outline does not specify marking DescontoCredito as processed/calculated.
        }
      }

      alert("Cálculo consolidado com sucesso!");
      setSimulacaoResultados(null); // Limpa simulação
      loadHistoricoCalculos(); // Recarrega histórico

    } catch (error) {
      console.error("Erro ao consolidar cálculo:", error);
      setErroSimulacao(`Falha ao consolidar o cálculo: ${error.message}.`);
      // TODO: Implementar rollback ou lógica de compensação se parte da operação falhar.
    } finally {
      setIsLoading(false);
    }
  };


  return (
    // <PermissionGuard permission={PERMISSIONS.CALCULOS_PRODUCAO_GERENCIAR}> // Descomentar quando permissões ativas
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            Cálculo de Produção Médica
          </CardTitle>
          <CardDescription>
            Simule e consolide os cálculos de produção de plantões, procedimentos, produção administrativa e descontos/créditos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção de Filtros */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros para Simulação
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="competencia">Competência <span className="text-red-500">*</span></Label>
                <Input
                  id="competencia"
                  type="month"
                  value={competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                  disabled={isLoadingFilters || isLoading}
                />
              </div>
              <div>
                <Label htmlFor="empresa">Empresa Contratante/Prestadora</Label>
                <Select
                    value={empresaId || ""}
                    onValueChange={(value) => setEmpresaId(value === "all" ? null : value)}
                    disabled={isLoadingFilters || isLoading}
                >
                  <SelectTrigger><SelectValue placeholder="Todas as Empresas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Empresas</SelectItem>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome_fantasia || e.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hospital">Hospital</Label>
                <Select
                    value={hospitalId || ""}
                    onValueChange={(value) => setHospitalId(value === "all" ? null : value)}
                    disabled={isLoadingFilters || isLoading}
                >
                  <SelectTrigger><SelectValue placeholder="Todos os Hospitais" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Hospitais</SelectItem>
                    {hospitais.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="medico">Médico</Label>
                <Select
                    value={medicoId || ""}
                    onValueChange={(value) => setMedicoId(value === "all" ? null : value)}
                    disabled={isLoadingFilters || isLoading}
                >
                  <SelectTrigger><SelectValue placeholder="Todos os Médicos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem key="all" value="all">Todos os Médicos</SelectItem>
                    {medicos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Opções de Cálculo */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Opções de Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aplicarParametrosFiscais"
                  checked={aplicarParametrosFiscais}
                  onCheckedChange={setAplicarParametrosFiscais}
                  disabled={isLoading}
                />
                <Label htmlFor="aplicarParametrosFiscais" className="text-sm font-medium">
                  Aplicar Parâmetros Fiscais da Empresa (ISS, Taxa Adm, etc.) sobre Procedimentos Particulares
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="calcularINSSMedico"
                  checked={calcularINSSMedico}
                  onCheckedChange={setCalcularINSSMedico}
                  disabled={isLoading}
                />
                <Label htmlFor="calcularINSSMedico" className="text-sm font-medium">
                  Calcular INSS do Médico (sobre o total do repasse)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="calcularIRRFMedico"
                  checked={calcularIRRFMedico}
                  onCheckedChange={setCalcularIRRFMedico}
                  disabled={isLoading}
                />
                <Label htmlFor="calcularIRRFMedico" className="text-sm font-medium">
                  Calcular IRRF do Médico (sobre base após INSS)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="considerarRecorrentes"
                  checked={considerarRecorrentes}
                  onCheckedChange={setConsiderarRecorrentes}
                  disabled={isLoading}
                />
                <Label htmlFor="considerarRecorrentes" className="text-sm font-medium">
                  Considerar Descontos/Créditos Recorrentes de competências anteriores
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSimularCalculo} disabled={isLoading || isLoadingFilters || !competencia} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Simular Cálculo
            </Button>
          </div>

          {erroSimulacao && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro na Simulação</AlertTitle>
              <AlertDescription>{erroSimulacao}</AlertDescription>
            </Alert>
          )}

          {/* Resultados da Simulação */}
          {simulacaoResultados && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Resultados da Simulação para {formatCompetencia(simulacaoResultados.parametrosUsados.competencia)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Accordion type="single" collapsible defaultValue="resumo">
                  <AccordionItem value="resumo">
                    <AccordionTrigger className="text-lg font-semibold">Resumo Geral</AccordionTrigger>
                    <AccordionContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4 bg-slate-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-slate-600">Qtd. Plantões:</span> {simulacaoResultados.resumoGeral.qtdPlantoes}
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-slate-600">Qtd. Procedimentos:</span> {simulacaoResultados.resumoGeral.qtdProcedimentos}
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-slate-600">Qtd. Prod. Adm.:</span> {simulacaoResultados.resumoGeral.qtdProducoes}
                        </div>
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-slate-600">Qtd. Desc./Créd.:</span> {simulacaoResultados.resumoGeral.qtdDescontosCreditos}
                        </div>

                        <div className="font-semibold text-blue-700"><span className="font-medium text-slate-600">Total Bruto Plantões:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalBrutoPlantoes)}</div>
                        <div className="font-semibold text-purple-700"><span className="font-medium text-slate-600">Total Bruto Proced.:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalBrutoProcedimentos)}</div>
                        <div className="font-semibold text-amber-700"><span className="font-medium text-slate-600">Total Bruto Prod. Adm.:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalBrutoProducoes)}</div>
                        <div className="font-semibold text-green-700 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium text-slate-600">Total Créditos:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalCreditos)}
                        </div>

                        <div className="font-semibold text-red-600 flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          <span className="font-medium text-slate-600">Total Desc. (Diversos):</span> {formatCurrency(simulacaoResultados.resumoGeral.totalDescontos)}
                        </div>
                        <div className="font-semibold text-red-600"><span className="font-medium text-slate-600">Total INSS Médico:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalDescontosINSS)}</div>
                        <div className="font-semibold text-red-600"><span className="font-medium text-slate-600">Total IRRF Médico:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalDescontosIRRF)}</div>
                        <div className="font-semibold text-red-600"><span className="font-medium text-slate-600">Total Taxa Adm.:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalTaxaAdministrativa)}</div>

                        <div className="font-semibold text-red-600"><span className="font-medium text-slate-600">Total Mat/Med Proced.:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalMatMed)}</div>
                        <div className="font-semibold text-red-600"><span className="font-medium text-slate-600">Total Impostos Emp.:</span> {formatCurrency(simulacaoResultados.resumoGeral.totalImpostosEmpresa)}</div>
                        
                        <div className="text-lg font-bold text-green-700 col-span-full md:col-span-2"><span className="font-medium text-slate-600">Líquido Total Repasse:</span> {formatCurrency(simulacaoResultados.resumoGeral.valorLiquidoRepasse)}</div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="detalhes">
                    <AccordionTrigger className="text-lg font-semibold">Itens Detalhados</AccordionTrigger>
                    <AccordionContent>
                      {simulacaoResultados.itensDetalhados.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor Bruto</TableHead>
                              <TableHead className="text-right">INSS</TableHead>
                              <TableHead className="text-right">IRRF</TableHead>
                              <TableHead className="text-right">Outros Desc.</TableHead>
                              <TableHead className="text-right">Valor Líquido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {simulacaoResultados.itensDetalhados.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {item.tipo === "Plantão" && <Calendar className="w-4 h-4 text-blue-600" />}
                                    {item.tipo === "Procedimento" && <Stethoscope className="w-4 h-4 text-purple-600" />}
                                    {item.tipo === "Produção Adm." && <Briefcase className="w-4 h-4 text-amber-600" />}
                                    {item.tipo === "Crédito" && <TrendingUp className="w-4 h-4 text-green-600" />}
                                    {item.tipo === "Desconto" && <TrendingDown className="w-4 h-4 text-red-600" />}
                                    {item.tipo}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate" title={`${item.descricao} ${item.detalhes ? `(${item.detalhes})` : ''}`}>{item.descricao}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.valorBruto)}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(item.inss)}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(item.irrf)}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(item.outrosDescontos)}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">{formatCurrency(item.valorLiquido)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <TableCaption>Nenhum item detalhado para exibir.</TableCaption>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex justify-end mt-6 space-x-3">
                    <Button variant="outline" onClick={() => window.print()} disabled={isLoading}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir Simulação
                    </Button>
                    <Button onClick={handleConsolidarCalculo} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Consolidar Cálculo
                    </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Cálculos Consolidados */}
          <Card className="mt-8 border-gray-300">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><ListTree className="h-5 w-5"/>Histórico de Cálculos Consolidados</CardTitle>
            </CardHeader>
            <CardContent>
                {historicoCalculos.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum cálculo consolidado encontrado.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Competência</TableHead>
                                <TableHead>Data Cálculo</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead className="text-right">Total Bruto</TableHead>
                                <TableHead className="text-right">Total Líquido</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historicoCalculos.map(calc => (
                                <TableRow key={calc.id}>
                                    <TableCell>{formatCompetencia(calc.competencia_producao)}</TableCell>
                                    <TableCell>{format(parseISO(calc.data_calculo), "dd/MM/yyyy HH:mm")}</TableCell>
                                    <TableCell>{calc.nome_usuario_responsavel}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(calc.total_bruto_geral)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(calc.valor_liquido_total_repasse)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => alert(`Visualizar detalhes do cálculo ${calc.id}`)} title="Visualizar Detalhes">
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                )}
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
    // </PermissionGuard>
  );
}
