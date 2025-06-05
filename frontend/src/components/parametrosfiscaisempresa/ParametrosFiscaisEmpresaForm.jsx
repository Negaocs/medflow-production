import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Building2, CalendarRange, Percent, FileText, AlertTriangle } from "lucide-react";
import { Empresa } from "@/api/entities";
import { format, parseISO, isValid } from "date-fns";

const regimesTributarios = [
  { value: "lucro_presumido", label: "Lucro Presumido" },
  { value: "simples_nacional", label: "Simples Nacional" },
];

const aliquotaFields = [
  { id: "aliquota_inss", label: "INSS (%)", placeholder: "Ex: 20.00" },
  { id: "aliquota_irrf", label: "IRRF (%)", placeholder: "Ex: 1.50 (ou deixe em branco)" },
  { id: "aliquota_iss", label: "ISS (%)", placeholder: "Ex: 3.50" },
  { id: "aliquota_irpj", label: "IRPJ (%)", placeholder: "Ex: 1.20" },
  { id: "aliquota_csll", label: "CSLL (%)", placeholder: "Ex: 1.08" },
  { id: "aliquota_pis", label: "PIS (%)", placeholder: "Ex: 0.65" },
  { id: "aliquota_cofins", label: "COFINS (%)", placeholder: "Ex: 3.00" },
  { id: "aliquota_administrativa", label: "Taxa Administrativa (%)", placeholder: "Ex: 6.00" },
];

export default function ParametrosFiscaisEmpresaForm({ parametroFiscal, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    parametroFiscal || {
      empresa_id: "",
      regime_tributario: "lucro_presumido",
      vigencia_inicio: format(new Date(), "yyyy-MM-dd"),
      vigencia_fim: null,
      aliquota_inss: null,
      aliquota_irrf: null,
      aliquota_iss: null,
      aliquota_irpj: null,
      aliquota_csll: null,
      aliquota_pis: null,
      aliquota_cofins: null,
      aliquota_administrativa: null,
      observacoes: "",
    }
  );
  const [empresas, setEmpresas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const empresasData = await Empresa.filter({ ativo: true }, "nome_fantasia");
        setEmpresas(empresasData);
      } catch (err) {
        console.error("Erro ao carregar empresas:", err);
        setError("Falha ao carregar lista de empresas.");
      }
    };
    loadEmpresas();
  }, []);

  useEffect(() => {
    if (parametroFiscal) {
      setFormData({
        ...parametroFiscal,
        vigencia_inicio: parametroFiscal.vigencia_inicio ? format(parseISO(parametroFiscal.vigencia_inicio), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        vigencia_fim: parametroFiscal.vigencia_fim ? format(parseISO(parametroFiscal.vigencia_fim), "yyyy-MM-dd") : null,
      });
    }
  }, [parametroFiscal]);

  const handleChange = (field, value) => {
    let processedValue = value;
    if (aliquotaFields.some(f => f.id === field)) {
      processedValue = value === "" ? null : parseFloat(value);
      if (processedValue !== null && isNaN(processedValue)) processedValue = null;
    } else if (field === "vigencia_fim" && value === "") {
      processedValue = null;
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.empresa_id) {
        setError("Por favor, selecione uma empresa.");
        return;
    }
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error("Erro ao salvar parâmetros fiscais:", err);
      setError("Falha ao salvar. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getEmpresaName = (empresa) => empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel} aria-label="Voltar">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {parametroFiscal ? "Editar Parâmetros Fiscais" : "Novos Parâmetros Fiscais"}
          </h1>
          <p className="text-slate-600 mt-1">
            Defina as alíquotas e configurações fiscais para uma empresa e período de vigência.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-white shadow-lg border-0 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            Detalhes dos Parâmetros
          </CardTitle>
          <CardDescription>
            As alíquotas devem ser inseridas como percentuais (ex: 5 para 5%, 0.65 para 0.65%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seção Empresa e Vigência */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Empresa e Vigência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="empresa_id">Empresa *</Label>
                  <Select
                    value={formData.empresa_id}
                    onValueChange={(v) => handleChange("empresa_id", v)}
                    disabled={!!parametroFiscal} // Não permite alterar empresa ao editar
                  >
                    <SelectTrigger id="empresa_id" className={parametroFiscal ? "bg-slate-100 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {getEmpresaName(e)} ({e.cnpj})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="regime_tributario">Regime Tributário *</Label>
                  <Select
                    value={formData.regime_tributario}
                    onValueChange={(v) => handleChange("regime_tributario", v)}
                  >
                    <SelectTrigger id="regime_tributario">
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      {regimesTributarios.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                  <Label htmlFor="vigencia_inicio">Vigência Início *</Label>
                  <Input
                    id="vigencia_inicio"
                    type="date"
                    value={formData.vigencia_inicio}
                    onChange={(e) => handleChange("vigencia_inicio", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vigencia_fim">Vigência Fim (Opcional)</Label>
                  <Input
                    id="vigencia_fim"
                    type="date"
                    value={formData.vigencia_fim || ""}
                    onChange={(e) => handleChange("vigencia_fim", e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Deixe em branco se a vigência for atual.</p>
                </div>
              </div>
            </section>

            {/* Seção Alíquotas */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Alíquotas de Impostos e Taxas (%)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                {aliquotaFields.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type="number"
                      step="0.01"
                      value={formData[field.id] === null || formData[field.id] === undefined ? "" : formData[field.id]}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="text-right"
                    />
                  </div>
                ))}
              </div>
            </section>
            
            {/* Seção Observações */}
            <section className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Detalhes sobre regras fiscais específicas, exceções ou aplicação das alíquotas."
                rows={4}
              />
            </section>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : (parametroFiscal ? "Salvar Alterações" : "Salvar Parâmetros")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}