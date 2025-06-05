
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart3,
  Filter,
  Users,
  Building2,
  Loader2,
  AlertTriangle,
  Paperclip,
  UserCircle 
} from "lucide-react";
import {
  Medico,
  Empresa,
  Hospital as HospitalEntity,
  Plantao,
  ProcedimentoParticular,
  ProducaoAdministrativa,
  DescontoCredito,
  Contrato
} from "@/api/entities";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import RelatorioProducaoMedico from "../components/relatorios/RelatorioProducaoMedico";
import RelatorioFinanceiroConsolidado from "../components/relatorios/RelatorioFinanceiroConsolidado";
import RelatorioProcedimentosParticulares from "../components/relatorios/RelatorioProcedimentosParticulares";
import RelatorioIndividualProducao from "../components/relatorios/RelatorioIndividualProducao";

// Funções utilitárias
const formatCurrency = (value, fallback = "R$ 0,00") => {
  if (value === null || value === undefined || isNaN(Number(value))) return fallback;
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatCompetencia = (competencia) => {
  if (!competencia) return "N/A";
  try {
    const [year, month] = competencia.split('-');
    return format(parseISO(`${year}-${month}-01`), "MMMM/yyyy");
  } catch {
    return competencia;
  }
};


const TIPOS_RELATORIO = {
  PRODUCAO_MEDICO: "producao_medico",
  FINANCEIRO_CONSOLIDADO: "financeiro_consolidado",
  PROCEDIMENTOS_PARTICULARES: "procedimentos_particulares",
  INDIVIDUAL_PRODUCAO: "individual_producao", // Novo tipo
};

const getNomeTipoRelatorio = (tipo) => {
  switch (tipo) {
    case TIPOS_RELATORIO.PRODUCAO_MEDICO:
      return "Produção Mensal por Médico";
    case TIPOS_RELATORIO.FINANCEIRO_CONSOLIDADO:
      return "Financeiro Consolidado por Empresa";
    case TIPOS_RELATORIO.PROCEDIMENTOS_PARTICULARES:
      return "Detalhado de Procedimentos Particulares";
    case TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO: // Novo
      return "Relatório Individual de Produção Médica";
    default:
      return "Relatório";
  }
};

export default function RelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState(TIPOS_RELATORIO.PRODUCAO_MEDICO);
  
  // Filtros Comuns
  const [competencia, setCompetencia] = useState(format(new Date(), "yyyy-MM"));
  const [medicoId, setMedicoId] = useState(null); // "ALL" ou ID
  const [empresaId, setEmpresaId] = useState(null); // "ALL" ou ID
  const [hospitalId, setHospitalId] = useState(null); // "ALL" ou ID
  
  // Novos estados para datas de pagamento do relatório individual
  const [dataPagamentoProLabore, setDataPagamentoProLabore] = useState('');
  const [dataPagamentoProducao, setDataPagamentoProducao] = useState('');

  // Dados para dropdowns
  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [hospitais, setHospitais] = useState([]);

  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [reportData, setReportData] = useState(null); // Para os relatórios antigos
  const [triggerReportGeneration, setTriggerReportGeneration] = useState(0); // Para o novo relatório
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    const loadFilterData = async () => {
      setIsLoadingFilters(true);
      try {
        const recordLimit = 500; // Define a limit for records to fetch for filters
        const [medicosData, empresasData, hospitaisData] = await Promise.all([
          Medico.filter({ ativo: true }, "nome", recordLimit),
          Empresa.filter({ ativo: true }, "nome_fantasia", recordLimit),
          HospitalEntity.filter({ ativo: true }, "nome", recordLimit),
        ]);
        setMedicos(medicosData);
        setEmpresas(empresasData);
        setHospitais(hospitaisData);
        // if (medicosData.length > 0 && !medicoId) { // Pré-selecionar médico se o relatório individual for o padrão
        //   setMedicoId(medicosData[0].id); // Ou deixar como "Todos"
        // }
      } catch (error) {
        console.error("Erro ao carregar dados de filtro:", error);
        let errorMessage = "Falha ao carregar opções de filtro.";
        if (error.message) {
          errorMessage += ` Detalhe: ${error.message}`;
        }
        setReportError(errorMessage);
      } finally {
        setIsLoadingFilters(false);
      }
    };
    loadFilterData();
  }, []);

  const getEmpresaName = (id) => {
    const emp = empresas.find(e => e.id === id);
    return emp ? (emp.nome_fantasia || emp.razao_social) : "N/A";
  };
  
  const getMedicoName = (id) => {
    const med = medicos.find(m => m.id === id);
    return med ? med.nome : "N/A";
  };

  const handleGerarRelatorio = async () => {
    if (tipoRelatorio === TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO) {
      setReportError(""); // Clear any previous errors first
      setReportData(null); // Clear data from other report types
      setIsLoadingReport(true); // Indicate loading for the new report type (briefly for the parent UI)

      if (!medicoId || medicoId === "ALL") {
        setReportError("Por favor, selecione um médico para o Relatório Individual.");
        setIsLoadingReport(false);
        return;
      }
      if (!competencia) {
        setReportError("Por favor, selecione a competência para o Relatório Individual.");
        setIsLoadingReport(false);
        return;
      }
      // As datas de pagamento são opcionais, mas devem ser válidas se preenchidas.
      if (dataPagamentoProLabore && isNaN(parseISO(dataPagamentoProLabore).getTime())) {
        setReportError("Data de pagamento do pró-labore inválida.");
        setIsLoadingReport(false);
        return;
      }
      if (dataPagamentoProducao && isNaN(parseISO(dataPagamentoProducao).getTime())) {
        setReportError("Data de pagamento da produção inválida.");
        setIsLoadingReport(false);
        return;
      }
      
      setTriggerReportGeneration(prev => prev + 1); // Trigger the individual report component
      setIsLoadingReport(false); // Reset loading state here, as the child component will manage its own
      return;
    }

    // Lógica para os relatórios antigos (PRODUCAO_MEDICO, FINANCEIRO_CONSOLIDADO, PROCEDIMENTOS_PARTICULARES)
    setIsLoadingReport(true);
    setReportData(null);
    setReportError("");
    setTriggerReportGeneration(0); // Reset trigger for individual report

    if (!competencia && (tipoRelatorio === TIPOS_RELATORIO.PRODUCAO_MEDICO || tipoRelatorio === TIPOS_RELATORIO.FINANCEIRO_CONSOLIDADO)) {
        setReportError("Por favor, selecione a competência.");
        setIsLoadingReport(false);
        return;
    }
    
    const dataInicio = competencia ? format(startOfMonth(parseISO(`${competencia}-01`)), "yyyy-MM-dd") : null;
    const dataFim = competencia ? format(endOfMonth(parseISO(`${competencia}-01`)), "yyyy-MM-dd") : null;

    try {
      let collectedData = {};
      const commonFilters = {
         ...(medicoId && medicoId !== "ALL" && { medico_id: medicoId }),
         ...(empresaId && empresaId !== "ALL" && { empresa_id: empresaId }), // Para relatórios de empresa
         ...(hospitalId && hospitalId !== "ALL" && { hospital_id: hospitalId }),
      };
      
      const reportDataLimit = 2000; // Limite para dados do relatório

      // Coletar todos os dados de uma vez para evitar múltiplas chamadas
      const [
          allPlantoes,
          allProcedimentos,
          allProducaoAdm,
          allDescontosCreditos,
          allContratos
      ] = await Promise.all([
          Plantao.filter({ confirmado: true }, "-data_plantao", reportDataLimit),
          ProcedimentoParticular.filter({ confirmado: true }, "-data_procedimento", reportDataLimit),
          ProducaoAdministrativa.filter({ confirmado: true }, "-data_atividade", reportDataLimit),
          DescontoCredito.list("-created_date", reportDataLimit), // Descontos não têm "confirmado"
          Contrato.filter({ativo: true}, null, reportDataLimit) // Adicionado limite
      ]);

      const filterByCompetencia = (item) => {
        if (!dataInicio || !dataFim) return true; // Se não houver competência, não filtra por ela
        const itemDate = item.data_plantao || item.data_procedimento || item.data_atividade || item.data_referencia; // Adicionar data_referencia para prolabore
        if (!itemDate && item.competencia) { // Fallback para campo competencia se data específica não existir
            return item.competencia === competencia;
        }
        if (!itemDate) return false; // Se não tem data nem competencia, não incluir
        
        const parsedItemDate = parseISO(itemDate);
        return parsedItemDate >= parseISO(dataInicio) && parsedItemDate <= parseISO(dataFim);
      };
      
      const filterByCommon = (item) => {
        let match = true;

        if (commonFilters.medico_id && item.medico_id !== commonFilters.medico_id) {
          match = false;
        }
        
        // Filtro de empresa_id e hospital_id para diferentes tipos de lançamento
        if (item.contrato_id) { // Entidades vinculadas a contratos (ex: plantões)
            const contratoDoItem = allContratos.find(c => c.id === item.contrato_id);
            if (contratoDoItem) {
                if (commonFilters.empresa_id && contratoDoItem.empresa_id !== commonFilters.empresa_id) match = false;
                if (commonFilters.hospital_id && contratoDoItem.hospital_id !== commonFilters.hospital_id) match = false;
            } else {
                // If a plantao has a contract_id but the contract isn't found, assume it doesn't match for safety.
                if (commonFilters.empresa_id || commonFilters.hospital_id) match = false; 
            }
        } else { // Entidades com empresa_id/hospital_id direto (ex: procedimentos particulares, produção administrativa)
            if (commonFilters.empresa_id) {
                let itemEmpresaId = item.empresa_pagamento_id || item.empresa_id;
                if (itemEmpresaId !== commonFilters.empresa_id) match = false;
            }
            if (commonFilters.hospital_id && item.hospital_id !== commonFilters.hospital_id) {
                match = false;
            }
        }
        return match;
      };

      collectedData.plantoes = allPlantoes.filter(filterByCompetencia).filter(filterByCommon);
      collectedData.procedimentos = allProcedimentos.filter(filterByCompetencia).filter(filterByCommon);
      collectedData.producaoAdministrativa = allProducaoAdm.filter(filterByCompetencia).filter(filterByCommon);
      collectedData.descontosCreditos = allDescontosCreditos.filter(filterByCompetencia).filter(filterByCommon);

      // Para enriquecer dados
      collectedData.medicos = medicos;
      collectedData.empresas = empresas;
      collectedData.hospitais = hospitais;
      collectedData.contratos = allContratos; // Passar contratos para os relatórios
      
      setReportData(collectedData);

    } catch (error) {
      console.error(`Erro ao gerar ${getNomeTipoRelatorio(tipoRelatorio)}:`, error);
      setReportError(`Falha ao gerar o relatório: ${error.message}`);
    } finally {
      setIsLoadingReport(false);
    }
  };
  
  const renderSelectedReport = () => {
    // Handling general loading state for non-individual reports
    if (isLoadingReport && tipoRelatorio !== TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO) { 
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Gerando relatório, por favor aguarde...</p>
          </div>
        );
    }
    // Handling general error state for non-individual reports
    if (reportError && tipoRelatorio !== TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO) {
        return (
          <Alert variant="destructive" className="my-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Gerar Relatório</AlertTitle>
            <AlertDescription>{reportError}</AlertDescription>
          </Alert>
        );
    }

    // Specific rendering logic for the Individual Production Report
    if (tipoRelatorio === TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO) {
      if (reportError) { // This error comes from parent's validation in handleGerarRelatorio
        return (
           <Alert variant="destructive" className="my-6">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Erro na Seleção de Filtros</AlertTitle>
             <AlertDescription>{reportError}</AlertDescription>
           </Alert>
        );
      }
      // Render the individual report component when triggered and valid filters are present
      return triggerReportGeneration > 0 && medicoId && medicoId !== "ALL" && competencia ? (
        <RelatorioIndividualProducao 
          medicoId={medicoId} 
          competencia={competencia}
          dataPagamentoProLabore={dataPagamentoProLabore}
          dataPagamentoProducao={dataPagamentoProducao}
          key={triggerReportGeneration} // Forces remounting of the component on trigger change
        />
      ) : ( // Prompt user if no report is triggered yet or filters are missing
        <div className="text-center py-10 text-slate-500">
            <UserCircle className="mx-auto h-12 w-12 mb-4 text-slate-400" />
            <p>Selecione um médico e a competência, e clique em "Gerar Relatório" para visualizar o Recibo Individual.</p>
        </div>
      );
    }

    // Default message for other reports if no data is loaded yet
    if (!reportData) {
        return (
            <div className="text-center py-10 text-slate-500">
                <Filter className="mx-auto h-12 w-12 mb-4 text-slate-400" />
                <p>Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados.</p>
            </div>
        );
    }
    
    // Render traditional reports based on collected reportData
    if (reportData) {
      switch (tipoRelatorio) {
        case TIPOS_RELATORIO.PRODUCAO_MEDICO:
          return <RelatorioProducaoMedico 
                    data={reportData} 
                    competencia={competencia}
                    medicoFiltro={medicoId !== "ALL" ? getMedicoName(medicoId) : "Todos"}
                    empresaFiltro={empresaId !== "ALL" ? getEmpresaName(empresaId) : "Todas"} 
                 />;
        case TIPOS_RELATORIO.FINANCEIRO_CONSOLIDADO:
          return <RelatorioFinanceiroConsolidado 
                    data={reportData} 
                    competencia={competencia} 
                    empresaFiltro={empresaId !== "ALL" ? getEmpresaName(empresaId) : "Todas"} 
                  />;
        case TIPOS_RELATORIO.PROCEDIMENTOS_PARTICULARES:
          return <RelatorioProcedimentosParticulares 
                    data={reportData} 
                    competencia={competencia} 
                    medicoFiltro={medicoId !== "ALL" ? getMedicoName(medicoId) : "Todos"}
                    empresaFiltro={empresaId !== "ALL" ? getEmpresaName(empresaId) : "Todas"}
                 />;
        default:
          return <p className="text-center py-10">Tipo de relatório não selecionado ou inválido.</p>;
      }
    }
    return null;
  };


  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Central de Relatórios
            </h1>
            <p className="text-slate-600 mt-1">Analise a produção médica e financeira com filtros detalhados.</p>
        </div>
        <div className="w-full sm:w-72">
            <Label htmlFor="tipoRelatorio" className="text-sm font-medium text-slate-700">Selecionar Relatório</Label>
            <Select 
                value={tipoRelatorio} 
                onValueChange={(value) => { 
                    setTipoRelatorio(value); 
                    setReportData(null); // Clear previous report data
                    setReportError(''); // Clear previous errors
                    setTriggerReportGeneration(0); // Reset trigger for individual report
                    setIsLoadingReport(false); // Ensure loading is reset
                }}
            >
            <SelectTrigger id="tipoRelatorio" className="mt-1 bg-white">
                <SelectValue placeholder="Selecione um relatório" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={TIPOS_RELATORIO.PRODUCAO_MEDICO}>
                    <div className="flex items-center gap-2"> <Users className="h-4 w-4 text-blue-500"/> {getNomeTipoRelatorio(TIPOS_RELATORIO.PRODUCAO_MEDICO)}</div>
                </SelectItem>
                <SelectItem value={TIPOS_RELATORIO.FINANCEIRO_CONSOLIDADO}>
                    <div className="flex items-center gap-2"> <Building2 className="h-4 w-4 text-green-500"/> {getNomeTipoRelatorio(TIPOS_RELATORIO.FINANCEIRO_CONSOLIDADO)}</div>
                </SelectItem>
                <SelectItem value={TIPOS_RELATORIO.PROCEDIMENTOS_PARTICULARES}>
                    <div className="flex items-center gap-2"> <Paperclip className="h-4 w-4 text-purple-500"/> {getNomeTipoRelatorio(TIPOS_RELATORIO.PROCEDIMENTOS_PARTICULARES)}</div>
                </SelectItem>
                <SelectItem value={TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO}>
                    <div className="flex items-center gap-2"> <UserCircle className="h-4 w-4 text-orange-500"/> {getNomeTipoRelatorio(TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO)}</div>
                </SelectItem>
            </SelectContent>
            </Select>
        </div>
      </header>

      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros para {getNomeTipoRelatorio(tipoRelatorio)}
          </CardTitle>
          <CardDescription>Ajuste os filtros abaixo para refinar os dados do relatório.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div> {/* Competência is always relevant */}
              <Label htmlFor="competencia">Competência</Label>
              <Input
                id="competencia"
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="mt-1"
                disabled={isLoadingFilters}
              />
            </div>
            <div>
              <Label htmlFor="medico">Médico</Label>
              <Select 
                value={medicoId || "ALL"} 
                onValueChange={(val) => setMedicoId(val === "ALL" ? null : val)} 
                disabled={isLoadingFilters || medicos.length === 0}
              >
                <SelectTrigger id="medico" className="mt-1">
                  <SelectValue placeholder="Todos os Médicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Médicos</SelectItem>
                  {medicos.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(tipoRelatorio !== TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO) && ( // Esconder para relatório individual
              <>
                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select value={empresaId || "ALL"} onValueChange={(val) => setEmpresaId(val === "ALL" ? null : val)} disabled={isLoadingFilters}>
                    <SelectTrigger id="empresa" className="mt-1">
                      <SelectValue placeholder="Todas as Empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as Empresas</SelectItem>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome_fantasia || emp.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                { (tipoRelatorio === TIPOS_RELATORIO.PRODUCAO_MEDICO) && // Mostrar filtro de hospital para produção por médico
                  <div>
                    <Label htmlFor="hospital">Hospital (Contrato do Plantão)</Label>
                    <Select value={hospitalId || "ALL"} onValueChange={(val) => setHospitalId(val === "ALL" ? null : val)} disabled={isLoadingFilters}>
                      <SelectTrigger id="hospital" className="mt-1">
                        <SelectValue placeholder="Todos os Hospitais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos os Hospitais</SelectItem>
                        {hospitais.map((hosp) => (
                          <SelectItem key={hosp.id} value={hosp.id}>
                            {hosp.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                }
              </>
            )}

            {tipoRelatorio === TIPOS_RELATORIO.INDIVIDUAL_PRODUCAO && (
              <>
                <div>
                  <Label htmlFor="data-pag-prolabore">Data Pag. Pró-Labore</Label>
                  <Input
                    id="data-pag-prolabore"
                    type="date"
                    value={dataPagamentoProLabore}
                    onChange={(e) => setDataPagamentoProLabore(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="data-pag-producao">Data Pag. Produção</Label>
                  <Input
                    id="data-pag-producao"
                    type="date"
                    value={dataPagamentoProducao}
                    onChange={(e) => setDataPagamentoProducao(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 lg:col-span-1 flex items-end">
                <Button 
                    onClick={handleGerarRelatorio} 
                    disabled={isLoadingFilters || isLoadingReport}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md py-3"
                >
                    {isLoadingReport ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                        <BarChart3 className="h-5 w-5 mr-2" />
                    )}
                    Gerar Relatório
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        {renderSelectedReport()}
      </div>
    </div>
  );
}
