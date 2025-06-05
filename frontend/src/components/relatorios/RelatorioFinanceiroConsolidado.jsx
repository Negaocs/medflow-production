
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Adicionado Accordion e seus componentes
import { Button } from "@/components/ui/button"; // Adicionado Button
import { Building2, Calendar, DollarSign, Percent, FileText, Download, TrendingUp, TrendingDown, Landmark } from "lucide-react";

// Funções utilitárias
const formatCurrency = (value, fallback = "R$ 0,00") => {
  if (value === null || value === undefined || isNaN(Number(value))) return fallback;
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatCompetenciaDisplay = (competencia) => {
  if (!competencia) return "N/A";
  try {
    const [year, month] = competencia.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return competencia;
  }
};


export default function RelatorioFinanceiroConsolidado({ data, competencia, empresaFiltro }) {
  if (!data) return null;

  const { plantoes, procedimentos, producoesAdm, descontosCreditos, empresas, contratos, hospitais, medicos } = data;

  // Agrupar por empresa pagadora (ou empresa do contrato para plantões)
  const financeiroPorEmpresa = {};

  // Helper para obter ID da empresa pagadora
  const getEmpresaPagadoraId = (item, itemTipo) => {
    if (item.empresa_pagamento_id) return item.empresa_pagamento_id;
    if (itemTipo === 'plantao' && item.contrato_id) {
        const contrato = contratos.find(c => c.id === item.contrato_id);
        return contrato?.empresa_id;
    }
    return item.empresa_id; // Fallback para empresa_id se não houver pagadora específica
  };
  
  empresas.forEach(emp => {
     // Inicializar apenas se for a empresa filtrada ou se não houver filtro de empresa
    if (!empresaFiltro || empresaFiltro === "Todas" || (empresaFiltro !== "Todas" && emp.nome_fantasia === empresaFiltro) || (empresaFiltro !== "Todas" && emp.razao_social === empresaFiltro)) {
        financeiroPorEmpresa[emp.id] = {
          empresaNome: emp.nome_fantasia || emp.razao_social,
          cnpj: emp.cnpj,
          totalBrutoPlantoes: 0,
          totalBrutoProcedimentos: 0, // Valor bruto do procedimento, antes de mat/med e taxas
          totalBrutoProducaoAdm: 0,
          totalMatMedProcedimentos: 0, // Somente de procedimentos
          totalImpostosEmpresa: 0, // ISS, PIS, COFINS, IRPJ, CSLL (sobre plantões e procedimentos)
          totalTaxaAdmEmpresa: 0, // Taxa adm da empresa (sobre plantões e procedimentos)
          totalCreditosLancados: 0, // Lançamentos manuais de crédito para a empresa/médicos
          totalDescontosLancados: 0, // Lançamentos manuais de desconto para a empresa/médicos
          totalRepasseMedicoEstimado: 0, // Líquido que iria para os médicos
          detalhes: {
            plantoes: [],
            procedimentos: [],
            producaoAdm: [],
            descontosCreditos: []
          }
        };
    }
  });

  plantoes.forEach(p => {
    const empPagId = getEmpresaPagadoraId(p, 'plantao');
    if (!empPagId || !financeiroPorEmpresa[empPagId]) return;
    
    financeiroPorEmpresa[empPagId].totalBrutoPlantoes += (p.valor_total || 0);
    // Impostos e taxas de plantões precisariam dos parâmetros fiscais da empresa contratante (do contrato)
    // Por ora, vamos simplificar e não calcular impostos/taxas sobre plantões aqui,
    // pois isso já é feito no Cálculo de Produção. Este relatório é mais um resumo.
    financeiroPorEmpresa[empPagId].totalRepasseMedicoEstimado += (p.valor_total || 0); // Simplificado
    financeiroPorEmpresa[empPagId].detalhes.plantoes.push(p);
  });

  procedimentos.forEach(proc => {
    const empPagId = getEmpresaPagadoraId(proc, 'procedimento');
    if (!empPagId || !financeiroPorEmpresa[empPagId]) return;
    
    financeiroPorEmpresa[empPagId].totalBrutoProcedimentos += (proc.valor_bruto || 0);
    financeiroPorEmpresa[empPagId].totalMatMedProcedimentos += (proc.valor_mat_med || 0);
    financeiroPorEmpresa[empPagId].totalImpostosEmpresa += (proc.valor_impostos_empresa || 0);
    financeiroPorEmpresa[empPagId].totalTaxaAdmEmpresa += (proc.valor_taxa_administrativa_empresa || 0);
    financeiroPorEmpresa[empPagId].totalRepasseMedicoEstimado += (proc.valor_liquido_repasse || 0);
    financeiroPorEmpresa[empPagId].detalhes.procedimentos.push(proc);
  });
  
  producoesAdm.forEach(prod => {
    const empPagId = getEmpresaPagadoraId(prod, 'producaoAdm');
    if (!empPagId || !financeiroPorEmpresa[empPagId]) return;

    financeiroPorEmpresa[empPagId].totalBrutoProducaoAdm += (prod.valor_total || 0);
    // Similar a plantões, impostos/taxas de produção administrativa são complexos para este resumo.
    financeiroPorEmpresa[empPagId].totalRepasseMedicoEstimado += (prod.valor_total || 0); // Simplificado
    financeiroPorEmpresa[empPagId].detalhes.producaoAdm.push(prod);
  });

  descontosCreditos.forEach(dc => {
    const empPagId = getEmpresaPagadoraId(dc, 'descontoCredito');
    if (!empPagId || !financeiroPorEmpresa[empPagId]) return;

    if (dc.tipo === 'credito') {
        financeiroPorEmpresa[empPagId].totalCreditosLancados += (dc.valor || 0);
        // Créditos aumentam o repasse se forem para o médico
        // Se for para a empresa, a lógica é outra. Assumindo que são para médicos/produção.
        financeiroPorEmpresa[empPagId].totalRepasseMedicoEstimado += (dc.valor || 0);
    } else if (dc.tipo === 'desconto') {
        financeiroPorEmpresa[empPagId].totalDescontosLancados += (dc.valor || 0);
        financeiroPorEmpresa[empPagId].totalRepasseMedicoEstimado -= (dc.valor || 0);
    }
    financeiroPorEmpresa[empPagId].detalhes.descontosCreditos.push(dc);
  });

  const empresasComDados = Object.values(financeiroPorEmpresa).filter(
    e => e.totalBrutoPlantoes > 0 || e.totalBrutoProcedimentos > 0 || e.totalBrutoProducaoAdm > 0 || e.totalCreditosLancados > 0 || e.totalDescontosLancados > 0
  );

  if (empresasComDados.length === 0) {
      return (
        <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-slate-700">Sem Dados para Exibir</CardTitle>
                <CardDescription>Nenhum dado financeiro encontrado para os filtros selecionados ({formatCompetenciaDisplay(competencia)}).</CardDescription>
            </CardHeader>
        </Card>
      );
  }

  // Totais Gerais do Relatório
  const totalGeralBrutoPlantoes = empresasComDados.reduce((acc, emp) => acc + emp.totalBrutoPlantoes, 0);
  const totalGeralBrutoProcedimentos = empresasComDados.reduce((acc, emp) => acc + emp.totalBrutoProcedimentos, 0);
  const totalGeralBrutoProducaoAdm = empresasComDados.reduce((acc, emp) => acc + emp.totalBrutoProducaoAdm, 0);
  const totalGeralFaturamentoBruto = totalGeralBrutoPlantoes + totalGeralBrutoProcedimentos + totalGeralBrutoProducaoAdm;
  
  const totalGeralMatMed = empresasComDados.reduce((acc, emp) => acc + emp.totalMatMedProcedimentos, 0);
  const totalGeralImpostosEmpresa = empresasComDados.reduce((acc, emp) => acc + emp.totalImpostosEmpresa, 0);
  const totalGeralTaxaAdmEmpresa = empresasComDados.reduce((acc, emp) => acc + emp.totalTaxaAdmEmpresa, 0);
  const totalGeralCreditos = empresasComDados.reduce((acc, emp) => acc + emp.totalCreditosLancados, 0);
  const totalGeralDescontos = empresasComDados.reduce((acc, emp) => acc + emp.totalDescontosLancados, 0);
  
  const totalGeralRepasseMedico = empresasComDados.reduce((acc, emp) => acc + emp.totalRepasseMedicoEstimado, 0);
  
  const totalGeralCustosTaxasRetencoes = totalGeralMatMed + totalGeralImpostosEmpresa + totalGeralTaxaAdmEmpresa + totalGeralDescontos;
  // Resultado da Empresa = Faturamento Bruto + Créditos - Custos/Taxas/Retenções - Repasse Médico
  const resultadoEmpresaGlobal = totalGeralFaturamentoBruto + totalGeralCreditos - totalGeralCustosTaxasRetencoes - totalGeralRepasseMedico;


  return (
    <Card className="mt-6 shadow-xl border-0 bg-white">
      <CardHeader className="border-b bg-slate-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
                <CardTitle className="text-2xl font-bold text-green-700 flex items-center gap-2">
                    <Landmark className="h-7 w-7" />
                    Relatório Financeiro Consolidado
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                    Competência: <span className="font-semibold text-green-600">{formatCompetenciaDisplay(competencia)}</span> |
                    Empresa: <span className="font-semibold">{empresaFiltro}</span>
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="self-start sm:self-center">
                <Download className="h-4 w-4 mr-2" /> Exportar / Imprimir
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {/* Seção de Totais Gerais */}
        <Card className="mb-6 bg-green-50 border-green-200">
            <CardHeader>
                <CardTitle className="text-lg text-green-800">Resumo Geral do Período</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <div><strong className="text-slate-700">Faturamento Bruto (Plantões):</strong> {formatCurrency(totalGeralBrutoPlantoes)}</div>
                    <div><strong className="text-slate-700">Faturamento Bruto (Proced.):</strong> {formatCurrency(totalGeralBrutoProcedimentos)}</div>
                    <div><strong className="text-slate-700">Faturamento Bruto (Prod. Adm.):</strong> {formatCurrency(totalGeralBrutoProducaoAdm)}</div>
                    <div className="font-bold text-slate-800"><strong className="text-slate-700">Total Faturamento Bruto:</strong> {formatCurrency(totalGeralFaturamentoBruto)}</div>
                    <hr className="col-span-full my-1" />
                    <div><strong className="text-slate-700">(-) Mat/Med (Proced.):</strong> {formatCurrency(totalGeralMatMed)}</div>
                    <div><strong className="text-slate-700">(-) Impostos Empresa (Proced.):</strong> {formatCurrency(totalGeralImpostosEmpresa)}</div>
                    <div><strong className="text-slate-700">(-) Taxa Adm. Empresa (Proced.):</strong> {formatCurrency(totalGeralTaxaAdmEmpresa)}</div>
                    <div><strong className="text-slate-700">(+) Créditos Lançados:</strong> {formatCurrency(totalGeralCreditos)}</div>
                    <div><strong className="text-slate-700">(-) Descontos Lançados:</strong> {formatCurrency(totalGeralDescontos)}</div>
                    <hr className="col-span-full my-1" />
                    <div><strong className="text-slate-700">(=) Total Repasse Médico Estimado:</strong> {formatCurrency(totalGeralRepasseMedico)}</div>
                    <div className="col-span-full font-bold text-xl text-green-700 mt-2 pt-2 border-t">
                        <strong className="text-green-800">(=) Resultado Estimado para Empresa(s):</strong> {formatCurrency(resultadoEmpresaGlobal)}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Detalhamento por Empresa */}
        <Accordion type="multiple" collapsible className="w-full">
          {empresasComDados.map((empData, index) => {
            const faturamentoBrutoEmpresa = empData.totalBrutoPlantoes + empData.totalBrutoProcedimentos + empData.totalBrutoProducaoAdm;
            const custosTaxasRetencoesEmpresa = empData.totalMatMedProcedimentos + empData.totalImpostosEmpresa + empData.totalTaxaAdmEmpresa + empData.totalDescontosLancados;
            const resultadoEmpresa = faturamentoBrutoEmpresa + empData.totalCreditosLancados - custosTaxasRetencoesEmpresa - empData.totalRepasseMedicoEstimado;

            return (
                <AccordionItem value={`empresa-${index}`} key={index} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:bg-slate-100 transition-colors rounded-md">
                    <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-green-600" />
                        <div>
                            <span className="font-semibold text-lg text-slate-800">{empData.empresaNome}</span>
                            <p className="text-xs text-slate-500">CNPJ: {empData.cnpj}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold text-green-600">{formatCurrency(resultadoEmpresa)}</span>
                        <p className="text-xs text-slate-500">Resultado Estimado</p>
                    </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 sm:px-4 py-4 bg-white border-t">
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm p-3 bg-green-50 rounded-md border border-green-200">
                            <div><strong>Faturamento Bruto (Plantões):</strong> {formatCurrency(empData.totalBrutoPlantoes)}</div>
                            <div><strong>Faturamento Bruto (Proced.):</strong> {formatCurrency(empData.totalBrutoProcedimentos)}</div>
                            <div><strong>Faturamento Bruto (Prod. Adm.):</strong> {formatCurrency(empData.totalBrutoProducaoAdm)}</div>
                            <div className="font-semibold"><strong>Total Faturamento Bruto:</strong> {formatCurrency(faturamentoBrutoEmpresa)}</div>
                            <hr className="col-span-full my-1" />
                            <div><strong>(-) Mat/Med (Proced.):</strong> {formatCurrency(empData.totalMatMedProcedimentos)}</div>
                            <div><strong>(-) Impostos Empresa (Proced.):</strong> {formatCurrency(empData.totalImpostosEmpresa)}</div>
                            <div><strong>(-) Taxa Adm. Empresa (Proced.):</strong> {formatCurrency(empData.totalTaxaAdmEmpresa)}</div>
                            <div><strong>(+) Créditos Lançados:</strong> {formatCurrency(empData.totalCreditosLancados)}</div>
                            <div><strong>(-) Descontos Lançados:</strong> {formatCurrency(empData.totalDescontosLancados)}</div>
                             <hr className="col-span-full my-1" />
                            <div className="font-semibold"><strong>(=) Total Repasse Médico Estimado:</strong> {formatCurrency(empData.totalRepasseMedicoEstimado)}</div>
                        </div>
                        {/* Adicionar tabelas de detalhamento de plantões, procedimentos, etc., se necessário */}
                    </div>
                </AccordionContent>
                </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
