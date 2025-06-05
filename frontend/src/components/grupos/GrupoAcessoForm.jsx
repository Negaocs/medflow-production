
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Shield } from "lucide-react";
import { PERMISSIONS } from "../auth/PermissionChecker";

const PERMISSION_GROUPS_CONFIG = [
  {
    groupName: "Dashboard",
    permissions: [{ key: PERMISSIONS.DASHBOARD_VIEW, label: "Visualizar Dashboard" }]
  },
  {
    groupName: "Médicos",
    permissions: [
      { key: PERMISSIONS.MEDICOS_LISTAR, label: "Listar Médicos" },
      { key: PERMISSIONS.MEDICOS_CRIAR, label: "Criar Médicos" },
      { key: PERMISSIONS.MEDICOS_EDITAR, label: "Editar Médicos" },
      { key: PERMISSIONS.MEDICOS_EXCLUIR, label: "Excluir Médicos" }
    ]
  },
  {
    groupName: "Empresas",
    permissions: [
      { key: PERMISSIONS.EMPRESAS_LISTAR, label: "Listar Empresas" },
      { key: PERMISSIONS.EMPRESAS_CRIAR, label: "Criar Empresas" },
      { key: PERMISSIONS.EMPRESAS_EDITAR, label: "Editar Empresas" },
      { key: PERMISSIONS.EMPRESAS_EXCLUIR, label: "Excluir Empresas" }
    ]
  },
  {
    groupName: "Hospitais",
    permissions: [
      { key: PERMISSIONS.HOSPITAIS_LISTAR, label: "Listar Hospitais" },
      { key: PERMISSIONS.HOSPITAIS_CRIAR, label: "Criar Hospitais" },
      { key: PERMISSIONS.HOSPITAIS_EDITAR, label: "Editar Hospitais" },
      { key: PERMISSIONS.HOSPITAIS_EXCLUIR, label: "Excluir Hospitais" }
    ]
  },
  {
    groupName: "Contratos",
    permissions: [
      { key: PERMISSIONS.CONTRATOS_LISTAR, label: "Listar Contratos" },
      { key: PERMISSIONS.CONTRATOS_CRIAR, label: "Criar Contratos" },
      { key: PERMISSIONS.CONTRATOS_EDITAR, label: "Editar Contratos" },
      { key: PERMISSIONS.CONTRATOS_RENOVAR, label: "Renovar Contratos" },
      { key: PERMISSIONS.CONTRATOS_EXCLUIR, label: "Excluir Contratos" }
    ]
  },
  {
    groupName: "Tipos de Plantão",
    permissions: [
      { key: PERMISSIONS.TIPOS_PLANTAO_LISTAR, label: "Listar Tipos" },
      { key: PERMISSIONS.TIPOS_PLANTAO_CRIAR, label: "Criar Tipos" },
      { key: PERMISSIONS.TIPOS_PLANTAO_EDITAR, label: "Editar Tipos" },
      { key: PERMISSIONS.TIPOS_PLANTAO_EXCLUIR, label: "Excluir Tipos" }
    ]
  },
  {
    groupName: "Plantões",
    permissions: [
      { key: PERMISSIONS.PLANTOES_LISTAR, label: "Listar Plantões" },
      { key: PERMISSIONS.PLANTOES_CRIAR, label: "Criar Plantões" },
      { key: PERMISSIONS.PLANTOES_EDITAR, label: "Editar Plantões" },
      { key: PERMISSIONS.PLANTOES_CONFIRMAR, label: "Confirmar Plantões" },
      { key: PERMISSIONS.PLANTOES_EXCLUIR, label: "Excluir Plantões" }
    ]
  },
  {
    groupName: "Procedimentos Particulares",
    permissions: [
      { key: PERMISSIONS.PROCEDIMENTOS_LISTAR, label: "Listar Procedimentos" },
      { key: PERMISSIONS.PROCEDIMENTOS_CRIAR, label: "Criar Procedimentos" },
      { key: PERMISSIONS.PROCEDIMENTOS_EDITAR, label: "Editar Procedimentos" },
      { key: PERMISSIONS.PROCEDIMENTOS_CONFIRMAR, label: "Confirmar Procedimentos" },
      { key: PERMISSIONS.PROCEDIMENTOS_EXCLUIR, label: "Excluir Procedimentos" }
    ]
  },
  {
    groupName: "Produção Administrativa",
    permissions: [
      { key: PERMISSIONS.PROD_ADMIN_LISTAR, label: "Listar Prod. Admin." },
      { key: PERMISSIONS.PROD_ADMIN_CRIAR, label: "Criar Prod. Admin." },
      { key: PERMISSIONS.PROD_ADMIN_EDITAR, label: "Editar Prod. Admin." },
      { key: PERMISSIONS.PROD_ADMIN_CONFIRMAR, label: "Confirmar Prod. Admin." },
      { key: PERMISSIONS.PROD_ADMIN_EXCLUIR, label: "Excluir Prod. Admin." }
    ]
  },
  {
    groupName: "Pró-labores",
    permissions: [
        { key: PERMISSIONS.PROLABORE_LISTAR, label: "Listar Pró-labores" },
        { key: PERMISSIONS.PROLABORE_CRIAR, label: "Criar Pró-labores" },
        { key: PERMISSIONS.PROLABORE_EDITAR, label: "Editar Pró-labores" },
        { key: PERMISSIONS.PROLABORE_CONFIRMAR, label: "Confirmar Pró-labores" },
        { key: PERMISSIONS.PROLABORE_EXCLUIR, label: "Excluir Pró-labores" }
    ]
  },
  {
    groupName: "Descontos e Créditos",
    permissions: [
      { key: PERMISSIONS.DESCONTOS_CREDITOS_LISTAR, label: "Listar Desc./Créd." },
      { key: PERMISSIONS.DESCONTOS_CREDITOS_CRIAR, label: "Criar Desc./Créd." },
      { key: PERMISSIONS.DESCONTOS_CREDITOS_EDITAR, label: "Editar Desc./Créd." },
      { key: PERMISSIONS.DESCONTOS_CREDITOS_EXCLUIR, label: "Excluir Desc./Créd." }
    ]
  },
  {
    groupName: "Cálculos",
    permissions: [
      { key: PERMISSIONS.CALCULOS_VIEW, label: "Visualizar Cálculos" },
      { key: PERMISSIONS.CALCULOS_EXECUTAR, label: "Executar Cálculos" }
    ]
  },
  {
    groupName: "Relatórios",
    permissions: [
      { key: PERMISSIONS.RELATORIOS_VIEW, label: "Visualizar Relatórios" },
      { key: PERMISSIONS.RELATORIOS_EXPORTAR, label: "Exportar Relatórios" }
    ]
  },
  {
    groupName: "Tabelas Fiscais",
    permissions: [
      { key: PERMISSIONS.TABELAS_INSS_GERENCIAR, label: "Gerenciar Tabelas INSS" },
      { key: PERMISSIONS.TABELAS_IRRF_GERENCIAR, label: "Gerenciar Tabelas IRRF" }
    ]
  },
  {
    groupName: "Administração",
    permissions: [
      { key: PERMISSIONS.ADMIN_FULL, label: "Acesso Total (Administrador)" },
      { key: PERMISSIONS.USUARIOS_GERENCIAR, label: "Gerenciar Usuários" }, 
      { key: PERMISSIONS.GRUPOS_GERENCIAR, label: "Gerenciar Grupos de Acesso" },
      { key: PERMISSIONS.DADOS_IMPORTAR_EXPORTAR, label: "Importar/Exportar Dados" } 
    ]
  }
];

export default function GrupoAcessoForm({ grupo, onSave, onCancel }) {
  const [formData, setFormData] = useState(grupo || {
    nome: "",
    descricao: "",
    permissoes: [],
    ativo: true
  });

  useEffect(() => {
    if (grupo) {
      setFormData(grupo);
    } else {
      setFormData({
        nome: "",
        descricao: "",
        permissoes: [],
        ativo: true
      });
    }
  }, [grupo]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionToggle = (permissionKey) => {
    setFormData(prev => {
      const newPermissions = prev.permissoes.includes(permissionKey)
        ? prev.permissoes.filter(p => p !== permissionKey)
        : [...prev.permissoes, permissionKey];
      
      return {
        ...prev,
        permissoes: newPermissions
      };
    });
  };

  const handleGroupToggle = (groupPermissionsList, isChecked) => {
    setFormData(prev => {
      let newPermissions = [...prev.permissoes];
      
      if (isChecked) {
        groupPermissionsList.forEach(perm => {
          if (!newPermissions.includes(perm.key)) {
            newPermissions.push(perm.key);
          }
        });
      } else {
        groupPermissionsList.forEach(perm => {
          newPermissions = newPermissions.filter(p => p !== perm.key);
        });
      }
      
      return {
        ...prev,
        permissoes: newPermissions
      };
    });
  };

  const isGroupChecked = (groupPermissionsList) => {
    if (!groupPermissionsList || groupPermissionsList.length === 0) return false;
    return groupPermissionsList.every(perm => formData.permissoes.includes(perm.key));
  };

  const isGroupIndeterminate = (groupPermissionsList) => {
    if (!groupPermissionsList || groupPermissionsList.length === 0) return false;
    const checkedCount = groupPermissionsList.filter(perm => 
      formData.permissoes.includes(perm.key)
    ).length;
    return checkedCount > 0 && checkedCount < groupPermissionsList.length;
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
            {formData.id ? "Editar Grupo de Acesso" : "Novo Grupo de Acesso"}
          </h1>
          <p className="text-slate-600 mt-1">
            {formData.id ? "Altere as informações do grupo" : "Crie um novo grupo de acesso com permissões específicas"}
          </p>
        </div>
      </div>

      <Card className="bg-white shadow-lg border-0 max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Informações do Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Grupo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Ex: Administradores, Médicos, Financeiro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ativo">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => handleChange("ativo", checked)}
                    />
                    <Label htmlFor="ativo">Grupo ativo</Label>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange("descricao", e.target.value)}
                    placeholder="Descreva o propósito deste grupo de acesso..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Permissões */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Permissões</h3>
              <div className="space-y-6">
                {PERMISSION_GROUPS_CONFIG.map(({ groupName, permissions }) => (
                  <div key={groupName} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id={`group-${groupName.replace(/\s+/g, '-')}`}
                        checked={isGroupChecked(permissions)}
                        onCheckedChange={(checkedState) => {
                            const isNowChecked = checkedState === true;
                            handleGroupToggle(permissions, isNowChecked);
                         }}
                        className={isGroupIndeterminate(permissions) ? "data-[state=checked]:bg-blue-600 data-[state=indeterminate]:bg-blue-300" : ""}
                        ref={el => {
                            if (el) el.indeterminate = isGroupIndeterminate(permissions);
                        }}
                      />
                      <Label htmlFor={`group-${groupName.replace(/\s+/g, '-')}`} className="font-semibold text-slate-700">
                        {groupName}
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                      {permissions.map((permission) => (
                        <div key={permission.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.key}
                            checked={formData.permissoes.includes(permission.key)}
                            onCheckedChange={() => handlePermissionToggle(permission.key)}
                          />
                          <Label htmlFor={permission.key} className="text-sm text-slate-600">
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-700 mb-2">Resumo das Permissões</h4>
              <p className="text-sm text-slate-600">
                Este grupo terá <span className="font-semibold">{formData.permissoes.length}</span> permissões selecionadas.
              </p>
              {formData.permissoes.includes(PERMISSIONS.ADMIN_FULL) && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Este grupo inclui permissão de Administrador Total, que dá acesso completo ao sistema.
                </p>
              )}
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
                {isSubmitting ? "Salvando..." : "Salvar Grupo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
