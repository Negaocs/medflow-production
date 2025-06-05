import React, { useState, useEffect } from "react";
import { TipoPlantao } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Pencil, 
  ListChecks,
  Clock,
  Info
} from "lucide-react";
import TipoPlantaoForm from "../components/tiposplantao/TipoPlantaoForm";

export default function TiposPlantao() {
  const [tiposPlantao, setTiposPlantao] = useState([]);
  const [filteredTiposPlantao, setFilteredTiposPlantao] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTipoPlantao, setEditingTipoPlantao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTiposPlantao();
  }, []);

  useEffect(() => {
    const filtered = tiposPlantao.filter(tipo =>
      tipo.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Ordenar por nome alfabeticamente
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    setFilteredTiposPlantao(filtered);
  }, [tiposPlantao, searchTerm]);

  const loadTiposPlantao = async () => {
    try {
      const data = await TipoPlantao.list("nome");
      setTiposPlantao(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de plantão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (tipoPlantaoData) => {
    try {
      if (editingTipoPlantao) {
        await TipoPlantao.update(editingTipoPlantao.id, tipoPlantaoData);
      } else {
        await TipoPlantao.create(tipoPlantaoData);
      }
      loadTiposPlantao();
      setShowForm(false);
      setEditingTipoPlantao(null);
    } catch (error) {
      console.error('Erro ao salvar tipo de plantão:', error);
    }
  };

  const handleEdit = (tipoPlantao) => {
    setEditingTipoPlantao(tipoPlantao);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTipoPlantao(null);
  };

  if (showForm) {
    return (
      <TipoPlantaoForm
        tipoPlantao={editingTipoPlantao}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tipos de Plantão</h1>
          <p className="text-slate-600 mt-1">Gerencie os diferentes tipos de plantões</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-blue-600" />
              Lista de Tipos de Plantão ({filteredTiposPlantao.length})
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome..."
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
              <p className="mt-4 text-slate-600">Carregando tipos de plantão...</p>
            </div>
          ) : filteredTiposPlantao.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "Nenhum tipo encontrado" : "Nenhum tipo de plantão cadastrado"}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Comece cadastrando o primeiro tipo de plantão"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTiposPlantao.map((tipo) => (
                    <TableRow key={tipo.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <ListChecks className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{tipo.nome}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{tipo.carga_horaria}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {tipo.descricao ? (
                            <p className="text-sm text-slate-600 truncate" title={tipo.descricao}>
                              {tipo.descricao}
                            </p>
                          ) : (
                            <span className="text-xs text-slate-400">Sem descrição</span>
                          )}
                          {tipo.observacoes && (
                            <p className="text-xs text-slate-500 mt-1 truncate" title={tipo.observacoes}>
                              Obs: {tipo.observacoes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={tipo.ativo ? "default" : "secondary"}
                          className={tipo.ativo ? "bg-green-100 text-green-800" : ""}
                        >
                          {tipo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(tipo)}
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