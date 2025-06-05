
import React, { useState, useEffect } from "react";
import { ProducaoAdministrativa, Medico, Empresa } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Pencil, 
  Briefcase, 
  DollarSign, 
  CalendarDays, 
  User, 
  Building2,
  CheckCircle,
  Clock,
  Hourglass,
  FileText
} from "lucide-react";
import ProducaoAdministrativaForm from "../components/producaoadministrativa/ProducaoAdministrativaForm";
import { format, parseISO } from "date-fns";
import { PermissionGuard, PERMISSIONS } from "@/components/auth/PermissionChecker";


const tipoProducaoLabels = {
  pro_labore: "Pró-labore (Atividade)",
  cedula_presenca: "Cédula de Presença",
  administrativa: "Administrativa (Outras)",
};

export default function ProducaoAdministrativaPage() {
  const [producoes, setProducoes] = useState([]);
  const [filteredProducoes, setFilteredProducoes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProducao, setEditingProducao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("");
  // Initialize with the new string values for "all"
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
        producoesData,
        medicosData,
        empresasData,
      ] = await Promise.all([
        ProducaoAdministrativa.list("-data_atividade"),
        Medico.filter({ ativo: true }),
        Empresa.filter({ ativo: true }),
      ]);
      setProducoes(producoesData);
      setMedicos(medicosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
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
        medicos.find(m => m.id === item.medico_id)?.nome.toLowerCase().includes(searchTermLower) ||
        empresas.find(e => e.id === item.empresa_id)?.razao_social.toLowerCase().includes(searchTermLower) ||
        empresas.find(e => e.id === item.empresa_id)?.nome_fantasia?.toLowerCase().includes(searchTermLower)
      );
    }
    if (competenciaFilter) {
      filtered = filtered.filter(item => item.competencia === competenciaFilter);
    }
    // Update filter logic to check against "ALL_MEDICOS"
    if (medicoFilter && medicoFilter !== "ALL_MEDICOS") { 
      filtered = filtered.filter(item => item.medico_id === medicoFilter);
    }
    // Update filter logic to check against "ALL_EMPRESAS"
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
      if (editingProducao) {
        await ProducaoAdministrativa.update(editingProducao.id, data);
      } else {
        await ProducaoAdministrativa.create(data);
      }
      loadInitialData();
      setShowForm(false);
      setEditingProducao(null);
    } catch (error) {
      console.error("Erro ao salvar produção administrativa:", error);
    }
  };

  const handleEdit = (producao) => {
    setEditingProducao(producao);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProducao(null);
  };

  const toggleConfirmacao = async (item) => {
    try {
      await ProducaoAdministrativa.update(item.id, { ...item, confirmado: !item.confirmado });
      loadInitialData(); 
    } catch (error) {
      console.error('Erro ao alterar confirmação:', error);
    }
  };

  const getLookupName = (id, list, nameField = 'nome', fallback = "N/A") => {
    const item = list.find(i => i.id === id);
    return item ? (item.nome_fantasia || item[nameField]) : fallback;
  };
  
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ -';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }


  if (showForm) {
    return (
      <ProducaoAdministrativaForm
        producao={editingProducao}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Produção Administrativa</h1>
          <p className="text-slate-600 mt-1">Gerencie os lançamentos de atividades administrativas</p>
        </div>
        <PermissionGuard permission={PERMISSIONS.PROD_ADMIN_CRIAR} fallback={null}>
            <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg self-start md:self-center"
            >
            <Plus className="w-4 h-4 mr-2" />
            Nova Produção
            </Button>
        </PermissionGuard>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Lista de Produções Administrativas
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Input
              placeholder="Buscar por descrição, médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="xl:col-span-2"
            />
            <Input
              type="month"
              value={competenciaFilter}
              onChange={(e) => setCompetenciaFilter(e.target.value)}
            />
            <Select value={medicoFilter} onValueChange={setMedicoFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por Médico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_MEDICOS">Todos os Médicos</SelectItem> {/* Alterado value de null/"" */}
                {medicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_EMPRESAS">Todas as Empresas</SelectItem> {/* Alterado value de null/"" */}
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{getLookupName(e.id, empresas)}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* TODO: Adicionar filtro por tipo_producao aqui se necessário */}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 h-56 rounded-lg"></div>)}
            </div>
          ) : filteredProducoes.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhuma produção administrativa encontrada</h3>
              <p className="text-slate-500">
                {searchTerm || competenciaFilter || (medicoFilter && medicoFilter !== "ALL_MEDICOS") || (empresaFilter && empresaFilter !== "ALL_EMPRESAS") || tipoFilter
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando uma nova produção administrativa"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducoes.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-base truncate" title={item.descricao_atividade}>
                          {item.descricao_atividade}
                        </h3>
                        <p className="text-xs text-slate-500">
                           Competência: {item.competencia} | Data: {format(parseISO(item.data_atividade), "dd/MM/yyyy")}
                        </p>
                      </div>
                       <div className="flex flex-col items-end gap-1">
                        <Badge variant={item.confirmado ? "default" : "secondary"} className={`text-xs ${item.confirmado ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {item.confirmado ? "Confirmada" : "Pendente"}
                        </Badge>
                        <PermissionGuard permission={PERMISSIONS.PROD_ADMIN_EDITAR} fallback={null}>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-7 w-7">
                                <Pencil className="w-3.5 h-3.5" />
                            </Button>
                        </PermissionGuard>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                     <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600"/>
                        <span className="font-medium text-slate-700">{getLookupName(item.medico_id, medicos)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600"/>
                        <span className="text-slate-600">{getLookupName(item.empresa_id, empresas)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t">
                        <div>
                            <span className="text-slate-500 block text-xs">Tipo:</span>
                            <p className="font-medium text-slate-700 truncate" title={tipoProducaoLabels[item.tipo_producao]}>{tipoProducaoLabels[item.tipo_producao]}</p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs">Horas:</span>
                            <p className="font-medium text-slate-700">{item.horas_dedicadas}h</p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs">Valor/Hora:</span>
                            <p className="font-medium text-slate-700">{formatCurrency(item.valor_hora)}</p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs">Total:</span>
                            <p className="font-semibold text-green-600">{formatCurrency(item.valor_total)}</p>
                        </div>
                         <div className="col-span-2">
                            <span className="text-slate-500 block text-xs">Tributável:</span>
                            <p className="font-medium text-slate-700">{item.tributavel ? "Sim" : "Não"}</p>
                        </div>
                    </div>
                    {item.observacoes && (
                         <div className="text-xs text-slate-500 pt-1 border-t">
                            <FileText className="w-3 h-3 inline mr-1" />
                           {item.observacoes}
                        </div>
                    )}
                    <PermissionGuard permission={PERMISSIONS.PROD_ADMIN_CONFIRMAR} fallback={null}>
                        <div className="pt-2 border-t">
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => toggleConfirmacao(item)}
                                className={`w-full h-auto p-1 text-xs ${item.confirmado ? "text-yellow-600 hover:text-yellow-700" : "text-green-600 hover:text-green-700"}`}
                            >
                                {item.confirmado ? <><Clock className="w-3 h-3 mr-1" /> Marcar Pendente</> : <><CheckCircle className="w-3 h-3 mr-1" /> Confirmar Produção</>}
                            </Button>
                        </div>
                    </PermissionGuard>
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
