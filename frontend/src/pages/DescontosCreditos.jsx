import React, { useState, useEffect } from "react";
import { DescontoCredito, Medico, Empresa, Hospital as HospitalEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  Receipt,
  Stethoscope,
  Building2,
  Hospital,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays
} from "lucide-react";
import DescontoCreditoForm from "../components/descontoscreditos/DescontoCreditoForm";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function DescontosCreditos() {
  const [descontosCreditos, setDescontosCreditos] = useState([]);
  const [filteredDescontosCreditos, setFilteredDescontosCreditos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [hospitais, setHospitais] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [descontosCreditos, searchTerm, competenciaFilter, tipoFilter, medicos, empresas]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        dcData,
        medicosData,
        empresasData,
        hospitaisData,
      ] = await Promise.all([
        DescontoCredito.list("-competencia"),
        Medico.list(),
        Empresa.list(),
        HospitalEntity.list(),
      ]);
      setDescontosCreditos(dcData);
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
    let filtered = [...descontosCreditos];

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const medico = medicos.find(m => m.id === item.medico_id);
        const empresa = empresas.find(e => e.id === item.empresa_id);
        return (
          item.descricao.toLowerCase().includes(searchTermLower) ||
          (medico?.nome.toLowerCase().includes(searchTermLower)) ||
          (empresa?.nome_fantasia?.toLowerCase().includes(searchTermLower)) ||
          (empresa?.razao_social.toLowerCase().includes(searchTermLower))
        );
      });
    }
    
    if (competenciaFilter) {
      filtered = filtered.filter(item => item.competencia === competenciaFilter);
    }

    if (tipoFilter !== "todos") {
      filtered = filtered.filter(item => item.tipo === tipoFilter);
    }

    setFilteredDescontosCreditos(filtered);
  };

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await DescontoCredito.update(editingItem.id, data);
      } else {
        await DescontoCredito.create(data);
      }
      loadInitialData();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar desconto/crédito:', error);
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

  const getRelatedDataName = (id, dataList, nameField = 'nome') => {
    const item = dataList.find(d => d.id === id);
    return item ? item[nameField] : 'N/A';
  };
  
  const getEmpresaName = (id) => {
    const empresa = empresas.find(e => e.id === id);
    return empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';
  }

  if (showForm) {
    return (
      <DescontoCreditoForm
        item={editingItem}
        onSave={handleSave}
        onCancel={handleCancel}
        medicos={medicos.filter(m => m.ativo)}
        empresas={empresas.filter(e => e.ativo)}
        hospitais={hospitais.filter(h => h.ativo)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Descontos e Créditos</h1>
          <p className="text-slate-600 mt-1">Gerencie os lançamentos de descontos e créditos</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Lista de Lançamentos
            </CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por Médico, Empresa ou Descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
               <Input
                type="month"
                placeholder="Competência"
                value={competenciaFilter}
                onChange={(e) => setCompetenciaFilter(e.target.value)}
                className="w-40"
              />
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="desconto">Descontos</SelectItem>
                  <SelectItem value="credito">Créditos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredDescontosCreditos.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm || competenciaFilter || tipoFilter !== "todos" 
                  ? "Nenhum lançamento encontrado" 
                  : "Nenhum desconto ou crédito cadastrado"}
              </h3>
              <p className="text-slate-500">
                {searchTerm || competenciaFilter || tipoFilter !== "todos" 
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando o primeiro lançamento"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDescontosCreditos.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-all duration-300 border border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.tipo === 'credito' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
                          {item.tipo === 'credito' ? <ArrowUpCircle className="w-6 h-6 text-white" /> : <ArrowDownCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">
                            {item.descricao}
                          </h3>
                          <Badge 
                            className={item.tipo === 'credito' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        className="hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign className={`w-4 h-4 ${item.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-medium ${item.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                        Valor: R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Stethoscope className="w-4 h-4" />
                      <span>Médico: {getRelatedDataName(item.medico_id, medicos)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>Empresa: {getEmpresaName(item.empresa_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Hospital className="w-4 h-4" />
                      <span>Hospital: {getRelatedDataName(item.hospital_id, hospitais)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays className="w-4 h-4" />
                        <span>Competência: {item.competencia}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t flex justify-between text-xs text-slate-500">
                        <span>Tributável: {item.tributavel ? "Sim" : "Não"}</span>
                        <span>Recorrente: {item.recorrente ? "Sim" : "Não"}</span>
                    </div>
                    {item.observacoes && (
                       <div className="pt-2 border-t">
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={item.observacoes}>
                          Obs: {item.observacoes}
                        </p>
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