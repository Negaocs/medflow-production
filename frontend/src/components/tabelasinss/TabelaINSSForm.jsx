import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, CalendarDays, Percent, DollarSign, Hash } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

export default function TabelaINSSForm({ faixaINSS, onSave, onCancel, isFixedVigencia }) {
  const [formData, setFormData] = useState(
    faixaINSS || {
      vigencia_inicio: format(new Date(), "yyyy-MM-dd"),
      vigencia_fim: null,
      tipo_contribuinte: "empregado",
      faixa: 1,
      salario_de: 0,
      salario_ate: 0,
      aliquota: 0,
      deducao_faixa: 0,
      teto_contribuicao: null,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (faixaINSS) {
      setFormData({
        ...faixaINSS,
        vigencia_inicio: faixaINSS.vigencia_inicio ? format(parseISO(faixaINSS.vigencia_inicio), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        vigencia_fim: faixaINSS.vigencia_fim ? format(parseISO(faixaINSS.vigencia_fim), "yyyy-MM-dd") : null,
        tipo_contribuinte: faixaINSS.tipo_contribuinte || "empregado",
        aliquota: faixaINSS.aliquota || 0,
        deducao_faixa: faixaINSS.deducao_faixa || 0,
        faixa: faixaINSS.faixa || 1,
        salario_de: faixaINSS.salario_de || 0,
        salario_ate: faixaINSS.salario_ate || 0,
        teto_contribuicao: faixaINSS.teto_contribuicao || null,
      });
    } else {
      setFormData({
        vigencia_inicio: format(new Date(), "yyyy-MM-dd"),
        vigencia_fim: null,
        tipo_contribuinte: "empregado",
        faixa: 1,
        salario_de: 0,
        salario_ate: 0,
        aliquota: 0,
        deducao_faixa: 0,
        teto_contribuicao: null,
      });
    }
  }, [faixaINSS]);

  const handleChange = (field, value) => {
    let processedValue = value;
    if (field === "faixa") {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue) || processedValue < 1) processedValue = 1;
    } else if (["salario_de", "salario_ate", "aliquota", "deducao_faixa", "teto_contribuicao"].includes(field)) {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) processedValue = field === "teto_contribuicao" ? null : 0;
      if (field === "aliquota" && (processedValue < 0 || processedValue > 1)) {
        processedValue = Math.max(0, Math.min(1, processedValue));
      }
    } else if (field === "vigencia_fim" && value === "") {
        processedValue = null; 
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
  };

  // Auto-preencher alíquota quando tipo_contribuinte muda
  const handleTipoContribuinteChange = (value) => {
    setFormData(prev => ({
      ...prev,
      tipo_contribuinte: value,
      aliquota: value === "pro_labore" ? 0.11 : prev.aliquota, // 11% para pró-labore
      deducao_faixa: value === "pro_labore" ? 0 : prev.deducao_faixa // Sem dedução para pró-labore
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSave = {
      ...formData,
      faixa: Number(formData.faixa),
      salario_de: Number(formData.salario_de),
      salario_ate: Number(formData.salario_ate),
      aliquota: Number(formData.aliquota),
      deducao_faixa: Number(formData.deducao_faixa),
      teto_contribuicao: formData.teto_contribuicao ? Number(formData.teto_contribuicao) : null,
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
            {faixaINSS && faixaINSS.id ? "Editar Faixa da Tabela INSS" : (isFixedVigencia ? "Nova Faixa para Vigência Existente" : "Nova Vigência/Faixa da Tabela INSS")}
          </h1>
          <p className="text-slate-600 mt-1">
            {faixaINSS && faixaINSS.id ? "Altere os dados da faixa" : "Insira os dados para a tabela de contribuição do INSS"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-blue-600" />
            Detalhes da Faixa INSS
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
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Configuração da Faixa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_contribuinte">Tipo de Contribuinte *</Label>
                  <Select 
                    value={formData.tipo_contribuinte} 
                    onValueChange={handleTipoContribuinteChange}
                    disabled={isFixedVigencia}
                  >
                    <SelectTrigger className={isFixedVigencia ? "bg-slate-100 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empregado">Empregado (CLT)</SelectItem>
                      <SelectItem value="pro_labore">Pró-Labore (11% fixo)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {formData.tipo_contribuinte === "pro_labore" ? 
                      "Pró-labore tem alíquota fixa de 11% sem progressividade" : 
                      "Empregados CLT usam faixas progressivas"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="faixa">Número da Faixa *</Label>
                  <Input 
                    id="faixa" 
                    type="number" 
                    min="1" 
                    step="1" 
                    value={formData.faixa} 
                    onChange={(e) => handleChange("faixa", e.target.value)} 
                    placeholder="Ex: 1" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aliquota">
                    Alíquota *
                    {formData.tipo_contribuinte === "pro_labore" && (
                      <span className="text-green-600 font-medium"> (11% fixo)</span>
                    )}
                  </Label>
                  <Input 
                    id="aliquota" 
                    type="number" 
                    min="0" 
                    max="1" 
                    step="0.0001" 
                    value={formData.aliquota} 
                    onChange={(e) => handleChange("aliquota", e.target.value)} 
                    placeholder="Ex: 0.11 para 11%" 
                    required 
                    readOnly={formData.tipo_contribuinte === "pro_labore"}
                    className={formData.tipo_contribuinte === "pro_labore" ? "bg-green-50" : ""}
                  />
                  <p className="text-xs text-slate-500">
                    {formData.tipo_contribuinte === "pro_labore" ? 
                      "Alíquota fixa de 11% para pró-labore" : 
                      "Ex: 0.075 para 7,5% ou 0.09 para 9%"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="salario_de">Salário De (R$) *</Label>
                  <Input 
                    id="salario_de" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={formData.salario_de} 
                    onChange={(e) => handleChange("salario_de", e.target.value)} 
                    placeholder="Ex: 0.00" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salario_ate">Salário Até (R$) *</Label>
                  <Input 
                    id="salario_ate" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={formData.salario_ate} 
                    onChange={(e) => handleChange("salario_ate", e.target.value)} 
                    placeholder="Ex: 1412.00" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="teto_contribuicao">Teto de Contribuição (R$)</Label>
                  <Input 
                    id="teto_contribuicao" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={formData.teto_contribuicao || ""} 
                    onChange={(e) => handleChange("teto_contribuicao", e.target.value)} 
                    placeholder="Ex: 908.85" 
                  />
                  <p className="text-xs text-slate-500">Valor máximo de contribuição INSS para esta vigência</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="deducao_faixa">
                    Dedução da Faixa (R$)
                    {formData.tipo_contribuinte === "pro_labore" && (
                      <span className="text-green-600 font-medium"> (Sem dedução)</span>
                    )}
                  </Label>
                  <Input 
                    id="deducao_faixa" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={formData.deducao_faixa} 
                    onChange={(e) => handleChange("deducao_faixa", e.target.value)} 
                    placeholder="Ex: 0.00" 
                    readOnly={formData.tipo_contribuinte === "pro_labore"}
                    className={formData.tipo_contribuinte === "pro_labore" ? "bg-green-50" : ""}
                  />
                  <p className="text-xs text-slate-500">
                    {formData.tipo_contribuinte === "pro_labore" ? 
                      "Pró-labore não possui dedução de faixa (sempre R$ 0,00)" : 
                      "Para cálculo progressivo por faixa, esta dedução usualmente é R$ 0,00"}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : (faixaINSS && faixaINSS.id ? "Salvar Alterações" : "Salvar Faixa")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}