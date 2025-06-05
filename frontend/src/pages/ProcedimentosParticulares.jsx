import React, { useState, useEffect } from "react";
import { ProcedimentoParticular, Medico, Empresa, Hospital as HospitalEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Pencil, 
  Paperclip, 
  DollarSign, 
  CalendarDays, 
  User, 
  Stethoscope,
  Building2,
  Hospital as HospitalIcon,
  CheckCircle,
  Clock,
  Percent,
  Landmark,
  HandCoins
} from "lucide-react";
import ProcedimentoParticularForm from "../components/procedimentosparticulares/ProcedimentoParticularForm";
import { format, parseISO, isValid } from "date-fns";

export default function ProcedimentosParticulares() {
  const [procedimentos, setProcedimentos] = useState([]);
  const [filteredProcedimentos, setFilteredProcedimentos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProcedimento, setEditingProcedimento] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [hospitais, setHospitais] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("");
  const [medicoFilter, setMedicoFilter] = useState(null);
  const [empresaFilter, setEmpresaFilter] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [procedimentos, searchTerm, competenciaFilter, medicoFilter, empresaFilter, medicos, empresas]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        procedimentosData,
        medicosData,
        empresasData,
        hospitaisData
      ] = await Promise.all([
        ProcedimentoParticular.list("-data_procedimento"),
        Medico.filter({ ativo: true }),
        Empresa.filter({ ativo: true }),
        HospitalEntity.filter({ ativo: true })
      ]);
      setProcedimentos(procedimentosData);
      setMedicos(medicosData);
      setEmpresas(empresasData);
      setHospitais(hospitaisData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...procedimentos];
    const searchTermLower = searchTerm.toLowerCase();

    if (searchTermLower) {
      filtered = filtered.filter(proc => 
        proc.nome_paciente?.toLowerCase().includes(searchTermLower) ||
        proc.descricao_procedimentos?.toLowerCase().includes(searchTermLower) ||
        proc.nota_fiscal?.toLowerCase().includes(searchTermLower) ||
        medicos.find(m => m.id === proc.medico_id)?.nome.toLowerCase().includes(searchTermLower) ||
        empresas.find(e => e.id === proc.empresa_id)?.razao_social.toLowerCase().includes(searchTermLower) ||
        empresas.find(e => e.id === proc.empresa_id)?.nome_fantasia?.toLowerCase().includes(searchTermLower)
      );
    }
    if (competenciaFilter) {
      filtered = filtered.filter(proc => proc.competencia === competenciaFilter);
    }
    if (medicoFilter) {
      filtered = filtered.filter(proc => proc.medico_id === medicoFilter);
    }
    if (empresaFilter) {
      filtered = filtered.filter(proc => proc.empresa_id === empresaFilter || proc.empresa_pagamento_id === empresaFilter);
    }
    setFilteredProcedimentos(filtered);
  };

  const handleSave = async (data) => {
    try {
      if (editingProcedimento) {
        await ProcedimentoParticular.update(editingProcedimento.id, data);
      } else {
        await ProcedimentoParticular.create(data);
      }
      loadInitialData();
      setShowForm(false);
      setEditingProcedimento(null);
    } catch (error) {
      console.error("Erro ao salvar procedimento:", error);
    }
  };

  const handleEdit = (procedimento) => {
    setEditingProcedimento(procedimento);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProcedimento(null);
  };

  const toggleConfirmacao = async (proc) => {
    try {
      await ProcedimentoParticular.update(proc.id, { ...proc, confirmado: !proc.confirmado });
      loadInitialData(); 
    } catch (error) {
      console.error('Erro ao alterar confirmação do procedimento:', error);
    }
  };

  const getLookupName = (id, list, nameField = 'nome', fallback = "N/A") => {
    const item = list.find(i => i.id === id);
    return item ? (item.nome_fantasia || item[nameField]) : fallback;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return "R$ 0,00";
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatDateSafe = (dateString) => {
    if (!dateString || !isValid(parseISO(dateString))) return "Data N/A";
    return format(parseISO(dateString), "dd/MM/yyyy");
  };

  if (showForm) {
    return (
      <ProcedimentoParticularForm
        procedimento={editingProcedimento}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Procedimentos Particulares</h1>
          <p className="text-slate-600 mt-1">Gerencie os lançamentos de procedimentos particulares</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg self-start md:self-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Procedimento
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mb-4 text-xl">
            <Paperclip className="h-5 w-5 text-blue-600" />
            Lista de Procedimentos
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar paciente, NF, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-2 md:col-span-1"
            />
            <Input
              type="month"
              value={competenciaFilter}
              onChange={(e) => setCompetenciaFilter(e.target.value)}
            />
            <Select 
                value={medicoFilter || ""} 
                onValueChange={(value) => setMedicoFilter(value === "all" ? null : value)}
            >
              <SelectTrigger><SelectValue placeholder="Filtrar por Médico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Médicos</SelectItem>
                {medicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select 
                value={empresaFilter || ""} 
                onValueChange={(value) => setEmpresaFilter(value === "all" ? null : value)}
            >
              <SelectTrigger><SelectValue placeholder="Filtrar por Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{getLookupName(e.id, empresas)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 h-80 rounded-lg"></div>)}
            </div>
          ) : filteredProcedimentos.length === 0 ? (
            <div className="text-center py-12">
              <Paperclip className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum procedimento encontrado</h3>
              <p className="text-slate-500">
                {searchTerm || competenciaFilter || medicoFilter || empresaFilter
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando um novo procedimento"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProcedimentos.map((proc) => {
                const empresaPrestadora = empresas.find(e => e.id === proc.empresa_id);
                const empresaPagadora = empresas.find(e => e.id === proc.empresa_pagamento_id);
                const showEmpresaPagadora = empresaPagadora && empresaPagadora.id !== empresaPrestadora?.id;

                return (
                <Card key={proc.id} className="hover:shadow-md transition-shadow duration-300 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-lg truncate" title={proc.nome_paciente}>
                          Paciente: {proc.nome_paciente}
                        </h3>
                        <p className="text-xs text-slate-500">
                           {proc.nota_fiscal ? `NF: ${proc.nota_fiscal} | ` : ''}
                           Competência: {proc.competencia}
                        </p>
                      </div>
                       <div className="flex flex-col items-end gap-1">
                        <Badge variant={proc.confirmado ? "default" : "secondary"} className={`text-xs ${proc.confirmado ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {proc.confirmado ? "Confirmado" : "Pendente"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(proc)} className="h-8 w-8 text-slate-500 hover:text-blue-600">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm flex-grow">
                    <p className="text-xs text-slate-600 line-clamp-2" title={proc.descricao_procedimentos}>
                        <strong>Procedimento:</strong> {proc.descricao_procedimentos}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t">
                        <div>
                            <span className="text-slate-500 block text-xs">Médico Repasse:</span>
                            <p className="font-medium text-slate-700 truncate" title={getLookupName(proc.medico_id, medicos)}>{getLookupName(proc.medico_id, medicos)}</p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs">Empresa Prest.:</span>
                            <p className="font-medium text-slate-700 truncate" title={getLookupName(proc.empresa_id, empresas)}>{getLookupName(proc.empresa_id, empresas)}</p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs">Cirurgião Resp.:</span>
                            <p className="font-medium text-slate-700 truncate" title={proc.cirurgiao_responsavel_nome || "N/A"}>{proc.cirurgiao_responsavel_nome || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs">Data:</span>
                            <p className="font-medium text-slate-700">{formatDateSafe(proc.data_procedimento)}</p>
                        </div>
                    </div>
                    {showEmpresaPagadora && (
                         <div className="text-xs text-slate-600 pt-1 border-t flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            Pago por: <span className="font-medium">{getLookupName(proc.empresa_pagamento_id, empresas)}</span>
                        </div>
                    )}
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                        <HospitalIcon className="w-3 h-3 text-purple-500" />
                        Local: {proc.hospital_id ? getLookupName(proc.hospital_id, hospitais) : (proc.local_realizacao_nome || "N/A")}
                    </div>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-3 pt-3 border-t text-center">
                        <div className="p-2 bg-slate-50 rounded-md">
                            <span className="text-slate-500 block text-xs">Valor Bruto</span>
                            <p className="font-semibold text-blue-600 text-md">{formatCurrency(proc.valor_bruto)}</p>
                        </div>
                         <div className="p-2 bg-slate-50 rounded-md">
                            <span className="text-slate-500 block text-xs">Mat/Med</span>
                            <p className="font-semibold text-orange-600 text-md">{formatCurrency(proc.valor_mat_med)}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-md">
                            <span className="text-slate-500 block text-xs">Impostos Emp.</span>
                            <p className="font-semibold text-red-500 text-md">{formatCurrency(proc.valor_impostos_empresa)}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-md">
                            <span className="text-slate-500 block text-xs">Taxa Adm. Emp.</span>
                            <p className="font-semibold text-red-500 text-md">{formatCurrency(proc.valor_taxa_administrativa_empresa)}</p>
                        </div>
                    </div>
                     <div className="mt-2 pt-2 border-t text-center">
                        <span className="text-slate-500 block text-xs mb-0.5">Repasse Líquido Estimado</span>
                        <p className="font-bold text-green-600 text-xl">{formatCurrency(proc.valor_liquido_repasse)}</p>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t mt-auto">
                         <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleConfirmacao(proc)}
                            className={`w-full h-auto p-1 text-xs ${proc.confirmado ? "text-yellow-600 hover:text-yellow-700" : "text-green-600 hover:text-green-700"}`}
                          >
                            {proc.confirmado ? <><Clock className="w-3 h-3 mr-1" /> Marcar Pendente</> : <><CheckCircle className="w-3 h-3 mr-1" /> Confirmar Procedimento</>}
                          </Button>
                    </div>
                </Card>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}