import React, { useState, useEffect } from "react";
import { VinculoFiscalMedico, Medico } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Pencil, 
  Building2,
  Calculator,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import VinculoFiscalMedicoForm from "../components/vinculosfiscaismedicos/VinculoFiscalMedicoForm";
import { format, parseISO, isValid } from "date-fns";

export default function VinculosFiscaisMedicosPage() {
  const [vinculos, setVinculos] = useState([]);
  const [filteredVinculos, setFilteredVinculos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [medicoFilter, setMedicoFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVinculo, setEditingVinculo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [medicos, setMedicos] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vinculos, searchTerm, medicoFilter, medicos]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vinculosData, medicosData] = await Promise.all([
        VinculoFiscalMedico.list("-competencia_inicio"),
        Medico.filter({ ativo: true }, "nome")
      ]);
      setVinculos(vinculosData);
      setMedicos(medicosData);
    } catch (error) {
      console.error('Erro ao carregar vínculos fiscais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vinculos];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(vinculo => 
        vinculo.nome_instituicao?.toLowerCase().includes(searchLower) ||
        vinculo.cnpj_responsavel?.includes(searchTerm) ||
        medicos.find(m => m.id === vinculo.medico_id)?.nome.toLowerCase().includes(searchLower)
      );
    }
    
    if (medicoFilter) {
      filtered = filtered.filter(vinculo => vinculo.medico_id === medicoFilter);
    }
    
    setFilteredVinculos(filtered);
  };

  const handleSave = async (vinculoData) => {
    try {
      if (editingVinculo) {
        await VinculoFiscalMedico.update(editingVinculo.id, vinculoData);
      } else {
        await VinculoFiscalMedico.create(vinculoData);
      }
      loadData();
      setShowForm(false);
      setEditingVinculo(null);
    } catch (error) {
      console.error('Erro ao salvar vínculo fiscal:', error);
    }
  };

  const handleEdit = (vinculo) => {
    setEditingVinculo(vinculo);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVinculo(null);
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString || !isValid(parseISO(dateString))) return "N/A";
    return format(parseISO(dateString), "MM/yyyy");
  };

  const getMedicoName = (medicoId) => {
    const medico = medicos.find(m => m.id === medicoId);
    return medico ? medico.nome : 'N/A';
  };

  const getTipoVinculoLabel = (tipo) => {
    const tipos = {
      clt: "CLT",
      pj: "Pessoa Jurídica",
      cooperativa: "Cooperativa",
      plantao_publico: "Plantão Público",
      outro: "Outro"
    };
    return tipos[tipo] || tipo;
  };

  if (showForm) {
    return (
      <VinculoFiscalMedicoForm
        vinculo={editingVinculo}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Vínculos Fiscais de Médicos</h1>
          <p className="text-slate-600 mt-1">Gerencie vínculos externos para cálculo correto de INSS e IRRF</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Vínculo
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-blue-600" />
            Lista de Vínculos Fiscais
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por médico, instituição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={medicoFilter} onValueChange={setMedicoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Médico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos os Médicos</SelectItem>
                {medicos.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
              ))}
            </div>
          ) : filteredVinculos.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum vínculo encontrado</h3>
              <p className="text-slate-500">
                {searchTerm || medicoFilter
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando o primeiro vínculo fiscal"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVinculos.map((vinculo) => (
                <Card key={vinculo.id} className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-base truncate" title={vinculo.nome_instituicao}>
                          {vinculo.nome_instituicao}
                        </h3>
                        <p className="text-sm text-slate-500 font-mono">{vinculo.cnpj_responsavel}</p>
                        <p className="text-sm text-slate-600 font-medium">{getMedicoName(vinculo.medico_id)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={vinculo.ativo ? "default" : "secondary"} 
                               className={vinculo.ativo ? "bg-green-100 text-green-700" : ""}>
                          {vinculo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vinculo)} className="h-7 w-7">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600"/>
                      <span>
                        {formatDate(vinculo.competencia_inicio)} até {formatDate(vinculo.competencia_fim) || "Em curso"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600"/>
                      <span>{getTipoVinculoLabel(vinculo.tipo_vinculo)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <span className="text-slate-500 block text-xs">INSS:</span>
                        <p className="font-medium text-slate-700">Base: {formatCurrency(vinculo.base_inss)}</p>
                        <p className="font-semibold text-red-600 text-xs">Retido: {formatCurrency(vinculo.valor_inss_retido)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs">IRRF:</span>
                        <p className="font-medium text-slate-700">Base: {formatCurrency(vinculo.base_irrf)}</p>
                        <p className="font-semibold text-red-600 text-xs">Retido: {formatCurrency(vinculo.valor_irrf_retido)}</p>
                      </div>
                    </div>

                    {vinculo.observacoes && (
                      <div className="text-xs text-slate-500 pt-1 border-t">
                        {vinculo.observacoes}
                      </div>
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