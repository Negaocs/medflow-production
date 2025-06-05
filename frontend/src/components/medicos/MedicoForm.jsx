import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Stethoscope, RefreshCw } from "lucide-react";
import { UsuarioSistema } from "@/api/entities";

export default function MedicoForm({ medico, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    medico || {
      nome: "",
      email: "",
      telefone: "",
      crm: "",
      estado_crm: "SP",
      especialidade: "",
      cpf: "",
      data_nascimento: "",
      endereco: "",
      cidade: "",
      estado: "SP",
      cep: "",
      pix_chave: "",
      pix_tipo: "cpf",
      banco: "",
      agencia: "",
      conta: "",
      observacoes: "",
      permite_acesso_sistema: false,
      usuario_sistema_id: null,
      ativo: true
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);

  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const tiposPix = [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "E-mail" },
    { value: "telefone", label: "Telefone" },
    { value: "aleatoria", label: "Chave Aleatória" }
  ];

  useEffect(() => {
    if (formData.permite_acesso_sistema) {
      loadUsuarios();
    }
  }, [formData.permite_acesso_sistema]);

  const loadUsuarios = async () => {
    setIsLoadingUsuarios(true);
    try {
      // Simulação de carregamento de usuários
      const usuariosData = await UsuarioSistema.list();
      setUsuarios(usuariosData.filter(u => u.perfil === "medico" && u.ativo));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoadingUsuarios(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermiteAcessoChange = (checked) => {
    handleChange("permite_acesso_sistema", checked);
    if (!checked) {
      handleChange("usuario_sistema_id", null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Erro ao salvar médico:", error);
      alert("Erro ao salvar médico. Verifique os dados e tente novamente.");
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
            {medico ? "Editar Médico" : "Novo Médico"}
          </h1>
          <p className="text-slate-600 mt-1">
            {medico ? "Altere as informações do médico" : "Cadastre um novo médico no sistema"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Informações do Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange("nome", e.target.value)}
                      placeholder="Nome completo do médico"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange("telefone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleChange("cpf", e.target.value)}
                      placeholder="123.456.789-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => handleChange("data_nascimento", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Profissionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM *</Label>
                    <Input
                      id="crm"
                      value={formData.crm}
                      onChange={(e) => handleChange("crm", e.target.value)}
                      placeholder="Número do CRM"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado_crm">Estado do CRM *</Label>
                    <Select
                      value={formData.estado_crm}
                      onValueChange={(value) => handleChange("estado_crm", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map(estado => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input
                      id="especialidade"
                      value={formData.especialidade}
                      onChange={(e) => handleChange("especialidade", e.target.value)}
                      placeholder="Ex: Cardiologia, Clínica Geral, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleChange("endereco", e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleChange("cidade", e.target.value)}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => handleChange("estado", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map(estado => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleChange("cep", e.target.value)}
                      placeholder="12345-678"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Bancários */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Bancários</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pix_tipo">Tipo de Chave PIX</Label>
                    <Select
                      value={formData.pix_tipo}
                      onValueChange={(value) => handleChange("pix_tipo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposPix.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pix_chave">Chave PIX</Label>
                    <Input
                      id="pix_chave"
                      value={formData.pix_chave}
                      onChange={(e) => handleChange("pix_chave", e.target.value)}
                      placeholder="Informe a chave PIX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.banco}
                      onChange={(e) => handleChange("banco", e.target.value)}
                      placeholder="Nome ou código do banco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencia">Agência</Label>
                    <Input
                      id="agencia"
                      value={formData.agencia}
                      onChange={(e) => handleChange("agencia", e.target.value)}
                      placeholder="Número da agência"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conta">Conta</Label>
                    <Input
                      id="conta"
                      value={formData.conta}
                      onChange={(e) => handleChange("conta", e.target.value)}
                      placeholder="Número da conta com dígito"
                    />
                  </div>
                </div>
              </div>

              {/* Acesso ao Sistema */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Acesso ao Sistema</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="permite_acesso_sistema"
                      checked={formData.permite_acesso_sistema}
                      onCheckedChange={handlePermiteAcessoChange}
                    />
                    <Label htmlFor="permite_acesso_sistema">Permitir acesso ao sistema</Label>
                  </div>

                  {formData.permite_acesso_sistema && (
                    <div className="space-y-2">
                      <Label htmlFor="usuario_sistema_id">Usuário do Sistema</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.usuario_sistema_id ? String(formData.usuario_sistema_id) : ""}
                          onValueChange={(value) => handleChange("usuario_sistema_id", value === "" ? null : value)}
                          disabled={isLoadingUsuarios}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={
                              isLoadingUsuarios 
                                ? "Carregando usuários..." 
                                : "Selecionar usuário"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum usuário selecionado</SelectItem>
                            {usuarios.length === 0 && !isLoadingUsuarios && (
                              <SelectItem value="" disabled>Nenhum usuário encontrado</SelectItem>
                            )}
                            {usuarios.map(usuario => (
                              <SelectItem key={usuario.id} value={usuario.id}>
                                {usuario.nome_completo} ({usuario.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={loadUsuarios}
                          disabled={isLoadingUsuarios}
                          title="Recarregar lista de usuários"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        💡 <strong>Dica:</strong> Se o usuário não existir, crie-o primeiro em &quot;Configurações&quot; e &quot;Usuários do Sistema&quot;
                        com o perfil &quot;Médico&quot;. Depois, retorne aqui para vincular. <br />
                        O e-mail do médico e do usuário do sistema devem ser idênticos para o login.
                      </p>
                    </div>
                  )}

                  {formData.usuario_sistema_id && formData.email && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-amber-800 text-sm">
                        <strong>Importante:</strong> Certifique-se de que o e-mail do médico ({formData.email}) 
                        seja o mesmo do usuário do sistema para garantir o funcionamento correto do login.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Observações</h3>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações Adicionais</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange("observacoes", e.target.value)}
                    placeholder="Informações adicionais sobre o médico..."
                    rows={4}
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
                  <Label htmlFor="ativo">Médico ativo</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Salvando..." : "Salvar Médico"}
          </Button>
        </div>
      </form>
    </div>
  );
}

