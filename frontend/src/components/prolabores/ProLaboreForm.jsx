import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, DollarSign, User, Building2, CalendarDays, RefreshCw } from "lucide-react";
import { Medico, Empresa } from "@/api/entities"; // MUDANÇA: Remover ProducaoAdministrativa, só usar as entidades de lookup
import { format, parseISO, isValid } from "date-fns";

export default function ProLaboreForm({ proLabore, onSave, onCancel }) { // MUDANÇA: Parâmetro é proLabore, não producao
  const [formData, setFormData] = useState(
    proLabore || {
      medico_id: "",
      empresa_pagamento_id: "",
      empresa_beneficiaria_id: "", // MUDANÇA: Campo específico da entidade ProLabore
      data_referencia: format(new Date(), "yyyy-MM-dd"), // MUDANÇA: Campo específico da entidade ProLabore
      competencia: format(new Date(), "yyyy-MM"), // Será calculado automaticamente
      descricao: "", // MUDANÇA: Campo específico da entidade ProLabore
      valor_bruto: "", // MUDANÇA: Campo específico da entidade ProLabore
      tributavel: true,
      recorrente: false,
      confirmado: false,
      observacoes: "",
    }
  );

  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  // Atualizar competência automaticamente quando data_referencia mudar
  useEffect(() => {
    if (formData.data_referencia && isValid(parseISO(formData.data_referencia))) {
      const date = parseISO(formData.data_referencia);
      const competencia = format(date, "yyyy-MM");
      setFormData(prev => ({ ...prev, competencia }));
    }
  }, [formData.data_referencia]);

  const loadOptions = async () => {
    try {
      const [medicosData, empresasData] = await Promise.all([
        Medico.filter({ ativo: true }, "nome"),
        Empresa.filter({ ativo: true }, "nome_fantasia"),
      ]);
      setMedicos(medicosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Preparar dados para salvar na entidade ProLabore
      const dataToSave = {
        ...formData,
        valor_bruto: parseFloat(formData.valor_bruto) || 0, // MUDANÇA: Campo valor_bruto
        // Remover empresa_beneficiaria_id se for igual a empresa_pagamento_id ou vazio
        empresa_beneficiaria_id: (formData.empresa_beneficiaria_id && formData.empresa_beneficiaria_id !== formData.empresa_pagamento_id) 
          ? formData.empresa_beneficiaria_id 
          : null,
      };
      
      await onSave(dataToSave);
    } catch (error) {
      console.error("Erro ao salvar pró-labore:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {proLabore ? "Editar Pró-labore" : "Novo Pró-labore"}
          </h1>
          <p className="text-slate-600 mt-1">
            {proLabore ? "Altere as informações do pró-labore" : "Cadastre um novo pró-labore no sistema"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Informações do Pró-labore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medico_id">Médico *</Label>
                  <Select
                    value={formData.medico_id}
                    onValueChange={(value) => handleChange("medico_id", value)}
                    required
                  >
                    <SelectTrigger id="medico_id">
                      <SelectValue placeholder="Selecione um médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicos.map(medico => (
                        <SelectItem key={medico.id} value={medico.id}>
                          {medico.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange("descricao", e.target.value)}
                    placeholder="Ex: Pró-labore Direção Técnica"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_referencia">Data de Referência *</Label>
                  <Input
                    id="data_referencia"
                    type="date"
                    value={formData.data_referencia}
                    onChange={(e) => handleChange("data_referencia", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência (Calculada)</Label>
                  <Input
                    id="competencia"
                    value={formData.competencia}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="valor_bruto">Valor Bruto *</Label>
                  <Input
                    id="valor_bruto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_bruto}
                    onChange={(e) => handleChange("valor_bruto", e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Empresas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Empresas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa_pagamento_id">Empresa Pagadora *</Label>
                  <Select
                    value={formData.empresa_pagamento_id}
                    onValueChange={(value) => handleChange("empresa_pagamento_id", value)}
                    required
                  >
                    <SelectTrigger id="empresa_pagamento_id">
                      <SelectValue placeholder="Selecione a empresa que pagará" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map(empresa => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome_fantasia || empresa.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa_beneficiaria_id">Empresa Beneficiária (Opcional)</Label>
                  <Select
                    value={formData.empresa_beneficiaria_id || ""}
                    onValueChange={(value) => handleChange("empresa_beneficiaria_id", value)}
                  >
                    <SelectTrigger id="empresa_beneficiaria_id">
                      <SelectValue placeholder="Selecione se diferente da pagadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhuma (mesma que pagadora)</SelectItem>
                      {empresas.map(empresa => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome_fantasia || empresa.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Configurações</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tributavel"
                    checked={formData.tributavel}
                    onCheckedChange={(checked) => handleChange("tributavel", checked)}
                  />
                  <Label htmlFor="tributavel">Pró-labore tributável (INSS 11% e IRRF)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="recorrente"
                    checked={formData.recorrente}
                    onCheckedChange={(checked) => handleChange("recorrente", checked)}
                  />
                  <Label htmlFor="recorrente">Lançamento recorrente mensalmente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="confirmado"
                    checked={formData.confirmado}
                    onCheckedChange={(checked) => handleChange("confirmado", checked)}
                  />
                  <Label htmlFor="confirmado">Pró-labore confirmado para cálculo</Label>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Observações</h3>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações adicionais sobre o pró-labore..."
                  rows={3}
                />
              </div>
            </div>

            {/* Botões */}
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
                {isSubmitting ? "Salvando..." : "Salvar Pró-labore"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}