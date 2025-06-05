import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Receipt } from "lucide-react";

const tiposLancamento = [
  { value: "desconto", label: "Desconto" },
  { value: "credito", label: "Crédito" },
];

export default function DescontoCreditoForm({ 
  item, 
  onSave, 
  onCancel,
  medicos,
  empresas,
  hospitais
}) {
  const [formData, setFormData] = useState(item || {
    medico_id: "",
    empresa_id: "",
    hospital_id: "",
    tipo: "desconto",
    descricao: "",
    valor: 0,
    competencia: "",
    tributavel: false,
    recorrente: false,
    observacoes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSave = {
      ...formData,
      valor: parseFloat(formData.valor) || 0
    };
    try {
      await onSave(dataToSave);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getEmpresaName = (empresa) => {
    return empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {item ? "Editar Lançamento" : "Novo Desconto/Crédito"}
          </h1>
          <p className="text-slate-600 mt-1">
            {item ? "Altere as informações do lançamento" : "Cadastre um novo desconto ou crédito"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Informações do Lançamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Entidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Referência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medico_id">Médico *</Label>
                  <Select value={formData.medico_id} onValueChange={(value) => handleChange("medico_id", value)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o Médico" /></SelectTrigger>
                    <SelectContent>
                      {medicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa_id">Empresa *</Label>
                  <Select value={formData.empresa_id} onValueChange={(value) => handleChange("empresa_id", value)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione a Empresa" /></SelectTrigger>
                    <SelectContent>
                      {empresas.map(e => <SelectItem key={e.id} value={e.id}>{getEmpresaName(e)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"> {/* Hospital é opcional */}
                  <Label htmlFor="hospital_id">Hospital (opcional)</Label> 
                  <Select value={formData.hospital_id} onValueChange={(value) => handleChange("hospital_id", value)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o Hospital" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {hospitais.map(h => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Detalhes do Lançamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Detalhes do Lançamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Lançamento *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleChange("tipo", value)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o Tipo" /></SelectTrigger>
                    <SelectContent>
                      {tiposLancamento.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input id="descricao" value={formData.descricao} onChange={(e) => handleChange("descricao", e.target.value)} placeholder="Descrição do lançamento" required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$) *</Label>
                  <Input id="valor" type="number" min="0" step="0.01" value={formData.valor} onChange={(e) => handleChange("valor", e.target.value)} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência (AAAA-MM) *</Label>
                  <Input id="competencia" type="month" value={formData.competencia} onChange={(e) => handleChange("competencia", e.target.value)} placeholder="AAAA-MM" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => handleChange("observacoes", e.target.value)} placeholder="Observações sobre o lançamento" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch id="tributavel" checked={formData.tributavel} onCheckedChange={(checked) => handleChange("tributavel", checked)} />
                  <Label htmlFor="tributavel">Tributável (incide impostos)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="recorrente" checked={formData.recorrente} onCheckedChange={(checked) => handleChange("recorrente", checked)} />
                  <Label htmlFor="recorrente">Lançamento Recorrente</Label>
                </div>
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
                {isSubmitting ? "Salvando..." : "Salvar Lançamento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}