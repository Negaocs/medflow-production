
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Hospital as HospitalIcon } from "lucide-react";

export default function HospitalForm({ hospital, onSave, onCancel }) {
  const [formData, setFormData] = useState(hospital || {
    nome: "",
    cnpj: "",
    empresa_id: "", // Added empresa_id
    endereco: "",
    telefone: "",
    email: "",
    contato_responsavel: "",
    observacoes: "",
    ativo: true
  });

  const [empresas, setEmpresas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const { Empresa } = await import("@/api/entities");
      const data = await Empresa.list();
      setEmpresas(data.filter(e => e.ativo));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      // Optionally, show a toast or message to the user
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
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
            {hospital ? "Editar Hospital" : "Novo Hospital"}
          </h1>
          <p className="text-slate-600 mt-1">
            {hospital ? "Altere as informações do hospital" : "Cadastre um novo hospital no sistema"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HospitalIcon className="h-5 w-5 text-blue-600" />
            Informações do Hospital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Hospital */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Cadastrais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Hospital *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Nome do Hospital"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="empresa_id">Empresa Vinculada *</Label>
                  <Select
                    value={formData.empresa_id}
                    onValueChange={(value) => handleChange("empresa_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map(empresa => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome_fantasia || empresa.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleChange("endereco", e.target.value)}
                    placeholder="Endereço completo do hospital"
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
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contato@hospital.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato_responsavel">Contato Responsável</Label>
                  <Input
                    id="contato_responsavel"
                    value={formData.contato_responsavel}
                    onChange={(e) => handleChange("contato_responsavel", e.target.value)}
                    placeholder="Nome do contato responsável"
                  />
                </div>
              </div>
            </div>

            {/* Observações e Status */}
             <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Outras Informações</h3>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações gerais sobre o hospital"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => handleChange("ativo", checked)}
                />
                <Label htmlFor="ativo">Hospital ativo no sistema</Label>
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
                {isSubmitting ? "Salvando..." : "Salvar Hospital"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
