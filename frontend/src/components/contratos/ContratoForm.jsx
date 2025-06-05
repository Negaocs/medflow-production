
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, FileText, PlusCircle, Trash2, DollarSign } from "lucide-react";
import { TipoPlantao as TipoPlantaoEntity, ContratoTipoPlantao } from "@/api/entities"; // Certifique-se que ContratoTipoPlantao está em all.js ou importe direto

export default function ContratoForm({ 
  contrato, // Recebe `editingContrato` ou `initialDataForForm` da página
  onSave, 
  onCancel,
  onPrepareRenewal, // Função para chamar ao clicar em "Renovar"
  empresas, // Lista de todas empresas ativas
  hospitais, // Lista de todos hospitais ativos
}) {
  const [formData, setFormData] = useState({
    empresa_id: "",
    hospital_id: "",
    numero_contrato: "",
    data_inicio: "",
    data_fim: "",
    observacoes: "",
    ativo: true,
    id: null // Importante para distinguir novo/edição
  });

  const [tiposPlantaoContrato, setTiposPlantaoContrato] = useState([]);
  const [todosTiposPlantao, setTodosTiposPlantao] = useState([]); // Todos os tipos de plantão cadastrados e ativos
  const [hospitaisFiltrados, setHospitaisFiltrados] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Carrega todos os tipos de plantão ativos para o select
    const fetchTodosTiposPlantao = async () => {
      try {
        const tipos = await TipoPlantaoEntity.filter({ ativo: true });
        setTodosTiposPlantao(tipos);
      } catch (error) {
        console.error("Erro ao carregar todos os tipos de plantão:", error);
      }
    };
    fetchTodosTiposPlantao();
  }, []);

  useEffect(() => {
    // Popula o formulário quando a prop 'contrato' muda (edição, renovação, ou novo)
    const dadosIniciais = contrato || { ativo: true }; // Default para novo contrato
    
    setFormData({
      empresa_id: dadosIniciais.empresa_id || "",
      hospital_id: dadosIniciais.hospital_id || "",
      numero_contrato: dadosIniciais.numero_contrato || "",
      data_inicio: dadosIniciais.data_inicio || "",
      data_fim: dadosIniciais.data_fim || "",
      observacoes: dadosIniciais.observacoes || "",
      ativo: dadosIniciais.ativo !== undefined ? dadosIniciais.ativo : true,
      id: dadosIniciais.id || null // Mantém o ID se for edição
    });

    if (dadosIniciais.tiposPlantaoParaPreencher) {
      // Veio de uma preparação para renovação, os tipos já estão formatados
      setTiposPlantaoContrato(dadosIniciais.tiposPlantaoParaPreencher.map(tp => ({ ...tp })));
    } else if (dadosIniciais.id) {
      // Edição de um contrato existente, busca os tipos vinculados
      const fetchTiposVinculados = async () => {
        try {
          const tiposVinculados = await ContratoTipoPlantao.filter({ contrato_id: dadosIniciais.id, ativo: true });
          setTiposPlantaoContrato(tiposVinculados.map(tv => ({
            id: tv.id, // ID do registro ContratoTipoPlantao (para atualização/deleção)
            tipo_plantao_id: tv.tipo_plantao_id,
            valor: tv.valor
          })));
        } catch (error) {
          console.error("Erro ao carregar tipos de plantão vinculados:", error);
          setTiposPlantaoContrato([]);
        }
      };
      fetchTiposVinculados();
    } else {
      // Novo contrato (não edição, não renovação)
      setTiposPlantaoContrato([]);
    }
  }, [contrato]); // Re-executa quando 'contrato' prop muda


  useEffect(() => {
    // Filtra hospitais quando a empresa muda
    if (formData.empresa_id) {
      const hospEmpresa = hospitais.filter(h => h.empresa_id === formData.empresa_id && h.ativo);
      setHospitaisFiltrados(hospEmpresa);
      // Se o hospital selecionado não pertence à nova empresa, limpa a seleção
      if (formData.hospital_id && !hospEmpresa.find(h => h.id === formData.hospital_id)) {
        setFormData(prev => ({ ...prev, hospital_id: "" }));
      }
    } else {
      setHospitaisFiltrados([]);
      setFormData(prev => ({ ...prev, hospital_id: "" })); // Limpa hospital se não houver empresa
    }
  }, [formData.empresa_id, hospitais]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTipoPlantaoChange = (index, field, value) => {
    const newTipos = [...tiposPlantaoContrato];
    newTipos[index][field] = field === 'valor' ? parseFloat(value) || 0 : value;
    setTiposPlantaoContrato(newTipos);
  };

  const addTipoPlantaoLinha = () => {
    setTiposPlantaoContrato([...tiposPlantaoContrato, { tipo_plantao_id: "", valor: 0 }]);
  };

  const removeTipoPlantaoLinha = (index) => {
    setTiposPlantaoContrato(tiposPlantaoContrato.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Salva o Contrato principal primeiro (onSave é o handleSave da PÁGINA)
      // O formData.id será null se for novo/renovação, ou terá valor se for edição.
      const savedContratoPrincipal = await onSave(formData); 
      const contratoId = savedContratoPrincipal?.id;

      if (!contratoId) {
        console.error("ID do contrato principal não obtido após salvar.");
        // Idealmente, mostrar um erro para o usuário aqui
        setIsSubmitting(false);
        return;
      }
      
      // Agora gerencia os ContratoTipoPlantao
      const tiposPlantaoExistentesNoDB = formData.id // Se era edição, busca os que já existiam para esse contrato
        ? await ContratoTipoPlantao.filter({ contrato_id: contratoId }) 
        : [];

      // Itens no formulário atual
      const itensNoForm = tiposPlantaoContrato.filter(tp => tp.tipo_plantao_id && tp.valor > 0);

      // Criar novos ou atualizar existentes
      for (const itemForm of itensNoForm) {
        if (itemForm.id) { // Se tem ID, é um ContratoTipoPlantao existente (veio da edição)
          const dbItem = tiposPlantaoExistentesNoDB.find(db => db.id === itemForm.id);
          if (dbItem && (dbItem.tipo_plantao_id !== itemForm.tipo_plantao_id || dbItem.valor !== itemForm.valor || !dbItem.ativo)) {
            await ContratoTipoPlantao.update(itemForm.id, {
              tipo_plantao_id: itemForm.tipo_plantao_id,
              valor: itemForm.valor,
              ativo: true // Garante que está ativo
            });
          }
        } else { // Sem ID, é um novo ContratoTipoPlantao para este contrato
          await ContratoTipoPlantao.create({
            contrato_id: contratoId,
            tipo_plantao_id: itemForm.tipo_plantao_id,
            valor: itemForm.valor,
            ativo: true
          });
        }
      }
      
      // Inativar ContratoTipoPlantao que foram removidos do formulário (mas existiam no DB para este contrato)
      const idsNoForm = new Set(itensNoForm.map(item => item.id).filter(Boolean));
      for (const dbItem of tiposPlantaoExistentesNoDB) {
        if (dbItem.ativo && !idsNoForm.has(dbItem.id)) {
          await ContratoTipoPlantao.update(dbItem.id, { ativo: false });
        }
      }
      // onSave na página Contratos.js já lida com fechar o form e recarregar os dados.

    } catch (error) {
      console.error("Erro no handleSubmit do ContratoForm:", error);
      // Idealmente, mostrar um erro para o usuário
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
            {formData.id ? "Editar Contrato" : "Novo Contrato"}
          </h1>
          <p className="text-slate-600 mt-1">
            {formData.id ? "Altere as informações do contrato" : "Cadastre um novo contrato"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Informações do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Gerais do Contrato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa_id">Empresa *</Label>
                  <Select value={formData.empresa_id} onValueChange={(value) => handleChange("empresa_id", value)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione a Empresa" /></SelectTrigger>
                    <SelectContent>
                      {empresas.map(e => <SelectItem key={e.id} value={e.id}>{getEmpresaName(e)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital_id">Hospital *</Label>
                  <Select 
                    value={formData.hospital_id} 
                    onValueChange={(value) => handleChange("hospital_id", value)} 
                    required
                    disabled={!formData.empresa_id || hospitaisFiltrados.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!formData.empresa_id ? "Selecione empresa primeiro" : (hospitaisFiltrados.length === 0 ? "Nenhum hospital para esta empresa" : "Selecione o Hospital")} />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitaisFiltrados.map(h => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                   {formData.empresa_id && hospitaisFiltrados.length === 0 && (
                    <p className="text-xs text-amber-600">Nenhum hospital ativo vinculado a esta empresa.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_contrato">Número do Contrato</Label>
                  <Input id="numero_contrato" value={formData.numero_contrato} onChange={(e) => handleChange("numero_contrato", e.target.value)} placeholder="Ex: CT001/2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início *</Label>
                  <Input id="data_inicio" type="date" value={formData.data_inicio} onChange={(e) => handleChange("data_inicio", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data de Fim (opcional)</Label>
                  <Input id="data_fim" type="date" value={formData.data_fim} onChange={(e) => handleChange("data_fim", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Tipos de Plantão e Valores */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Tipos de Plantão e Valores</h3>
              {tiposPlantaoContrato.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-end p-3 border rounded-md">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`tipo_plantao_id_${index}`}>Tipo de Plantão *</Label>
                    <Select
                      value={item.tipo_plantao_id}
                      onValueChange={(value) => handleTipoPlantaoChange(index, "tipo_plantao_id", value)}
                      required
                    >
                      <SelectTrigger id={`tipo_plantao_id_${index}`}>
                        <SelectValue placeholder="Selecione o Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {todosTiposPlantao.map(tp => (
                          <SelectItem key={tp.id} value={tp.id} disabled={tiposPlantaoContrato.some((selected, i) => i !== index && selected.tipo_plantao_id === tp.id)}>
                            {tp.nome} ({tp.carga_horaria}h)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 w-full md:w-48">
                    <Label htmlFor={`valor_plantao_${index}`}>Valor (R$) *</Label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <Input
                        id={`valor_plantao_${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valor}
                        onChange={(e) => handleTipoPlantaoChange(index, "valor", e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                        required
                      />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeTipoPlantaoLinha(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addTipoPlantaoLinha} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" />
                Adicionar Tipo de Plantão
              </Button>
            </div>
            
            {/* Observações e Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Outras Informações</h3>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => handleChange("observacoes", e.target.value)} placeholder="Observações sobre o contrato" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="ativo" checked={formData.ativo} onCheckedChange={(checked) => handleChange("ativo", checked)} />
                <Label htmlFor="ativo">Contrato ativo no sistema</Label>
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 pt-6 border-t">
              <div> {/* Div para o botão de Renovar à esquerda */}
                {onPrepareRenewal && formData.id && ( // Mostra se onPrepareRenewal existe E estamos editando (formData.id existe)
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onPrepareRenewal(contrato)} // contrato (prop) aqui é o contrato original da edição
                    className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Renovar este Contrato
                  </Button>
                )}
              </div>
              <div className="flex gap-3"> {/* Div para os botões Cancelar e Salvar à direita */}
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Salvando..." : (formData.id ? "Salvar Alterações" : "Salvar Novo Contrato")}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
