import React, { useState, useEffect } from "react";
import { MedicoEmpresa, Medico, Empresa } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  Users,
  Stethoscope,
  Building2,
  CalendarDays,
  Link as LinkIcon
} from "lucide-react";
import VinculoMedicoForm from "../components/vinculos/VinculoMedicoForm";
import { format } from "date-fns";

export default function VinculosMedicos() {
  const [vinculos, setVinculos] = useState([]);
  const [filteredVinculos, setFilteredVinculos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVinculo, setEditingVinculo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vinculos, searchTerm, medicos, empresas]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [vinculosData, medicosData, empresasData] = await Promise.all([
        MedicoEmpresa.list("-data_vinculo"),
        Medico.list(),
        Empresa.list(),
      ]);
      setVinculos(vinculosData);
      setMedicos(medicosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    const filtered = vinculos.filter(vinculo => {
      const medico = medicos.find(m => m.id === vinculo.medico_id);
      const empresa = empresas.find(e => e.id === vinculo.empresa_id);
      
      const searchTermLower = searchTerm.toLowerCase();

      return (
        (medico?.nome.toLowerCase().includes(searchTermLower)) ||
        (empresa?.nome_fantasia?.toLowerCase().includes(searchTermLower)) ||
        (empresa?.razao_social.toLowerCase().includes(searchTermLower))
      );
    });
    setFilteredVinculos(filtered);
  };

  const handleSave = async (vinculoData) => {
    try {
      if (editingVinculo) {
        await MedicoEmpresa.update(editingVinculo.id, vinculoData);
      } else {
        await MedicoEmpresa.create(vinculoData);
      }
      loadInitialData();
      setShowForm(false);
      setEditingVinculo(null);
    } catch (error) {
      console.error('Erro ao salvar vínculo:', error);
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
      <VinculoMedicoForm
        vinculo={editingVinculo}
        onSave={handleSave}
        onCancel={handleCancel}
        medicos={medicos.filter(m => m.ativo)}
        empresas={empresas.filter(e => e.ativo)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Vínculos Médico-Empresa</h1>
          <p className="text-slate-600 mt-1">Gerencie os vínculos entre médicos e empresas</p>
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
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              Lista de Vínculos
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por Médico ou Empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
          ) : filteredVinculos.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "Nenhum vínculo encontrado" : "Nenhum vínculo cadastrado"}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Comece cadastrando o primeiro vínculo"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVinculos.map((vinculo) => (
                <Card key={vinculo.id} className="hover:shadow-lg transition-all duration-300 border border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <LinkIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">
                            {getRelatedDataName(vinculo.medico_id, medicos)}
                          </h3>
                          <Badge 
                            variant={vinculo.ativo ? "default" : "secondary"}
                            className={vinculo.ativo ? "bg-green-100 text-green-800" : ""}
                          >
                            {vinculo.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(vinculo)}
                        className="hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>Empresa: {getEmpresaName(vinculo.empresa_id)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays className="w-4 h-4" />
                        <span>Início: {format(new Date(vinculo.data_vinculo), "dd/MM/yyyy")}</span>
                      </div>
                      {vinculo.data_desvinculo && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <CalendarDays className="w-4 h-4" />
                          <span>Fim: {format(new Date(vinculo.data_desvinculo), "dd/MM/yyyy")}</span>
                        </div>
                      )}
                    </div>
                    {vinculo.observacoes && (
                       <div className="pt-2 border-t">
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={vinculo.observacoes}>
                          Obs: {vinculo.observacoes}
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