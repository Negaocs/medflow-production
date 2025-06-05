import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, ListChecks } from "lucide-react";

export default function TipoPlantaoForm({ tipoPlantao, onSave, onCancel }) {
  const [formData, setFormData] = useState(tipoPlantao || {
    nome: "",
    descricao: "",
    carga_horaria: 12,
    observacoes: "",
    ativo: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tipoPlantao) {
      setFormData(tipoPlantao);
    }
  }, [tipoPlantao]);

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
      // Garantir que carga_horaria seja um número
      const dataToSave = {
        ...formData,
        carga_horaria: parseFloat(formData.carga_horaria) || 0
      };
      await onSave(dataToSave);
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
            {tipoPlantao ? "Editar Tipo de Plantão" : "Novo Tipo de Plantão"}
          </h1>
          <p className="text-slate-600 mt-1">
            {tipoPlantao ? "Altere as informações do tipo de plantão" : "Cadastre um novo tipo de plantão no sistema"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-blue-600" />
            Informações do Tipo de Plantão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Tipo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Ex: Plantão 12h, Plantão 24h, Sobreaviso"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carga_horaria">Carga Horária (horas) *</Label>
                  <Input
                    id="carga_horaria"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.carga_horaria}
                    onChange={(e) => handleChange("carga_horaria", e.target.value)}
                    placeholder="Ex: 12, 24, 6"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  placeholder="Descrição detalhada do tipo de plantão..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações específicas, regras especiais, etc..."
                  rows={2}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Status</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => handleChange("ativo", checked)}
                />
                <Label htmlFor="ativo">Tipo de plantão ativo no sistema</Label>
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
                {isSubmitting ? "Salvando..." : "Salvar Tipo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}