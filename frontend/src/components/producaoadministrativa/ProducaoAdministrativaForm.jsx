
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Briefcase, User, Building2, CalendarDays, Clock, DollarSign } from "lucide-react";
import { Medico, Empresa } from "@/api/entities";
import { format, parseISO } from "date-fns";

const tiposProducaoAdministrativa = [
  { value: "cedula_presenca", label: "Cédula de Presença" },
  { value: "administrativa", label: "Administrativa (Outras)" },
];

export default function ProducaoAdministrativaForm({ producao, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    producao || {
      medico_id: "",
      empresa_id: "",
      data_atividade: "",
      competencia: "",
      descricao_atividade: "",
      horas_dedicadas: 1,
      tipo_producao: "administrativa",
      tributavel: false,
      valor_hora: 0,
      valor_total: 0,
      confirmado: false,
      observacoes: "",
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicos, setMedicos] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [medicosData, empresasData] = await Promise.all([
          Medico.filter({ ativo: true }),
          Empresa.filter({ ativo: true }),
        ]);
        setMedicos(medicosData);
        setEmpresas(empresasData);

        if (producao?.data_atividade) {
          setFormData((prev) => ({
            ...prev,
            data_atividade: format(parseISO(producao.data_atividade), "yyyy-MM-dd"),
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar dados para formulário:", error);
      }
    };
    loadInitialData();
  }, [producao]);

  useEffect(() => {
    // Calcular competência
    if (formData.data_atividade) {
      try {
        const date = parseISO(formData.data_atividade);
        const competenciaValue = format(date, "yyyy-MM");
        setFormData((prev) => ({ ...prev, competencia: competenciaValue }));
      } catch (error) {
        setFormData((prev) => ({ ...prev, competencia: "" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, competencia: "" }));
    }

    // Calcular valor total
    const horas = parseFloat(formData.horas_dedicadas) || 0;
    const valorHora = parseFloat(formData.valor_hora) || 0;
    setFormData((prev) => ({ ...prev, valor_total: horas * valorHora }));
  }, [formData.data_atividade, formData.horas_dedicadas, formData.valor_hora]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Garantir que tipo_producao não seja pró-labore se por algum motivo antigo ainda estiver no estado
    const tipoProducaoFinal = formData.tipo_producao === "pro_labore" ? "administrativa" : formData.tipo_producao;

    const dataToSave = {
      ...formData,
      tipo_producao: tipoProducaoFinal,
      horas_dedicadas: parseFloat(formData.horas_dedicadas) || 0,
      valor_hora: parseFloat(formData.valor_hora) || 0,
      valor_total: (parseFloat(formData.horas_dedicadas) || 0) * (parseFloat(formData.valor_hora) || 0),
    };
    try {
      await onSave(dataToSave);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getEmpresaName = (empresa) => empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {producao ? "Editar Produção Administrativa" : "Nova Produção Administrativa"}
          </h1>
          <p className="text-slate-600 mt-1">
            {producao ? "Altere os dados da produção" : "Registre uma nova produção administrativa"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Detalhes da Produção Administrativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1: Envolvidos e Data */}
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Envolvidos e Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medico_id">Médico *</Label>
                  <Select value={formData.medico_id} onValueChange={(v) => handleChange("medico_id", v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                    <SelectContent>{medicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa_id">Empresa *</Label>
                  <Select value={formData.empresa_id} onValueChange={(v) => handleChange("empresa_id", v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                    <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{getEmpresaName(e)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_atividade">Data da Atividade *</Label>
                  <Input id="data_atividade" type="date" value={formData.data_atividade} onChange={(e) => handleChange("data_atividade", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência (Automático)</Label>
                  <Input id="competencia" value={formData.competencia} readOnly className="bg-slate-100" />
                </div>
              </div>
            </section>

            {/* Seção 2: Detalhes da Atividade */}
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Detalhes da Atividade</h3>
              <div className="space-y-2 mb-4">
                <Label htmlFor="descricao_atividade">Descrição da Atividade *</Label>
                <Textarea id="descricao_atividade" value={formData.descricao_atividade} onChange={(e) => handleChange("descricao_atividade", e.target.value)} placeholder="Descreva a atividade administrativa realizada" required rows={3}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_producao">Tipo de Produção *</Label>
                  <Select value={formData.tipo_producao} onValueChange={(v) => handleChange("tipo_producao", v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>{tiposProducaoAdministrativa.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horas_dedicadas">Horas Dedicadas *</Label>
                  <Input id="horas_dedicadas" type="number" min="0.1" step="0.1" value={formData.horas_dedicadas} onChange={(e) => handleChange("horas_dedicadas", e.target.value)} placeholder="0.0" required />
                </div>
              </div>
            </section>
            
            {/* Seção 3: Valores e Financeiro */}
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Valores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_hora">Valor por Hora (R$) (Opcional)</Label>
                  <Input id="valor_hora" type="number" min="0" step="0.01" value={formData.valor_hora} onChange={(e) => handleChange("valor_hora", e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total (R$) (Automático)</Label>
                  <Input id="valor_total" type="number" value={formData.valor_total} readOnly className="bg-slate-100 font-semibold" />
                </div>
              </div>
            </section>

            {/* Seção 4: Configurações Adicionais */}
            <section>
               <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Configurações Adicionais</h3>
                <div className="space-y-2 mb-4">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => handleChange("observacoes", e.target.value)} placeholder="Informações adicionais sobre esta produção" rows={2}/>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center space-x-2">
                        <Switch id="tributavel" checked={formData.tributavel} onCheckedChange={(v) => handleChange("tributavel", v)} />
                        <Label htmlFor="tributavel">Esta produção é tributável</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="confirmado" checked={formData.confirmado} onCheckedChange={(v) => handleChange("confirmado", v)} />
                        <Label htmlFor="confirmado">Confirmado para processamento/pagamento</Label>
                    </div>
                </div>
            </section>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : (producao ? "Salvar Alterações" : "Salvar Produção")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
