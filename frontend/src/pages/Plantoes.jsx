
import React, { useState, useEffect } from "react";
import { Plantao, Contrato, Medico, Empresa, Hospital as HospitalEntity, TipoPlantao, ContratoTipoPlantao } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock,
  Filter,
  Pencil,
  Building // Adicionado ícone Building para Empresa Pagadora
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlantaoForm from "../components/plantoes/PlantaoForm";
import { format, parse } from "date-fns"; // Adicionado parse

export default function Plantoes() {
  const [plantoes, setPlantoes] = useState([]);
  const [filteredPlantoes, setFilteredPlantoes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingPlantao, setEditingPlantao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [contratos, setContratos] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]); // Usado para nomes de empresa contratante e pagadora
  const [hospitais, setHospitais] = useState([]);
  const [todosTiposPlantao, setTodosTiposPlantao] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [plantoes, searchTerm, competenciaFilter, statusFilter, medicos, contratos, empresas, hospitais, todosTiposPlantao]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plantoesData, contratosData, medicosData, empresasData, hospitaisData, tiposPlantaoData] = await Promise.all([
        Plantao.list("-competencia"), // Ordena por competência mais recente
        Contrato.filter({ ativo: true }),
        Medico.filter({ ativo: true }),
        Empresa.filter({ ativo: true }), // Carrega todas as empresas para referência
        HospitalEntity.filter({ ativo: true }),
        TipoPlantao.filter({ativo: true})
      ]);

      setPlantoes(plantoesData);
      setContratos(contratosData);
      setMedicos(medicosData);
      setEmpresas(empresasData);
      setHospitais(hospitaisData);
      setTodosTiposPlantao(tiposPlantaoData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...plantoes];
    const searchTermLower = searchTerm.toLowerCase();

    if (searchTermLower) {
      filtered = filtered.filter(plantao => {
        const medico = medicos.find(m => m.id === plantao.medico_id);
        const contrato = contratos.find(c => c.id === plantao.contrato_id);
        const empresaContratante = contrato ? empresas.find(e => e.id === contrato.empresa_id) : null;
        const empresaPagadora = empresas.find(e => e.id === plantao.empresa_pagamento_id);
        const hospital = contrato ? hospitais.find(h => h.id === contrato.hospital_id) : null;
        const tipoPlantao = todosTiposPlantao.find(tp => tp.id === plantao.tipo_plantao_id);

        return (
          (medico?.nome && medico.nome.toLowerCase().includes(searchTermLower)) ||
          (empresaContratante?.nome_fantasia && empresaContratante.nome_fantasia.toLowerCase().includes(searchTermLower)) ||
          (empresaContratante?.razao_social && empresaContratante.razao_social.toLowerCase().includes(searchTermLower)) ||
          (empresaPagadora?.nome_fantasia && empresaPagadora.nome_fantasia.toLowerCase().includes(searchTermLower)) ||
          (empresaPagadora?.razao_social && empresaPagadora.razao_social.toLowerCase().includes(searchTermLower)) ||
          (hospital?.nome && hospital.nome.toLowerCase().includes(searchTermLower)) ||
          (tipoPlantao?.nome && tipoPlantao.nome.toLowerCase().includes(searchTermLower))
        );
      });
    }

    if (competenciaFilter) { // YYYY-MM
      filtered = filtered.filter(plantao => plantao.competencia === competenciaFilter);
    }

    if (statusFilter !== "todos") {
      const isConfirmado = statusFilter === "confirmados";
      filtered = filtered.filter(plantao => plantao.confirmado === isConfirmado);
    }

    setFilteredPlantoes(filtered);
  };

  const handleSave = async (plantaoData) => {
    try {
      if (editingPlantao) {
        await Plantao.update(editingPlantao.id, plantaoData);
      } else {
        await Plantao.create(plantaoData);
      }
      loadData();
      setShowForm(false);
      setEditingPlantao(null);
    } catch (error) {
      console.error('Erro ao salvar plantão:', error);
    }
  };

  const handleEdit = (plantao) => {
    setEditingPlantao(plantao);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlantao(null);
  };

  const toggleConfirmacao = async (plantao) => {
    try {
      await Plantao.update(plantao.id, { ...plantao, confirmado: !plantao.confirmado });
      loadData(); 
    } catch (error) {
      console.error('Erro ao alterar confirmação:', error);
    }
  };

  const getPlantaoDisplayInfo = (plantao) => {
    const medico = medicos.find(m => m.id === plantao.medico_id);
    const contrato = contratos.find(c => c.id === plantao.contrato_id);
    const empresaContratante = contrato ? empresas.find(e => e.id === contrato.empresa_id) : null;
    const hospital = contrato ? hospitais.find(h => h.id === contrato.hospital_id) : null;
    const tipoPlantao = todosTiposPlantao.find(tp => tp.id === plantao.tipo_plantao_id);
    const empresaPagadora = empresas.find(e => e.id === plantao.empresa_pagamento_id); // Busca empresa pagadora

    return {
      medicoNome: medico?.nome || "Médico N/A",
      empresaContratanteNome: empresaContratante ? (empresaContratante.nome_fantasia || empresaContratante.razao_social) : "Empresa N/A",
      hospitalNome: hospital?.nome || "Hospital N/A",
      tipoPlantaoNome: tipoPlantao ? `${tipoPlantao.nome} (${tipoPlantao.carga_horaria}h)` : "Tipo N/A",
      contratoDisplay: contrato ? (contrato.numero_contrato || `ID ${contrato.id.substring(0,4)}...`) : "Contrato N/A",
      empresaPagadoraNome: empresaPagadora ? (empresaPagadora.nome_fantasia || empresaPagadora.razao_social) : "N/A (Usar Contratante)",
      empresaPagadoraId: empresaPagadora?.id,
      empresaContratanteId: empresaContratante?.id
    };
  };

  const formatCompetenciaForDisplay = (competencia) => { // YYYY-MM
    if (!competencia) return "N/A";
    try {
      const [year, month] = competencia.split('-');
      const date = parse(`${year}-${month}-01`, 'yyyy-MM-dd', new Date());
      return format(date, "MMMM/yyyy"); // Ex: "Janeiro/2024"
    } catch {
      return competencia; // fallback se o formato for inesperado
    }
  };

  if (showForm) {
    return (
      <PlantaoForm
        plantao={editingPlantao}
        // As listas são carregadas dentro do PlantaoForm agora
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Plantões</h1>
          <p className="text-slate-600 mt-1">Gerencie os plantões realizados pelos médicos</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Plantão
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Lista de Plantões
          </CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por médico, empresa, hospital, tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="month" // Mês e ano
                value={competenciaFilter}
                onChange={(e) => setCompetenciaFilter(e.target.value)}
                className="w-auto md:w-40"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="confirmados">Confirmados</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg"></div>
              ))}
            </div>
          ) : filteredPlantoes.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                Nenhum plantão encontrado
              </h3>
              <p className="text-slate-500">
                {searchTerm || competenciaFilter || statusFilter !== "todos"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando o primeiro plantão"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlantoes.map((plantao) => {
                const { 
                    medicoNome, 
                    empresaContratanteNome, 
                    hospitalNome, 
                    tipoPlantaoNome, 
                    contratoDisplay,
                    empresaPagadoraNome,
                    empresaPagadoraId,
                    empresaContratanteId
                } = getPlantaoDisplayInfo(plantao);
                const showEmpresaPagadora = empresaPagadoraId && empresaPagadoraId !== empresaContratanteId;
                return (
                  <Card key={plantao.id} className="hover:shadow-md transition-all duration-300 border border-slate-200">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plantao.confirmado ? 'bg-green-500' : 'bg-blue-500'}`}>
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800 text-lg">
                                {medicoNome}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {empresaContratanteNome} &bull; {hospitalNome}
                              </p>
                              <p className="text-xs text-slate-500">Contrato: {contratoDisplay}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-slate-500 block">Competência:</span>
                               <Badge variant="outline" className="text-blue-600 border-blue-600">
                                {formatCompetenciaForDisplay(plantao.competencia)}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Tipo:</span>
                              <p className="font-medium truncate" title={tipoPlantaoNome}>{tipoPlantaoNome}</p>
                            </div>
                             <div>
                              <span className="text-slate-500 block">Qtde:</span>
                              <p className="font-medium">{plantao.quantidade}</p>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Valor Unit.:</span>
                              <p className="font-medium">R$ {plantao.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <span className="text-slate-500 block">Total:</span>
                              <p className="font-semibold text-green-600">R$ {plantao.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                          {showEmpresaPagadora && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                                <Building className="w-3 h-3 text-blue-500" />
                                <span>Pagamento por: <span className="font-medium">{empresaPagadoraNome}</span></span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
                           <Badge 
                              variant={plantao.confirmado ? "default" : "secondary"}
                              className={`self-start md:self-end ${plantao.confirmado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              {plantao.confirmado ? "Confirmado" : "Pendente"}
                            </Badge>
                          <div className="flex gap-2 mt-2 w-full md:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleConfirmacao(plantao)}
                              className={`flex-1 md:flex-none ${plantao.confirmado ? "text-yellow-600 hover:bg-yellow-50 border-yellow-500" : "text-green-600 hover:bg-green-50 border-green-500"}`}
                            >
                              {plantao.confirmado ? (
                                <>
                                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                  Desconfirmar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                  Confirmar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(plantao)}
                               className="flex-1 md:flex-none"
                            >
                              <Pencil className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                      {plantao.observacoes && (
                        <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">Obs: {plantao.observacoes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
