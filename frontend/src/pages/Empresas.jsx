
import React, { useState, useEffect } from "react";
import { Empresa } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Pencil, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Briefcase,
  Users
} from "lucide-react";
import EmpresaForm from "../components/empresas/EmpresaForm";

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    const filtered = empresas.filter(empresa =>
      empresa.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (empresa.nome_fantasia && empresa.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
      empresa.cnpj.includes(searchTerm)
    );
    // Ordenar por razão social alfabeticamente - CORRIGIDO
    filtered.sort((a, b) => a.razao_social.localeCompare(b.razao_social));
    setFilteredEmpresas(filtered);
  }, [empresas, searchTerm]);

  const loadEmpresas = async () => {
    try {
      const data = await Empresa.list("razao_social");
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (empresaData) => {
    try {
      if (editingEmpresa) {
        await Empresa.update(editingEmpresa.id, empresaData);
      } else {
        await Empresa.create(empresaData);
      }
      loadEmpresas();
      setShowForm(false);
      setEditingEmpresa(null);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    }
  };

  const handleEdit = (empresa) => {
    setEditingEmpresa(empresa);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmpresa(null);
  };

  const getRegimeTributarioLabel = (regime) => {
    const regimes = {
      simples_nacional: "Simples Nacional",
      lucro_presumido: "Lucro Presumido", 
      lucro_real: "Lucro Real"
    };
    return regimes[regime] || regime;
  };

  if (showForm) {
    return (
      <EmpresaForm
        empresa={editingEmpresa}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Empresas</h1>
          <p className="text-slate-600 mt-1">Gerencie o cadastro de empresas prestadoras de serviço</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Lista de Empresas ({filteredEmpresas.length})
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
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
              <p className="mt-4 text-slate-600">Carregando empresas...</p>
            </div>
          ) : filteredEmpresas.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Comece cadastrando a primeira empresa"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Regime Tributário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.map((empresa) => (
                    <TableRow key={empresa.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {empresa.nome_fantasia || empresa.razao_social}
                            </p>
                            {empresa.nome_fantasia && empresa.razao_social !== empresa.nome_fantasia && (
                              <p className="text-sm text-slate-500">{empresa.razao_social}</p>
                            )}
                            {empresa.responsavel && (
                              <p className="text-xs text-slate-400">
                                Resp.: {empresa.responsavel}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-sm">{empresa.cnpj}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {empresa.telefone && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{empresa.telefone}</span>
                            </div>
                          )}
                          {empresa.email && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{empresa.email}</span>
                            </div>
                          )}
                          {empresa.endereco && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{empresa.endereco}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-purple-700 border-purple-300">
                          {getRegimeTributarioLabel(empresa.regime_tributario)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={empresa.ativo ? "default" : "secondary"}
                          className={empresa.ativo ? "bg-green-100 text-green-800" : ""}
                        >
                          {empresa.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(empresa)}
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
    </div>
  );
}
