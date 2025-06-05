
import React, { useState, useEffect } from "react";
import { Contrato, Empresa, Hospital as HospitalEntity, TipoPlantao, ContratoTipoPlantao } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  FileText,
  Building2,
  Hospital,
  ListChecks,
  CalendarDays,
  DollarSign,
  PlusCircle // Adicionado PlusCircle
} from "lucide-react";
import ContratoForm from "../components/contratos/ContratoForm";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [filteredContratos, setFilteredContratos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null); // Contrato atualmente em edição (com ID)
  const [isLoading, setIsLoading] = useState(true);
  
  const [initialDataForForm, setInitialDataForForm] = useState(null); // Dados para pré-preencher o form (novo, ou renovação)
  const [formKey, setFormKey] = useState(0); // Para forçar remonte do form

  const [empresas, setEmpresas] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [todosTiposPlantao, setTodosTiposPlantao] = useState([]);
  const [contratoTiposPlantaoValores, setContratoTiposPlantaoValores] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contratos, searchTerm, empresas, hospitais]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        contratosData,
        empresasData,
        hospitaisData,
        tiposPlantaoData,
        contratoTiposPlantaoData
      ] = await Promise.all([
        Contrato.filter({ ativo: true }, "-data_inicio"),
        Empresa.filter({ ativo: true }),
        HospitalEntity.filter({ ativo: true }),
        TipoPlantao.filter({ ativo: true }),
        ContratoTipoPlantao.filter({ ativo: true })
      ]);
      setContratos(contratosData);
      setEmpresas(empresasData);
      setHospitais(hospitaisData);
      setTodosTiposPlantao(tiposPlantaoData);
      setContratoTiposPlantaoValores(contratoTiposPlantaoData);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    const filtered = contratos.filter(contrato => {
      const empresa = empresas.find(e => e.id === contrato.empresa_id);
      const hospital = hospitais.find(h => h.id === contrato.hospital_id);
      
      const searchTermLower = searchTerm.toLowerCase();

      return (
        (contrato.numero_contrato?.toLowerCase().includes(searchTermLower)) ||
        (empresa?.nome_fantasia?.toLowerCase().includes(searchTermLower)) ||
        (empresa?.razao_social?.toLowerCase().includes(searchTermLower)) ||
        (hospital?.nome?.toLowerCase().includes(searchTermLower))
      );
    });
    setFilteredContratos(filtered);
  };

  const handleSave = async (dataFromForm) => {
    try {
      let savedContratoResponse;
      if (dataFromForm.id) { // Se o form enviou um ID, ele INTENCIONA atualizar.
        await Contrato.update(dataFromForm.id, dataFromForm);
        savedContratoResponse = dataFromForm; // Retorna os dados atualizados
      } else { // Senão, é uma criação (novo ou renovação).
        savedContratoResponse = await Contrato.create(dataFromForm);
      }
      
      // A lógica de salvar/atualizar ContratoTipoPlantao é feita no ContratoForm.jsx
      // Após o Contrato principal ser salvo e termos o ID.
      // O retorno 'savedContratoResponse' é usado pelo ContratoForm para obter o ID.

      loadInitialData(); // Recarrega tudo, incluindo ContratoTipoPlantao
      setShowForm(false);
      setEditingContrato(null);
      setInitialDataForForm(null);
      return savedContratoResponse; 
    } catch (error) {
      console.error('Erro ao salvar contrato principal na página:', error);
      throw error;
    }
  };

  const handleEdit = (contrato) => {
    setEditingContrato(contrato); // Define o contrato que está sendo editado
    setInitialDataForForm(null); // Limpa qualquer dado de renovação anterior
    setFormKey(prev => prev + 1); // Força remonte do form
    setShowForm(true);
  };

  const handleOpenNewForm = () => {
    setEditingContrato(null);
    setInitialDataForForm(null); // Garante que é um form totalmente novo
    setFormKey(prev => prev + 1);
    setShowForm(true);
  }

  const handlePrepareRenewal = (contratoOriginal) => {
    const dadosRenovacao = {
      ...contratoOriginal, // Copia todos os dados
      numero_contrato: `${contratoOriginal.numero_contrato || 'Contrato'} (Renovação)`,
      data_inicio: "", // Limpar para o usuário definir
      data_fim: "",    // Limpar para o usuário definir
      ativo: true,     // Um contrato renovado geralmente começa ativo
      observacoes: `Renovado de: ${contratoOriginal.numero_contrato || ''} - Original: ${format(new Date(contratoOriginal.data_inicio), "dd/MM/yyyy")} a ${contratoOriginal.data_fim ? format(new Date(contratoOriginal.data_fim), "dd/MM/yyyy") : 'indefinido'}`
    };
    delete dadosRenovacao.id; // Crucial: Remove o ID para que seja uma criação

    // Busca os tipos de plantão e valores do contrato original para pré-preencher
    const tiposDoContratoOriginal = contratoTiposPlantaoValores
      .filter(ctpv => ctpv.contrato_id === contratoOriginal.id && ctpv.ativo)
      .map(ctpv => ({
        tipo_plantao_id: ctpv.tipo_plantao_id,
        valor: ctpv.valor
        // Não inclui o ID do ContratoTipoPlantao, pois serão novos registros
      }));
    
    dadosRenovacao.tiposPlantaoParaPreencher = tiposDoContratoOriginal;

    setEditingContrato(null); // Não estamos mais editando o contrato original
    setInitialDataForForm(dadosRenovacao); // Define os dados para o form de renovação
    setFormKey(prev => prev + 1); // Força remonte do form
    setShowForm(true); // Abre o formulário
  };


  const handleCancel = () => {
    setShowForm(false);
    setEditingContrato(null);
    setInitialDataForForm(null);
  };

  const getRelatedDataName = (id, dataList, nameField = 'nome') => {
    const item = dataList.find(d => d.id === id);
    return item ? item[nameField] : 'N/A';
  };
  
  const getEmpresaName = (id) => {
    const empresa = empresas.find(e => e.id === id);
    return empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';
  }

  const getTiposPlantaoParaContrato = (contratoId) => {
    return contratoTiposPlantaoValores
      .filter(ctpv => ctpv.contrato_id === contratoId && ctpv.ativo)
      .map(ctpv => {
        const tipoPlantaoInfo = todosTiposPlantao.find(tp => tp.id === ctpv.tipo_plantao_id);
        return {
          nome: tipoPlantaoInfo ? `${tipoPlantaoInfo.nome} (${tipoPlantaoInfo.carga_horaria}h)` : 'Tipo Desconhecido',
          valor: ctpv.valor
        };
      });
  };

  if (showForm) {
    return (
      <ContratoForm
        key={formKey} // Chave para forçar remonte quando necessário
        // Prop 'contrato' recebe 'initialDataForForm' se for renovação/novo pré-preenchido,
        // ou 'editingContrato' se for edição de um existente.
        contrato={initialDataForForm || editingContrato} 
        onSave={handleSave}
        onCancel={handleCancel}
        // Passa a função de preparar renovação SOMENTE se estiver editando um contrato existente (editingContrato tem ID)
        onPrepareRenewal={editingContrato && editingContrato.id ? () => handlePrepareRenewal(editingContrato) : null}
        empresas={empresas}
        hospitais={hospitais}
        todosTiposPlantao={todosTiposPlantao} // Certifique-se de passar todos os tipos de plantão
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Contratos</h1>
          <p className="text-slate-600 mt-1">Gerencie os contratos com empresas e hospitais</p>
        </div>
        <Button 
          onClick={handleOpenNewForm} // Alterado para usar a nova função
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </Button>
      </div>
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Lista de Contratos
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por Nº Contrato, Empresa ou Hospital..."
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
                  <div className="bg-slate-200 h-64 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredContratos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "Nenhum contrato encontrado" : "Nenhum contrato cadastrado"}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Comece cadastrando o primeiro contrato"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredContratos.map((contrato) => {
                const tiposPlantaoDoContrato = getTiposPlantaoParaContrato(contrato.id);
                return (
                <Card key={contrato.id} className="hover:shadow-lg transition-all duration-300 border border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">
                            Contrato: {contrato.numero_contrato || `ID ${contrato.id.substring(0,8)}...`}
                          </h3>
                          <Badge 
                            variant={contrato.ativo ? "default" : "secondary"}
                            className={contrato.ativo ? "bg-green-100 text-green-800" : ""}
                          >
                            {contrato.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contrato)}
                        className="hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>Empresa: {getEmpresaName(contrato.empresa_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Hospital className="w-4 h-4" />
                      <span>Hospital: {getRelatedDataName(contrato.hospital_id, hospitais)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays className="w-4 h-4" />
                        <span>Início: {format(new Date(contrato.data_inicio), "dd/MM/yyyy")}</span>
                      </div>
                      {contrato.data_fim && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <CalendarDays className="w-4 h-4" />
                          <span>Fim: {format(new Date(contrato.data_fim), "dd/MM/yyyy")}</span>
                        </div>
                      )}
                    </div>
                    
                    {tiposPlantaoDoContrato.length > 0 && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm text-slate-700 hover:no-underline">
                            <ListChecks className="w-4 h-4 mr-2" />
                            Valores por Tipo de Plantão ({tiposPlantaoDoContrato.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-1 text-xs pl-2">
                              {tiposPlantaoDoContrato.map((tp, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>{tp.nome}:</span>
                                  <span className="font-medium">R$ {tp.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {contrato.observacoes && (
                       <div className="pt-2 border-t">
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={contrato.observacoes}>
                          Obs: {contrato.observacoes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
