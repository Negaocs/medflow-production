import React, { useState, useEffect } from "react";
import { GrupoAcesso, UsuarioGrupo } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Pencil, 
  Shield, 
  Users,
  Lock
} from "lucide-react";
import GrupoAcessoForm from "../components/grupos/GrupoAcessoForm";
import { PermissionGuard, PERMISSIONS } from "../components/auth/PermissionChecker";

export default function GruposAcesso() {
  const [grupos, setGrupos] = useState([]);
  const [filteredGrupos, setFilteredGrupos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    const filtered = grupos.filter(grupo =>
      grupo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grupo.descricao && grupo.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    // Ordenar por nome alfabeticamente
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    setFilteredGrupos(filtered);
  }, [grupos, searchTerm]);

  const loadGrupos = async () => {
    try {
      const data = await GrupoAcesso.list("nome");
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (grupoData) => {
    try {
      if (editingGrupo) {
        await GrupoAcesso.update(editingGrupo.id, grupoData);
      } else {
        await GrupoAcesso.create(grupoData);
      }
      loadGrupos();
      setShowForm(false);
      setEditingGrupo(null);
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
    }
  };

  const handleEdit = (grupo) => {
    setEditingGrupo(grupo);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGrupo(null);
  };

  if (showForm) {
    return (
      <GrupoAcessoForm
        grupo={editingGrupo}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.GRUPOS_GERENCIAR}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Grupos de Acesso</h1>
            <p className="text-slate-600 mt-1">Gerencie os grupos de acesso e suas permissões</p>
          </div>
          <PermissionGuard permission={PERMISSIONS.GRUPOS_GERENCIAR}>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Grupo
            </Button>
          </PermissionGuard>
        </div>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Lista de Grupos ({filteredGrupos.length})
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
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
                <p className="mt-4 text-slate-600">Carregando grupos...</p>
              </div>
            ) : filteredGrupos.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  {searchTerm ? "Nenhum grupo encontrado" : "Nenhum grupo cadastrado"}
                </h3>
                <p className="text-slate-500">
                  {searchTerm 
                    ? "Tente buscar com outros termos"
                    : "Comece criando o primeiro grupo de acesso"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrupos.map((grupo) => (
                      <TableRow key={grupo.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{grupo.nome}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {grupo.descricao ? (
                              <p className="text-sm text-slate-600 truncate" title={grupo.descricao}>
                                {grupo.descricao}
                              </p>
                            ) : (
                              <span className="text-xs text-slate-400">Sem descrição</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">
                              {grupo.permissoes?.length || 0} permissões
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={grupo.ativo ? "default" : "secondary"}
                            className={grupo.ativo ? "bg-green-100 text-green-800" : ""}
                          >
                            {grupo.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <PermissionGuard permission={PERMISSIONS.GRUPOS_GERENCIAR}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(grupo)}
                              className="hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}