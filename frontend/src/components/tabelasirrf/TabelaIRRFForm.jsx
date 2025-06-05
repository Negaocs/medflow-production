
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, CalendarDays, Percent, DollarSign, Hash, FileBadge } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function TabelaIRRFForm({ faixaIRRF, onSave, onCancel, isFixedVigencia }) {
  const [formData, setFormData] = useState(
    faixaIRRF || {
      vigencia_inicio: format(new Date(), "yyyy-MM-dd"),
      vigencia_fim: null,
      faixa: 1,
      base_calculo_de: 0,
      base_calculo_ate: 0,
      aliquota: 0,
      parcela_deduzir: 0,
      valor_deducao_dependente: 0,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (faixaIRRF) {
      setFormData({
        ...faixaIRRF,
        vigencia_inicio: faixaIRRF.vigencia_inicio ? format(parseISO(faixaIRRF.vigencia_inicio), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        vigencia_fim: faixaIRRF.vigencia_fim ? format(parseISO(faixaIRRF.vigencia_fim), "yyyy-MM-dd") : null,
        aliquota: faixaIRRF.aliquota || 0,
        parcela_deduzir: faixaIRRF.parcela_deduzir || 0,
        valor_deducao_dependente: faixaIRRF.valor_deducao_dependente || 0,
        faixa: faixaIRRF.faixa || 1,
        base_calculo_de: faixaIRRF.base_calculo_de || 0,
        base_calculo_ate: faixaIRRF.base_calculo_ate || 0,
      });
    } else {
       setFormData({
        vigencia_inicio: format(new Date(), "yyyy-MM-dd"),
        vigencia_fim: null,
        faixa: 1,
        base_calculo_de: 0,
        base_calculo_ate: 0,
        aliquota: 0,
        parcela_deduzir: 0,
        valor_deducao_dependente: 0,
      });
    }
  }, [faixaIRRF]);

  const handleChange = (field, value) => {
    let processedValue = value;
    if (field === "faixa") {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue) || processedValue < 1) processedValue = 1;
    } else if (["base_calculo_de", "base_calculo_ate", "aliquota", "parcela_deduzir", "valor_deducao_dependente"].includes(field)) {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) processedValue = 0;
      if (field === "aliquota" && (processedValue < 0 || processedValue > 1)) {
        processedValue = Math.max(0, Math.min(1, processedValue));
      }
    } else if (field === "vigencia_fim" && value === "") {
        processedValue = null; 
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSave = {
      ...formData,
      faixa: Number(formData.faixa),
      base_calculo_de: Number(formData.base_calculo_de),
      base_calculo_ate: Number(formData.base_calculo_ate),
      aliquota: Number(formData.aliquota),
      parcela_deduzir: Number(formData.parcela_deduzir),
      valor_deducao_dependente: Number(formData.valor_deducao_dependente),
      vigencia_fim: formData.vigencia_fim === "" ? null : formData.vigencia_fim,
    };
    try {
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
            {faixaIRRF && faixaIRRF.id ? "Editar Faixa da Tabela IRRF" : (isFixedVigencia ? "Nova Faixa IRRF para Vigência Existente" : "Nova Vigência/Faixa da Tabela IRRF")}
          </h1>
          <p className="text-slate-600 mt-1">
            {faixaIRRF && faixaIRRF.id ? "Altere os dados da faixa do IRRF" : "Insira os dados para a tabela de Imposto de Renda"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBadge className="h-5 w-5 text-red-600" />
            Detalhes da Faixa IRRF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Período de Vigência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vigencia_inicio">Vigência Início *</Label>
                  <Input 
                    id="vigencia_inicio" 
                    type="date" 
                    value={formData.vigencia_inicio} 
                    onChange={(e) => handleChange("vigencia_inicio", e.target.value)} 
                    required 
                    readOnly={isFixedVigencia}
                    className={isFixedVigencia ? "bg-slate-100 cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vigencia_fim">Vigência Fim (Opcional)</Label>
                  <Input 
                    id="vigencia_fim" 
                    type="date" 
                    value={formData.vigencia_fim || ""} 
                    onChange={(e) => handleChange("vigencia_fim", e.target.value)} 
                    readOnly={isFixedVigencia}
                    className={isFixedVigencia ? "bg-slate-100 cursor-not-allowed" : ""}
                  />
                  <p className="text-xs text-slate-500">Deixe em branco se a vigência for atual.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Detalhes da Faixa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label htmlFor="faixa">Número da Faixa *</Label>
                  <Input id="faixa" type="number" min="1" step="1" value={formData.faixa} onChange={(e) => handleChange("faixa", e.target.value)} placeholder="Ex: 1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota">Alíquota (Ex: 0.075 para 7,5%) *</Label>
                  <Input id="aliquota" type="number" min="0" max="1" step="0.0001" value={formData.aliquota} onChange={(e) => handleChange("aliquota", e.target.value)} placeholder="Ex: 0.075" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_calculo_de">Base de Cálculo De (R$) *</Label>
                  <Input id="base_calculo_de" type="number" min="0" step="0.01" value={formData.base_calculo_de} onChange={(e) => handleChange("base_calculo_de", e.target.value)} placeholder="Ex: 0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_calculo_ate">Base de Cálculo Até (R$) *</Label>
                  <Input id="base_calculo_ate" type="number" min="0" step="0.01" value={formData.base_calculo_ate} onChange={(e) => handleChange("base_calculo_ate", e.target.value)} placeholder="Ex: 2112.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parcela_deduzir">Parcela a Deduzir (R$) *</Label>
                  <Input id="parcela_deduzir" type="number" min="0" step="0.01" value={formData.parcela_deduzir} onChange={(e) => handleChange("parcela_deduzir", e.target.value)} placeholder="Ex: 158.40" required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_deducao_dependente">Dedução por Dependente (R$)</Label>
                  <Input id="valor_deducao_dependente" type="number" min="0" step="0.01" value={formData.valor_deducao_dependente} onChange={(e) => handleChange("valor_deducao_dependente", e.target.value)} placeholder="Ex: 189.59"/>
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : (faixaIRRF && faixaIRRF.id ? "Salvar Alterações" : "Salvar Faixa")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
