
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button"; // Adicionado Button
import { Users, Calendar, DollarSign, Stethoscope, Paperclip, Briefcase, TrendingDown, TrendingUp, Download, FileText, Building2 } from "lucide-react";

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

export default function RelatorioProducaoMedico({ data, competencia, medicoFiltro, empresaFiltro }) {
  if (!data) return null;

  const { plantoes, procedimentos, producoesAdm, descontosCreditos, medicos, empresas, contratos, hospitais } = data;

  // Agrupar todos os lançamentos por médico
  const producaoPorMedico = {};

  medicos.forEach(med => {
    producaoPorMedico[med.id] = {
      medicoNome: med.nome,
      totalBrutoPlantoes: 0,
      totalBrutoProcedimentos: 0,
      totalBrutoProducoesAdm: 0,
      totalDescontos: 0,
      totalCreditos: 0,
      totalINSS: 0, // Simplificado, cálculo complexo de INSS/IRRF não é feito aqui
      totalIRRF: 0, // Simplificado
      totalLiquido: 0,
      plantoes: [],
      procedimentos: [],
      producoesAdm: [],
      descontosCreditos: []
    };
  });
  
  plantoes.forEach(p => {
    if (!producaoPorMedico[p.medico_id]) return;
    producaoPorMedico[p.medico_id].totalBrutoPlantoes += (p.valor_total || 0);
    const contrato = contratos.find(c => c.id === p.contrato_id);
    const empresa = contrato ? empresas.find(e => e.id === contrato.empresa_id) : null;
    const hospital = contrato ? hospitais.find(h => h.id === contrato.hospital_id) : null;
    producaoPorMedico[p.medico_id].plantoes.push({...p, empresaNome: empresa?.nome_fantasia || 'N/A', hospitalNome: hospital?.nome || 'N/A'});
  });

  procedimentos.forEach(proc => {
    if (!producaoPorMedico[proc.medico_id]) return;
    producaoPorMedico[proc.medico_id].totalBrutoProcedimentos += (proc.valor_liquido_repasse || 0); // Usar valor líquido do repasse
    const empresaPrestadora = empresas.find(e => e.id === proc.empresa_id);
    producaoPorMedico[proc.medico_id].procedimentos.push({...proc, empresaNome: empresaPrestadora?.nome_fantasia || 'N/A'});
  });

  producoesAdm.forEach(prod => {
    if (!producaoPorMedico[prod.medico_id]) return;
    producaoPorMedico[prod.medico_id].totalBrutoProducoesAdm += (prod.valor_total || 0);
    const empresa = empresas.find(e => e.id === prod.empresa_id);
    producaoPorMedico[prod.medico_id].producoesAdm.push({...prod, empresaNome: empresa?.nome_fantasia || 'N/A'});
  });
  
  descontosCreditos.forEach(dc => {
    if (!producaoPorMedico[dc.medico_id]) return;
    const empresa = empresas.find(e => e.id === dc.empresa_id);
    const itemComEmpresa = {...dc, empresaNome: empresa?.nome_fantasia || 'N/A'};
    producaoPorMedico[dc.medico_id].descontosCreditos.push(itemComEmpresa);
    if (dc.tipo === 'desconto') {
      producaoPorMedico[dc.medico_id].totalDescontos += (dc.valor || 0);
    } else if (dc.tipo === 'credito') {
      producaoPorMedico[dc.medico_id].totalCreditos += (dc.valor || 0);
    }
  });

  Object.keys(producaoPorMedico).forEach(medId => {
    const medicoData = producaoPorMedico[medId];
    medicoData.totalLiquido = medicoData.totalBrutoPlantoes +
                             medicoData.totalBrutoProcedimentos +
                             medicoData.totalBrutoProducoesAdm +
                             medicoData.totalCreditos -
                             medicoData.totalDescontos -
                             medicoData.totalINSS - // Aqui seriam os descontos de INSS/IRRF se calculados
                             medicoData.totalIRRF;
  });

  const medicosComProducao = Object.values(producaoPorMedico).filter(
    m => m.plantoes.length > 0 || m.procedimentos.length > 0 || m.producoesAdm.length > 0 || m.descontosCreditos.length > 0
  );
  
  if (medicosComProducao.length === 0) {
      return (
        <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-slate-700">Sem Dados para Exibir</CardTitle>
                <CardDescription>Nenhuma produção encontrada para os filtros selecionados ({formatCompetenciaDisplay(competencia)}).</CardDescription>
            </CardHeader>
        </Card>
      );
  }

  return (
    <Card className="mt-6 shadow-xl border-0 bg-white">
      <CardHeader className="border-b bg-slate-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
                <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                    <Users className="h-7 w-7" />
                    Produção Mensal por Médico
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                    Competência: <span className="font-semibold text-blue-600">{formatCompetenciaDisplay(competencia)}</span> | 
                    Médico: <span className="font-semibold">{medicoFiltro}</span> |
                    Empresa (Contrato/Pagadora): <span className="font-semibold">{empresaFiltro}</span>
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="self-start sm:self-center">
                <Download className="h-4 w-4 mr-2" /> Exportar / Imprimir
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="multiple" collapsible className="w-full">
          {medicosComProducao.map((medData, index) => (
            <AccordionItem value={`medico-${index}`} key={index} className="border-b last:border-b-0">
              <AccordionTrigger className="px-6 py-4 hover:bg-slate-100 transition-colors">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-lg text-slate-800">{medData.medicoNome}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-green-600">{formatCurrency(medData.totalLiquido)}</span>
                    <p className="text-xs text-slate-500">Líquido Estimado</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 sm:px-6 py-4 bg-white border-t">
                <div className="space-y-6">
                  {/* Resumo Financeiro do Médico */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md font-semibold text-blue-800">Resumo Financeiro - {medData.medicoNome}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                            <div className="font-medium text-slate-700">Plantões Bruto: <span className="text-blue-600">{formatCurrency(medData.totalBrutoPlantoes)}</span></div>
                            <div className="font-medium text-slate-700">Proced. Líquido Repasse: <span className="text-purple-600">{formatCurrency(medData.totalBrutoProcedimentos)}</span></div>
                            <div className="font-medium text-slate-700">Prod. Adm. Bruto: <span className="text-orange-600">{formatCurrency(medData.totalBrutoProducoesAdm)}</span></div>
                            <div className="font-medium text-slate-700">Créditos: <span className="text-green-500">{formatCurrency(medData.totalCreditos)}</span></div>
                            <div className="font-medium text-slate-700">Descontos: <span className="text-red-500">{formatCurrency(medData.totalDescontos)}</span></div>
                            {/* Linha para Total Bruto Geral (antes de impostos do médico) */}
                            <div className="col-span-full sm:col-span-1 font-bold text-slate-800 mt-1 pt-1 border-t">
                                Total Bruto Geral: 
                                <span className="text-indigo-700 ml-1">
                                    {formatCurrency(medData.totalBrutoPlantoes + medData.totalBrutoProcedimentos + medData.totalBrutoProducoesAdm + medData.totalCreditos - medData.totalDescontos)}
                                </span>
                            </div>
                        </div>
                        {/* Adicionar aqui campos para INSS e IRRF se fossem calculados neste relatório */}
                    </CardContent>
                  </Card>

                  {/* Detalhamento de Plantões */}
                  {medData.plantoes.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-slate-700 mb-2 flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-500"/> Plantões Realizados ({medData.plantoes.length})</h4>
                      <Table className="text-xs sm:text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Empresa (Contrato)</TableHead>
                            <TableHead>Hospital</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medData.plantoes.map(p => (
                            <TableRow key={p.id}>
                              <TableCell>{p.data_plantao ? new Date(p.data_plantao + 'T00:00:00').toLocaleDateString('pt-BR') : p.competencia}</TableCell>
                              <TableCell>{p.empresaNome}</TableCell>
                              <TableCell>{p.hospitalNome}</TableCell>
                              <TableCell>{(data.tiposPlantao?.find(tp => tp.id === p.tipo_plantao_id)?.nome) || 'N/A'}</TableCell>
                              <TableCell className="text-right">{p.quantidade}</TableCell>
                              <TableCell className="text-right">{formatCurrency(p.valor_total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Detalhamento de Procedimentos Particulares */}
                  {medData.procedimentos.length > 0 && (
                     <div>
                      <h4 className="text-md font-semibold text-slate-700 mb-2 flex items-center gap-2"><Paperclip className="h-5 w-5 text-purple-500"/> Procedimentos Particulares ({medData.procedimentos.length})</h4>
                       <Table className="text-xs sm:text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Empresa Prest.</TableHead>
                            <TableHead className="text-right">Valor Líq. Repasse</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medData.procedimentos.map(proc => (
                            <TableRow key={proc.id}>
                              <TableCell>{proc.data_procedimento ? new Date(proc.data_procedimento + 'T00:00:00').toLocaleDateString('pt-BR') : proc.competencia}</TableCell>
                              <TableCell>{proc.nome_paciente}</TableCell>
                              <TableCell>{proc.empresaNome}</TableCell>
                              <TableCell className="text-right">{formatCurrency(proc.valor_liquido_repasse)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {/* Detalhamento de Produção Administrativa */}
                  {medData.producoesAdm.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-slate-700 mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5 text-orange-500"/> Produção Administrativa ({medData.producoesAdm.length})</h4>
                       <Table className="text-xs sm:text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medData.producoesAdm.map(prod => (
                            <TableRow key={prod.id}>
                              <TableCell>{prod.data_atividade ? new Date(prod.data_atividade + 'T00:00:00').toLocaleDateString('pt-BR') : prod.competencia}</TableCell>
                              <TableCell>{prod.descricao_atividade}</TableCell>
                              <TableCell>{prod.empresaNome}</TableCell>
                              <TableCell className="text-right">{formatCurrency(prod.valor_total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Detalhamento de Descontos/Créditos */}
                   {medData.descontosCreditos.length > 0 && (
                    <div>
                        <h4 className="text-md font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500"/> <TrendingDown className="h-5 w-5 text-red-500"/> Descontos e Créditos ({medData.descontosCreditos.length})
                        </h4>
                       <Table className="text-xs sm:text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medData.descontosCreditos.map(dc => (
                            <TableRow key={dc.id}>
                              <TableCell>
                                <span className={`font-semibold ${dc.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                                  {dc.tipo.charAt(0).toUpperCase() + dc.tipo.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell>{dc.descricao}</TableCell>
                              <TableCell>{dc.empresaNome}</TableCell>
                              <TableCell className="text-right">{formatCurrency(dc.valor)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
