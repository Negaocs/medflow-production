
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Adicionado Button
import { Paperclip, Calendar, Download, User, Building2, Hospital, DollarSign, Percent } from "lucide-react";

// Funções utilitárias
const formatCurrency = (value, fallback = "R$ 0,00") => {
  if (value === null || value === undefined || isNaN(Number(value))) return fallback;
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para tratar como local
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
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

export default function RelatorioProcedimentosParticulares({ data, competencia, medicoFiltro, empresaFiltro }) {
  if (!data || !data.procedimentos) return null;

  const { procedimentos, medicos, empresas, hospitais } = data;

  if (procedimentos.length === 0) {
      return (
        <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-slate-700">Sem Dados para Exibir</CardTitle>
                <CardDescription>Nenhum procedimento particular encontrado para os filtros selecionados ({formatCompetenciaDisplay(competencia)}).</CardDescription>
            </CardHeader>
        </Card>
      );
  }
  
  const getMedicoName = (id) => medicos.find(m => m.id === id)?.nome || "N/A";
  const getEmpresaName = (id) => {
      const emp = empresas.find(e => e.id === id);
      return emp ? (emp.nome_fantasia || emp.razao_social) : "N/A";
  };
  const getHospitalName = (id) => hospitais.find(h => h.id === id)?.nome || "N/A";

  // Totais do Relatório
  const totalValorBruto = procedimentos.reduce((sum, p) => sum + (p.valor_bruto || 0), 0);
  const totalMatMed = procedimentos.reduce((sum, p) => sum + (p.valor_mat_med || 0), 0);
  const totalImpostosEmpresa = procedimentos.reduce((sum, p) => sum + (p.valor_impostos_empresa || 0), 0);
  const totalTaxaAdm = procedimentos.reduce((sum, p) => sum + (p.valor_taxa_administrativa_empresa || 0), 0);
  const totalLiquidoRepasse = procedimentos.reduce((sum, p) => sum + (p.valor_liquido_repasse || 0), 0);

  return (
    <Card className="mt-6 shadow-xl border-0 bg-white">
      <CardHeader className="border-b bg-slate-50 rounded-t-lg">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
                <CardTitle className="text-2xl font-bold text-purple-700 flex items-center gap-2">
                    <Paperclip className="h-7 w-7" />
                    Relatório Detalhado de Procedimentos Particulares
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                    Competência: <span className="font-semibold text-purple-600">{formatCompetenciaDisplay(competencia)}</span> | 
                    Médico Repasse: <span className="font-semibold">{medicoFiltro}</span> |
                    Empresa Prestadora/Pagadora: <span className="font-semibold">{empresaFiltro}</span>
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="self-start sm:self-center">
                <Download className="h-4 w-4 mr-2" /> Exportar / Imprimir
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {/* Tabela de Totais */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Totais do Período</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 text-sm">
                <div><strong>Valor Bruto Total:</strong> {formatCurrency(totalValorBruto)}</div>
                <div><strong>Total Mat/Med:</strong> {formatCurrency(totalMatMed)}</div>
                <div><strong>Total Impostos Empresa:</strong> {formatCurrency(totalImpostosEmpresa)}</div>
                <div><strong>Total Taxa Adm.:</strong> {formatCurrency(totalTaxaAdm)}</div>
                <div className="font-bold text-purple-700"><strong>Total Líquido Repasse:</strong> {formatCurrency(totalLiquidoRepasse)}</div>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico Repasse</TableHead>
                <TableHead>Emp. Prestadora</TableHead>
                <TableHead>Emp. Pagadora</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Mat/Med</TableHead>
                <TableHead className="text-right">Impostos Emp.</TableHead>
                <TableHead className="text-right">Taxa Adm.</TableHead>
                <TableHead className="text-right">Líq. Repasse</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {procedimentos.map((p) => (
                <TableRow key={p.id}>
                    <TableCell>{formatDate(p.data_procedimento)}</TableCell>
                    <TableCell>{p.nome_paciente}</TableCell>
                    <TableCell>{getMedicoName(p.medico_id)}</TableCell>
                    <TableCell>{getEmpresaName(p.empresa_id)}</TableCell>
                    <TableCell>{p.empresa_pagamento_id ? getEmpresaName(p.empresa_pagamento_id) : '-'}</TableCell>
                    <TableCell>{p.hospital_id ? getHospitalName(p.hospital_id) : (p.local_realizacao_nome || 'N/A')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor_bruto)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor_mat_med)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor_impostos_empresa)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor_taxa_administrativa_empresa)}</TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">{formatCurrency(p.valor_liquido_repasse)}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
