
import React, { useState, useEffect, useMemo } from "react";
import { TabelaINSS as TabelaINSSEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Percent, 
  CalendarRange,
  Eye,
  Trash2, // Ícone para excluir
  Copy // Ícone para duplicar vigência
} from "lucide-react";
import TabelaINSSForm from "../components/tabelasinss/TabelaINSSForm";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para formatar moeda
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ -';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Função para formatar percentual
const formatPercentage = (value) => {
  if (typeof value !== 'number') return '- %';
  return `${(value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

// Função para formatar data
const formatDate = (dateString) => {
  if (!dateString || !isValid(parseISO(dateString))) return "Atual";
  return format(parseISO(dateString), "dd/MM/yyyy");
};
const formatVigenciaTitle = (dateString) => {
  if (!dateString || !isValid(parseISO(dateString))) return "Vigência Indefinida";
  return format(parseISO(dateString), "MMMM 'de' yyyy", { locale: ptBR });
}


export default function TabelasINSSPage() {
  const [tabelas, setTabelas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFaixa, setEditingFaixa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vigenciaParaNovaFaixa, setVigenciaParaNovaFaixa] = useState(null); // { vigencia_inicio, vigencia_fim, tipo_contribuinte }

  useEffect(() => {
    loadTabelas();
  }, []);

  const loadTabelas = async () => {
    setIsLoading(true);
    try {
      // CORREÇÃO: Ordenar apenas por um campo na chamada da API
      const data = await TabelaINSSEntity.list("-vigencia_inicio"); 
      setTabelas(data);
    } catch (error) {
      console.error("Erro ao carregar tabelas INSS:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedTabelas = useMemo(() => {
    return tabelas.reduce((acc, faixa) => {
      const vigenciaKey = `${faixa.vigencia_inicio}_${faixa.vigencia_fim || 'null'}_${faixa.tipo_contribuinte}`;
      if (!acc[vigenciaKey]) {
        acc[vigenciaKey] = {
          vigencia_inicio: faixa.vigencia_inicio,
          vigencia_fim: faixa.vigencia_fim,
          tipo_contribuinte: faixa.tipo_contribuinte, // Adicionado
          faixas: [],
        };
      }
      acc[vigenciaKey].faixas.push(faixa);
      // A ordenação por faixa é feita aqui, após os dados serem carregados
      acc[vigenciaKey].faixas.sort((a, b) => a.faixa - b.faixa); // Garante ordenação por faixa dentro do grupo
      return acc;
    }, {});
  }, [tabelas]);

  const handleSave = async (data) => {
    try {
      if (editingFaixa) {
        await TabelaINSSEntity.update(editingFaixa.id, data);
      } else {
        // Se estiver adicionando a uma vigência existente, usar os dados da vigência
        const dataToSave = vigenciaParaNovaFaixa 
            ? { 
                ...data, 
                vigencia_inicio: vigenciaParaNovaFaixa.vigencia_inicio, 
                vigencia_fim: vigenciaParaNovaFaixa.vigencia_fim,
                tipo_contribuinte: vigenciaParaNovaFaixa.tipo_contribuinte // Certifica que o tipo de contribuinte é mantido
            }
            : data;
        await TabelaINSSEntity.create(dataToSave);
      }
      loadTabelas();
      setShowForm(false);
      setEditingFaixa(null);
      setVigenciaParaNovaFaixa(null);
    } catch (error) {
      console.error("Erro ao salvar faixa INSS:", error);
      // Adicionar feedback para o usuário aqui, se necessário
    }
  };

  const handleEdit = (faixa) => {
    setEditingFaixa(faixa);
    setVigenciaParaNovaFaixa(null); // Limpa se estiver editando
    setShowForm(true);
  };
  
  const handleAddNewFaixaToVigencia = (vigencia_inicio, vigencia_fim, tipo_contribuinte) => {
    setVigenciaParaNovaFaixa({ vigencia_inicio, vigencia_fim, tipo_contribuinte });
    setEditingFaixa(null); // Garante que é uma nova faixa
    setShowForm(true);
  };

  const handleAddNewVigencia = () => {
    setEditingFaixa(null);
    setVigenciaParaNovaFaixa(null); // Nova vigência, não preenche as datas
    setShowForm(true);
  }

  const handleDeleteFaixa = async (faixaId) => {
    if (window.confirm("Tem certeza que deseja excluir esta faixa?")) {
      try {
        await TabelaINSSEntity.delete(faixaId);
        loadTabelas();
      } catch (error) {
        console.error("Erro ao excluir faixa INSS:", error);
        // Adicionar feedback de erro para o usuário
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

    const originalTipoContribuinte = vigenciaOriginal.tipo_contribuinte;

    setIsLoading(true);
    try {
      const novasFaixasPromises = vigenciaOriginal.faixas.map(faixa => {
        const { id, created_by, created_date, updated_date, ...dadosFaixa } = faixa; // Remove campos de sistema
        return TabelaINSSEntity.create({
          ...dadosFaixa,
          vigencia_inicio: novaVigenciaInicio,
          vigencia_fim: novaVigenciaFim,
          tipo_contribuinte: originalTipoContribuinte, // Garante que o tipo é duplicado
        });
      });
      await Promise.all(novasFaixasPromises);
      loadTabelas();
    } catch (error) {
      console.error("Erro ao duplicar vigência:", error);
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
              tipo_contribuinte: vigenciaParaNovaFaixa.tipo_contribuinte, // Passa o tipo de contribuinte
              faixa: (groupedTabelas[`${vigenciaParaNovaFaixa.vigencia_inicio}_${vigenciaParaNovaFaixa.vigencia_fim || 'null'}_${vigenciaParaNovaFaixa.tipo_contribuinte}`]?.faixas.length || 0) + 1, // Sugere próximo número de faixa
              salario_de: 0, 
              salario_ate: 0, 
              aliquota: 0, 
              deducao_faixa: 0,
              teto_contribuicao: groupedTabelas[`${vigenciaParaNovaFaixa.vigencia_inicio}_${vigenciaParaNovaFaixa.vigencia_fim || 'null'}_${vigenciaParaNovaFaixa.tipo_contribuinte}`]?.faixas[0]?.teto_contribuicao || null // Preenche o teto se existir
            } 
          : undefined); // Undefined para que o form use seus próprios defaults se for nova vigência
          
    return (
      <TabelaINSSForm
        faixaINSS={initialDataForForm}
        onSave={handleSave}
        onCancel={handleCancel}
        isFixedVigencia={isAddingToExistingVigencia} // Passa a nova prop
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tabelas de Contribuição INSS</h1>
          <p className="text-slate-600 mt-1">Gerencie as faixas e alíquotas para cálculo do INSS (empregados e pró-labore).</p>
        </div>
        <Button
          onClick={handleAddNewVigencia}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Vigência/Faixa
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando tabelas...</p>
        </div>
      ) : Object.keys(groupedTabelas).length === 0 ? (
         <div className="text-center py-12 bg-white shadow-md rounded-lg">
            <Percent className="mx-auto h-16 w-16 text-slate-400 mb-6" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhuma Tabela INSS Cadastrada</h3>
            <p className="text-slate-500 mb-6">Comece adicionando as faixas de contribuição para diferentes períodos de vigência.</p>
            <Button onClick={handleAddNewVigencia}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Vigência/Faixa
            </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTabelas)
            .sort(([keyA], [keyB]) => {
              const [dataA, , tipoA] = keyA.split('_'); // keyA will be "vigencia_inicio_vigencia_fim_tipo_contribuinte"
              const [dataB, , tipoB] = keyB.split('_');
              const dataCompare = parseISO(dataB) - parseISO(dataA); // Ordena vigências pela mais recente
              return dataCompare !== 0 ? dataCompare : tipoA.localeCompare(tipoB); // Depois pelo tipo
            })
            .map(([vigenciaKey, { vigencia_inicio, vigencia_fim, tipo_contribuinte, faixas }]) => (
            <Card key={vigenciaKey} className="bg-white shadow-lg border-0">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-blue-700">
                      <CalendarRange className="h-6 w-6" />
                      Vigência: {formatVigenciaTitle(vigencia_inicio)}
                      <Badge className={tipo_contribuinte === "pro_labore" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                        {tipo_contribuinte === "pro_labore" ? "Pró-Labore (11%)" : "Empregado (CLT)"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      De {formatDate(vigencia_inicio)} até {formatDate(vigencia_fim)}
                      {faixas.length > 0 && faixas[0].teto_contribuicao && (
                        <span className="ml-2 font-medium text-orange-600">
                          • Teto: {formatCurrency(faixas[0].teto_contribuicao)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleDuplicateVigencia(vigenciaKey)}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicar Vigência
                    </Button>
                    <Button size="sm" onClick={() => handleAddNewFaixaToVigencia(vigencia_inicio, vigencia_fim, tipo_contribuinte)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Faixa
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Faixa</TableHead>
                      <TableHead>Salário De</TableHead>
                      <TableHead>Salário Até</TableHead>
                      <TableHead>Alíquota</TableHead>
                      <TableHead>Dedução Faixa</TableHead>
                      {faixas.some(f => f.teto_contribuicao) && <TableHead>Teto Contrib.</TableHead>}
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faixas.map((faixa) => (
                      <TableRow key={faixa.id}>
                        <TableCell className="font-medium">{faixa.faixa}</TableCell>
                        <TableCell>{formatCurrency(faixa.salario_de)}</TableCell>
                        <TableCell>{formatCurrency(faixa.salario_ate)}</TableCell>
                        <TableCell>
                          <span className={faixa.tipo_contribuinte === "pro_labore" ? "text-green-600 font-medium" : ""}>
                            {formatPercentage(faixa.aliquota)}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(faixa.deducao_faixa)}</TableCell>
                        {faixas.some(f => f.teto_contribuicao) && (
                          <TableCell>
                            {faixa.teto_contribuicao ? formatCurrency(faixa.teto_contribuicao) : "-"}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(faixa)} className="hover:text-blue-600">
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
                    <p className="text-center text-slate-500 py-4">Nenhuma faixa cadastrada para esta vigência.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
