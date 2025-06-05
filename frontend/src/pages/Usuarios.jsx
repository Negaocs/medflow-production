import React, { useState, useEffect } from "react";
import { UsuarioSistema } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  User, 
  Mail, 
  Phone, 
  Shield,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle
} from "lucide-react";
import UsuarioForm from "../components/usuarios/UsuarioForm";
import { format, parseISO, isValid } from "date-fns";

const perfilLabels = {
  administrador: { label: "Administrador", color: "bg-red-100 text-red-800" },
  gerente: { label: "Gerente", color: "bg-purple-100 text-purple-800" },
  operador: { label: "Operador", color: "bg-blue-100 text-blue-800" },
  consulta: { label: "Consulta", color: "bg-gray-100 text-gray-800" }
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    const filtered = usuarios.filter(usuario =>
      usuario.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.cargo && usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsuarios(filtered);
  }, [usuarios, searchTerm]);

  const loadUsuarios = async () => {
    try {
      const data = await UsuarioSistema.list("-created_date");
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (usuarioData) => {
    try {
      if (editingUsuario) {
        await UsuarioSistema.update(editingUsuario.id, usuarioData);
      } else {
        await UsuarioSistema.create(usuarioData);
      }
      loadUsuarios();
      setShowForm(false);
      setEditingUsuario(null);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUsuario(null);
  };

  const handleToggleStatus = async (usuario) => {
    try {
      await UsuarioSistema.update(usuario.id, {
        ...usuario,
        ativo: !usuario.ativo
      });
      loadUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
    }
  };

  const formatLastLogin = (dateString) => {
    if (!dateString || !isValid(parseISO(dateString))) return "Nunca";
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm");
  };

  if (showForm) {
    return (
      <UsuarioForm
        usuario={editingUsuario}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Usuários do Sistema</h1>
          <p className="text-slate-600 mt-1">Gerencie os usuários e permissões de acesso</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Lista de Usuários
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, e-mail ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 h-56 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Comece cadastrando o primeiro usuário"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsuarios.map((usuario) => (
                <Card key={usuario.id} className="hover:shadow-lg transition-all duration-300 border border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          usuario.ativo ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">{usuario.nome_completo}</h3>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge className={perfilLabels[usuario.perfil]?.color || "bg-gray-100 text-gray-800"}>
                              {perfilLabels[usuario.perfil]?.label || usuario.perfil}
                            </Badge>
                            {!usuario.ativo && (
                              <Badge className="bg-red-100 text-red-800">
                                Inativo
                              </Badge>
                            )}
                            {usuario.bloqueado && (
                              <Badge className="bg-orange-100 text-orange-800">
                                Bloqueado
                              </Badge>
                            )}
                            {usuario.senha_temporaria && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Senha Temp.
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(usuario)}
                        className="hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{usuario.email}</span>
                    </div>
                    {usuario.telefone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span>{usuario.telefone}</span>
                      </div>
                    )}
                    {usuario.cargo && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Shield className="w-4 h-4" />
                        <span>{usuario.cargo}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>Último login: {formatLastLogin(usuario.data_ultimo_login)}</span>
                    </div>
                    
                    {usuario.tentativas_login > 0 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{usuario.tentativas_login} tentativa(s) de login falhada(s)</span>
                      </div>
                    )}

                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-xs text-slate-500">
                        {usuario.primeiro_login ? "Aguardando primeiro login" : "Usuário ativo"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(usuario)}
                        className={`text-xs ${
                          usuario.ativo 
                            ? "text-red-600 hover:bg-red-50 border-red-500" 
                            : "text-green-600 hover:bg-green-50 border-green-500"
                        }`}
                      >
                        {usuario.ativo ? (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}