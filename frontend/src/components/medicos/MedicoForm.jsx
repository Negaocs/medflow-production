
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Stethoscope, Link2, Info, RefreshCw, UserPlus } from "lucide-react"; // Adicionado UserPlus
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UsuarioSistema } from "@/api/entities";
import { Medico } from "@/api/entities";
import { MedicoEmpresa, Empresa } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MedicoForm({ medico, onSave, onCancel }) {
  const initialFormData = {
    nome: "",
    cpf: "",
    crm: "",
    estado_crm: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    endereco: "",
    banco: "",
    agencia: "",
    conta: "",
    pix: "",
    dependentes_irrf: 0,
    usuario_sistema_id: null,
    permite_acesso_sistema: false, // Novo campo de controle
    ativo: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [empresas, setEmpresas] = useState([]);
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usuarios, setUsuarios] = useState([]); // Renamed from usuariosSistema
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);

  useEffect(() => {
    if (medico) {
      // Merge medico data, and set permite_acesso_sistema based on usuario_sistema_id existence
      setFormData(prev => ({
        ...initialFormData, // Ensure all fields are present from initialFormData
        ...medico,
        permite_acesso_sistema: !!medico.usuario_sistema_id, // Set true if user is linked
      }));
      setEmpresasSelecionadas([]); // Clear selections to be reloaded
    } else {
      setFormData(initialFormData);
    }
    loadEmpresas();
    loadUsuarios(); // Always load users
    if (medico) {
      loadVinculosEmpresa();
    }
  }, [medico]); // Depend on medico

  const loadEmpresas = async () => {
    try {
      const data = await Empresa.list();
      setEmpresas(data.filter(e => e.ativo));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadVinculosEmpresa = async () => {
    if (!medico?.id) return;
    try {
      const vinculos = await MedicoEmpresa.filter({ medico_id: medico.id, ativo: true });
      setEmpresasSelecionadas(vinculos.map(v => v.empresa_id));
    } catch (error) {
      console.error('Erro ao carregar vínculos:', error);
    }
  };

  const loadUsuarios = async () => { // Renamed and modified
    setIsLoadingUsuarios(true);
    try {
      const todosUsuarios = await UsuarioSistema.list();
      // Get IDs of users already linked to other *active* doctors (excluding the current one)
      const medicosComUsuario = (await Medico.list()).filter(m => m.usuario_sistema_id && m.id !== medico?.id).map(m => m.usuario_sistema_id);

      const usuariosDisponiveis = todosUsuarios.filter(u =>
        u.ativo && (!medicosComUsuario.includes(u.id) || u.id === medico?.usuario_sistema_id)
      );
      setUsuarios(usuariosDisponiveis);
    } catch (error) {
      console.error('Erro ao carregar usuários do sistema:', error);
    } finally {
      setIsLoadingUsuarios(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'usuario_sistema_id') {
        if (value) {
          const selectedUser = usuarios.find(u => u.id === value);
          if (selectedUser) {
            newState.email = selectedUser.email; // Auto-fill email from selected user
          }
        }
        // If user is deselected, email becomes editable but its value is not cleared here.
        // It should match the current value of formData.email for consistency
      }
      return newState;
    });
  };

  const handlePermiteAcessoChange = (permite) => {
    setFormData(prev => {
      const newState = {
        ...prev,
        permite_acesso_sistema: permite,
      };
      if (!permite) {
        newState.usuario_sistema_id = null; // Clear linked user if access is disabled
      }
      return newState;
    });
  };

  const handleEmpresaToggle = (empresaId) => {
    setEmpresasSelecionadas(prev =>
      prev.includes(empresaId)
        ? prev.filter(id => id !== empresaId)
        : [...prev, empresaId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };

      if (formData.permite_acesso_sistema) {
        if (formData.usuario_sistema_id) {
            const selectedUser = usuarios.find(u => u.id === formData.usuario_sistema_id);
            if (!selectedUser) {
                alert("Usuário do sistema selecionado não encontrado. Recarregue a lista de usuários.");
                setIsSubmitting(false);
                return;
            }
            if (selectedUser.email !== formData.email) {
                alert("O e-mail do médico deve ser o mesmo do usuário do sistema selecionado para o login.");
                setIsSubmitting(false);
                return;
            }
            // Garantir que o usuário do sistema tenha o perfil de médico e associação correta
            if (selectedUser.perfil !== 'medico' || selectedUser.medico_id_associado !== (medico?.id || null)) {
                try {
                    await UsuarioSistema.update(selectedUser.id, {
                        perfil: 'medico',
                        medico_id_associado: medico?.id || null // Will be updated correctly after medico is saved
                    });
                    console.log(`Perfil e/ou associação do usuário ${selectedUser.nome_completo} atualizados.`);
                } catch (updateError) {
                    console.error("Erro ao tentar atualizar perfil do usuário para médico:", updateError);
                    alert("Erro ao tentar definir o perfil do usuário selecionado para 'Médico'. Verifique as permissões ou faça manualmente.");
                    // Do not return, let the save continue but alert the user.
                }
            }
        } else {
            alert("Se 'Permitir acesso ao sistema' está marcado, você deve selecionar um usuário do sistema ou criar um novo e vinculá-lo.");
            setIsSubmitting(false);
            return;
        }
      }
      
      // Se não permite acesso, garantir que usuario_sistema_id seja null
      if (!dataToSave.permite_acesso_sistema) {
        dataToSave.usuario_sistema_id = null;
      }

      let medicoSalvo;
      if (medico && medico.id) { // Editando
        // Desvincular usuário antigo, se houver e for diferente do novo
        if (medico.usuario_sistema_id && medico.usuario_sistema_id !== dataToSave.usuario_sistema_id) {
          try {
            const usuarioAntigo = await UsuarioSistema.get(medico.usuario_sistema_id);
            if (usuarioAntigo && usuarioAntigo.medico_id_associado === medico.id) {
              await UsuarioSistema.update(usuarioAntigo.id, { medico_id_associado: null, perfil: usuarioAntigo.perfil === 'medico' ? 'operador' : usuarioAntigo.perfil }); // Define um perfil padrão ou mantém o anterior se não for medico
            }
          } catch (err) {
            console.warn("Não foi possível desvincular usuário antigo:", err.message);
          }
        }
        await Medico.update(medico.id, dataToSave);
        medicoSalvo = { ...medico, ...dataToSave };
      } else { // Criando
        const novoMedico = await Medico.create(dataToSave);
        medicoSalvo = novoMedico;
      }

      if (medicoSalvo && medicoSalvo.id) {
        await gerenciarVinculosEmpresa(medicoSalvo.id);

        // Gerenciar vínculo com UsuarioSistema
        if (dataToSave.permite_acesso_sistema) {
          if (dataToSave.usuario_sistema_id) {
            const usuarioParaAtualizar = await UsuarioSistema.get(dataToSave.usuario_sistema_id);
            // Only update if not already linked to this medico or if profile is not 'medico'
            if (usuarioParaAtualizar && (usuarioParaAtualizar.medico_id_associado !== medicoSalvo.id || usuarioParaAtualizar.perfil !== 'medico')) {
              await UsuarioSistema.update(dataToSave.usuario_sistema_id, { medico_id_associado: medicoSalvo.id, perfil: 'medico' });
            }
          }
        } else {
          // If permite_acesso_sistema is false, ensure any existing user link is cleared
          if (medico && medico.usuario_sistema_id) { // Check if there was a previous link
            const usuarioAntigo = await UsuarioSistema.get(medico.usuario_sistema_id);
            if (usuarioAntigo && usuarioAntigo.medico_id_associado === medico.id) {
              await UsuarioSistema.update(usuarioAntigo.id, { medico_id_associado: null, perfil: null });
            }
          }
        }
      }
      onSave(medicoSalvo); // Pass the updated/created medico object back
    } catch (error) {
      console.error("Erro no handleSubmit do MedicoForm:", error);
      let errorMessage = "Ocorreu um erro ao salvar o médico.";
      if (error.message && error.message.includes("UNIQUE constraint failed: Medico.cpf")) {
        errorMessage = "Erro: Já existe um médico cadastrado com este CPF.";
      } else if (error.message && error.message.includes("UNIQUE constraint failed: Medico.email")) {
        errorMessage = "Erro: Já existe um médico cadastrado com este E-mail.";
      }
      alert(errorMessage + " Verifique os dados ou o console para mais detalhes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const gerenciarVinculosEmpresa = async (medicoId) => {
    try {
      const vinculosExistentes = await MedicoEmpresa.filter({ medico_id: medicoId });

      for (const vinculo of vinculosExistentes) {
        if (!empresasSelecionadas.includes(vinculo.empresa_id) && vinculo.ativo) {
          await MedicoEmpresa.update(vinculo.id, {
            ...vinculo,
            ativo: false,
            data_desvinculo: new Date().toISOString().split('T')[0]
          });
        }
      }

      for (const empresaId of empresasSelecionadas) {
        const vinculoExistente = vinculosExistentes.find(v => v.empresa_id === empresaId && v.medico_id === medicoId);

        if (!vinculoExistente) {
          await MedicoEmpresa.create({
            medico_id: medicoId,
            empresa_id: empresaId,
            data_vinculo: new Date().toISOString().split('T')[0],
            ativo: true
          });
        } else if (!vinculoExistente.ativo) {
          await MedicoEmpresa.update(vinculoExistente.id, {
            ...vinculoExistente,
            ativo: true,
            data_desvinculo: null,
            data_vinculo: vinculoExistente.data_vinculo || new Date().toISOString().split('T')[0]
          });
        }
      }
    } catch (error) {
      console.error('Erro ao gerenciar vínculos:', error);
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

      <Card className="bg-white shadow-lg border-0 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Informações do Médico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
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
                  <Label htmlFor="estado_crm">Estado CRM *</Label>
                  <Input
                    id="estado_crm"
                    value={formData.estado_crm}
                    onChange={(e) => handleChange("estado_crm", e.target.value)}
                    placeholder="SP, RJ, MG..."
                    required
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
                <div className="space-y-2">
                  <Label htmlFor="dependentes_irrf">Dependentes IRRF</Label>
                  <Input
                    id="dependentes_irrf"
                    type="number"
                    min="0"
                    value={formData.dependentes_irrf}
                    onChange={(e) => handleChange("dependentes_irrf", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="email">E-mail * (para login, se acesso permitido)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="medico@email.com"
                    required
                    // O campo email do médico DEVE ser editável. A validação se ele bate com o email do usuário selecionado
                    // é feita no submit. Se o usuário selecionado tiver outro email, o admin deve ser avisado
                    // para corrigir o email do médico OU o email do usuário do sistema.
                    // disabled={formData.permite_acesso_sistema && !!formData.usuario_sistema_id} 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleChange("endereco", e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
              </div>
            </div>

            {/* Nova Seção: Acesso ao Sistema */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> {/* Ícone adicionado aqui */}
                Acesso ao Sistema
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Switch
                    id="permite_acesso_sistema"
                    checked={formData.permite_acesso_sistema}
                    onCheckedChange={handlePermiteAcessoChange}
                  />
                  <div className="flex-1">
                    <Label htmlFor="permite_acesso_sistema" className="font-medium text-slate-800">
                      Permitir acesso ao sistema
                    </Label>
                    <p className="text-sm text-slate-600">
                      Permite que este médico faça login e acesse suas informações no sistema.
                    </p>
                  </div>
                </div>

                {formData.permite_acesso_sistema && (
                  <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                    <div className="space-y-2">
                      <Label htmlFor="usuario_sistema_id">Usuário do Sistema Associado</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.usuario_sistema_id || ""}
                          onValueChange={(value) => handleChange("usuario_sistema_id", value || null)}
                          disabled={isLoadingUsuarios}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={
                              isLoadingUsuarios
                                ? "Carregando usuários..."
                                : "Selecionar usuário existente"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>Nenhum usuário selecionado</SelectItem>
                            {usuarios.map(usuario => (
                              <SelectItem key={usuario.id} value={usuario.id}>
                                {usuario.nome_completo} ({usuario.email}) {usuario.perfil === 'medico' ? '[Médico]' : `[${usuario.perfil}]`}
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
                        💡 <strong>Dica:</strong> Se o usuário não existir, crie-o primeiro em "Configurações > Usuários do Sistema"
                        com o perfil "Médico". Depois, retorne aqui para vincular. <br />
                        O e-mail do médico e do usuário do sistema devem ser idênticos para o login.
                      </p>
                    </div>

                    {formData.usuario_sistema_id && formData.email && (
                      <Alert className="bg-green-50 border-green-200">
                        <Info className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                           Este médico está configurado para acessar o sistema. O login será com o e-mail: <strong>{formData.email}</strong>.
                        </AlertDescription>
                      </Alert>
                    )}
                     {!formData.usuario_sistema_id && formData.permite_acesso_sistema && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200">
                            <Info className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700">
                                Selecione um usuário do sistema para vincular ou crie um novo com o perfil "Médico".
                            </AlertDescription>
                        </Alert>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Dados Bancários */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Bancários</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={formData.banco}
                    onChange={(e) => handleChange("banco", e.target.value)}
                    placeholder="Nome do banco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    value={formData.agencia}
                    onChange={(e) => handleChange("agencia", e.target.value)}
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conta">Conta</Label>
                  <Input
                    id="conta"
                    value={formData.conta}
                    onChange={(e) => handleChange("conta", e.target.value)}
                    placeholder="00000-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pix">Chave PIX</Label>
                  <Input
                    id="pix"
                    value={formData.pix}
                    onChange={(e) => handleChange("pix", e.target.value)}
                    placeholder="CPF, e-mail ou chave aleatória"
                  />
                </div>
              </div>
            </div>

            {/* Vínculos com Empresas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Vínculos com Empresas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {empresas.map(empresa => (
                  <div key={empresa.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={`empresa_${empresa.id}`}
                      checked={empresasSelecionadas.includes(empresa.id)}
                      onChange={() => handleEmpresaToggle(empresa.id)}
                      className="rounded"
                    />
                    <Label htmlFor={`empresa_${empresa.id}`} className="flex-1 cursor-pointer">
                      {empresa.nome_fantasia || empresa.razao_social}
                    </Label>
                  </div>
                ))}
              </div>
              {empresas.length === 0 && (
                <p className="text-sm text-slate-500">Nenhuma empresa disponível. Cadastre empresas primeiro.</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => handleChange("ativo", checked)}
                  />
                  <Label htmlFor="ativo">Médico ativo no sistema</Label>
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
                {isSubmitting ? "Salvando..." : "Salvar Médico"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
