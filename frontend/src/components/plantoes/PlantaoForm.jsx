
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Calendar, Building2 } from "lucide-react"; // Added Building2
import { Medico as MedicoEntity, Contrato as ContratoEntity, TipoPlantao as TipoPlantaoEntity, ContratoTipoPlantao, Empresa as EmpresaEntity, Hospital as HospitalEntity } from "@/api/entities";

export default function PlantaoForm({ 
    plantao, 
    onSave, 
    onCancel 
}) {
  const [formData, setFormData] = useState(plantao || {
    medico_id: "",
    contrato_id: "",
    tipo_plantao_id: "",
    // data_plantao: "", // Removido data_plantao específica
    competencia: "", // Adicionado/priorizado competência
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    observacoes: "",
    confirmado: false,
    empresa_pagamento_id: "" // Novo campo
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para carregar dados das entidades
  const [medicos, setMedicos] = useState([]);
  const [contratos, setContratos] = useState([]); // Contratos ativos (Empresa-Hospital)
  const [todosTiposPlantao, setTodosTiposPlantao] = useState([]); // Todos os tipos de plantão (para nomes)
  const [tiposPlantaoDoContrato, setTiposPlantaoDoContrato] = useState([]); // Tipos de plantão específicos do contrato selecionado
  const [empresas, setEmpresas] = useState([]); // Para o select de Empresa Pagamento
  const [hospitais, setHospitais] = useState([]); // Para exibir nomes nos contratos


  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [medicosData, contratosData, tiposPlantaoData, empresasData, hospitaisData] = await Promise.all([
          MedicoEntity.filter({ ativo: true }),
          ContratoEntity.filter({ ativo: true }), // Apenas contratos ativos
          TipoPlantaoEntity.filter({ ativo: true }),
          EmpresaEntity.filter({ ativo: true }), // Todas as empresas ativas para "Empresa Pagamento"
          HospitalEntity.filter({ ativo: true })
        ]);
        setMedicos(medicosData);
        setContratos(contratosData);
        setTodosTiposPlantao(tiposPlantaoData);
        setEmpresas(empresasData); // Carrega todas as empresas
        setHospitais(hospitaisData);

        // Se estiver editando, e a competência já existe, pré-formata
        if (plantao?.competencia) {
            setFormData(prev => ({...prev, competencia: plantao.competencia}));
        }

      } catch (error) {
        console.error("Erro ao carregar dados para formulário de plantão:", error);
      }
    };
    loadDropdownData();
  }, [plantao]); // Adicionado plantao como dependência para carregar os dados de edição corretamente
  
  // // Atualizar competência quando data_plantao mudar - REMOVIDO, pois usaremos input de competência
  // useEffect(() => {
  //   if (formData.data_plantao) {
  //     const date = new Date(formData.data_plantao);
  //     const year = date.getUTCFullYear();
  //     const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  //     const competencia = `${year}-${month}`;
  //     setFormData(prev => ({ ...prev, competencia }));
  //   }
  // }, [formData.data_plantao]);

  // Atualizar valor_total quando quantidade ou valor_unitario mudar
  useEffect(() => {
    const total = (parseFloat(formData.quantidade) || 0) * (parseFloat(formData.valor_unitario) || 0);
    setFormData(prev => ({ ...prev, valor_total: total }));
  }, [formData.quantidade, formData.valor_unitario]);

  // Carregar tipos de plantão e valores quando um contrato for selecionado
  useEffect(() => {
    const fetchTiposPlantaoContrato = async () => {
      if (formData.contrato_id) {
        try {
          const ctpValores = await ContratoTipoPlantao.filter({ contrato_id: formData.contrato_id, ativo: true });
          const tiposFormatados = ctpValores.map(ctpv => {
            const infoTipo = todosTiposPlantao.find(tp => tp.id === ctpv.tipo_plantao_id);
            return {
              id: ctpv.tipo_plantao_id, // ID do TipoPlantao
              nome: infoTipo ? `${infoTipo.nome} (${infoTipo.carga_horaria}h)` : 'Desconhecido',
              valor: ctpv.valor, // Valor específico deste tipo neste contrato
            };
          });
          setTiposPlantaoDoContrato(tiposFormatados);
          // Se o tipo de plantão selecionado anteriormente não estiver na nova lista, limpe-o
          if (formData.tipo_plantao_id && !tiposFormatados.some(t => t.id === formData.tipo_plantao_id)) {
            setFormData(prev => ({ ...prev, tipo_plantao_id: "", valor_unitario: 0 }));
          }
        } catch (error) {
          console.error("Erro ao buscar tipos de plantão do contrato:", error);
          setTiposPlantaoDoContrato([]);
        }
      } else {
        setTiposPlantaoDoContrato([]);
      }
    };
    fetchTiposPlantaoContrato();
  }, [formData.contrato_id, todosTiposPlantao]);


  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTipoPlantaoSelectChange = (tipoPlantaoId) => {
    const tipoSelecionado = tiposPlantaoDoContrato.find(tp => tp.id === tipoPlantaoId);
    setFormData(prev => ({
      ...prev,
      tipo_plantao_id: tipoPlantaoId,
      valor_unitario: tipoSelecionado ? tipoSelecionado.valor : 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let dataToSave = {
          ...formData,
          quantidade: parseFloat(formData.quantidade) || 1,
          valor_unitario: parseFloat(formData.valor_unitario) || 0,
          valor_total: (parseFloat(formData.quantidade) || 1) * (parseFloat(formData.valor_unitario) || 0)
      };

      // Lógica para empresa_pagamento_id
      if (!dataToSave.empresa_pagamento_id) { // If not explicitly set (or is null/empty string)
        const contratoSelecionado = contratos.find(c => c.id === dataToSave.contrato_id);
        if (contratoSelecionado) {
          dataToSave.empresa_pagamento_id = contratoSelecionado.empresa_id;
        }
      }
      await onSave(dataToSave);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getContratoLabel = (contrato) => {
    if (!contrato) return "Selecione um contrato";
    const empresa = empresas.find(e => e.id === contrato.empresa_id);
    const hospital = hospitais.find(h => h.id === contrato.hospital_id);
    const nomeEmpresa = empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'Empresa N/A';
    const nomeHospital = hospital ? hospital.nome : 'Hospital N/A';
    return `${contrato.numero_contrato || `ID ${contrato.id.substring(0,4)}...`} (${nomeEmpresa} / ${nomeHospital})`;
  }

  const getEmpresaLabel = (empresa) => empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {plantao ? "Editar Plantão" : "Novo Plantão"}
          </h1>
          <p className="text-slate-600 mt-1">
            {plantao ? "Altere as informações do plantão" : "Registre um novo plantão realizado"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Informações do Plantão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados do Plantão</h3>
              
              <div className="space-y-2">
                <Label htmlFor="medico_id">Médico *</Label>
                <Select
                  value={formData.medico_id}
                  onValueChange={(value) => handleChange("medico_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicos.map((med) => (
                      <SelectItem key={med.id} value={med.id}>
                        {med.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contrato_id">Contrato (Empresa Contratante/Hospital) *</Label>
                <Select
                  value={formData.contrato_id}
                  onValueChange={(value) => handleChange("contrato_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contratos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getContratoLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_plantao_id">Tipo de Plantão *</Label>
                <Select
                  value={formData.tipo_plantao_id}
                  onValueChange={handleTipoPlantaoSelectChange}
                  required
                  disabled={!formData.contrato_id || tiposPlantaoDoContrato.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.contrato_id ? "Selecione um contrato primeiro" : (tiposPlantaoDoContrato.length === 0 ? "Nenhum tipo para este contrato" : "Selecione o Tipo de Plantão")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPlantaoDoContrato.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id}>
                        {tp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.contrato_id && <p className="text-xs text-slate-500">Selecione um contrato para ver os tipos de plantão.</p>}
                {formData.contrato_id && tiposPlantaoDoContrato.length === 0 && <p className="text-xs text-amber-600">Nenhum tipo de plantão configurado para este contrato.</p>}
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência (Mês/Ano) *</Label>
                  <Input
                    id="competencia"
                    type="month" // Muda para tipo 'month'
                    value={formData.competencia}
                    onChange={(e) => handleChange("competencia", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="0.5" // Permitir meio plantão
                    step="0.5" // Permitir incrementos de meio
                    value={formData.quantidade}
                    onChange={(e) => handleChange("quantidade", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                  <Input
                    id="valor_unitario"
                    type="number"
                    value={formData.valor_unitario}
                    readOnly // Preenchido automaticamente
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total (R$)</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    value={formData.valor_total}
                    readOnly
                    className="bg-slate-100 font-semibold"
                  />
                </div>
              </div>
               {/* Novo campo Empresa Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="empresa_pagamento_id">Empresa Pagamento (Opcional)</Label>
                <Select
                  value={formData.empresa_pagamento_id}
                  onValueChange={(value) => handleChange("empresa_pagamento_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (se diferente da empresa do contrato)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>
                      <em>Usar empresa do contrato</em>
                    </SelectItem>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {getEmpresaLabel(emp)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <p className="text-xs text-slate-500">Se não selecionado, o pagamento será atribuído à empresa do contrato.</p>
              </div>


              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações sobre o plantão"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="confirmado"
                  checked={formData.confirmado}
                  onCheckedChange={(checked) => handleChange("confirmado", checked)}
                />
                <Label htmlFor="confirmado">Plantão confirmado para pagamento</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : "Salvar Plantão"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
