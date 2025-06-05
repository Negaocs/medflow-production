
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Medico,
  Empresa,
  ProLabore,
  VinculoFiscalMedico,
  TabelaINSS,
  TabelaIRRF,
  ResultadoCalculoProLabore,
  ItemCalculadoProLabore,
  User,
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
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calculator,
  Filter,
  User as UserIcon,
  Building2,
  AlertTriangle,
  Loader2,
  DollarSign,
  ShieldCheck,
  Eye,
  Info,
  History,
  Search as SearchIcon,
  Pencil,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isValid, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// Funções Utilitárias
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
    if (!year || !month) return competencia;
    const date = parseISO(`${year}-${month}-01`);
    return format(date, "MMMM/yyyy", { locale: ptBR });
  } catch {
    return competencia;
  }
};

// Componente Modal de Simulação
const SimulacaoProLaboreModal = ({ medico, empresa, competencia, dadosApoio, onClose, onSalvarCalculo }) => {
  const [simulacaoData, setSimulacaoData] = useState(null);
  const [isLoadingModal, setIsLoadingModal] = useState(true);
  const [errorModal, setErrorModal] = useState("");

  const { tabelasINSS, tabelasIRRF, vinculosFiscaisPorMedico } = dadosApoio;

  const performCalculation = useCallback(() => {
    setIsLoadingModal(true);
    setErrorModal("");
    console.log("[ModalPerformCalc] Iniciando cálculo para:", medico?.nome, "Empresa:", empresa?.nome_fantasia, "Competência:", competencia);

    try {
      if (!medico || !empresa || !competencia || !tabelasINSS || !tabelasIRRF) {
        setErrorModal("Dados insuficientes para simulação. Verifique filtros e cadastros fiscais.");
        setIsLoadingModal(false);
        return;
      }

      if (!tabelasINSS.proLabore || tabelasINSS.proLabore.length === 0) {
        setErrorModal("Tabela INSS (Pró-Labore) não encontrada para a competência.");
        setIsLoadingModal(false);
        return;
      }
      if (!tabelasIRRF.faixas || tabelasIRRF.faixas.length === 0) {
        setErrorModal("Tabela IRRF não encontrada para a competência.");
        setIsLoadingModal(false);
        return;
      }
      
      const ALIQUOTA_PROLABORE_FIXA = 0.11;
      const tetoContribuicaoINSS = tabelasINSS.tetoContribuicao;
      
      console.log(`[ModalPerformCalc] Alíquota Pró-Labore (FIXA): ${ALIQUOTA_PROLABORE_FIXA * 100}%`);
      console.log(`[ModalPerformCalc] Teto Contribuição INSS: ${formatCurrency(tetoContribuicaoINSS)}`);

      if (tetoContribuicaoINSS === null || tetoContribuicaoINSS === undefined) {
        setErrorModal("Teto de contribuição INSS não definido. Verifique cadastro da Tabela INSS.");
        setIsLoadingModal(false);
        return;
      }

      // 1. Calcular total de pró-labore bruto tributável nesta empresa
      let totalProLaboreBrutoThisCompany = 0;
      const proLaboresTributaveisThisCompany = (medico.proLaboresOriginais || []).filter(pl => pl.tributavel !== false);
      proLaboresTributaveisThisCompany.forEach(pl => {
        totalProLaboreBrutoThisCompany += pl.valor_bruto || 0;
      });
      
      console.log(`[ModalPerformCalc] Total Pró-Labore Bruto Tributável (Nesta Empresa): ${formatCurrency(totalProLaboreBrutoThisCompany)}`);
      
      // 2. Buscar vínculos fiscais externos tradicionais (de outras fontes, como vínculo CLT)
      const vinculosDoMedico = vinculosFiscaisPorMedico[medico.id] || [];
      let totalINSSRetidoExternoTradicional = 0;
      let totalBaseIRRFExternaTradicional = 0;
      let totalIRRFRetidoExternoTradicional = 0;

      vinculosDoMedico.forEach(v => {
        totalINSSRetidoExternoTradicional += v.valor_inss_retido || 0;
        totalBaseIRRFExternaTradicional += v.base_irrf || 0; 
        totalIRRFRetidoExternoTradicional += v.valor_irrf_retido || 0;
      });
      
      console.log(`[ModalPerformCalc] Vínculos Externos Tradicionais - INSS Retido: ${formatCurrency(totalINSSRetidoExternoTradicional)}, Base IRRF: ${formatCurrency(totalBaseIRRFExternaTradicional)}, IRRF Retido: ${formatCurrency(totalIRRFRetidoExternoTradicional)}`);

      // 3. NOVO: Cálculos consolidados existentes na competência (vínculos fiscais internos do sistema), JÁ FILTRADOS pela função de busca
      let totalINSSRetidoInterno = 0;
      let totalBaseIRRFInternaConsiderada = 0;
      let totalIRRFRetidoInterno = 0;
      let calculosConsolidadosParaConsiderar = [];

      // medico.calculosConsolidadosExistentes já vem filtrado para não incluir a empresa atual
      if (medico.calculosConsolidadosExistentes && medico.calculosConsolidadosExistentes.length > 0) {
        calculosConsolidadosParaConsiderar = medico.calculosConsolidadosExistentes;
        
        calculosConsolidadosParaConsiderar.forEach(calc => {
          totalINSSRetidoInterno += calc.total_descontos_inss_medico || 0;
          // Base IRRF de um cálculo consolidado é Bruto - INSS retido naquele cálculo
          totalBaseIRRFInternaConsiderada += (calc.total_bruto_pro_labore_atividades || 0) - (calc.total_descontos_inss_medico || 0); 
          totalIRRFRetidoInterno += calc.total_descontos_irrf_medico || 0;
        });
      }
      
      console.log(`[ModalPerformCalc] Vínculos Fiscais Internos (Cálculos Consolidados) - INSS Retido: ${formatCurrency(totalINSSRetidoInterno)}, Base IRRF: ${formatCurrency(totalBaseIRRFInternaConsiderada)}, IRRF Retido: ${formatCurrency(totalIRRFRetidoInterno)}`);
      console.log(`[ModalPerformCalc] Cálculos Consolidados Considerados:`, calculosConsolidadosParaConsiderar.map(c => ({empresa: c.empresa_nome || 'N/A', bruto: formatCurrency(c.total_bruto_pro_labore_atividades), inss: formatCurrency(c.total_descontos_inss_medico), irrf: formatCurrency(c.total_descontos_irrf_medico)})));

      // 4. Consolidar totais de retenções e bases de cálculos (tradicionais externos + internos do sistema)
      const totalINSSRetidoGlobal = totalINSSRetidoExternoTradicional + totalINSSRetidoInterno;
      const totalBaseIRRFGlobal = totalBaseIRRFExternaTradicional + totalBaseIRRFInternaConsiderada;
      const totalIRRFRetidoGlobal = totalIRRFRetidoExternoTradicional + totalIRRFRetidoInterno;
      
      console.log(`[ModalPerformCalc] CONSOLIDADO GLOBAL - INSS Retido: ${formatCurrency(totalINSSRetidoGlobal)}, Base IRRF: ${formatCurrency(totalBaseIRRFGlobal)}, IRRF Retido: ${formatCurrency(totalIRRFRetidoGlobal)}`);

      // 5. Cálculo do INSS a reter nesta empresa
      let inssAReterThisCompanyPL = 0;
      if (totalProLaboreBrutoThisCompany > 0) {
        const inssCalculadoSobreThisCompanyPL = totalProLaboreBrutoThisCompany * ALIQUOTA_PROLABORE_FIXA;
        console.log(`[ModalPerformCalc] INSS Calculado (${formatCurrency(totalProLaboreBrutoThisCompany)} × ${ALIQUOTA_PROLABORE_FIXA * 100}%): ${formatCurrency(inssCalculadoSobreThisCompanyPL)}`);
        
        const maxINSSDevidoNaCompetencia = tetoContribuicaoINSS;
        console.log(`[ModalPerformCalc] Max INSS Devido no Mês (Teto): ${formatCurrency(maxINSSDevidoNaCompetencia)}`);
        
        const saldoDisponivelParaRetencaoINSS = Math.max(0, maxINSSDevidoNaCompetencia - totalINSSRetidoGlobal);
        console.log(`[ModalPerformCalc] Saldo Disponível para Retenção INSS: ${formatCurrency(saldoDisponivelParaRetencaoINSS)}`);
        
        inssAReterThisCompanyPL = Math.min(inssCalculadoSobreThisCompanyPL, saldoDisponivelParaRetencaoINSS);
        inssAReterThisCompanyPL = Math.max(0, inssAReterThisCompanyPL); // Garante que não seja negativo
        
        console.log(`[ModalPerformCalc] INSS a Reter Final (Nesta Empresa): ${formatCurrency(inssAReterThisCompanyPL)}`);
      }

      // 6. Cálculo do IRRF
      const baseIRRFThisCompanyPL = Math.max(0, totalProLaboreBrutoThisCompany - inssAReterThisCompanyPL);
      const baseIRRFTotalCompetencia = totalBaseIRRFExternaTradicional + totalBaseIRRFInternaConsiderada + baseIRRFThisCompanyPL;
      
      console.log(`[ModalPerformCalc] Base IRRF Nesta Empresa (Bruto - INSS): ${formatCurrency(baseIRRFThisCompanyPL)}`);
      console.log(`[ModalPerformCalc] Base IRRF Total Competência (Externos + Internos + Atual): ${formatCurrency(baseIRRFTotalCompetencia)}`);

      let irrfAReterThisCompanyPL = 0;
      if (baseIRRFTotalCompetencia > 0) {
        const deducaoDependentes = (medico.dependentes_irrf || 0) * (tabelasIRRF.deducaoDependente || 0);
        const baseIRRFAposDeducoes = Math.max(0, baseIRRFTotalCompetencia - deducaoDependentes);
        
        console.log(`[ModalPerformCalc] Dedução Dependentes IRRF (${medico.dependentes_irrf || 0} × ${formatCurrency(tabelasIRRF.deducaoDependente)}): ${formatCurrency(deducaoDependentes)}`);
        console.log(`[ModalPerformCalc] Base IRRF Após Deduções: ${formatCurrency(baseIRRFAposDeducoes)}`);

        const faixaIRRF = tabelasIRRF.faixas.find(f =>
          baseIRRFAposDeducoes >= f.base_calculo_de &&
          (f.base_calculo_ate === null || f.base_calculo_ate === 0 || baseIRRFAposDeducoes <= f.base_calculo_ate)
        );

        if (faixaIRRF) {
          const irrfCalculadoGlobalCompetencia = Math.max(0, (baseIRRFAposDeducoes * faixaIRRF.aliquota) - (faixaIRRF.parcela_deduzir || 0));
          console.log(`[ModalPerformCalc] IRRF Calculado Global Competência (${formatCurrency(baseIRRFAposDeducoes)} × ${faixaIRRF.aliquota * 100}% - ${formatCurrency(faixaIRRF.parcela_deduzir)}): ${formatCurrency(irrfCalculadoGlobalCompetencia)}`);
          
          irrfAReterThisCompanyPL = Math.max(0, irrfCalculadoGlobalCompetencia - (totalIRRFRetidoExternoTradicional + totalIRRFRetidoInterno));
          console.log(`[ModalPerformCalc] IRRF a Reter Final (Nesta Empresa): ${formatCurrency(irrfAReterThisCompanyPL)}`);
        } else {
          console.log(`[ModalPerformCalc] Nenhuma faixa IRRF encontrada para base ${formatCurrency(baseIRRFAposDeducoes)}`);
        }
      }

      const valorLiquidoThisCompanyPL = totalProLaboreBrutoThisCompany - inssAReterThisCompanyPL - irrfAReterThisCompanyPL;
      
      console.log(`[ModalPerformCalc] Valor Líquido Final: ${formatCurrency(valorLiquidoThisCompanyPL)}`);

      setSimulacaoData({
        proLaboreBrutoAtual: totalProLaboreBrutoThisCompany,
        proLaboresOriginaisConsiderados: medico.proLaboresOriginais,
        vinculosExternos: vinculosDoMedico, // Vínculos fiscais tradicionais
        calculosConsolidadosExternos: calculosConsolidadosParaConsiderar,
        // Total Base INSS Consolidada: Soma do bruto desta empresa + base INSS de vínculos tradicionais + bruto de outros cálculos consolidados
        totalBaseINSSConsolidada: totalProLaboreBrutoThisCompany +
                                  (vinculosDoMedico.reduce((acc, v) => acc + (v.base_inss || 0), 0)) + 
                                  (calculosConsolidadosParaConsiderar.reduce((acc, c) => acc + (c.total_bruto_pro_labore_atividades || 0), 0)),
        totalBaseIRRFConsolidada: baseIRRFTotalCompetencia,
        tetoINSSAplicado: tetoContribuicaoINSS,
        aliquotaProLaboreAplicada: ALIQUOTA_PROLABORE_FIXA,
        tabelaIRRFInfo: `Faixas de ${tabelasIRRF.faixas.length > 0 ? format(parseISO(tabelasIRRF.faixas[0].vigencia_inicio), "dd/MM/yyyy") : 'N/A'}, Ded. Dependente: ${formatCurrency(tabelasIRRF.deducaoDependente)}`,
        inssAReter: inssAReterThisCompanyPL,
        irrfAReter: irrfAReterThisCompanyPL,
        totalLiquido: valorLiquidoThisCompanyPL,
        aliquotas_e_parametros_aplicados: {
            tabelaINSS: tabelasINSS,
            tabelaIRRF: tabelasIRRF,
            aliquotaProLaboreUsada: ALIQUOTA_PROLABORE_FIXA,
            tetoINSSUsado: tetoContribuicaoINSS,
            deducaoDependentesValor: (medico.dependentes_irrf || 0) * (tabelasIRRF.deducaoDependente || 0),
            numeroDependentes: medico.dependentes_irrf || 0,
            vinculosExternosConsiderados: vinculosDoMedico.length + calculosConsolidadosParaConsiderar.length
        }
      });
    } catch (err) {
      console.error("Erro ao calcular simulação no modal:", err);
      setErrorModal(`Falha ao calcular simulação: ${err.message}.`);
    } finally {
      setIsLoadingModal(false);
    }
  }, [medico, empresa, competencia, dadosApoio, tabelasINSS, tabelasIRRF, vinculosFiscaisPorMedico]);

  useEffect(() => {
    if (medico && empresa && competencia && dadosApoio) {
        performCalculation();
    }
  }, [medico, empresa, competencia, dadosApoio, performCalculation]);

  if (!medico || !empresa) return null;

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Simulação de Pró-Labore: {medico.nome}</DialogTitle>
        <DialogDescription>
          Empresa: {empresa.nome_fantasia || empresa.razao_social} | Competência: {formatCompetencia(competencia)}
        </DialogDescription>
      </DialogHeader>
      {isLoadingModal ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-3 text-slate-600">Calculando simulação...</p>
        </div>
      ) : errorModal ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na Simulação</AlertTitle>
          <AlertDescription>{errorModal}</AlertDescription>
        </Alert>
      ) : simulacaoData ? (
        <div className="space-y-6 py-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Pró-Labore em {empresa.nome_fantasia || empresa.razao_social}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-base text-slate-700">Valor Bruto: <span className="font-semibold">{formatCurrency(simulacaoData.proLaboreBrutoAtual)}</span></p>
              {simulacaoData.proLaboresOriginaisConsiderados?.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  Origem: {simulacaoData.proLaboresOriginaisConsiderados.map(pl => `${pl.descricao} (${formatCurrency(pl.valor_bruto)})`).join('; ')}
                </div>
              )}
            </CardContent>
          </Card>

          {simulacaoData.vinculosExternos?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Outros Vínculos (Tradicionais)</CardTitle></CardHeader>
              <CardContent>
                <Table size="sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origem</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-right">Base INSS</TableHead>
                      <TableHead className="text-right">INSS Retido</TableHead>
                      <TableHead className="text-right">Base IRRF</TableHead>
                      <TableHead className="text-right">IRRF Retido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulacaoData.vinculosExternos.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{v.nome_instituicao}</TableCell>
                        <TableCell>{v.cnpj_responsavel}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.base_inss)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.valor_inss_retido)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.base_irrf)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.valor_irrf_retido)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {simulacaoData.calculosConsolidadosExternos?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Outros Cálculos Consolidados (no Sistema)</CardTitle></CardHeader>
              <CardContent>
                <Table size="sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">INSS Retido</TableHead>
                      <TableHead className="text-right">IRRF Retido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulacaoData.calculosConsolidadosExternos.map((calc) => (
                      <TableRow key={calc.id}>
                        <TableCell>{calc.empresa_nome || "N/A"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(calc.total_bruto_pro_labore_atividades)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(calc.total_descontos_inss_medico)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(calc.total_descontos_irrf_medico)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}


          <Card>
            <CardHeader><CardTitle className="text-lg">Parâmetros e Bases Consolidadas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-slate-700">Base INSS Total: <span className="font-semibold">{formatCurrency(simulacaoData.totalBaseINSSConsolidada)}</span></div>
              <div className="text-slate-700">Base IRRF Total: <span className="font-semibold">{formatCurrency(simulacaoData.totalBaseIRRFConsolidada)}</span></div>
              <div className="text-slate-700">Teto INSS: <span className="font-semibold">{formatCurrency(simulacaoData.tetoINSSAplicado)}</span></div>
              <div className="text-slate-700">Alíquota Pró-Labore: <span className="font-semibold">{(simulacaoData.aliquotaProLaboreAplicada * 100).toFixed(0)}%</span></div>
              <div className="text-slate-700 md:col-span-2">Tabela IRRF: <span className="font-semibold">{simulacaoData.tabelaIRRFInfo}</span></div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader><CardTitle className="text-lg text-blue-700">Resultado para {empresa.nome_fantasia || empresa.razao_social}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
              <div>
                <p className="text-sm text-blue-600">INSS a Reter:</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(simulacaoData.inssAReter)}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">IRRF a Reter:</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(simulacaoData.irrfAReter)}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Total Líquido:</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(simulacaoData.totalLiquido)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button 
            onClick={() => onSalvarCalculo(simulacaoData)} 
            disabled={isLoadingModal || !simulacaoData || !!errorModal}
            className="bg-green-600 hover:bg-green-700"
        >
          <ShieldCheck className="h-4 w-4 mr-2" /> Salvar Cálculo
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};


// Componente Principal da Página
export default function CalculoProLaborePage() {
  const [competencia, setCompetencia] = useState(format(new Date(), "yyyy-MM"));
  const [empresaFiltroId, setEmpresaFiltroId] = useState(null);
  const [medicosComProLaboreFiltrados, setMedicosComProLaboreFiltrados] = useState([]);
  
  const [dadosApoio, setDadosApoio] = useState({
    medicos: [],
    empresas: [],
    tabelasINSS: { proLabore: [], empregados: [], tetoContribuicao: null },
    tabelasIRRF: { faixas: [], deducaoDependente: 0 },
    vinculosFiscaisPorMedico: {},
    currentUser: null,
  });

  const [isLoading, setIsLoading] = useState(false); // Para a busca principal
  const [isLoadingData, setIsLoadingData] = useState(true); // Para carregamento inicial de dados de apoio
  const [error, setError] = useState("");
  const [historicoCalculos, setHistoricoCalculos] = useState([]);

  const [medicoParaSimulacao, setMedicoParaSimulacao] = useState(null);
  const [empresaParaSimulacao, setEmpresaParaSimulacao] = useState(null);
  const [showSimulacaoModal, setShowSimulacaoModal] = useState(false);

  // Carregar dados iniciais (Médicos, Empresas, Usuário, Histórico)
  useEffect(() => {
    const loadBaseData = async () => {
      setIsLoadingData(true);
      setError("");
      try {
        const [medicosData, empresasData, currentUserData, historicoData] = await Promise.all([
          Medico.filter({ ativo: true }, "nome"),
          Empresa.filter({ ativo: true }, "nome_fantasia"),
          User.me(),
          ResultadoCalculoProLabore.filter({ status: "consolidado" }, "-data_calculo", 20),
        ]);

        setDadosApoio(prev => ({
          ...prev,
          medicos: medicosData,
          empresas: empresasData,
          currentUser: currentUserData,
        }));
        setHistoricoCalculos(historicoData);

        if (empresasData.length > 0 && !empresaFiltroId) {
          setEmpresaFiltroId(empresasData[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar dados base:", err);
        setError("Falha ao carregar dados de apoio. Tente recarregar.");
      } finally {
        setIsLoadingData(false);
      }
    };
    loadBaseData();
  }, [empresaFiltroId]);

  // Carregar tabelas fiscais quando a competência mudar
  const loadTabelasFiscaisDaCompetencia = useCallback(async (comp) => {
    if (!comp) return;
    setIsLoading(true); // Ativar loading aqui para tabelas
    setError(""); 
    console.log(`[loadTabelasFiscais] Carregando tabelas para competência: ${comp}`);
    try {
      const vigenciaData = parseISO(`${comp}-01`);
      if (!isValid(vigenciaData)) {
        setError(`Competência inválida: ${comp}`);
        setIsLoading(false);
        return;
      }

      const [todasTabelasINSS, todasTabelasIRRF] = await Promise.all([
        TabelaINSS.list(),
        TabelaIRRF.list()
      ]);

      console.log(`[loadTabelasFiscais] Todas Tabelas INSS Raw: ${todasTabelasINSS.length} encontradas`);
      console.log(`[loadTabelasFiscais] Todas Tabelas IRRF Raw: ${todasTabelasIRRF.length} encontradas`);

      const tabelaINSSEmpregados = todasTabelasINSS
        .filter(t => {
          if (!t.vigencia_inicio) return false;
          const inicio = parseISO(t.vigencia_inicio);
          if (!isValid(inicio)) return false;
          const fim = t.vigencia_fim ? parseISO(t.vigencia_fim) : null;
          if (t.vigencia_fim && !isValid(fim)) return false;
          return vigenciaData >= inicio && (!fim || vigenciaData <= fim) && (!t.tipo_contribuinte || t.tipo_contribuinte === "empregado");
        })
        .sort((a, b) => (a.salario_de || 0) - (b.salario_de || 0));

      const tabelaINSSProLabore = todasTabelasINSS
        .filter(t => {
          if (!t.vigencia_inicio) return false;
          const inicio = parseISO(t.vigencia_inicio);
          if (!isValid(inicio)) return false;
          const fim = t.vigencia_fim ? parseISO(t.vigencia_fim) : null;
          if (t.vigencia_fim && !isValid(fim)) return false;
          return vigenciaData >= inicio && (!fim || vigenciaData <= fim) && t.tipo_contribuinte === "pro_labore";
        })
        .sort((a, b) => (a.salario_de || 0) - (b.salario_de || 0));
      
      console.log(`[loadTabelasFiscais] Tabela INSS Pró-Labore para ${comp}:`, JSON.parse(JSON.stringify(tabelaINSSProLabore)));
      console.log(`[loadTabelasFiscais] Tabela INSS Empregados para ${comp}:`, JSON.parse(JSON.stringify(tabelaINSSEmpregados)));

      let tetoContribuicaoINSS = null;
      const proLaboreTetoEntry = tabelaINSSProLabore.find(f => f.teto_contribuicao !== undefined && f.teto_contribuicao !== null && f.teto_contribuicao > 0);
      if (proLaboreTetoEntry) {
          tetoContribuicaoINSS = proLaboreTetoEntry.teto_contribuicao;
      } else {
          const empregadoTetoEntry = tabelaINSSEmpregados.find(f => f.teto_contribuicao !== undefined && f.teto_contribuicao !== null && f.teto_contribuicao > 0);
          if (empregadoTetoEntry) {
              tetoContribuicaoINSS = empregadoTetoEntry.teto_contribuicao;
          } else if (tabelaINSSEmpregados.length > 0 && tabelaINSSEmpregados.some(f => f.salario_ate !== null && f.salario_ate > 0)) {
              tetoContribuicaoINSS = Math.max(...tabelaINSSEmpregados.filter(f => f.salario_ate !== null).map(t => t.salario_ate || 0));
          } else if (tabelaINSSProLabore.length > 0 && tabelaINSSProLabore.some(f => f.salario_ate !== null && f.salario_ate > 0)) {
              tetoContribuicaoINSS = Math.max(...tabelaINSSProLabore.filter(f => f.salario_ate !== null).map(t => t.salario_ate || 0));
          }
      }
      console.log(`[loadTabelasFiscais] Teto INSS determinado para ${comp}: ${tetoContribuicaoINSS}`);

      const tabelaIRRFVigenteRaw = todasTabelasIRRF
        .filter(t => {
          if (!t.vigencia_inicio) return false;
          const inicio = parseISO(t.vigencia_inicio);
          if (!isValid(inicio)) return false;
          const fim = t.vigencia_fim ? parseISO(t.vigencia_fim) : null;
          if (t.vigencia_fim && !isValid(fim)) return false;
          return vigenciaData >= inicio && (!fim || vigenciaData <= fim);
        })
        .sort((a, b) => (a.base_calculo_de || 0) - (b.base_calculo_de || 0));
      
      // CORREÇÃO DO ERRO DE DIGITAÇÃO AQUI:
      const valorDeducaoDependente = tabelaIRRFVigenteRaw.length > 0 ? (tabelaIRRFVigenteRaw[0].valor_deducao_dependente || 0) : 0;
      console.log(`[loadTabelasFiscais] Tabela IRRF Vigente para ${comp}:`, JSON.parse(JSON.stringify(tabelaIRRFVigenteRaw)));
      console.log(`[loadTabelasFiscais] Valor Dedução Dependente: ${valorDeducaoDependente}`);


      setDadosApoio(prev => ({
        ...prev,
        tabelasINSS: {
          empregados: tabelaINSSEmpregados,
          proLabore: tabelaINSSProLabore,
          tetoContribuicao: tetoContribuicaoINSS
        },
        tabelasIRRF: {
          faixas: tabelaIRRFVigenteRaw,
          deducaoDependente: valorDeducaoDependente 
        }
      }));

    } catch (err) {
      console.error("Erro ao carregar tabelas fiscais:", err);
      setError(`Falha ao carregar tabelas fiscais para a competência: ${err.message}.`);
      setDadosApoio(prev => ({ 
        ...prev,
        tabelasINSS: { empregados: [], proLabore: [], tetoContribuicao: null },
        tabelasIRRF: { faixas: [], deducaoDependente: 0 }
      }));
    } finally {
      setIsLoading(false); // Desativar loading ao final
    }
  }, []);

  useEffect(() => {
    if (competencia) {
      loadTabelasFiscaisDaCompetencia(competencia);
    }
  }, [competencia, loadTabelasFiscaisDaCompetencia]);

  // Buscar médicos com lançamentos
  const handleBuscarMedicosComLancamentos = useCallback(async () => {
    if (!competencia || !empresaFiltroId) {
      setError("Por favor, selecione a competência e a empresa.");
      setMedicosComProLaboreFiltrados([]);
      return;
    }
    setIsLoading(true);
    setError("");
    setMedicosComProLaboreFiltrados([]);

    const empresaSelecionada = dadosApoio.empresas.find(e => e.id === empresaFiltroId);
    console.log(`[CalculoPLPage] Buscando Pró-Labores para Competência: ${competencia}, Empresa Selecionada: ${empresaSelecionada?.nome_fantasia || empresaFiltroId} (ID: ${empresaFiltroId})`);

    try {
      // PASSO 1: Buscar TODOS os pró-labores para a competência
      const todosProLaboresDaCompetencia = await ProLabore.filter({ competencia: competencia });
      console.log(`[CalculoPLPage] ${todosProLaboresDaCompetencia.length} Pró-Labores encontrados APENAS por competência (${competencia}):`, JSON.parse(JSON.stringify(todosProLaboresDaCompetencia)));

      if (todosProLaboresDaCompetencia.length === 0) {
        setError(`Nenhum lançamento de pró-labore encontrado para a competência ${formatCompetencia(competencia)}.`);
        setIsLoading(false);
        return;
      }

      // PASSO 2: Filtrar no lado do cliente pela empresa (pagadora OU beneficiária)
      console.log(`[CalculoPLPage] Filtrando manualmente por Empresa ID: ${empresaFiltroId}`);
      const proLaboresFiltradosManualmente = todosProLaboresDaCompetencia.filter(pl => {
        const pagadoraMatch = pl.empresa_pagamento_id === empresaFiltroId;
        const beneficiariaMatch = pl.empresa_beneficiaria_id === empresaFiltroId;
        // Log para cada pró-labore verificado
        console.log(`[CalculoPLPage - Filtro Manual Check] PL ID: ${pl.id}, Pagadora: ${pl.empresa_pagamento_id} (Match: ${pagadoraMatch}), Beneficiária: ${pl.empresa_beneficiaria_id} (Match: ${beneficiariaMatch})`);
        return pagadoraMatch || beneficiariaMatch;
      });
      
      console.log(`[CalculoPLPage] ${proLaboresFiltradosManualmente.length} Pró-Labores após filtro manual por empresa:`, JSON.parse(JSON.stringify(proLaboresFiltradosManualmente)));

      if (proLaboresFiltradosManualmente.length === 0) {
        setError(`Nenhum lançamento de pró-labore encontrado para ${empresaSelecionada?.nome_fantasia || 'empresa selecionada'} na competência ${formatCompetencia(competencia)} após filtro manual.`);
        setIsLoading(false);
        return;
      }
      
      const medicoIds = [...new Set(proLaboresFiltradosManualmente.map(p => p.medico_id))];
      const medicosFiltradosAtivos = dadosApoio.medicos.filter(m => medicoIds.includes(m.id) && m.ativo);
      
      console.log(`[CalculoPLPage] Médicos Ativos com Pró-Labore (após filtro manual):`, JSON.parse(JSON.stringify(medicosFiltradosAtivos.map(m => ({id: m.id, nome: m.nome})))));

      if (medicosFiltradosAtivos.length === 0) {
         setError(`Lançamentos encontrados, mas nenhum médico associado está ativo ou cadastrado. Verifique os médicos.`);
         setIsLoading(false);
         return;
      }

      // PASSO 3: Carregar vínculos fiscais para os médicos encontrados E cálculos consolidados existentes
      // Esta etapa é mantida para garantir que todos os dados fiscais externos e internos sejam carregados de forma abrangente
      const promisesForMedicosData = medicosFiltradosAtivos.map(async (med) => {
        // Fetch traditional fiscal links
        const vinculos = await VinculoFiscalMedico.filter({ medico_id: med.id, ativo: true });
        const inicioCompCalc = startOfMonth(parseISO(`${competencia}-01`));
        const fimCompCalc = endOfMonth(parseISO(`${competencia}-01`));
        const vinculosAtivosNaCompetencia = vinculos.filter(v => {
          if (!v.competencia_inicio || !isValid(parseISO(v.competencia_inicio))) return false;
          const inicioVinc = parseISO(v.competencia_inicio);
          const fimVinc = v.competencia_fim && isValid(parseISO(v.competencia_fim)) ? parseISO(v.competencia_fim) : null;
          return inicioVinc <= fimCompCalc && (!fimVinc || fimVinc >= inicioCompCalc);
        });

        // Fetch existing consolidated calculations for this medico and competence
        // This fetches ALL consolidated calculations for the medico in the given competence
        const calculosConsolidados = await ResultadoCalculoProLabore.filter({ 
          medico_id: med.id, 
          competencia_prolabore: competencia, 
          status: "consolidado" 
        });

        // Enrich consolidated calculations with company name for display/logging
        const calculosConsolidadosEnriched = calculosConsolidados.map(calc => {
          const empresaCalc = dadosApoio.empresas.find(e => e.id === calc.empresa_id);
          return {
            ...calc,
            empresa_nome: empresaCalc ? (empresaCalc.nome_fantasia || empresaCalc.razao_social) : "Empresa Desconhecida",
          };
        });

        return {
          medicoId: med.id,
          vinculos: vinculosAtivosNaCompetencia,
          calculosConsolidados: calculosConsolidadosEnriched,
        };
      });

      const allMedicosData = await Promise.all(promisesForMedicosData);
      
      const vinculosFiscaisAtualizados = {};
      const calculosConsolidadosPorMedico = {}; // Stores all enriched consolidated calculations for each medico
      allMedicosData.forEach(data => {
        vinculosFiscaisAtualizados[data.medicoId] = data.vinculos;
        calculosConsolidadosPorMedico[data.medicoId] = data.calculosConsolidados;
      });

      setDadosApoio(prev => ({ 
        ...prev, 
        vinculosFiscaisPorMedico: vinculosFiscaisAtualizados,
      }));
      console.log("[CalculoPLPage] Vínculos Fiscais Atualizados:", JSON.parse(JSON.stringify(vinculosFiscaisAtualizados)));
      console.log("[CalculoPLPage] Cálculos Consolidados Por Médico (Completos):", JSON.parse(JSON.stringify(calculosConsolidadosPorMedico)));
            
      // PASSO 4: Preparar médicos para a listagem
      // Aqui, filtramos os cálculos consolidados para incluir apenas os de OUTRAS empresas,
      // conforme o requisito de "vínculos fiscais internos do sistema" para a simulação.
      const medicosParaLista = medicosFiltradosAtivos.map(med => {
        const proLaboresDoMedicoNestaEmpresa = proLaboresFiltradosManualmente.filter(p => p.medico_id === med.id);
        const valorTotalProLabore = proLaboresDoMedicoNestaEmpresa.reduce((sum, pl) => sum + (pl.valor_bruto || 0), 0);
        
        const calculoExistente = historicoCalculos.find(hc => 
            hc.medico_id === med.id && 
            hc.empresa_id === empresaFiltroId && 
            hc.competencia_prolabore === competencia &&
            hc.status === "consolidado"
        );

        // Filter consolidated calculations to exclude the current company's calculations
        // These are already enriched with company names from the previous step (calculosConsolidadosEnriched)
        const calculosConsolidadosParaOutrasEmpresas = (calculosConsolidadosPorMedico[med.id] || []).filter(calc => 
            calc.empresa_id !== empresaFiltroId
        );

        return {
          ...med,
          proLaboresOriginais: proLaboresDoMedicoNestaEmpresa, 
          valorProLaboreEmpresaAtual: valorTotalProLabore,
          statusCalculo: calculoExistente ? "Calculado" : (valorTotalProLabore > 0 ? "Pendente" : "Sem Lançamento"), 
          calculoId: calculoExistente ? calculoExistente.id : null,
          calculosConsolidadosExistentes: calculosConsolidadosParaOutrasEmpresas, // Attach ONLY calculations from other companies
        };
      }).filter(m => m.valorProLaboreEmpresaAtual > 0 || m.statusCalculo === "Calculado"); 

      console.log("[CalculoPLPage] Médicos para Listagem Final (após filtro manual):", JSON.parse(JSON.stringify(medicosParaLista.map(m => ({id:m.id, nome:m.nome, valor: m.valorProLaboreEmpresaAtual})))));
      setMedicosComProLaboreFiltrados(medicosParaLista);
      if (medicosParaLista.length === 0) {
        setError(`Pró-labores encontrados, mas nenhum médico se qualificou para exibição nesta empresa/competência (após filtro manual).`);
      }

    } catch (err) {
      console.error("Erro em handleBuscarMedicosComLancamentos:", err);
      setError(`Falha ao buscar dados: ${err.message}.`);
    } finally {
      setIsLoading(false);
    }
  }, [competencia, empresaFiltroId, dadosApoio.empresas, dadosApoio.medicos, historicoCalculos]);
  
  // Carregar histórico consolidado (apenas na montagem inicial ou refresh manual)
  const loadHistoricoConsolidado = useCallback(async () => {
    try {
        const historico = await ResultadoCalculoProLabore.filter({ status: "consolidado" }, "-data_calculo", 20);
        setHistoricoCalculos(historico);
    } catch(err) {
        console.error("Erro ao carregar histórico:", err);
    }
  }, []);


  // Abrir/Fechar Modal
  const handleAbrirSimulacao = (medico) => {
    const empresaSel = dadosApoio.empresas.find(e => e.id === empresaFiltroId);
    if (medico && empresaSel && competencia) {
      setMedicoParaSimulacao(medico);
      setEmpresaParaSimulacao(empresaSel);
      setShowSimulacaoModal(true);
    } else {
      setError("Não foi possível abrir simulação. Verifique filtros.");
    }
  };

  const handleFecharSimulacao = () => {
    setShowSimulacaoModal(false);
    setMedicoParaSimulacao(null);
    setEmpresaParaSimulacao(null);
  };

  // Salvar Cálculo Simulado
  const handleSalvarCalculoSimulado = useCallback(async (simulacaoDataModal) => {
    const currentUser = dadosApoio.currentUser;
    if (!simulacaoDataModal || !medicoParaSimulacao || !empresaParaSimulacao || !currentUser) {
        setError("Dados insuficientes para salvar o cálculo.");
        return;
    }

    setIsLoading(true); // Usar loading principal para salvar
    setError("");

    try {
      const resultadoMestre = {
        competencia_prolabore: competencia,
        data_calculo: new Date().toISOString(),
        medico_id: medicoParaSimulacao.id,
        empresa_id: empresaParaSimulacao.id,
        total_bruto_pro_labore_atividades: simulacaoDataModal.proLaboreBrutoAtual,
        total_descontos_inss_medico: simulacaoDataModal.inssAReter,
        total_descontos_irrf_medico: simulacaoDataModal.irrfAReter,
        valor_liquido_total_pago: simulacaoDataModal.totalLiquido,
        status: "consolidado",
        usuario_responsavel_id: currentUser.id,
        nome_usuario_responsavel: currentUser?.nome_completo || currentUser?.email,
        parametros_simulacao: {
            ...simulacaoDataModal.aliquotas_e_parametros_aplicados,
            vinculos_considerados_ids: (simulacaoDataModal.vinculosExternos || []).map(v => v.id),
            calculos_consolidados_considerados_ids: (simulacaoDataModal.calculosConsolidadosExternos || []).map(c => c.id), // Store IDs of internal calculations considered
        },
        observacoes: `Cálculo consolidado: ${medicoParaSimulacao.nome}, ${empresaParaSimulacao.nome_fantasia}, Comp: ${formatCompetencia(competencia)}`
      };
      const mestreCriado = await ResultadoCalculoProLabore.create(resultadoMestre);

      const itensPromises = (simulacaoDataModal.proLaboresOriginaisConsiderados || []).map(plOriginal => {
          const itemCalculado = {
            resultado_calculo_pro_labore_id: mestreCriado.id,
            prolabore_id: plOriginal.id,
            medico_id: medicoParaSimulacao.id,
            empresa_pagadora_id: empresaParaSimulacao.id, // Assumindo que é a empresa da simulação
            competencia: competencia,
            valor_bruto_item: plOriginal.valor_bruto,
            // Valores de INSS e IRRF são totais no mestre, aqui poderiam ser rateados se necessário,
            // mas para pró-labore, geralmente é um único bloco de cálculo.
            // Simplificando: valores individuais de retenção são os totais do mestre se só houver este item, 
            // ou precisariam de rateio se vários pró-labores fossem somados ANTES do cálculo dos impostos.
            // Por ora, vamos focar no total. Se o pró-labore bruto já é o total da empresa, então as retenções são sobre ele.
            valor_base_calculo_inss: plOriginal.tributavel ? plOriginal.valor_bruto : 0, 
            valor_inss_retido_medico: plOriginal.tributavel ? simulacaoDataModal.inssAReter : 0, // Simplificação
            valor_irrf_retido_medico: plOriginal.tributavel ? simulacaoDataModal.irrfAReter : 0, // Simplificação
            valor_liquido_pago_item: plOriginal.tributavel ? (plOriginal.valor_bruto - simulacaoDataModal.inssAReter - simulacaoDataModal.irrfAReter) : plOriginal.valor_bruto, // Simplificação
            aliquotas_aplicadas_info: JSON.stringify(simulacaoDataModal.aliquotas_e_parametros_aplicados)
          };
          return ItemCalculadoProLabore.create(itemCalculado);
      });
      await Promise.all(itensPromises);
      
      // Atualizar os pró-labores originais com o ID do cálculo
      const updateProLaboresPromises = (simulacaoDataModal.proLaboresOriginaisConsiderados || []).map(plOriginal => 
        ProLabore.update(plOriginal.id, { resultado_calculo_pro_labore_id: mestreCriado.id })
      );
      await Promise.all(updateProLaboresPromises);
      
      alert("Cálculo consolidado e salvo com sucesso!");
      handleFecharSimulacao();
      await loadHistoricoConsolidado(); // Recarrega o histórico
      await handleBuscarMedicosComLancamentos(); // Recarrega a lista de médicos

    } catch (err) {
      console.error("Erro ao salvar cálculo consolidado:", err);
      setError(`Falha ao salvar cálculo: ${err.message}.`);
    } finally {
      setIsLoading(false);
    }
  }, [dadosApoio.currentUser, medicoParaSimulacao, empresaParaSimulacao, competencia, loadHistoricoConsolidado, handleBuscarMedicosComLancamentos]);

  // Renderizar Histórico
  const renderHistoricoCalculos = () => {
    if (historicoCalculos.length === 0) {
      return <p className="text-center text-slate-500 py-4">Nenhum cálculo consolidado recente.</p>;
    }
    return (
      <Table size="sm">
        <TableHeader>
          <TableRow>
            <TableHead>Competência</TableHead>
            <TableHead>Médico</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-right">Líquido</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historicoCalculos.map((calc) => {
            const medicoHist = dadosApoio.medicos.find(m => m.id === calc.medico_id);
            const empresaHist = dadosApoio.empresas.find(e => e.id === calc.empresa_id);
            return (
            <TableRow key={calc.id}>
              <TableCell>{formatCompetencia(calc.competencia_prolabore)}</TableCell>
              <TableCell>{medicoHist?.nome || "N/A"}</TableCell>
              <TableCell>{empresaHist?.nome_fantasia || "N/A"}</TableCell>
              <TableCell className="text-right font-semibold text-green-600">{formatCurrency(calc.valor_liquido_total_pago)}</TableCell>
              <TableCell>{format(parseISO(calc.data_calculo), "dd/MM/yy HH:mm")}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Detalhes do cálculo ${calc.id}`)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Cálculo de Pró-labore</h1>
          <p className="text-slate-600 mt-1">Simule e consolide o pró-labore por médico e empresa.</p>
        </div>
      </div>

      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Filter className="h-5 w-5" />
            Filtros para Busca
          </CardTitle>
          <CardDescription>Selecione competência e empresa para listar médicos com pró-labore.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="competencia-filtro">Competência <span className="text-red-500">*</span></Label>
              <Input
                id="competencia-filtro"
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                disabled={isLoadingData || isLoading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="empresa-filtro-select">Empresa <span className="text-red-500">*</span></Label>
              <Select
                value={empresaFiltroId || ""}
                onValueChange={setEmpresaFiltroId}
                disabled={isLoadingData || isLoading || dadosApoio.empresas.length === 0}
              >
                <SelectTrigger id="empresa-filtro-select" className="mt-1">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {dadosApoio.empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome_fantasia || emp.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleBuscarMedicosComLancamentos}
                disabled={isLoading || isLoadingData || !competencia || !empresaFiltroId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <SearchIcon className="h-5 w-5 mr-2" />}
                Buscar Lançamentos
              </Button>
            </div>
        </CardContent>
      </Card>
        
      {error && !isLoading && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(!isLoading && medicosComProLaboreFiltrados.length > 0) && (
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-slate-800">
              Médicos com Pró-Labore ({medicosComProLaboreFiltrados.length})
            </CardTitle>
            <CardDescription>
              Para {dadosApoio.empresas.find(e=>e.id === empresaFiltroId)?.nome_fantasia || 'empresa selecionada'} em {formatCompetencia(competencia)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead className="text-right">Valor Pró-Labore (Nesta Empresa)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicosComProLaboreFiltrados.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.nome}</TableCell>
                    <TableCell>{med.cpf}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(med.valorProLaboreEmpresaAtual)}</TableCell>
                    <TableCell>
                      <Badge variant={med.statusCalculo === "Calculado" ? "success" : med.statusCalculo === "Pendente" ? "warning" : "outline"}>
                        {med.statusCalculo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {med.statusCalculo === "Calculado" ? (
                        <Button variant="outline" size="sm" onClick={() => alert(`Ver Cálculo ID: ${med.calculoId}`)}>
                          <Eye className="h-4 w-4 mr-1" /> Visualizar
                        </Button>
                      ) : (
                        <Button variant="default" size="sm" onClick={() => handleAbrirSimulacao(med)} disabled={med.valorProLaboreEmpresaAtual === 0} className="bg-orange-500 hover:bg-orange-600">
                            <Calculator className="h-4 w-4 mr-1" /> Simular
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {(!isLoading && medicosComProLaboreFiltrados.length === 0 && !error && !isLoadingData && competencia && empresaFiltroId ) && (
           <Card className="shadow-md border-0">
                <CardContent className="text-center py-10 text-slate-500">
                    <UserIcon className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                    <p>Nenhum médico com lançamento de pró-labore qualificado para os filtros selecionados.</p>
                    <p className="text-sm">Verifique os lançamentos ou os filtros de competência e empresa.</p>
                </CardContent>
            </Card>
      )}
      
      <Card className="shadow-xl border-0 mt-8">
          <CardHeader>
               <CardTitle className="text-xl flex items-center gap-2 text-slate-700">
                  <History className="h-5 w-5 text-blue-600" />
                  Histórico de Cálculos Consolidados (Últimos 20)
              </CardTitle>
          </CardHeader>
          <CardContent>
               {isLoadingData ? <p className="text-center text-slate-500 py-4">Carregando histórico...</p> : renderHistoricoCalculos()}
          </CardContent>
      </Card>
      
      <Alert className="bg-blue-50 border-blue-200 mt-8 text-sm">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-700 font-semibold">Informações sobre o Cálculo de Pró-Labore</AlertTitle>
        <AlertDescription className="text-blue-600 space-y-1 mt-1">
          <p><strong>INSS:</strong> Aplicada alíquota de 11% sobre o valor bruto do pró-labore tributável, limitada ao teto de contribuição da previdência. Vínculos externos e <strong>cálculos consolidados anteriores no sistema</strong> são considerados para abatimento do teto.</p>
          <p><strong>IRRF:</strong> Calculado sobre a base (pró-labore bruto - INSS retido), somada às bases de IRRF de vínculos externos (líquidas de seus INSS) e <strong>de cálculos consolidados anteriores no sistema</strong>. Aplica-se a tabela progressiva e deduções (dependentes). IRRF retido externamente é deduzido.</p>
        </AlertDescription>
      </Alert>

      {/* Modal de Simulação */}
      {showSimulacaoModal && medicoParaSimulacao && empresaParaSimulacao && (
        <Dialog open={showSimulacaoModal} onOpenChange={(open) => { if(!open) handleFecharSimulacao(); }}>
            <SimulacaoProLaboreModal
                medico={medicoParaSimulacao}
                empresa={empresaParaSimulacao}
                competencia={competencia}
                dadosApoio={dadosApoio}
                onClose={handleFecharSimulacao}
                onSalvarCalculo={handleSalvarCalculoSimulado}
            />
        </Dialog>
      )}
    </div>
  );
}
