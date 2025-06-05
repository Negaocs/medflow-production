import React, { useState, useEffect } from "react"; // Adicionado useState, useEffect
import { ProducaoAdministrativa, Medico, Empresa } from "@/api/entities"; // Adicionado imports de entidades
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Adicionado Card, CardHeader, CardTitle
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Adicionado componentes Select
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
  Briefcase, // Adicionado Briefcase
  Edit3,
  Trash2,
  PlusCircle,
  Search,
  CalendarDays,
  Users,
  Building,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  Filter as FilterIcon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ProducaoAdministrativaForm from "@/components/producaoadministrativa/ProducaoAdministrativaForm";
import { format, parseISO, isValid } from "date-fns";

// Definição de tipoProducaoLabels (sem pró-labore)
const tipoProducaoLabels = {
  cedula_presenca: "Cédula de Presença",
  administrativa: "Administrativa (Outras)",
  // pro_labore: "Pró-labore (Atividade)" // Pró-labore não é mais uma opção aqui
};

const getLookupName = (id, list, key = "nome") => {
  const item = list.find((i) => i.id === id);
  return item ? item[key] : "N/A";
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return "R$ 0,00";
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};


export default function ProducaoAdministrativaPage() {
  const [producoes, setProducoes] = useState([]);
  const [filteredProducoes, setFilteredProducoes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProducao, setEditingProducao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemParaConfirmarExclusao, setItemParaConfirmarExclusao] = useState(null);

  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("");
  const [medicoFilter, setMedicoFilter] = useState("ALL_MEDICOS");
  const [empresaFilter, setEmpresaFilter] = useState("ALL_EMPRESAS");
  const [tipoFilter, setTipoFilter] = useState("");


  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [producoes, searchTerm, competenciaFilter, medicoFilter, empresaFilter, tipoFilter, medicos, empresas]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        producoesDataRaw,
        medicosData,
        empresasData,
      ] = await Promise.all([
        ProducaoAdministrativa.list("-data_atividade"),
        Medico.filter({ ativo: true }),
        Empresa.filter({ ativo: true }),
      ]);
      const producoesFiltradas = producoesDataRaw.filter(p => p.tipo_producao !== "pro_labore");
      setProducoes(producoesFiltradas);
      setMedicos(medicosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // TODO: Adicionar feedback visual de erro para o usuário
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...producoes];
    const searchTermLower = searchTerm.toLowerCase();

    if (searchTermLower) {
      filtered = filtered.filter(item =>
        item.descricao_atividade?.toLowerCase().includes(searchTermLower) ||
        getLookupName(item.medico_id, medicos, "nome").toLowerCase().includes(searchTermLower) ||
        getLookupName(item.empresa_id, empresas, "nome_fantasia").toLowerCase().includes(searchTermLower) ||
        getLookupName(item.empresa_id, empresas, "razao_social").toLowerCase().includes(searchTermLower)
      );
    }
    if (competenciaFilter) {
      filtered = filtered.filter(item => item.competencia === competenciaFilter);
    }
    if (medicoFilter && medicoFilter !== "ALL_MEDICOS") {
      filtered = filtered.filter(item => item.medico_id === medicoFilter);
    }
    if (empresaFilter && empresaFilter !== "ALL_EMPRESAS") {
      filtered = filtered.filter(item => item.empresa_id === empresaFilter);
    }
    if (tipoFilter) {
      filtered = filtered.filter(item => item.tipo_producao === tipoFilter);
    }
    setFilteredProducoes(filtered);
  };

  const handleSave = async (data) => {
    try {
      const dataToSave = { ...data };
      if (dataToSave.tipo_producao === "pro_labore") {
        console.warn("Tentativa de salvar tipo 'pro_labore' via formulário de Prod. Administrativa. Alterando para 'administrativa'.");
        dataToSave.tipo_producao = "administrativa";
      }

      if (editingProducao) {
        await ProducaoAdministrativa.update(editingProducao.id, dataToSave);
      } else {
        await ProducaoAdministrativa.create(dataToSave);
      }
      loadInitialData();
      setShowForm(false);
      setEditingProducao(null);
    } catch (error) {
      console.error("Erro ao salvar produção administrativa:", error);
      // TODO: Adicionar feedback visual de erro para o usuário
    }
  };

  const handleEdit = (producao) => {
    setEditingProducao(producao);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await ProducaoAdministrativa.delete(id);
      loadInitialData();
    } catch (error) {
      console.error("Erro ao excluir produção administrativa:", error);
      // TODO: Adicionar feedback visual de erro para o usuário
    }
    setItemParaConfirmarExclusao(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProducao(null);
  };

  const toggleConfirmacao = async (producaoItem) => {
    try {
      await ProducaoAdministrativa.update(producaoItem.id, { confirmado: !producaoItem.confirmado });
      loadInitialData();
    } catch (error) {
      console.error("Erro ao alterar status de confirmação:", error);
      // TODO: Adicionar feedback visual de erro para o usuário
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg text-slate-700">Carregando dados...</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <ProducaoAdministrativaForm
        producao={editingProducao}
        onSave={handleSave}
        onCancel={handleCancel}
        medicos={medicos}
        empresas={empresas}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      <Dialog open={!!itemParaConfirmarExclusao} onOpenChange={() => setItemParaConfirmarExclusao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este lançamento de produção administrativa? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemParaConfirmarExclusao(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDelete(itemParaConfirmarExclusao?.id)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Produção Administrativa</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Gerencie os lançamentos de atividades administrativas (exceto pró-labore).</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="mr-2 h-5 w-5" /> Nova Produção
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-slate-700">
            <FilterIcon className="h-5 w-5 text-blue-600" />
            Filtros e Pesquisa
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mt-4">
            <Input
              placeholder="Buscar por descrição, médico, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2"
            />
            <Input
              type="month"
              value={competenciaFilter}
              onChange={(e) => setCompetenciaFilter(e.target.value)}
            />
             <Select value={medicoFilter} onValueChange={setMedicoFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por Médico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_MEDICOS">Todos os Médicos</SelectItem>
                {medicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_EMPRESAS">Todas as Empresas</SelectItem>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos os Tipos</SelectItem>
                {Object.entries(tipoProducaoLabels)
                  // .filter(([key]) => key !== "pro_labore") // Esta linha não é mais estritamente necessária aqui, pois 'producoes' já é filtrado
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && filteredProducoes.length === 0 ? (
             <div className="text-center p-10 text-slate-500">Carregando...</div>
          ) : !isLoading && filteredProducoes.length === 0 ? (
            <div className="text-center p-10">
              <FileText className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-lg font-medium text-slate-600">Nenhum lançamento encontrado.</p>
              <p className="text-sm text-slate-500">
                {searchTerm || competenciaFilter || medicoFilter !== "ALL_MEDICOS" || empresaFilter !== "ALL_EMPRESAS" || tipoFilter
                  ? "Tente ajustar seus filtros ou cadastrar uma nova produção."
                  : "Cadastre uma nova produção administrativa."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Médico</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Empresa</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Data</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Competência</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Tipo</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Descrição</TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Valor Total</TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-slate-200">
                  {filteredProducoes.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{getLookupName(item.medico_id, medicos, "nome")}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{getLookupName(item.empresa_id, empresas, "nome_fantasia")}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.data_atividade ? format(parseISO(item.data_atividade), "dd/MM/yyyy") : "N/A"}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.competencia || "N/A"}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        <Badge variant={item.tipo_producao === 'cedula_presenca' ? 'secondary' : 'outline'} className="capitalize">
                          {tipoProducaoLabels[item.tipo_producao] || item.tipo_producao}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate hidden md:table-cell" title={item.descricao_atividade}>{item.descricao_atividade || "-"}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium text-right">{formatCurrency(item.valor_total)}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleConfirmacao(item)}
                          className={`rounded-full px-3 py-1 text-xs ${
                            item.confirmado
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          }`}
                        >
                          {item.confirmado ? <CheckCircle className="mr-1 h-4 w-4" /> : <XCircle className="mr-1 h-4 w-4" />}
                          {item.confirmado ? "Confirmado" : "Pendente"}
                        </Button>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setItemParaConfirmarExclusao(item)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}