import React, { useState, useEffect, useMemo } from "react";
import { TabelaIRRF as TabelaIRRFEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  FileBadge, // Alterado para FileBadge
  CalendarRange,
  Trash2,
  Copy
} from "lucide-react";
import TabelaIRRFForm from "../components/tabelasirrf/TabelaIRRFForm"; // Corrigido caminho
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

// Funções de formatação (podem ser movidas para um utils se usadas em mais lugares)
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ -';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercentage = (value) => {
  if (typeof value !== 'number') return '- %';
  return `${(value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

const formatDate = (dateString) => {
  if (!dateString || !isValid(parseISO(dateString))) return "Atual";
  return format(parseISO(dateString), "dd/MM/yyyy");
};

const formatVigenciaTitle = (dateString) => {
  if (!dateString || !isValid(parseISO(dateString))) return "Vigência Indefinida";
  return format(parseISO(dateString), "MMMM 'de' yyyy", { locale: ptBR });
}

export default function TabelasIRRFPage() {
  const [tabelas, setTabelas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFaixa, setEditingFaixa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vigenciaParaNovaFaixa, setVigenciaParaNovaFaixa] = useState(null);

  useEffect(() => {
    loadTabelas();
  }, []);

  const loadTabelas = async () => {
    setIsLoading(true);
    try {
      const data = await TabelaIRRFEntity.list("-vigencia_inicio"); 
      setTabelas(data);
    } catch (error) {
      console.error("Erro ao carregar tabelas IRRF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedTabelas = useMemo(() => {
    return tabelas.reduce((acc, faixa) => {
      const vigenciaKey = `${faixa.vigencia_inicio}_${faixa.vigencia_fim || 'null'}`;
      if (!acc[vigenciaKey]) {
        acc[vigenciaKey] = {
          vigencia_inicio: faixa.vigencia_inicio,
          vigencia_fim: faixa.vigencia_fim,
          faixas: [],
        };
      }
      acc[vigenciaKey].faixas.push(faixa);
      acc[vigenciaKey].faixas.sort((a, b) => a.faixa - b.faixa);
      return acc;
    }, {});
  }, [tabelas]);

  const handleSave = async (data) => {
    try {
      if (editingFaixa) {
        await TabelaIRRFEntity.update(editingFaixa.id, data);
      } else {
        const dataToSave = vigenciaParaNovaFaixa 
            ? { ...data, vigencia_inicio: vigenciaParaNovaFaixa.vigencia_inicio, vigencia_fim: vigenciaParaNovaFaixa.vigencia_fim }
            : data;
        await TabelaIRRFEntity.create(dataToSave);
      }
      loadTabelas();
      setShowForm(false);
      setEditingFaixa(null);
      setVigenciaParaNovaFaixa(null);
    } catch (error) {
      console.error("Erro ao salvar faixa IRRF:", error);
    }
  };

  const handleEdit = (faixa) => {
    setEditingFaixa(faixa);
    setVigenciaParaNovaFaixa(null);
    setShowForm(true);
  };
  
  const handleAddNewFaixaToVigencia = (vigencia_inicio, vigencia_fim) => {
    setVigenciaParaNovaFaixa({ vigencia_inicio, vigencia_fim });
    setEditingFaixa(null);
    setShowForm(true);
  };

  const handleAddNewVigencia = () => {
    setEditingFaixa(null);
    setVigenciaParaNovaFaixa(null);
    setShowForm(true);
  }

  const handleDeleteFaixa = async (faixaId) => {
    if (window.confirm("Tem certeza que deseja excluir esta faixa de IRRF?")) {
      try {
        await TabelaIRRFEntity.delete(faixaId);
        loadTabelas();
      } catch (error) {
        console.error("Erro ao excluir faixa IRRF:", error);
      }
    }
  };
  
  const handleDuplicateVigencia = async (vigenciaKey) => {
    const vigenciaOriginal = groupedTabelas[vigenciaKey];
    if (!vigenciaOriginal || !vigenciaOriginal.faixas.length) return;

    const novaVigenciaInicio = prompt("Digite a data de início da nova vigência (AAAA-MM-DD):", format(new Date(), "yyyy-MM-dd"));
    if (!novaVigenciaInicio || !/^\d{4}-\d{2}-\d{2}$/.test(novaVigenciaInicio)) {
      alert("Data de início inválida.");
      return;
    }
    
    let novaVigenciaFim = prompt("Digite a data de fim da nova vigência (AAAA-MM-DD) ou deixe em branco para atual:", "");
    if (novaVigenciaFim === "") {
        novaVigenciaFim = null;
    } else if (novaVigenciaFim && !/^\d{4}-\d{2}-\d{2}$/.test(novaVigenciaFim)) {
        alert("Data de fim inválida.");
        return;
    }

    setIsLoading(true);
    try {
      const novasFaixasPromises = vigenciaOriginal.faixas.map(faixa => {
        const { id, created_by, created_date, updated_date, ...dadosFaixa } = faixa;
        return TabelaIRRFEntity.create({
          ...dadosFaixa,
          vigencia_inicio: novaVigenciaInicio,
          vigencia_fim: novaVigenciaFim,
        });
      });
      await Promise.all(novasFaixasPromises);
      loadTabelas();
    } catch (error) {
      console.error("Erro ao duplicar vigência IRRF:", error);
      alert("Ocorreu um erro ao duplicar a vigência.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFaixa(null);
    setVigenciaParaNovaFaixa(null);
  };

  if (showForm) {
    const isEditing = !!editingFaixa;
    const isAddingToExistingVigencia = !isEditing && !!vigenciaParaNovaFaixa;

    const initialDataForForm = editingFaixa 
      ? editingFaixa 
      : (vigenciaParaNovaFaixa 
          ? { 
              vigencia_inicio: vigenciaParaNovaFaixa.vigencia_inicio, 
              vigencia_fim: vigenciaParaNovaFaixa.vigencia_fim, 
              faixa: (groupedTabelas[`${vigenciaParaNovaFaixa.vigencia_inicio}_${vigenciaParaNovaFaixa.vigencia_fim || 'null'}`]?.faixas.length || 0) + 1,
              base_calculo_de: 0, 
              base_calculo_ate: 0, 
              aliquota: 0, 
              parcela_deduzir: 0 
            } 
          : undefined);
          
    return (
      <TabelaIRRFForm
        faixaIRRF={initialDataForForm}
        onSave={handleSave}
        onCancel={handleCancel}
        isFixedVigencia={isAddingToExistingVigencia}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tabelas de Imposto de Renda (IRRF)</h1>
          <p className="text-slate-600 mt-1">Gerencie as faixas e alíquotas para cálculo do IRRF.</p>
        </div>
        <Button
          onClick={handleAddNewVigencia}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Vigência/Faixa IRRF
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando tabelas IRRF...</p>
        </div>
      ) : Object.keys(groupedTabelas).length === 0 ? (
         <div className="text-center py-12 bg-white shadow-md rounded-lg">
            <FileBadge className="mx-auto h-16 w-16 text-slate-400 mb-6" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhuma Tabela IRRF Cadastrada</h3>
            <p className="text-slate-500 mb-6">Comece adicionando as faixas de IRRF para diferentes períodos de vigência.</p>
            <Button onClick={handleAddNewVigencia} variant="destructive">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Vigência/Faixa
            </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTabelas)
            .sort(([keyA], [keyB]) => parseISO(keyB.split('_')[0]) - parseISO(keyA.split('_')[0]))
            .map(([vigenciaKey, { vigencia_inicio, vigencia_fim, faixas }]) => (
            <Card key={vigenciaKey} className="bg-white shadow-lg border-0">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-red-700">
                      <CalendarRange className="h-6 w-6" />
                      Vigência IRRF: {formatVigenciaTitle(vigencia_inicio)}
                    </CardTitle>
                    <CardDescription>
                      De {formatDate(vigencia_inicio)} até {formatDate(vigencia_fim)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleDuplicateVigencia(vigenciaKey)}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicar Vigência
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAddNewFaixaToVigencia(vigencia_inicio, vigencia_fim)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Faixa IRRF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Faixa</TableHead>
                      <TableHead>Base Cálculo De</TableHead>
                      <TableHead>Base Cálculo Até</TableHead>
                      <TableHead>Alíquota</TableHead>
                      <TableHead>Parcela a Deduzir</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faixas.map((faixa) => (
                      <TableRow key={faixa.id}>
                        <TableCell className="font-medium">{faixa.faixa}</TableCell>
                        <TableCell>{formatCurrency(faixa.base_calculo_de)}</TableCell>
                        <TableCell>{formatCurrency(faixa.base_calculo_ate)}</TableCell>
                        <TableCell>{formatPercentage(faixa.aliquota)}</TableCell>
                        <TableCell>{formatCurrency(faixa.parcela_deduzir)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(faixa)} className="hover:text-red-600">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFaixa(faixa.id)} className="hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 {faixas.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Nenhuma faixa IRRF cadastrada para esta vigência.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}