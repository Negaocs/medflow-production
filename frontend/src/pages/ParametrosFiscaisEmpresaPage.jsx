
import React, { useState, useEffect, useMemo } from "react";
import { ParametrosFiscaisEmpresa as ParametrosFiscaisEmpresaEntity } from "@/api/entities";
import { Empresa as EmpresaEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, FileText, Filter, Building2, CalendarRange, Loader2, AlertTriangle } from "lucide-react";
import ParametrosFiscaisEmpresaForm from "../components/parametrosfiscaisempresa/ParametrosFiscaisEmpresaForm";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatDate = (dateString, fallback = "Atual") => {
  if (!dateString || !isValid(parseISO(dateString))) return fallback;
  return format(parseISO(dateString), "dd/MM/yyyy");
};

const formatRegime = (regime) => {
  if (!regime) return "N/A";
  return regime.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
};

const formatAliquota = (value) => {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

const aliquotaFieldsDisplay = [
  { key: "aliquota_inss", label: "INSS" },
  { key: "aliquota_irrf", label: "IRRF" },
  { key: "aliquota_iss", label: "ISS" },
  { key: "aliquota_irpj", label: "IRPJ" },
  { key: "aliquota_csll", label: "CSLL" },
  { key: "aliquota_pis", label: "PIS" },
  { key: "aliquota_cofins", label: "COFINS" },
  { key: "aliquota_administrativa", label: "Tx. Adm." },
];


export default function ParametrosFiscaisEmpresaPage() {
  const [parametros, setParametros] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingParametro, setEditingParametro] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmpresaFilter, setSelectedEmpresaFilter] = useState(null); // Usar null

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [paramsData, empresasData] = await Promise.all([
        ParametrosFiscaisEmpresaEntity.list("-vigencia_inicio"),
        EmpresaEntity.filter({ ativo: true }, "nome_fantasia"),
      ]);
      setParametros(paramsData);
      setEmpresas(empresasData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Falha ao carregar dados. Tente recarregar a página.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEmpresaName = (empresaId) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa ? (empresa.nome_fantasia || empresa.razao_social) : "Empresa N/A";
  };

  const filteredParametros = useMemo(() => {
    let result = [...parametros];
    if (selectedEmpresaFilter) {
      result = result.filter(p => p.empresa_id === selectedEmpresaFilter);
    }
    // Agrupa por empresa e ordena por vigência dentro de cada empresa
    const groupedByEmpresa = result.reduce((acc, curr) => {
      (acc[curr.empresa_id] = acc[curr.empresa_id] || []).push(curr);
      return acc;
    }, {});

    // Ordena as vigências dentro de cada empresa (mais recente primeiro)
    for (const empresaId in groupedByEmpresa) {
      groupedByEmpresa[empresaId].sort((a, b) => parseISO(b.vigencia_inicio) - parseISO(a.vigencia_inicio));
    }
    return groupedByEmpresa;
  }, [parametros, selectedEmpresaFilter]);


  const handleSave = async (data) => {
    setIsLoading(true);
    try {
      if (editingParametro) {
        await ParametrosFiscaisEmpresaEntity.update(editingParametro.id, data);
      } else {
        await ParametrosFiscaisEmpresaEntity.create(data);
      }
      await loadInitialData(); // Recarrega tudo para garantir consistência
      setShowForm(false);
      setEditingParametro(null);
    } catch (err) {
      console.error("Erro ao salvar parâmetro fiscal:", err);
      setError("Falha ao salvar. Verifique os dados e tente novamente.");
      // Não fecha o form em caso de erro para o usuário poder corrigir
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (parametro) => {
    setEditingParametro(parametro);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingParametro(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingParametro(null);
    setError(""); // Limpa erro ao cancelar
  };

  if (showForm) {
    return (
      <ParametrosFiscaisEmpresaForm
        parametroFiscal={editingParametro}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Parâmetros Fiscais por Empresa</h1>
          <p className="text-slate-600 mt-1">Gerencie as alíquotas e regimes tributários das empresas por período de vigência.</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md self-start sm:self-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Parâmetro
        </Button>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Filter className="h-5 w-5 text-blue-600" />
              Filtros e Visualização
            </CardTitle>
            <div className="w-full md:w-auto md:max-w-xs">
              <Select 
                value={selectedEmpresaFilter || ""}
                onValueChange={(value) => setSelectedEmpresaFilter(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Empresa (Todas)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Empresas</SelectItem>
                  {empresas.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social} ({e.cnpj})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="ml-3 text-slate-600">Carregando parâmetros...</p>
            </div>
          ) : Object.keys(filteredParametros).length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {selectedEmpresaFilter ? "Nenhum parâmetro fiscal encontrado para esta empresa." : "Nenhum parâmetro fiscal cadastrado."}
              </h3>
              <p className="text-slate-500">
                {selectedEmpresaFilter ? "Você pode adicionar um novo parâmetro para esta empresa." : "Comece cadastrando os parâmetros fiscais."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(filteredParametros).map(([empresaId, paramsDaEmpresa]) => (
                <Card key={empresaId} className="border-slate-200 shadow-md">
                  <CardHeader className="bg-slate-50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-700" />
                        <div>
                            <h3 className="text-lg font-semibold text-blue-800">{getEmpresaName(empresaId)}</h3>
                            <p className="text-xs text-slate-500">CNPJ: {empresas.find(e => e.id === empresaId)?.cnpj}</p>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px]">Vigência</TableHead>
                          <TableHead>Regime</TableHead>
                          {aliquotaFieldsDisplay.map(f => <TableHead key={f.key} className="text-right">{f.label}</TableHead>)}
                          <TableHead className="w-[80px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paramsDaEmpresa.map((param) => (
                          <TableRow key={param.id}>
                            <TableCell>
                              {formatDate(param.vigencia_inicio)} - {formatDate(param.vigencia_fim)}
                            </TableCell>
                            <TableCell>{formatRegime(param.regime_tributario)}</TableCell>
                            {aliquotaFieldsDisplay.map(f => <TableCell key={f.key} className="text-right">{formatAliquota(param[f.key])}</TableCell>)}
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(param)} className="hover:text-blue-600">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                     {paramsDaEmpresa.length === 0 && (
                        <p className="text-center text-slate-500 py-4">Nenhum parâmetro cadastrado para esta empresa com os filtros atuais.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
