import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import { Medico } from "@/api/entities";
import { format, parseISO, isValid } from "date-fns";

export default function VinculoFiscalMedicoForm({ vinculo, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    vinculo || {
      medico_id: "",
      competencia_inicio: format(new Date(), "yyyy-MM-dd"),
      competencia_fim: "",
      cnpj_responsavel: "",
      nome_instituicao: "",
      base_inss: 0,
      valor_inss_retido: 0,
      base_irrf: 0,
      valor_irrf_retido: 0,
      tipo_vinculo: "outro",
      observacoes: "",
      ativo: true
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicos, setMedicos] = useState([]);

  useEffect(() => {
    const loadMedicos = async () => {
      try {
        const medicosData = await Medico.filter({ ativo: true }, "nome");
        setMedicos(medicosData);
        
        if (vinculo) {
          let initialData = { ...vinculo };
          if (vinculo.competencia_inicio && isValid(parseISO(vinculo.competencia_inicio))) {
            initialData.competencia_inicio = format(parseISO(vinculo.competencia_inicio), "yyyy-MM-dd");
          }
          if (vinculo.competencia_fim && isValid(parseISO(vinculo.competencia_fim))) {
            initialData.competencia_fim = format(parseISO(vinculo.competencia_fim), "yyyy-MM-dd");
          }
          setFormData(initialData);
        }
      } catch (error) {
        console.error("Erro ao carregar médicos:", error);
      }
    };
    loadMedicos();
  }, [vinculo]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
  };

  const formatCNPJ = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleCNPJChange = (value) => {
    const formattedCNPJ = formatCNPJ(value);
    handleChange("cnpj_responsavel", formattedCNPJ);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tiposVinculo = [
    { value: "clt", label: "CLT" },
    { value: "pj", label: "Pessoa Jurídica" },
    { value: "cooperativa", label: "Cooperativa" },
    { value: "plantao_publico", label: "Plantão Público" },
    { value: "outro", label: "Outro" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {vinculo ? "Editar Vínculo Fiscal" : "Novo Vínculo Fiscal"}
          </h1>
          <p className="text-slate-600 mt-1">
            {vinculo ? "Altere os dados do vínculo fiscal" : "Registre um novo vínculo fiscal do médico"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Detalhes do Vínculo Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medico_id">Médico *</Label>
                  <Select value={formData.medico_id} onValueChange={(v) => handleChange("medico_id", v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicos.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo_vinculo">Tipo de Vínculo</Label>
                  <Select value={formData.tipo_vinculo} onValueChange={(v) => handleChange("tipo_vinculo", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposVinculo.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome_instituicao">Nome da Instituição *</Label>
                  <Input 
                    id="nome_instituicao" 
                    value={formData.nome_instituicao} 
                    onChange={(e) => handleChange("nome_instituicao", e.target.value)} 
                    placeholder="Ex: Hospital XYZ Ltda"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj_responsavel">CNPJ da Instituição *</Label>
                  <Input 
                    id="cnpj_responsavel" 
                    value={formData.cnpj_responsavel} 
                    onChange={(e) => handleCNPJChange(e.target.value)} 
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competencia_inicio">Competência de Início *</Label>
                  <Input 
                    id="competencia_inicio" 
                    type="date" 
                    value={formData.competencia_inicio} 
                    onChange={(e) => handleChange("competencia_inicio", e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competencia_fim">Competência de Fim</Label>
                  <Input 
                    id="competencia_fim" 
                    type="date" 
                    value={formData.competencia_fim || ""} 
                    onChange={(e) => handleChange("competencia_fim", e.target.value || null)} 
                  />
                  <p className="text-xs text-slate-500">Deixe em branco se o vínculo ainda estiver em curso</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Valores Fiscais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-600">INSS</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="base_inss">Base de Cálculo INSS (R$)</Label>
                      <Input 
                        id="base_inss" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={formData.base_inss} 
                        onChange={(e) => handleNumberChange("base_inss", e.target.value)} 
                        placeholder="0.00" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_inss_retido">Valor INSS Retido (R$)</Label>
                      <Input 
                        id="valor_inss_retido" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={formData.valor_inss_retido} 
                        onChange={(e) => handleNumberChange("valor_inss_retido", e.target.value)} 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-600">IRRF</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="base_irrf">Base de Cálculo IRRF (R$)</Label>
                      <Input 
                        id="base_irrf" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={formData.base_irrf} 
                        onChange={(e) => handleNumberChange("base_irrf", e.target.value)} 
                        placeholder="0.00" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_irrf_retido">Valor IRRF Retido (R$)</Label>
                      <Input 
                        id="valor_irrf_retido" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={formData.valor_irrf_retido} 
                        onChange={(e) => handleNumberChange("valor_irrf_retido", e.target.value)} 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Informações Adicionais</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea 
                    id="observacoes" 
                    value={formData.observacoes} 
                    onChange={(e) => handleChange("observacoes", e.target.value)} 
                    placeholder="Ex: Plantão SUS no Hospital Municipal, holerite ref. 12/2024"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="ativo" 
                    checked={formData.ativo} 
                    onCheckedChange={(v) => handleChange("ativo", v)} 
                  />
                  <Label htmlFor="ativo">Vínculo ativo para cálculos</Label>
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : (vinculo ? "Salvar Alterações" : "Salvar Vínculo")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}