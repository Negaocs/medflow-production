import React, { useState, useEffect } from "react";
import { Hospital as HospitalEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Pencil, 
  Hospital, 
  Phone, 
  Mail, 
  MapPin,
  ClipboardList,
  Building2
} from "lucide-react";
import HospitalForm from "../components/hospitais/HospitalForm";

export default function Hospitais() {
  const [hospitais, setHospitais] = useState([]);
  const [filteredHospitais, setFilteredHospitais] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    loadHospitais();
  }, []);

  useEffect(() => {
    const filtered = hospitais.filter(hospital =>
      hospital.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.cnpj.includes(searchTerm)
    );
    // Ordenar por nome alfabeticamente
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    setFilteredHospitais(filtered);
  }, [hospitais, searchTerm]);

  const loadHospitais = async () => {
    try {
      const [hospitaisData, empresasData] = await Promise.all([
        HospitalEntity.list("nome"),
        import("@/api/entities").then(module => module.Empresa.list()) 
      ]);
      setHospitais(hospitaisData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Erro ao carregar hospitais ou empresas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (hospitalData) => {
    try {
      if (editingHospital) {
        await HospitalEntity.update(editingHospital.id, hospitalData);
      } else {
        await HospitalEntity.create(hospitalData);
      }
      loadHospitais();
      setShowForm(false);
      setEditingHospital(null);
    } catch (error) {
      console.error('Erro ao salvar hospital:', error);
    }
  };

  const handleEdit = (hospital) => {
    setEditingHospital(hospital);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHospital(null);
  };

  const getEmpresaName = (empresaId) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'N/A';
  };

  if (showForm) {
    return (
      <HospitalForm
        hospital={editingHospital}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hospitais</h1>
          <p className="text-slate-600 mt-1">Gerencie o cadastro de hospitais</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Hospital
        </Button>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hospital className="h-5 w-5 text-blue-600" />
              Lista de Hospitais ({filteredHospitais.length})
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por Nome ou CNPJ..."
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
              <p className="mt-4 text-slate-600">Carregando hospitais...</p>
            </div>
          ) : filteredHospitais.length === 0 ? (
            <div className="text-center py-12">
              <Hospital className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "Nenhum hospital encontrado" : "Nenhum hospital cadastrado"}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Comece cadastrando o primeiro hospital"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Empresa Vinculada</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHospitais.map((hospital) => (
                    <TableRow key={hospital.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <Hospital className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{hospital.nome}</p>
                            {hospital.contato_responsavel && (
                              <p className="text-xs text-slate-400">
                                Resp.: {hospital.contato_responsavel}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-sm">{hospital.cnpj}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-slate-700">
                            {getEmpresaName(hospital.empresa_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {hospital.telefone && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{hospital.telefone}</span>
                            </div>
                          )}
                          {hospital.email && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{hospital.email}</span>
                            </div>
                          )}
                          {hospital.endereco && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{hospital.endereco}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={hospital.ativo ? "default" : "secondary"}
                          className={hospital.ativo ? "bg-green-100 text-green-800" : ""}
                        >
                          {hospital.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(hospital)}
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