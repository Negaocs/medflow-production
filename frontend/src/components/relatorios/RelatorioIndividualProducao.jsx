
import React, { useState, useEffect } from 'react';
import {
  Medico,
  Empresa,
  Hospital,
  ResultadoCalculoProducao,
  ItemCalculadoProducao,
  ResultadoCalculoProLabore,
  ItemCalculadoProLabore,
  Plantao,
  TipoPlantao,
  Contrato,
  DescontoCredito,
} from '@/api/entities';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Printer, AlertTriangle, Download, FileText, Search } from 'lucide-react';

// Assuming these UI components are available in the project, e.g., from a UI library like shadcn/ui
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { gerarRelatorioPDF } from "@/api/functions";

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
    return format(parseISO(`${year}-${month}-01`), "MMMM/yyyy", { locale: ptBR });
  } catch {
    return competencia;
  }
};

const RelatorioIndividualProducao = () => {
  const [medicos, setMedicos] = useState([]); // State to hold the list of all doctors for the dropdown
  const [medicoSelecionado, setMedicoSelecionado] = useState(null); // State for the currently selected doctor ID
  const [competencia, setCompetencia] = useState(''); // State for the competence input (e.g., "YYYY-MM")
  // These states are now managed internally, previously they were props.
  // They are not set via UI in this version, so they will be empty unless loaded/pre-set.
  const [dataPagamentoProLabore, setDataPagamentoProLabore] = useState('');
  const [dataPagamentoProducao, setDataPagamentoProducao] = useState('');

  const [medicoInfo, setMedicoInfo] = useState(null); // Details of the selected doctor for report display
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Changed to false as initial fetch is manual
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false); // State for PDF generation loading

  // Effect to load all doctors for the selection dropdown on component mount
  useEffect(() => {
    const loadMedicos = async () => {
      try {
        const allMedicos = await Medico.list();
        setMedicos(allMedicos);
      } catch (err) {
        console.error("Erro ao carregar lista de médicos:", err);
        setError("Erro ao carregar lista de médicos.");
      }
    };
    loadMedicos();
  }, []);

  // Function to fetch report data, triggered by "Buscar Dados" button
  const handleBuscarDados = async () => {
    if (!medicoSelecionado || !competencia) {
      setError("Por favor, selecione um médico e informe a competência.");
      setReportData(null); // Clear previous report data if filters are incomplete
      return;
    }

    setIsLoading(true);
    setError('');
    setReportData(null); // Clear previous data before new fetch

    try {
      const medicoDetails = await Medico.get(medicoSelecionado);
      if (!medicoDetails) {
        setError("Médico não encontrado.");
        setIsLoading(false);
        return;
      }
      setMedicoInfo(medicoDetails); // Set medicoInfo for report header and footer

      // --- Sessão 1: Resumo Financeiro ---
      let totalProLaboreLiquido = 0;
      let totalProducaoLiquida = 0;
      const proLaboreResultados = await ResultadoCalculoProLabore.filter({ medico_id: medicoSelecionado, competencia_prolabore: competencia, status: "consolidado" });
      const producaoResultados = await ResultadoCalculoProducao.filter({ medico_id: medicoSelecionado, competencia_producao: competencia, status: "consolidado" });

      const proLaborePorEmpresa = {};
      proLaboreResultados.forEach(r => {
        totalProLaboreLiquido += r.valor_liquido_total_pago || 0;
        if (!proLaborePorEmpresa[r.empresa_id]) proLaborePorEmpresa[r.empresa_id] = { liquido: 0, descontos: { inss: 0, irrf: 0 } };
        proLaborePorEmpresa[r.empresa_id].liquido += r.valor_liquido_total_pago || 0;
        proLaborePorEmpresa[r.empresa_id].descontos.inss += r.total_descontos_inss_medico || 0;
        proLaborePorEmpresa[r.empresa_id].descontos.irrf += r.total_descontos_irrf_medico || 0;
      });
      
      const producaoPorEmpresa = {};
      let totalDescontosInssProducao = 0;
      let totalDescontosIrrfProducao = 0;
      let totalOutrosDescontosProducaoEmpresa = 0; // ISS, Taxa Adm

      for (const resultado of producaoResultados) {
        totalProducaoLiquida += resultado.valor_liquido_total_repasse || 0;
        if (!producaoPorEmpresa[resultado.empresa_id]) producaoPorEmpresa[resultado.empresa_id] = { liquido: 0, bruto: 0 };
        producaoPorEmpresa[resultado.empresa_id].liquido += resultado.valor_liquido_total_repasse || 0;
        producaoPorEmpresa[resultado.empresa_id].bruto += resultado.total_bruto_geral || 0; // Usar total_bruto_geral do resultado

        totalDescontosInssProducao += resultado.total_descontos_inss_medico || 0;
        totalDescontosIrrfProducao += resultado.total_descontos_irrf_medico || 0;
        totalOutrosDescontosProducaoEmpresa += (resultado.total_impostos_retidos_empresa || 0) + (resultado.total_taxa_administrativa || 0);
      }
      
      // --- Sessão 2: Resumo por Empresa / Hospital (Plantões) ---
      const todosPlantoes = await Plantao.filter({ medico_id: medicoSelecionado, competencia: competencia, confirmado: true });
      const todosTiposPlantao = await TipoPlantao.list();
      const todosContratos = await Contrato.list();
      const todasEmpresas = await Empresa.list();
      const todosHospitais = await Hospital.list();

      const resumoPorEmpresaHospital = {};

      for (const plantao of todosPlantoes) {
        const contrato = todosContratos.find(c => c.id === plantao.contrato_id);
        if (!contrato) continue;
        
        const empresa = todasEmpresas.find(e => e.id === contrato.empresa_id);
        const hospital = todosHospitais.find(h => h.id === contrato.hospital_id);
        const tipoPlantao = todosTiposPlantao.find(tp => tp.id === plantao.tipo_plantao_id);

        const instituicaoNome = hospital ? `${hospital.nome} (via ${empresa?.nome_fantasia || empresa?.razao_social || 'Empresa N/A'})` : (empresa?.nome_fantasia || empresa?.razao_social || 'Empresa N/A');
        const instituicaoKey = hospital?.id || empresa?.id; // Prioriza hospital se houver

        if (!resumoPorEmpresaHospital[instituicaoKey]) {
          resumoPorEmpresaHospital[instituicaoKey] = {
            nome: instituicaoNome,
            plantoes: { /* PresenciaisDiasUteis: 0, PresenciaisFDSFeriado: 0, etc. */ },
            tiposDetalhados: {}, // Para Sessão 5
            totalQuantidade: 0,
            valorBruto: 0,
          };
        }

        const resumoInst = resumoPorEmpresaHospital[instituicaoKey];
        const tipoNome = tipoPlantao?.nome || 'Tipo Desconhecido';
        
        // Simplificação para categorização de plantões - idealmente viria da entidade TipoPlantao
        if (!resumoInst.plantoes[tipoNome]) resumoInst.plantoes[tipoNome] = 0;
        resumoInst.plantoes[tipoNome] += (plantao.quantidade || 0);
        
        if (!resumoInst.tiposDetalhados[tipoNome]) resumoInst.tiposDetalhados[tipoNome] = { qtd: 0, valorUnit: 0, valorTotal: 0};
        resumoInst.tiposDetalhados[tipoNome].qtd += (plantao.quantidade || 0);
        resumoInst.tiposDetalhados[tipoNome].valorUnit = plantao.valor_unitario || 0; // Assume mesmo valor unitário para o tipo
        resumoInst.tiposDetalhados[tipoNome].valorTotal += (plantao.valor_total || 0);

        resumoInst.totalQuantidade += (plantao.quantidade || 0);
        resumoInst.valorBruto += (plantao.valor_total || 0);
      }
      
      // --- Sessões 3 e 4: Descontos e Créditos ---
      const descontosCreditosMedico = await DescontoCredito.filter({ medico_id: medicoSelecionado, competencia: competencia });
      const descontosGerais = descontosCreditosMedico.filter(dc => dc.tipo === 'desconto');
      const creditosGerais = descontosCreditosMedico.filter(dc => dc.tipo === 'credito');

      // Compilar todos os descontos
      const listaDescontos = [];
      // Descontos INSS/IRRF do Pró-Labore (agrupados por empresa)
      Object.entries(proLaborePorEmpresa).forEach(([empId, data]) => {
        const emp = todasEmpresas.find(e => e.id === empId);
        const nomeEmp = emp?.nome_fantasia || emp?.razao_social || `Empresa ${empId}`;
        if (data.descontos.inss > 0) listaDescontos.push({ descricao: `INSS Pró-Labore (${nomeEmp})`, valor: data.descontos.inss });
        if (data.descontos.irrf > 0) listaDescontos.push({ descricao: `IRRF Pró-Labore (${nomeEmp})`, valor: data.descontos.irrf });
      });
      
      // Descontos INSS/IRRF da Produção (agrupados)
      if (totalDescontosInssProducao > 0) listaDescontos.push({ descricao: "INSS Produção (Plantões/Proced.)", valor: totalDescontosInssProducao });
      if (totalDescontosIrrfProducao > 0) listaDescontos.push({ descricao: "IRRF Produção (Plantões/Proced.)", valor: totalDescontosIrrfProducao });

      // Outros descontos da Produção (taxas/impostos da empresa sobre procedimentos)
      // Estes são descontos que a empresa tem, mas que afetam o líquido do médico
      if (totalOutrosDescontosProducaoEmpresa > 0) listaDescontos.push({ descricao: "Impostos/Taxas Empresa (sobre Procedimentos)", valor: totalOutrosDescontosProducaoEmpresa });

      // Descontos gerais da entidade DescontoCredito
      descontosGerais.forEach(d => listaDescontos.push({ descricao: d.descricao, valor: d.valor }));
      
      const totalDescontos = listaDescontos.reduce((sum, d) => sum + d.valor, 0);
      const totalCreditos = creditosGerais.reduce((sum, c) => sum + c.valor, 0);

      setReportData({
        sessao1: {
          competencia: formatCompetencia(competencia),
          proLaborePorEmpresa,
          producaoPorEmpresa,
          totalProLaboreLiquido,
          totalProducaoLiquida,
          totalGeralLiquido: totalProLaboreLiquido + totalProducaoLiquida,
          dataPagamentoProLabore,
          dataPagamentoProducao,
          empresasInfo: todasEmpresas.reduce((acc, e) => { acc[e.id] = (e.nome_fantasia || e.razao_social); return acc; }, {})
        },
        sessao2: Object.values(resumoPorEmpresaHospital),
        sessao3: {
          descontos: listaDescontos,
          total: totalDescontos,
        },
        sessao4: {
          creditos: creditosGerais,
          total: totalCreditos,
        },
        sessao5: Object.values(resumoPorEmpresaHospital).filter(r => Object.keys(r.tiposDetalhados).length > 0) // Only include if there are detailed types
      });

    } catch (err) {
      console.error("Erro ao buscar dados para relatório individual:", err);
      setError(`Falha ao gerar relatório: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGerarPDF = async () => {
    if (!medicoSelecionado || !competencia) {
      alert('Por favor, selecione um médico e uma competência.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const response = await gerarRelatorioPDF({
        medicoId: medicoSelecionado,
        competencia: competencia,
        tipoRelatorio: "producao" // Assuming this 'producao' type exists in gerarRelatorioPDF
      });

      if (response.status === 200) {
        // Create a Blob from the PDF response and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const medicoNome = medicos.find(m => m.id === medicoSelecionado)?.nome || 'medico';
        a.download = `relatorio_producao_${medicoNome.replace(/\s+/g, '_')}_${competencia}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        throw new Error('Falha ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório em PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (error) {
    return <div className="p-10 text-center text-red-600"><AlertTriangle className="h-6 w-6 mx-auto mb-2" />{error}</div>;
  }
  
  // Destructure reportData for rendering only if it exists
  const { sessao1, sessao2, sessao3, sessao4, sessao5 } = reportData || {};

  const handlePrint = () => {
    window.print();
  };
  
  // Styles for printing (can be moved to a <style> in the head or external CSS)
  const printStyles = `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Arial, sans-serif; font-size: 10pt; }
      .no-print { display: none; }
      .page-break { page-break-after: always; }
      .report-container { width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
      th { background-color: #f0f0f0; font-weight: bold; }
      h2 { font-size: 14pt; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
      h3 { font-size: 12pt; margin-top: 15px; margin-bottom: 8px; color: #444; }
      .text-right { text-align: right !important; }
      .font-bold { font-weight: bold !important; }
      .total-row td { background-color: #f9f9f9; font-weight: bold; }
      .header-info p, .footer-info p { margin: 2px 0; }
      .section-summary { background-color: #e6f7ff; border: 1px solid #91d5ff; padding: 15px; margin-bottom: 20px; }
      .section-summary strong { display: block; font-size: 1.1em; margin-bottom: 5px; }
    }
  `;

  return (
    <div className="space-y-6 report-container bg-white p-4 md:p-8 shadow-lg rounded-md max-w-4xl mx-auto">
      <style>{printStyles}</style>

      {/* Header and Filters Section (no-print for UI elements) */}
      <div className="no-print">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Relatório Individual de Produção</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="medico">Médico:</Label>
            <Select onValueChange={setMedicoSelecionado} value={medicoSelecionado || ''}>
              <SelectTrigger id="medico" className="w-full">
                <SelectValue placeholder="Selecione um médico" />
              </SelectTrigger>
              <SelectContent>
                {medicos.map((medico) => (
                  <SelectItem key={medico.id} value={medico.id}>
                    {medico.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="competencia">Competência (AAAA-MM):</Label>
            <Input
              id="competencia"
              type="text"
              placeholder="Ex: 2023-10"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="w-full"
            />
          </div>
          {/* Add input fields for dataPagamentoProLabore and dataPagamentoProducao if they need to be set by the user */}
        </div>

        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleBuscarDados} 
            disabled={isLoading || !medicoSelecionado || !competencia}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Buscar Dados
          </Button>
          
          <Button 
            onClick={handleGerarPDF} 
            disabled={isGeneratingPDF || !medicoSelecionado || !competencia || !reportData}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Gerar PDF
          </Button>

          <Button
            onClick={handlePrint}
            disabled={!reportData} // Only enable print if reportData exists
            variant="outline"
            className="border-gray-400 text-gray-600 hover:bg-gray-50"
          >
            <Printer className="mr-2 h-5 w-5" />
            Imprimir / Salvar PDF (Browser)
          </Button>
        </div>
      </div>
      
      {/* Loading state for report data */}
      {isLoading && (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" /> Carregando dados do relatório...
        </div>
      )}

      {/* Message when no data is loaded/found */}
      {!isLoading && !reportData && !error && (
        <div className="p-10 text-center text-slate-500">
          Selecione um médico e a competência e clique em "Buscar Dados" para gerar o relatório.
        </div>
      )}

      {/* Conditional rendering for the report content itself */}
      {reportData && medicoInfo && (
        <>
          {/* Cabeçalho do Relatório */}
          <div className="text-center mb-8 header-info">
            <h1 className="text-2xl font-bold text-slate-800">Recibo de Produção Médica – Distribuição de Lucros</h1>
            <p className="text-slate-600">Dr(a). {medicoInfo.nome}</p>
            <p className="text-slate-600">CPF: {medicoInfo.cpf}</p>
          </div>

          {/* Sessão 1: Resumo Financeiro */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Resumo Financeiro – Líquido a Receber</h2>
            <div className="section-summary grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-blue-50 border border-blue-200">
              <div>
                <p className="text-sm text-slate-600">Competência:</p>
                <p className="text-lg font-bold text-slate-800">{sessao1.competencia}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Geral Líquido a Receber:</p>
                <p className="text-2xl font-extrabold text-green-600">{formatCurrency(sessao1.totalGeralLiquido)}</p>
              </div>
              {sessao1.dataPagamentoProLabore && (
                <div>
                  <p className="text-sm text-slate-600">Data Pag. Pró-Labore (Informada):</p>
                  <p className="font-semibold text-slate-700">{format(parseISO(sessao1.dataPagamentoProLabore), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              )}
              {sessao1.dataPagamentoProducao && (
                <div>
                  <p className="text-sm text-slate-600">Data Pag. Produção (Informada):</p>
                  <p className="font-semibold text-slate-700">{format(parseISO(sessao1.dataPagamentoProducao), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-medium text-slate-700 mt-6 mb-3">Detalhamento por Origem:</h3>
            {Object.keys(sessao1.proLaborePorEmpresa).length > 0 && (
                <div className="mb-3">
                    <p className="font-semibold text-slate-600">Pró-Labore Líquido por Empresa:</p>
                    {Object.entries(sessao1.proLaborePorEmpresa).map(([empId, data]) => (
                        <p key={`pl-${empId}`} className="ml-4 text-sm text-slate-500">{sessao1.empresasInfo[empId] || `Empresa ${empId}`}: {formatCurrency(data.liquido)}</p>
                    ))}
                    <p className="font-bold text-slate-700 ml-4">Total Pró-Labore Líquido: {formatCurrency(sessao1.totalProLaboreLiquido)}</p>
                </div>
            )}
            {Object.keys(sessao1.producaoPorEmpresa).length > 0 && (
                 <div className="mb-3">
                    <p className="font-semibold text-slate-600">Produção Líquida por Empresa:</p>
                    {Object.entries(sessao1.producaoPorEmpresa).map(([empId, data]) => (
                        <p key={`prod-${empId}`} className="ml-4 text-sm text-slate-500">{sessao1.empresasInfo[empId] || `Empresa ${empId}`}: {formatCurrency(data.liquido)} (Bruto: {formatCurrency(data.bruto)})</p>
                    ))}
                    <p className="font-bold text-slate-700 ml-4">Total Produção Líquida: {formatCurrency(sessao1.totalProducaoLiquida)}</p>
                </div>
            )}
          </section>

          {/* Sessão 2: Resumo por Empresa / Hospital (Plantões) */}
          {sessao2.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Resumo de Plantões por Empresa / Hospital</h2>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Empresa/Hospital</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo Plantão (Qtd)</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Plantões</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Valor Bruto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {sessao2.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.nome}</td>
                      <td className="px-4 py-2">
                        {Object.entries(item.plantoes).map(([tipo, qtd]) => `${tipo}: ${qtd}`).join('; ') || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-right">{item.totalQuantidade}</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.valorBruto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
               <p className="mt-1 text-xs text-slate-500">Nota: As categorias "Presenciais Dias Úteis", "FDS/Feriado", etc., serão implementadas com base na categorização dos "Tipos de Plantão". Por ora, exibimos os tipos cadastrados.</p>
            </section>
          )}

          {/* Sessão 3: Descontos */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Descontos</h2>
            {sessao3.descontos.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {sessao3.descontos.map((desc, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{desc.descricao}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(desc.valor)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold total-row">
                    <td className="px-4 py-2 text-right">Total Descontos:</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(sessao3.total)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500">Nenhum desconto aplicado neste período.</p>
            )}
          </section>

          {/* Sessão 4: Créditos */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Créditos</h2>
            {sessao4.creditos.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {sessao4.creditos.map((cred, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{cred.descricao}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(cred.valor)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold total-row">
                    <td className="px-4 py-2 text-right">Total Créditos:</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(sessao4.total)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500">Nenhum crédito adicional neste período.</p>
            )}
          </section>

          {/* Sessão 5: Detalhamento por Hospital (Plantões) */}
          {sessao5.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Detalhamento de Plantões por Hospital (Opcional)</h2>
              {sessao5.map((item, index) => (
                <div key={`det-${index}`} className="mb-4">
                  <h3 className="text-md font-medium text-slate-600 mb-1">{item.nome}</h3>
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo Plantão</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qtd.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Valor Unit.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-sm">
                      {Object.entries(item.tiposDetalhados).map(([tipoNome, dadosTipo], tipoIndex) => (
                        <tr key={tipoIndex}>
                          <td className="px-4 py-2">{tipoNome}</td>
                          <td className="px-4 py-2 text-right">{dadosTipo.qtd}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(dadosTipo.valorUnit)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(dadosTipo.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          )}
          
          {/* Rodapé */}
          <footer className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-500 footer-info">
            <p>Hospitalia Gestão Médica LTDA</p>
            <p>Rua Exemplo, 123 - Bairro Exemplo, Cidade - UF, CEP 00000-000</p>
            <p>CNPJ: 00.000.000/0001-00</p>
            {medicoInfo.observacoes && <p className="mt-2">Observações Adicionais: {medicoInfo.observacoes}</p>}
          </footer>
        </>
      )}
    </div>
  );
};

export default RelatorioIndividualProducao;
