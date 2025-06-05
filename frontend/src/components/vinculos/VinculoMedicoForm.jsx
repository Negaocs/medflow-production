import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Link as LinkIcon } from "lucide-react";

export default function VinculoMedicoForm({ 
  vinculo, 
  onSave, 
  onCancel,
  medicos,
  empresas
}) {
  const [formData, setFormData] = useState(vinculo || {
    medico_id: "",
    empresa_id: "",
    data_vinculo: "",
    data_desvinculo: "",
    ativo: true,
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
    try {
      await onSave(formData);
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
            {vinculo ? "Editar Vínculo" : "Novo Vínculo"}
          </h1>
          <p className="text-slate-600 mt-1">
            {vinculo ? "Altere as informações do vínculo" : "Cadastre um novo vínculo médico-empresa"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            Informações do Vínculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="space-y-2">
                <Label htmlFor="data_vinculo">Data do Vínculo *</Label>
                <Input 
                  id="data_vinculo" 
                  type="date" 
                  value={formData.data_vinculo} 
                  onChange={(e) => handleChange("data_vinculo", e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_desvinculo">Data do Desvínculo</Label>
                <Input 
                  id="data_desvinculo" 
                  type="date" 
                  value={formData.data_desvinculo} 
                  onChange={(e) => handleChange("data_desvinculo", e.target.value)} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea 
                id="observacoes" 
                value={formData.observacoes} 
                onChange={(e) => handleChange("observacoes", e.target.value)} 
                placeholder="Observações sobre o vínculo" 
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="ativo" 
                checked={formData.ativo} 
                onCheckedChange={(checked) => handleChange("ativo", checked)} 
              />
              <Label htmlFor="ativo">Vínculo ativo</Label>
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
                {isSubmitting ? "Salvando..." : "Salvar Vínculo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}