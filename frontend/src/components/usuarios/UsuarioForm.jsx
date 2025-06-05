
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, User, Eye, EyeOff, AlertTriangle, RefreshCw } from "lucide-react";

// Assuming Medico model/API client is available here
// You might need to adjust this import path based on your project structure
import Medico from '@/lib/models/Medico'; 

const perfisUsuario = [
  { value: "administrador", label: "Administrador", description: "Acesso total ao sistema" },
  { value: "gerente", label: "Gerente", description: "Acesso de gestão e relatórios" },
  { value: "operador", label: "Operador", description: "Operações básicas do sistema" },
  { value: "consulta", label: "Consulta", description: "Apenas visualização de dados" },
  { value: "medico", label: "Médico", description: "Acesso às próprias informações e relatórios" } // Novo perfil
];

export default function UsuarioForm({ usuario, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    usuario || {
      nome_completo: "",
      email: "",
      senha_hash: "", // Será processada no submit
      telefone: "",
      cargo: "",
      perfil: "operador",
      bloqueado: false,
      motivo_bloqueio: "",
      primeiro_login: true,
      senha_temporaria: true,
      ativo: true,
      observacoes: "",
      medico_id_associado: null // Novo campo para associar médico
    }
  );

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [senhaErrors, setSenhaErrors] = useState([]);

  const [medicos, setMedicos] = useState([]);
  const [isLoadingMedicos, setIsLoadingMedicos] = useState(false);

  useEffect(() => {
    if (usuario) {
      setFormData({
        ...usuario,
        senha_hash: "" // Não mostra hash da senha existente
      });
      // Para usuários existentes, senha é opcional (só preenche se quiser alterar)
      setSenha("");
      setConfirmarSenha("");
    }
  }, [usuario]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const gerarSenhaTemporaria = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let senhaTemp = "";
    for (let i = 0; i < 8; i++) {
      senhaTemp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(senhaTemp);
    setConfirmarSenha(senhaTemp);
    handleChange("senha_temporaria", true);
    handleChange("primeiro_login", true);
  };

  const validarSenha = (senha) => {
    const errors = [];
    if (senha.length < 6) {
      errors.push("A senha deve ter pelo menos 6 caracteres");
    }
    if (!/[A-Z]/.test(senha)) {
      errors.push("A senha deve conter pelo menos uma letra maiúscula");
    }
    if (!/[a-z]/.test(senha)) {
      errors.push("A senha deve conter pelo menos uma letra minúscula");
    }
    if (!/[0-9]/.test(senha)) {
      errors.push("A senha deve conter pelo menos um número");
    }
    return errors;
  };

  const handleSenhaChange = (novaSenha) => {
    setSenha(novaSenha);
    if (novaSenha) {
      setSenhaErrors(validarSenha(novaSenha));
    } else {
      setSenhaErrors([]);
    }
  };

  // Função simples para simular hash da senha (em produção, usar biblioteca adequada)
  const hashSenha = (senha) => {
    // ATENÇÃO: Esta é uma simulação. Em produção, usar bcrypt ou similar
    return btoa(senha + "salt_medflow_2024"); // Base64 simples para demonstração
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validações
      if (!usuario && (!senha || !confirmarSenha)) {
        alert("Senha é obrigatória para novos usuários");
        setIsSubmitting(false);
        return;
      }

      if (senha && senha !== confirmarSenha) {
        alert("As senhas não coincidem");
        setIsSubmitting(false);
        return;
      }

      if (senha && senhaErrors.length > 0) {
        alert("Corrija os erros na senha antes de continuar");
        setIsSubmitting(false);
        return;
      }

      // Validação específica para perfil médico
      if (formData.perfil === 'medico' && !formData.medico_id_associado) {
        alert("Para o perfil 'Médico', é obrigatório associar um médico.");
        setIsSubmitting(false);
        return;
      }

      const dataToSave = { ...formData };

      // Se uma nova senha foi fornecida, fazer o hash
      if (senha) {
        dataToSave.senha_hash = hashSenha(senha);
      } else if (!usuario && !senha) { // Para usuários novos SEM senha definida manualmente, gerar uma temporária
        const senhaTemp = Math.random().toString(36).slice(-8); // Gerar uma senha aleatória simples
        dataToSave.senha_hash = hashSenha(senhaTemp);
        dataToSave.senha_temporaria = true;
        dataToSave.primeiro_login = true;
      }

      // Limpar campos de controle que não devem ser salvos
      delete dataToSave.senha; // Se existir

      await onSave(dataToSave);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Erro ao salvar usuário. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMedicos = async () => {
    if (formData.perfil === 'medico') {
      setIsLoadingMedicos(true);
      try {
        const medicosData = await Medico.filter({ ativo: true }, "nome"); // Assuming Medico.filter exists
        setMedicos(medicosData);
      } catch (error) {
        console.error('Erro ao carregar médicos:', error);
        alert('Erro ao carregar lista de médicos. Tente novamente.');
      } finally {
        setIsLoadingMedicos(false);
      }
    } else {
      // Clear associated doctor if profile is not 'medico'
      if (formData.medico_id_associado) {
        handleChange("medico_id_associado", null);
      }
    }
  };

  useEffect(() => {
    loadMedicos();
  }, [formData.perfil]);


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {usuario ? "Editar Usuário" : "Novo Usuário"}
          </h1>
          <p className="text-slate-600 mt-1">
            {usuario ? "Altere as informações do usuário" : "Cadastre um novo usuário no sistema"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <section>
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => handleChange("nome_completo", e.target.value)}
                    placeholder="Nome completo do usuário"
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
                    placeholder="usuario@email.com"
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
                  <Label htmlFor="cargo">Cargo/Função</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => handleChange("cargo", e.target.value)}
                    placeholder="Ex: Analista, Coordenador, etc."
                  />
                </div>
              </div>
            </section>

            {/* Acesso e Permissões */}
            <section>
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Acesso e Permissões</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perfil">Perfil de Acesso *</Label>
                  <Select
                    value={formData.perfil}
                    onValueChange={(value) => handleChange("perfil", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {perfisUsuario.map(perfil => (
                        <SelectItem key={perfil.value} value={perfil.value}>
                          <div className="flex flex-col">
                            <span>{perfil.label}</span>
                            <span className="text-xs text-slate-500">{perfil.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Status da Conta</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ativo"
                        checked={formData.ativo}
                        onCheckedChange={(checked) => handleChange("ativo", checked)}
                      />
                      <Label htmlFor="ativo">Usuário ativo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="bloqueado"
                        checked={formData.bloqueado}
                        onCheckedChange={(checked) => handleChange("bloqueado", checked)}
                      />
                      <Label htmlFor="bloqueado">Usuário bloqueado</Label>
                    </div>
                  </div>
                </div>
              </div>

              {formData.bloqueado && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="motivo_bloqueio">Motivo do Bloqueio</Label>
                  <Input
                    id="motivo_bloqueio"
                    value={formData.motivo_bloqueio}
                    onChange={(e) => handleChange("motivo_bloqueio", e.target.value)}
                    placeholder="Descreva o motivo do bloqueio..."
                  />
                </div>
              )}

              {/* Nova seção para perfil médico */}
              {formData.perfil === 'medico' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
                  <h4 className="font-medium text-blue-800">Configurações para Médico</h4>
                  <div className="space-y-2">
                    <Label htmlFor="medico_id_associado">Médico Associado</Label>
                    <Select
                      value={formData.medico_id_associado ? String(formData.medico_id_associado) : ""}
                      onValueChange={(value) => handleChange("medico_id_associado", value === "" ? null : Number(value))}
                      disabled={isLoadingMedicos}
                      required // Make it required for medico profile
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingMedicos 
                            ? "Carregando médicos..." 
                            : "Selecionar médico"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Nenhum médico selecionado</SelectItem> {/* Option for null/empty */}
                        {medicos.length === 0 && !isLoadingMedicos && (
                          <SelectItem value={null} disabled>Nenhum médico encontrado</SelectItem>
                        )}
                        {medicos.map(medico => (
                          <SelectItem key={medico.id} value={String(medico.id)}>
                            {medico.nome} - CRM: {medico.crm}/{medico.estado_crm}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-blue-600">
                      Este usuário terá acesso apenas às informações do médico selecionado.
                    </p>
                  </div>
                  
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      <strong>Importante:</strong> Certifique-se de que o e-mail deste usuário seja o mesmo 
                      cadastrado no registro do médico para facilitar a identificação.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </section>

            {/* Senha */}
            <section>
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">
                {usuario ? "Alterar Senha (opcional)" : "Definir Senha *"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="senha">
                      {usuario ? "Nova Senha" : "Senha *"}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={gerarSenhaTemporaria}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Gerar Temporária
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => handleSenhaChange(e.target.value)}
                      placeholder={usuario ? "Deixe em branco para manter atual" : "Digite a senha"}
                      required={!usuario}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">
                    {usuario ? "Confirmar Nova Senha" : "Confirmar Senha *"}
                  </Label>
                  <Input
                    id="confirmarSenha"
                    type={mostrarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme a senha"
                    required={!usuario || !!senha}
                  />
                </div>
              </div>

              {senhaErrors.length > 0 && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {senhaErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="senha_temporaria"
                    checked={formData.senha_temporaria}
                    onCheckedChange={(checked) => handleChange("senha_temporaria", checked)}
                  />
                  <Label htmlFor="senha_temporaria">Senha temporária</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="primeiro_login"
                    checked={formData.primeiro_login}
                    onCheckedChange={(checked) => handleChange("primeiro_login", checked)}
                  />
                  <Label htmlFor="primeiro_login">Forçar troca no primeiro login</Label>
                </div>
              </div>
            </section>

            {/* Observações */}
            <section>
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Observações</h3>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações sobre o usuário, restrições, etc."
                  rows={3}
                />
              </div>
            </section>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || (formData.perfil === 'medico' && !formData.medico_id_associado && medicos.length > 0)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Salvando..." : "Salvar Usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
