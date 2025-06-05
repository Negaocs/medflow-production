
import React, { useState, useEffect } from "react";
import { Medico, MedicoEmpresa, Empresa } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Pencil, 
  Stethoscope, 
  Phone, 
  Mail, 
  MapPin,
  CreditCard,
  Users,
  Building2,
  Link as LinkIcon
} from "lucide-react";
import MedicoForm from "../components/medicos/MedicoForm";

export default function Medicos() {
  const [medicos, setMedicos] = useState([]);
  const [filteredMedicos, setFilteredMedicos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMedico, setEditingMedico] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para o modal de vínculos
  const [showVinculosModal, setShowVinculosModal] = useState(false);
  const [medicoSelecionado, setMedicoSelecionado] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [vinculosAtuais, setVinculosAtuais] = useState([]);
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState([]);
  const [isLoadingVinculos, setIsLoadingVinculos] = useState(false);
  const [isSavingVinculos, setIsSavingVinculos] = useState(false);

  useEffect(() => {
    loadMedicos();
    loadEmpresas();
  }, []);

  useEffect(() => {
    const filtered = medicos.filter(medico =>
      medico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (medico.crm && medico.crm.toLowerCase().includes(searchTerm.toLowerCase())) || // Adicionado check para medico.crm
      (medico.cpf && medico.cpf.includes(searchTerm)) // Adicionado check para medico.cpf
    );
    // Ordenar por nome alfabeticamente
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    setFilteredMedicos(filtered);
  }, [medicos, searchTerm]);

  const loadMedicos = async () => {
    try {
      const data = await Medico.list("nome"); // Ordenar por nome desde o backend
      setMedicos(data);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmpresas = async () => {
    try {
      // CORRIGIDO: Ordenar por um único campo, por exemplo 'nome_fantasia'
      const data = await Empresa.filter({ ativo: true }, "nome_fantasia"); 
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleSave = async (medicoData) => {
    try {
      if (editingMedico) {
        await Medico.update(editingMedico.id, medicoData);
      } else {
        await Medico.create(medicoData);
      }
      loadMedicos();
      setShowForm(false);
      setEditingMedico(null);
    } catch (error) {
      console.error('Erro ao salvar médico:', error);
    }
  };

  const handleEdit = (medico) => {
    setEditingMedico(medico);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMedico(null);
  };

  const handleOpenVinculosModal = async (medico) => {
    setMedicoSelecionado(medico);
    setShowVinculosModal(true);
    setIsLoadingVinculos(true);
    
    try {
      // Carregar vínculos atuais do médico
      const vinculosData = await MedicoEmpresa.filter({ medico_id: medico.id, ativo: true });
      setVinculosAtuais(vinculosData);
      setEmpresasSelecionadas(vinculosData.map(v => v.empresa_id));
    } catch (error) {
      console.error('Erro ao carregar vínculos:', error);
      setVinculosAtuais([]);
      setEmpresasSelecionadas([]);
    } finally {
      setIsLoadingVinculos(false);
    }
  };

  const handleToggleEmpresa = (empresaId) => {
    setEmpresasSelecionadas(prev => 
      prev.includes(empresaId) 
        ? prev.filter(id => id !== empresaId)
        : [...prev, empresaId]
    );
  };

  const handleSalvarVinculos = async () => {
    if (!medicoSelecionado) return;
    
    setIsSavingVinculos(true);
    try {
      const todosVinculosAtuais = await MedicoEmpresa.filter({ medico_id: medicoSelecionado.id });
      
      // Identificar vínculos a criar/ativar e a desativar
      const empresasAtualmenteVinculadasIds = todosVinculosAtuais.filter(v => v.ativo).map(v => v.empresa_id);
      
      const empresasParaVincular = empresasSelecionadas.filter(id => !empresasAtualmenteVinculadasIds.includes(id));
      const empresasParaDesvincular = todosVinculosAtuais.filter(v => v.ativo && !empresasSelecionadas.includes(v.empresa_id));

      // Desativar vínculos
      for (const vinculo of empresasParaDesvincular) {
        await MedicoEmpresa.update(vinculo.id, {
          ...vinculo, // Preserva outros campos do vínculo
          ativo: false,
          data_desvinculo: new Date().toISOString().split('T')[0]
        });
      }
      
      // Criar ou Reativar vínculos
      for (const empresaId of empresasParaVincular) {
        const vinculoExistenteInativo = todosVinculosAtuais.find(v => v.empresa_id === empresaId && !v.ativo);
        if (vinculoExistenteInativo) {
          // Reativar
          await MedicoEmpresa.update(vinculoExistenteInativo.id, {
            ...vinculoExistenteInativo, // Preserva outros campos
            ativo: true,
            data_desvinculo: null, // Limpa data de desvínculo
            data_vinculo: vinculoExistenteInativo.data_vinculo || new Date().toISOString().split('T')[0] // Mantém data original ou usa nova
          });
        } else {
          // Criar novo
          await MedicoEmpresa.create({
            medico_id: medicoSelecionado.id,
            empresa_id: empresaId,
            data_vinculo: new Date().toISOString().split('T')[0],
            ativo: true
          });
        }
      }
      
      setShowVinculosModal(false);
      // Considerar recarregar os médicos ou atualizar o estado localmente se os vínculos afetam a exibição na lista principal.
      // Por enquanto, apenas fecha o modal.
    } catch (error) {
      console.error('Erro ao salvar vínculos:', error);
      // Melhorar a notificação de erro para o usuário
      alert('Erro ao salvar vínculos. Verifique o console para mais detalhes e tente novamente.');
    } finally {
      setIsSavingVinculos(false);
    }
  };

  const getEmpresasVinculadas = (medicoId) => {
    // Esta é uma versão simplificada - você pode implementar uma lógica mais robusta
    // para exibir as empresas vinculadas diretamente na tabela se necessário
    return "Ver vínculos"; // Placeholder
  };

  if (showForm) {
    return (
      <MedicoForm
        medico={editingMedico}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Médicos</h1>
          <p className="text-slate-600 mt-1">Gerencie o cadastro de médicos</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Médico
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Lista de Médicos ({filteredMedicos.length})
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, CRM ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Carregando médicos...</p>
            </div>
          ) : filteredMedicos.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "Nenhum médico encontrado" : "Nenhum médico cadastrado"}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Comece cadastrando o primeiro médico"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead>Contato</TableHead>
                    {/* <TableHead>Especialização</TableHead> // Removido cabeçalho de especialização */}
                    <TableHead>Status</TableHead>
                    <TableHead>Vínculos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicos.map((medico) => (
                    <TableRow key={medico.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{medico.nome}</p>
                            <p className="text-sm text-slate-500">CPF: {medico.cpf}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{medico.crm}/{medico.estado_crm}</p>
                          {medico.dependentes_irrf > 0 && (
                            <p className="text-xs text-slate-500">
                              {medico.dependentes_irrf} dep. IRRF
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {medico.telefone && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{medico.telefone}</span>
                            </div>
                          )}
                          {medico.email && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{medico.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {/* <TableCell> // Removida célula de especialização
                        {medico.e_cirurgiao && (
                          <Badge className="bg-purple-100 text-purple-800">
                            Cirurgião
                          </Badge>
                        )}
                        {!medico.e_cirurgiao && (
                             <Badge variant="outline">Clínico</Badge>
                        )}
                      </TableCell> */}
                      <TableCell>
                        <Badge 
                          variant={medico.ativo ? "default" : "secondary"}
                          className={medico.ativo ? "bg-green-100 text-green-800" : ""}
                        >
                          {medico.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenVinculosModal(medico)}
                          className="flex items-center gap-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Empresas
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(medico)}
                          className="hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Vínculos com Empresas */}
      <Dialog open={showVinculosModal} onOpenChange={setShowVinculosModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Vínculos com Empresas - {medicoSelecionado?.nome}
            </DialogTitle>
            <DialogDescription>
              Selecione as empresas às quais este médico está vinculado atualmente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingVinculos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Carregando vínculos...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {empresas.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Nenhuma empresa cadastrada. Cadastre empresas primeiro.
                  </p>
                ) : (
                  empresas.map(empresa => (
                    <div key={empresa.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                      <Checkbox
                        id={`empresa_${empresa.id}`}
                        checked={empresasSelecionadas.includes(empresa.id)}
                        onCheckedChange={() => handleToggleEmpresa(empresa.id)}
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`empresa_${empresa.id}`}
                          className="cursor-pointer font-medium text-slate-800"
                        >
                          {empresa.nome_fantasia || empresa.razao_social}
                        </label>
                        {empresa.nome_fantasia && empresa.razao_social !== empresa.nome_fantasia && (
                          <p className="text-sm text-slate-500">{empresa.razao_social}</p>
                        )}
                        <p className="text-xs text-slate-400">CNPJ: {empresa.cnpj}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVinculosModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarVinculos} 
              disabled={isSavingVinculos || isLoadingVinculos}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isSavingVinculos ? "Salvando..." : "Salvar Vínculos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
