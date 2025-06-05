import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Upload, FileImage, Palette, Building2 } from "lucide-react";
import { ParametrosPDF } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

export default function ParametrosPDFPage() {
  const [parametros, setParametros] = useState({
    nome_empresa: "",
    cnpj_empresa: "",
    endereco_empresa: "",
    telefone_empresa: "",
    email_empresa: "",
    website_empresa: "",
    logo_url: "",
    logo_largura: 40,
    logo_altura: 20,
    cor_principal_r: 59,
    cor_principal_g: 130,
    cor_principal_b: 246,
    texto_rodape_adicional: "",
    ativo: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [parametrosId, setParametrosId] = useState(null);

  useEffect(() => {
    loadParametros();
  }, []);

  const loadParametros = async () => {
    try {
      const existingParams = await ParametrosPDF.filter({ ativo: true });
      if (existingParams.length > 0) {
        setParametros(existingParams[0]);
        setParametrosId(existingParams[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar parâmetros:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setParametros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)');
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const response = await UploadFile({ file });
      if (response && response.file_url) {
        setParametros(prev => ({
          ...prev,
          logo_url: response.file_url
        }));
      }
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      alert('Erro ao fazer upload da logo. Tente novamente.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!parametros.nome_empresa || !parametros.cnpj_empresa || !parametros.endereco_empresa) {
      alert('Por favor, preencha pelo menos o nome da empresa, CNPJ e endereço.');
      return;
    }

    setIsSaving(true);
    try {
      if (parametrosId) {
        await ParametrosPDF.update(parametrosId, parametros);
      } else {
        const newParams = await ParametrosPDF.create(parametros);
        setParametrosId(newParams.id);
      }
      alert('Parâmetros salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error);
      alert('Erro ao salvar parâmetros. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const corRgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const hexToCor = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleCorChange = (hexValue) => {
    const cor = hexToCor(hexValue);
    if (cor) {
      setParametros(prev => ({
        ...prev,
        cor_principal_r: cor.r,
        cor_principal_g: cor.g,
        cor_principal_b: cor.b
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Parâmetros dos Relatórios PDF</h1>
        <p className="text-slate-600 mt-1">Configure a aparência e informações dos relatórios em PDF</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
              <Input
                id="nome_empresa"
                value={parametros.nome_empresa}
                onChange={(e) => handleChange("nome_empresa", e.target.value)}
                placeholder="MedFlow Gestão Médica LTDA"
              />
            </div>

            <div>
              <Label htmlFor="cnpj_empresa">CNPJ *</Label>
              <Input
                id="cnpj_empresa"
                value={parametros.cnpj_empresa}
                onChange={(e) => handleChange("cnpj_empresa", e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div>
              <Label htmlFor="endereco_empresa">Endereço Completo *</Label>
              <Textarea
                id="endereco_empresa"
                value={parametros.endereco_empresa}
                onChange={(e) => handleChange("endereco_empresa", e.target.value)}
                placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF, CEP 00000-000"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone_empresa">Telefone</Label>
                <Input
                  id="telefone_empresa"
                  value={parametros.telefone_empresa}
                  onChange={(e) => handleChange("telefone_empresa", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="email_empresa">E-mail</Label>
                <Input
                  id="email_empresa"
                  type="email"
                  value={parametros.email_empresa}
                  onChange={(e) => handleChange("email_empresa", e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website_empresa">Website</Label>
              <Input
                id="website_empresa"
                value={parametros.website_empresa}
                onChange={(e) => handleChange("website_empresa", e.target.value)}
                placeholder="www.empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="texto_rodape_adicional">Texto Adicional do Rodapé</Label>
              <Textarea
                id="texto_rodape_adicional"
                value={parametros.texto_rodape_adicional}
                onChange={(e) => handleChange("texto_rodape_adicional", e.target.value)}
                placeholder="Ex: Dr. João Silva - Responsável Técnico - CRM 12345/SP"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo e Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-green-600" />
              Logo e Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload da Logo */}
            <div>
              <Label>Logo da Empresa</Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingLogo}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    disabled={isUploadingLogo}
                    onClick={() => document.querySelector('input[type="file"]').click()}
                  >
                    {isUploadingLogo ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {parametros.logo_url && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">Preview da Logo:</p>
                    <img 
                      src={parametros.logo_url} 
                      alt="Logo da empresa" 
                      className="max-h-16 max-w-32 object-contain border rounded"
                    />
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB. 
                  Recomendado: imagem em formato horizontal.
                </p>
              </div>
            </div>

            {/* Dimensões da Logo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logo_largura">Largura da Logo (mm)</Label>
                <Input
                  id="logo_largura"
                  type="number"
                  value={parametros.logo_largura}
                  onChange={(e) => handleChange("logo_largura", Number(e.target.value))}
                  min="10"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="logo_altura">Altura da Logo (mm)</Label>
                <Input
                  id="logo_altura"
                  type="number"
                  value={parametros.logo_altura}
                  onChange={(e) => handleChange("logo_altura", Number(e.target.value))}
                  min="5"
                  max="50"
                />
              </div>
            </div>

            {/* Cor Principal */}
            <div>
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cor Principal dos Relatórios
              </Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  type="color"
                  value={corRgbToHex(parametros.cor_principal_r, parametros.cor_principal_g, parametros.cor_principal_b)}
                  onChange={(e) => handleCorChange(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <div className="text-sm text-gray-600">
                  RGB: {parametros.cor_principal_r}, {parametros.cor_principal_g}, {parametros.cor_principal_b}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Esta cor será usada para títulos, bordas e elementos de destaque nos PDFs.
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="ativo"
                checked={parametros.ativo}
                onCheckedChange={(checked) => handleChange("ativo", checked)}
              />
              <Label htmlFor="ativo">Configuração ativa</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Parâmetros"}
        </Button>
      </div>
    </div>
  );
}