import React, { useState, useEffect } from "react";
import { ProLabore, Medico, Empresa } from "@/api/entities"; // MUDANÇA: Usar ProLabore ao invés de ProducaoAdministrativa
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Pencil, 
  DollarSign, 
  User, 
  Building2,
  CheckCircle,
  Clock,
  RefreshCw,
  Briefcase
} from "lucide-react";
import ProLaboreForm from "../components/prolabores/ProLaboreForm";
import { format, parseISO, isValid } from "date-fns";

export default function ProLaboresPage() {
  const [proLabores, setProLabores] = useState([]);
  const [filteredProLabores, setFilteredProLabores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("");
  const [medicoFilter, setMedicoFilter] = useState("ALL_MEDICOS");
  const [empresaPagadoraFilter, setEmpresaPagadoraFilter] = useState("ALL_EMPRESAS");
  const [recorrenteFilter, setRecorrenteFilter] = useState("todos");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [proLabores, searchTerm, competenciaFilter, medicoFilter, empresaPagadoraFilter, recorrenteFilter, medicos, empresas]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        proLaboresData, // MUDANÇA: Agora busca da entidade ProLabore
        medicosData,
        empresasData,
      ] = await Promise.all([
        ProLabore.list("-data_referencia"), // MUDANÇA: Usar data_referencia ao invés de data_atividade
        Medico.filter({ ativo: true }),
        Empresa.filter({ ativo: true }),
      ]);
      setProLabores(proLaboresData);
      setMedicos(medicosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Erro ao carregar dados de Pró-labores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...proLabores];
    const searchTermLower = searchTerm.toLowerCase();

    if (searchTermLower) {
      filtered = filtered.filter(item => 
        item.descricao?.toLowerCase().includes(searchTermLower) || // MUDANÇA: Campo agora é 'descricao'
        medicos.find(m => m.id === item.medico_id)?.nome.toLowerCase().includes(searchTermLower) ||
        // Filtrar por empresa pagadora
        empresas.find(e => e.id === item.empresa_pagamento_id)?.nome_fantasia?.toLowerCase().includes(searchTermLower) ||
        empresas.find(e => e.id === item.empresa_pagamento_id)?.razao_social.toLowerCase().includes(searchTermLower) ||
        // Opcionalmente, filtrar por empresa beneficiária também, se relevante para a busca
        (item.empresa_beneficiaria_id && (
            empresas.find(e => e.id === item.empresa_beneficiaria_id)?.nome_fantasia?.toLowerCase().includes(searchTermLower) ||
            empresas.find(e => e.id === item.empresa_beneficiaria_id)?.razao_social.toLowerCase().includes(searchTermLower)
        ))
      );
    }
    if (competenciaFilter) {
      filtered = filtered.filter(item => item.competencia === competenciaFilter);
    }
    if (medicoFilter && medicoFilter !== "ALL_MEDICOS") {
      filtered = filtered.filter(item => item.medico_id === medicoFilter);
    }
    if (empresaPagadoraFilter && empresaPagadoraFilter !== "ALL_EMPRESAS") {
      // Filtra pela empresa pagadora
      filtered = filtered.filter(item => item.empresa_pagamento_id === empresaPagadoraFilter);
    }
    if (recorrenteFilter !== "todos") {
      filtered = filtered.filter(item => item.recorrente === (recorrenteFilter === "sim"));
    }
    setFilteredProLabores(filtered);
  };

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await ProLabore.update(editingItem.id, data); // MUDANÇA: Usar entidade ProLabore
      } else {
        await ProLabore.create(data); // MUDANÇA: Usar entidade ProLabore
      }
      loadInitialData();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Erro ao salvar pró-labore:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const toggleConfirmacao = async (item) => {
    try {
      await ProLabore.update(item.id, { ...item, confirmado: !item.confirmado }); // MUDANÇA: Usar entidade ProLabore
      loadInitialData(); 
    } catch (error) {
      console.error('Erro ao alterar confirmação do pró-labore:', error);
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
      <ProLaboreForm
        proLabore={editingItem} // MUDANÇA: Passa o item da entidade ProLabore
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Lançamentos de Pró-labore</h1>
          <p className="text-slate-600 mt-1">Gerencie os pagamentos de pró-labore para médicos gestores</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg self-start md:self-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Pró-labore
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Lista de Pró-labores
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Input
              placeholder="Buscar por descrição, médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="xl:col-span-1"
            />
            <Input
              type="month"
              value={competenciaFilter}
              onChange={(e) => setCompetenciaFilter(e.target.value)}
              placeholder="Competência"
            />
            <Select value={medicoFilter} onValueChange={setMedicoFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por Médico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_MEDICOS">Todos os Médicos</SelectItem>
                {medicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={empresaPagadoraFilter} onValueChange={setEmpresaPagadoraFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por Emp. Pagadora" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_EMPRESAS">Todas Empresas</SelectItem>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{getLookupName(e.id, empresas, 'nome_fantasia')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={recorrenteFilter} onValueChange={setRecorrenteFilter}>
              <SelectTrigger><SelectValue placeholder="Recorrência" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 h-56 rounded-lg"></div>)}
            </div>
          ) : filteredProLabores.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum pró-labore encontrado</h3>
              <p className="text-slate-500">
                {searchTerm || competenciaFilter || (medicoFilter !== "ALL_MEDICOS") || (empresaPagadoraFilter !== "ALL_EMPRESAS") || recorrenteFilter !== "todos"
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando um novo pró-labore"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProLabores.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-base truncate" title={item.descricao}>
                          {item.descricao || "Pró-labore"}
                        </h3>
                        <p className="text-xs text-slate-500">
                           Competência: {item.competencia} | Ref: {item.data_referencia ? format(parseISO(item.data_referencia), "dd/MM/yyyy") : 'N/A'}
                        </p>
                      </div>
                       <div className="flex flex-col items-end gap-1">
                        <Badge variant={item.confirmado ? "default" : "secondary"} className={`text-xs ${item.confirmado ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {item.confirmado ? "Confirmado" : "Pendente"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
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
                        <span className="text-slate-600">
                            Pago por: {getLookupName(item.empresa_pagamento_id, empresas, 'nome_fantasia')}
                        </span>
                    </div>
                    {item.empresa_beneficiaria_id && item.empresa_pagamento_id !== item.empresa_beneficiaria_id && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Briefcase className="w-3 h-3"/>
                            <span>Beneficiária: {getLookupName(item.empresa_beneficiaria_id, empresas, 'nome_fantasia')}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t">
                        <div>
                            <span className="text-slate-500 block text-xs">Valor:</span>
                            <p className="font-semibold text-green-600 text-base">{formatCurrency(item.valor_bruto)}</p> {/* MUDANÇA: Usar valor_bruto */}
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs">Recorrente:</span>
                            <p className="font-medium text-slate-700 flex items-center">
                                {item.recorrente ? <RefreshCw className="w-3.5 h-3.5 mr-1 text-sky-600"/> : null}
                                {item.recorrente ? "Sim" : "Não"}
                            </p>
                        </div>
                         <div className="col-span-2">
                            <span className="text-slate-500 block text-xs">Tributável:</span>
                            <p className="font-medium text-slate-700">{item.tributavel ? "Sim" : "Não"}</p>
                        </div>
                    </div>
                    {item.observacoes && (
                         <div className="text-xs text-slate-500 pt-1 border-t">
                           {item.observacoes}
                        </div>
                    )}
                    <div className="pt-2 border-t">
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleConfirmacao(item)}
                            className={`w-full h-auto p-1 text-xs ${item.confirmado ? "text-yellow-600 hover:text-yellow-700" : "text-green-600 hover:text-green-700"}`}
                        >
                            {item.confirmado ? <><Clock className="w-3 h-3 mr-1" /> Marcar Pendente</> : <><CheckCircle className="w-3 h-3 mr-1" /> Confirmar Pró-labore</>}
                        </Button>
                    </div>
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