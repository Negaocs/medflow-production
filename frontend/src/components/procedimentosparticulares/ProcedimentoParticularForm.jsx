
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Stethoscope, Building2, Hospital as HospitalIcon, Users, DollarSign, Paperclip, Percent, Loader2, AlertTriangle } from "lucide-react";
import { Medico, Empresa, Hospital, ParametrosFiscaisEmpresa } from "@/api/entities";
import { format, parseISO, isValid } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formatCurrencyForInput = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return "";
  return Number(value).toFixed(2);
};

const formatCurrencyDisplay = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return "R$ 0,00";
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function ProcedimentoParticularForm({
  procedimento,
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    medico_id: "",
    empresa_id: "", // Empresa prestadora / faturadora
    hospital_id: "",
    empresa_pagamento_id: "", // Empresa que paga o médico
    data_procedimento: "",
    competencia: "",
    nota_fiscal: "",
    nome_paciente: "",
    descricao_procedimentos: "",
    cirurgiao_responsavel_nome: "", // Alterado de _id para _nome
    equipe_envolvida_nomes: "",
    local_realizacao_nome: "",
    valor_bruto: 0,
    valor_mat_med: 0,
    valor_impostos_empresa: 0,
    valor_taxa_administrativa_empresa: 0,
    valor_liquido_repasse: 0,
    observacoes: "",
    confirmado: false,
    ...(procedimento || {}), // Aplica o procedimento existente sobre o default
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(true);
  const [medicos, setMedicos] = useState([]);
  // const [cirurgioes, setCirurgioes] = useState([]); // Removido - não mais necessário
  const [empresas, setEmpresas] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [parametrosFiscaisAtuais, setParametrosFiscaisAtuais] = useState(null);
  const [formError, setFormError] = useState("");

  // Carregar dados de dependências (médicos, empresas, hospitais)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingDependencies(true);
      setFormError("");
      try {
        const [medicosData, empresasData, hospitaisData] = await Promise.all([
          Medico.filter({ ativo: true }, "nome"),
          Empresa.filter({ ativo: true }, "nome_fantasia"),
          Hospital.filter({ ativo: true }, "nome"),
        ]);
        setMedicos(medicosData);
        setEmpresas(empresasData);
        setHospitais(hospitaisData);
        // setCirurgioes(medicosData.filter(m => m.e_cirurgiao)); // Removido

        if (procedimento?.data_procedimento) {
           setFormData(prev => ({ ...prev, data_procedimento: format(parseISO(procedimento.data_procedimento), "yyyy-MM-dd") }));
        } else if (!formData.data_procedimento) {
           setFormData(prev => ({ ...prev, data_procedimento: format(new Date(), "yyyy-MM-dd") }));
        }
      } catch (error) {
        console.error("Erro ao carregar dados para formulário:", error);
        setFormError("Falha ao carregar dados de apoio. Tente recarregar.");
      } finally {
        setIsLoadingDependencies(false);
      }
    };
    loadInitialData();
  }, [procedimento]);

  // Derivar competência da data do procedimento
  useEffect(() => {
    if (formData.data_procedimento && isValid(parseISO(formData.data_procedimento))) {
      const date = parseISO(formData.data_procedimento);
      const competenciaValue = format(date, "yyyy-MM");
      setFormData((prev) => ({ ...prev, competencia: competenciaValue }));
    } else {
      setFormData((prev) => ({ ...prev, competencia: "" }));
    }
  }, [formData.data_procedimento]);

  // Buscar parâmetros fiscais quando empresa_id ou competencia mudam
  useEffect(() => {
    const fetchParametrosFiscais = async () => {
      if (!formData.empresa_id || !formData.competencia) {
        setParametrosFiscaisAtuais(null);
        return;
      }
      setFormError("");
      try {
        const vigenciaData = parseISO(`${formData.competencia}-01`);
        const params = await ParametrosFiscaisEmpresa.filter({ empresa_id: formData.empresa_id });
        
        const parametroVigente = params.find(p => {
          const inicioVigencia = parseISO(p.vigencia_inicio);
          const fimVigencia = p.vigencia_fim ? parseISO(p.vigencia_fim) : null;
          return vigenciaData >= inicioVigencia && (!fimVigencia || vigenciaData <= fimVigencia);
        });
        setParametrosFiscaisAtuais(parametroVigente || null);
        if (!parametroVigente) {
            console.warn(`Nenhum parâmetro fiscal encontrado para empresa ${formData.empresa_id} na competência ${formData.competencia}. Impostos e taxas podem não ser calculados.`);
        }
      } catch (error) {
        console.error("Erro ao buscar parâmetros fiscais:", error);
        setParametrosFiscaisAtuais(null);
        setFormError("Erro ao buscar parâmetros fiscais da empresa.");
      }
    };
    fetchParametrosFiscais();
  }, [formData.empresa_id, formData.competencia]);

  // Calcular impostos, taxa administrativa e valor líquido
  useEffect(() => {
    const bruto = parseFloat(formData.valor_bruto) || 0;
    const matMed = parseFloat(formData.valor_mat_med) || 0;
    let impostosEmpresaCalculados = 0;
    let taxaAdmCalculada = 0;

    if (parametrosFiscaisAtuais && bruto > 0) {
      const {
        aliquota_inss,
        aliquota_irrf,
        aliquota_iss,
        aliquota_irpj,
        aliquota_csll,
        aliquota_pis,
        aliquota_cofins,
        aliquota_administrativa
      } = parametrosFiscaisAtuais;

      // CORREÇÃO: Incluir todas as alíquotas especificadas
      const somaAliquotasImpostos = 
        (parseFloat(aliquota_inss) || 0) / 100 +
        (parseFloat(aliquota_irrf) || 0) / 100 +
        (parseFloat(aliquota_iss) || 0) / 100 +
        (parseFloat(aliquota_irpj) || 0) / 100 +
        (parseFloat(aliquota_csll) || 0) / 100 +
        (parseFloat(aliquota_pis) || 0) / 100 +
        (parseFloat(aliquota_cofins) || 0) / 100;
      
      impostosEmpresaCalculados = bruto * somaAliquotasImpostos;
      taxaAdmCalculada = bruto * ((parseFloat(aliquota_administrativa) || 0) / 100);
      
      console.log("[ProcPartForm] Parâmetros Fiscais Aplicados:", parametrosFiscaisAtuais);
      console.log(`[ProcPartForm] Soma Alíquotas Impostos: ${(somaAliquotasImpostos * 100).toFixed(2)}%`);
      console.log(`[ProcPartForm] Impostos Empresa Calculados (sobre ${formatCurrencyDisplay(bruto)}): ${formatCurrencyDisplay(impostosEmpresaCalculados)}`);
      console.log(`[ProcPartForm] Taxa Adm Calculada: ${formatCurrencyDisplay(taxaAdmCalculada)}`);
    }

    const liquido = bruto - matMed - impostosEmpresaCalculados - taxaAdmCalculada;
    setFormData((prev) => ({
      ...prev,
      valor_impostos_empresa: impostosEmpresaCalculados,
      valor_taxa_administrativa_empresa: taxaAdmCalculada,
      valor_liquido_repasse: liquido,
    }));
  }, [formData.valor_bruto, formData.valor_mat_med, parametrosFiscaisAtuais]);


  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleNumericChange = (field, value) => {
    const numValue = value === "" ? null : parseFloat(value);
    // Permitir que o usuário limpe o campo, resultando em null ou 0 dependendo da lógica de cálculo
    if (value === "" || (numValue !== null && !isNaN(numValue))) {
         setFormData((prev) => ({ ...prev, [field]: value === "" ? 0 : numValue })); // Default to 0 if empty for calculation purposes
    } else if (value !== "" && isNaN(numValue)) {
        // Manter o valor anterior se a entrada for inválida e não vazia
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    // Garantir que empresa_pagamento_id use empresa_id como fallback se não preenchido
    const finalEmpresaPagamentoId = formData.empresa_pagamento_id || formData.empresa_id;

    const dataToSave = {
      ...formData,
      valor_bruto: parseFloat(formData.valor_bruto) || 0,
      valor_mat_med: parseFloat(formData.valor_mat_med) || 0,
      // valores_impostos_empresa e valor_taxa_administrativa_empresa já estão no formData pelo useEffect
      // valor_liquido_repasse também já está calculado
      empresa_pagamento_id: finalEmpresaPagamentoId,
      cirurgiao_responsavel_nome: formData.cirurgiao_responsavel_nome || null, // Adicionado _nome
    };

    // Validação básica
    if (!dataToSave.empresa_id || !dataToSave.medico_id || !dataToSave.hospital_id || !dataToSave.data_procedimento || !dataToSave.nome_paciente || !dataToSave.descricao_procedimentos) {
        setFormError("Campos obrigatórios (*) não preenchidos.");
        setIsSubmitting(false);
        return;
    }
    if (dataToSave.valor_bruto <= 0) {
        setFormError("O valor bruto deve ser maior que zero.");
        setIsSubmitting(false);
        return;
    }


    try {
      await onSave(dataToSave);
    } catch(err) {
        console.error("Erro ao salvar procedimento: ", err);
        setFormError("Falha ao salvar o procedimento. Tente novamente.");
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  const getEmpresaName = (empresa) => empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';

  if (isLoadingDependencies) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="ml-3 text-slate-600">Carregando dados do formulário...</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {procedimento ? "Editar Procedimento Particular" : "Novo Procedimento Particular"}
          </h1>
        </div>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-white shadow-lg border-0 max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Paperclip className="h-5 w-5 text-blue-600" />
            Detalhes do Procedimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seção 1: Envolvidos e Local */}
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Envolvidos e Local</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medico_id">Médico Principal (Repasse) *</Label>
                  <Select value={formData.medico_id} onValueChange={(v) => handleChange("medico_id", v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                    <SelectContent>{medicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa_id">Empresa Prestadora (Faturamento) *</Label>
                  <Select value={formData.empresa_id} onValueChange={(v) => handleChange("empresa_id", v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                    <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{getEmpresaName(e)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa_pagamento_id">Empresa Pagadora (ao Médico)</Label>
                  <Select value={formData.empresa_pagamento_id} onValueChange={(v) => handleChange("empresa_pagamento_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Padrão: Empresa Prestadora" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={null}>Usar Empresa Prestadora</SelectItem> {/* Usar string vazia para `null` ou `undefined` */}
                        {empresas.map(e => <SelectItem key={e.id} value={e.id}>{getEmpresaName(e)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="cirurgiao_responsavel_nome">Cirurgião Responsável (Nome)</Label>
                  <Input 
                    id="cirurgiao_responsavel_nome" 
                    value={formData.cirurgiao_responsavel_nome || ""} 
                    onChange={(e) => handleChange("cirurgiao_responsavel_nome", e.target.value)} 
                    placeholder="Nome do cirurgião (opcional)" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital_id">Hospital *</Label>
                  <Select value={formData.hospital_id} onValueChange={(v) => handleChange("hospital_id", v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o hospital" /></SelectTrigger>
                    <SelectContent>
                        {hospitais.map(h => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local_realizacao_nome">Clínica/Outro Local</Label>
                  <Input id="local_realizacao_nome" value={formData.local_realizacao_nome || ""} onChange={(e) => handleChange("local_realizacao_nome", e.target.value)} placeholder="Nome da clínica ou outro local" />
                </div>
              </div>
            </section>

            {/* Seção 2: Dados do Procedimento */}
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Dados do Procedimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_procedimento">Data do Procedimento *</Label>
                  <Input id="data_procedimento" type="date" value={formData.data_procedimento} onChange={(e) => handleChange("data_procedimento", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competencia">Competência (Automático)</Label>
                  <Input id="competencia" value={formData.competencia} readOnly className="bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nota_fiscal">Nota Fiscal (Nº)</Label>
                  <Input id="nota_fiscal" value={formData.nota_fiscal || ""} onChange={(e) => handleChange("nota_fiscal", e.target.value)} placeholder="Número da NF (se houver)" />
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="nome_paciente">Nome do Paciente *</Label>
                  <Input id="nome_paciente" value={formData.nome_paciente} onChange={(e) => handleChange("nome_paciente", e.target.value)} placeholder="Nome completo do paciente" required />
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <Label htmlFor="descricao_procedimentos">Descrição dos Procedimentos *</Label>
                  <Textarea id="descricao_procedimentos" value={formData.descricao_procedimentos} onChange={(e) => handleChange("descricao_procedimentos", e.target.value)} placeholder="Detalhe os procedimentos realizados" required rows={3}/>
                </div>
                 <div className="space-y-2 lg:col-span-3">
                  <Label htmlFor="equipe_envolvida_nomes">Equipe Envolvida (Auxiliares, Anestesista, etc.)</Label>
                  <Input id="equipe_envolvida_nomes" value={formData.equipe_envolvida_nomes || ""} onChange={(e) => handleChange("equipe_envolvida_nomes", e.target.value)} placeholder="Nomes dos outros profissionais" />
                </div>
              </div>
            </section>
            
            {/* Seção 3: Valores e Financeiro */}
            <section>
              <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Valores e Financeiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                <div className="space-y-2">
                  <Label htmlFor="valor_bruto">Valor Bruto (R$) *</Label>
                  <Input id="valor_bruto" type="number" min="0" step="0.01" 
                         value={formatCurrencyForInput(formData.valor_bruto)} 
                         onChange={(e) => handleNumericChange("valor_bruto", e.target.value)} 
                         placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_mat_med">Valor Mat/Med (Desconto) (R$)</Label>
                  <Input id="valor_mat_med" type="number" min="0" step="0.01" 
                         value={formatCurrencyForInput(formData.valor_mat_med)} 
                         onChange={(e) => handleNumericChange("valor_mat_med", e.target.value)} 
                         placeholder="0.00" />
                </div>
                
                {/* Novos campos (read-only) para impostos e taxa administrativa */}
                <Card className="md:col-span-2 lg:col-span-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-md font-medium text-slate-600 mb-3 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-slate-500"/>
                    Descontos Calculados (Empresa Prestadora)
                  </h4>
                  {parametrosFiscaisAtuais === null && formData.empresa_id && (
                      <p className="text-xs text-amber-600 mb-2">Parâmetros fiscais não encontrados para a empresa/competência selecionada. Impostos e taxas não serão calculados.</p>
                  )}
                   {parametrosFiscaisAtuais === undefined && !formData.empresa_id && (
                      <p className="text-xs text-slate-500 mb-2">Selecione a empresa prestadora para carregar os parâmetros fiscais.</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Impostos Empresa (INSS, IRRF, ISS, etc)</Label>
                      <Input value={formatCurrencyDisplay(formData.valor_impostos_empresa)} readOnly className="bg-white font-medium border-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Taxa Administrativa</Label>
                      <Input value={formatCurrencyDisplay(formData.valor_taxa_administrativa_empresa)} readOnly className="bg-white font-medium border-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500 font-semibold">Repasse Líquido Estimado</Label>
                      <Input value={formatCurrencyDisplay(formData.valor_liquido_repasse)} readOnly className="bg-white font-bold text-green-600 border-green-400 text-md" />
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* Seção 4: Observações e Status */}
            <section>
               <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Observações e Status</h3>
                <div className="space-y-2 mb-4">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea id="observacoes" value={formData.observacoes || ""} onChange={(e) => handleChange("observacoes", e.target.value)} placeholder="Informações adicionais" rows={3}/>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="confirmado" checked={formData.confirmado} onCheckedChange={(v) => handleChange("confirmado", v)} />
                    <Label htmlFor="confirmado">Procedimento confirmado para faturamento/pagamento</Label>
                </div>
            </section>

            <div className="flex justify-end gap-3 pt-8 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingDependencies} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                {isSubmitting ? "Salvando..." : (procedimento ? "Salvar Alterações" : "Salvar Procedimento")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
