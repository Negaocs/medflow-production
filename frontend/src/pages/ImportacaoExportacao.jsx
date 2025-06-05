
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Download, ListChecks, History, AlertTriangle, Loader2, FileText, CheckCircle2, FileSpreadsheet, Info, ArrowRight, Columns } from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { HistoricoOperacao } from "@/api/entities";
import { User } from "@/api/entities"; 

// Importar todas as entidades dinamicamente
import * as allEntities from "@/api/entities";

// Configuração de chaves únicas para verificação de duplicidade
const entityUniqueKeys = {
  Medico: ["cpf"], 
  Empresa: ["cnpj"], 
  Hospital: ["cnpj"], 
  TipoPlantao: ["nome"], 
  Contrato: ["empresa_id", "hospital_id", "numero_contrato"], 
  ContratoTipoPlantao: ["contrato_id", "tipo_plantao_id"], 
  Plantao: ["medico_id", "contrato_id", "tipo_plantao_id", "data_plantao"], 
  ProcedimentoParticular: ["medico_id", "empresa_id", "data_procedimento", "nome_paciente"], 
  ProducaoAdministrativa: ["medico_id", "empresa_id", "data_atividade", "tipo_producao"], 
  ProLabore: ["medico_id", "empresa_pagamento_id", "competencia"], // Chaves únicas para ProLabore
  DescontoCredito: ["medico_id", "empresa_id", "competencia", "tipo", "descricao"], 
  TabelaINSS: ["vigencia_inicio", "faixa"], 
  TabelaIRRF: ["vigencia_inicio", "faixa"], 
  ParametrosFiscaisEmpresa: ["empresa_id", "vigencia_inicio"], 
  VinculoFiscalMedico: ["medico_id", "cnpj_responsavel", "competencia_inicio"], 
};

// entityConfig
const entityConfig = {
  Medico: {
    label: "Médicos",
    entity: allEntities.Medico,
    importFields: ["nome", "cpf", "crm", "estado_crm", "telefone", "email", "data_nascimento", "endereco", "banco", "agencia", "conta", "pix", "dependentes_irrf", "ativo"], // Removido "e_cirurgiao"
    dateFields: ["data_nascimento"],
    booleanFields: ["ativo"], // Removido "e_cirurgiao"
    numberFields: ["dependentes_irrf"],
    integerFields: [],
    fieldDescriptions: {
        data_nascimento: "Formato: AAAA-MM-DD ou DD/MM/AAAA",
        ativo: "true/false ou sim/não",
        dependentes_irrf: "Número inteiro"
    }
  },
  Empresa: {
    label: "Empresas",
    entity: allEntities.Empresa,
    importFields: ["razao_social", "nome_fantasia", "cnpj", "inscricao_estadual", "regime_tributario", "endereco", "telefone", "email", "responsavel", "ativo"],
    dateFields: [],
    booleanFields: ["ativo"],
    numberFields: [],
    integerFields: [],
    fieldDescriptions: {
        regime_tributario: "Valores: simples_nacional, lucro_presumido, lucro_real",
        ativo: "true/false ou sim/não"
    }
  },
  Hospital: {
    label: "Hospitais",
    entity: allEntities.Hospital,
    importFields: ["nome", "cnpj", "empresa_id", "endereco", "telefone", "email", "contato_responsavel", "observacoes", "ativo"],
    dateFields: [],
    booleanFields: ["ativo"],
    numberFields: [],
    integerFields: [],
    fieldDescriptions: {
        empresa_id: "ID da Empresa vinculada (obter da tela de Empresas)",
        ativo: "true/false ou sim/não"
    }
  },
  TipoPlantao: {
    label: "Tipos de Plantão",
    entity: allEntities.TipoPlantao,
    importFields: ["nome", "descricao", "carga_horaria", "observacoes", "ativo"],
    dateFields: [],
    booleanFields: ["ativo"],
    numberFields: ["carga_horaria"],
    integerFields: [],
    fieldDescriptions: {
        carga_horaria: "Número (ex: 12, 24)",
        ativo: "true/false ou sim/não"
    }
  },
  Contrato: {
    label: "Contratos",
    entity: allEntities.Contrato,
    importFields: ["empresa_id", "hospital_id", "numero_contrato", "data_inicio", "data_fim", "observacoes", "ativo"],
    dateFields: ["data_inicio", "data_fim"],
    booleanFields: ["ativo"],
    numberFields: [],
    integerFields: [],
    fieldDescriptions: {
        empresa_id: "ID da Empresa (obter da tela de Empresas)",
        hospital_id: "ID do Hospital (obter da tela de Hospitais)",
        data_inicio: "Formato: AAAA-MM-DD ou DD/MM/AAAA",
        data_fim: "Formato: AAAA-MM-DD ou DD/MM/AAAA (opcional)",
        ativo: "true/false ou sim/não"
    }
  },
  ContratoTipoPlantao: {
    label: "Valores de Plantão (Contrato)",
    entity: allEntities.ContratoTipoPlantao,
    importFields: ["contrato_id", "tipo_plantao_id", "valor", "ativo"],
    dateFields: [],
    booleanFields: ["ativo"],
    numberFields: ["valor"],
    integerFields: [],
    fieldDescriptions: {
        contrato_id: "ID do Contrato (obter da tela de Contratos)",
        tipo_plantao_id: "ID do Tipo de Plantão (obter da tela de Tipos de Plantão)",
        valor: "Número (ex: 1200.50)",
        ativo: "true/false ou sim/não"
    }
  },
  Plantao: {
    label: "Plantões",
    entity: allEntities.Plantao,
    importFields: ["medico_id", "contrato_id", "tipo_plantao_id", "data_plantao", "competencia", "quantidade", "valor_unitario", "observacoes", "confirmado", "empresa_pagamento_id"],
    dateFields: ["data_plantao"],
    booleanFields: ["confirmado"],
    numberFields: ["quantidade", "valor_unitario"],
    integerFields: [],
    fieldDescriptions: {
        medico_id: "ID do Médico (obter da tela de Médicos)",
        contrato_id: "ID do Contrato (obter da tela de Contratos)",
        tipo_plantao_id: "ID do Tipo de Plantão (obter da tela de Tipos de Plantão)",
        data_plantao: "Formato: AAAA-MM-DD ou DD/MM/AAAA",
        competencia: "Formato: YYYY-MM (ex: 2024-01)",
        confirmado: "true/false ou sim/não",
        empresa_pagamento_id: "ID da Empresa pagadora (obter da tela de Empresas - opcional)"
    }
  },
   ProcedimentoParticular: {
    label: "Procedimentos Particulares",
    entity: allEntities.ProcedimentoParticular,
    importFields: [
      "medico_id", "empresa_id", "hospital_id", "empresa_pagamento_id", "data_procedimento", 
      "competencia", "nota_fiscal", "nome_paciente", "descricao_procedimentos", 
      "cirurgiao_responsavel_nome", "equipe_envolvida_nomes", "local_realizacao_nome", // ALTERADO: cirurgiao_responsavel_id para cirurgiao_responsavel_nome
      "valor_bruto", "valor_mat_med", "valor_impostos_empresa", "valor_taxa_administrativa_empresa", "valor_liquido_repasse", "observacoes", "confirmado" // ADICIONADOS: novos campos de impostos e taxa
    ],
    dateFields: ["data_procedimento"],
    booleanFields: ["confirmado"],
    numberFields: ["valor_bruto", "valor_mat_med", "valor_impostos_empresa", "valor_taxa_administrativa_empresa", "valor_liquido_repasse"], // ADICIONADOS: novos campos numéricos
    integerFields: [],
    fieldDescriptions: {
      medico_id: "ID do Médico (obter da tela de Médicos)",
      empresa_id: "ID da Empresa prestadora (obter da tela de Empresas)",
      hospital_id: "ID do Hospital (obter da tela de Hospitais - ou deixe em branco se usar local_realizacao_nome)",
      empresa_pagamento_id: "ID da Empresa pagadora (obter da tela de Empresas - opcional)",
      data_procedimento: "Formato: AAAA-MM-DD ou DD/MM/AAAA",
      competencia: "Formato: YYYY-MM (ex: 2024-01)",
      cirurgiao_responsavel_nome: "Nome do médico cirurgião responsável (texto livre)", // ALTERADO: descrição atualizada
      valor_impostos_empresa: "Valor dos impostos da empresa (calculado automaticamente se vazio)",
      valor_taxa_administrativa_empresa: "Valor da taxa administrativa (calculado automaticamente se vazio)",
      valor_liquido_repasse: "Valor líquido para repasse (calculado automaticamente se vazio)",
      confirmado: "true/false ou sim/não"
    }
  },
  ProducaoAdministrativa: {
    label: "Produção Administrativa / Pró-Labore",
    entity: allEntities.ProducaoAdministrativa,
    importFields: [
        "medico_id", "empresa_id", "empresa_pagamento_id", "data_atividade", "competencia",
        "descricao_atividade", "horas_dedicadas", "tipo_producao", "tributavel", "recorrente",
        "valor_hora", "valor_total", "confirmado", "observacoes"
    ],
    dateFields: ["data_atividade"],
    booleanFields: ["tributavel", "recorrente", "confirmado"],
    numberFields: ["horas_dedicadas", "valor_hora", "valor_total"],
    integerFields: [],
    fieldDescriptions: {
        medico_id: "ID do Médico (obter da tela de Médicos)",
        empresa_id: "ID da Empresa beneficiária (obter da tela de Empresas)",
        empresa_pagamento_id: "ID da Empresa pagadora (obter da tela de Empresas - opcional)",
        data_atividade: "Formato: AAAA-MM-DD ou DD/MM/AAAA",
        competencia: "Formato: YYYY-MM",
        tipo_producao: "Valores: cedula_presenca, administrativa", // ATUALIZADO: removido pro_labore pois agora é entidade separada
        tributavel: "true/false ou sim/não",
        recorrente: "true/false ou sim/não",
        confirmado: "true/false ou sim/não"
    }
  },
  ProLabore: { // NOVA ENTIDADE
    label: "Pró-Labore",
    entity: allEntities.ProLabore,
    importFields: [
        "medico_id", "empresa_pagamento_id", "empresa_beneficiaria_id", "data_referencia", 
        "competencia", "descricao", "valor_bruto", "tributavel", "recorrente", "confirmado", "observacoes"
    ],
    dateFields: ["data_referencia"],
    booleanFields: ["tributavel", "recorrente", "confirmado"],
    numberFields: ["valor_bruto"],
    integerFields: [],
    fieldDescriptions: {
        medico_id: "ID do Médico (obter da tela de Médicos)",
        empresa_pagamento_id: "ID da Empresa pagadora (obter da tela de Empresas)",
        empresa_beneficiaria_id: "ID da Empresa beneficiária (obter da tela de Empresas - opcional)",
        data_referencia: "Formato: AAAA-MM-DD ou DD/MM/AAAA",
        competencia: "Formato: YYYY-MM",
        tributavel: "true/false ou sim/não",
        recorrente: "true/false ou sim/não",
        confirmado: "true/false ou sim/não"
    }
  },
  DescontoCredito: {
    label: "Descontos e Créditos",
    entity: allEntities.DescontoCredito,
    importFields: [
        "medico_id", "empresa_id", "hospital_id", "tipo", "descricao", "valor", 
        "competencia", "tributavel", "recorrente", "observacoes"
    ],
    dateFields: [],
    booleanFields: ["tributavel", "recorrente"],
    numberFields: ["valor"],
    integerFields: [],
    fieldDescriptions: {
        medico_id: "ID do Médico (obter da tela de Médicos)",
        empresa_id: "ID da Empresa (obter da tela de Empresas)",
        hospital_id: "ID do Hospital (obter da tela de Hospitais - opcional)",
        tipo: "Valores: desconto, credito",
        competencia: "Formato: YYYY-MM",
        tributavel: "true/false ou sim/não",
        recorrente: "true/false ou sim/não"
    }
  },
  TabelaINSS: {
    label: "Tabelas INSS",
    entity: allEntities.TabelaINSS,
    importFields: ["vigencia_inicio", "vigencia_fim", "tipo_contribuinte", "faixa", "salario_de", "salario_ate", "aliquota", "deducao_faixa", "teto_contribuicao"], // ADICIONADOS: tipo_contribuinte, teto_contribuicao
    dateFields: ["vigencia_inicio", "vigencia_fim"],
    booleanFields: [],
    numberFields: ["salario_de", "salario_ate", "aliquota", "deducao_faixa", "teto_contribuicao"], // ADICIONADO: teto_contribuicao
    integerFields: ["faixa"],
    fieldDescriptions: {
        vigencia_inicio: "Formato: AAAA-MM-DD",
        vigencia_fim: "Formato: AAAA-MM-DD (opcional)",
        tipo_contribuinte: "Valores: empregado, pro_labore", // NOVO
        faixa: "Número inteiro",
        aliquota: "Decimal (ex: 0.075 para 7.5%)",
        teto_contribuicao: "Valor máximo de contribuição INSS (opcional)" // NOVO
    }
  },
  TabelaIRRF: {
    label: "Tabelas IRRF",
    entity: allEntities.TabelaIRRF,
    importFields: ["vigencia_inicio", "vigencia_fim", "faixa", "base_calculo_de", "base_calculo_ate", "aliquota", "parcela_deduzir", "valor_deducao_dependente"],
    dateFields: ["vigencia_inicio", "vigencia_fim"],
    booleanFields: [],
    numberFields: ["base_calculo_de", "base_calculo_ate", "aliquota", "parcela_deduzir", "valor_deducao_dependente"],
    integerFields: ["faixa"],
    fieldDescriptions: {
        vigencia_inicio: "Formato: AAAA-MM-DD",
        vigencia_fim: "Formato: AAAA-MM-DD (opcional)",
        faixa: "Número inteiro",
        aliquota: "Decimal (ex: 0.075 para 7.5%)",
        valor_deducao_dependente: "Decimal (ex: 189.59)"
    }
  },
  ParametrosFiscaisEmpresa: {
    label: "Parâmetros Fiscais (Empresa)",
    entity: allEntities.ParametrosFiscaisEmpresa,
    importFields: [
        "empresa_id", "regime_tributario", "vigencia_inicio", "vigencia_fim", 
        "aliquota_inss", "aliquota_irrf", "aliquota_iss", "aliquota_irpj", 
        "aliquota_csll", "aliquota_pis", "aliquota_cofins", 
        "aliquota_administrativa", "observacoes"
    ],
    dateFields: ["vigencia_inicio", "vigencia_fim"],
    booleanFields: [],
    numberFields: [
        "aliquota_inss", "aliquota_irrf", "aliquota_iss", "aliquota_irpj", 
        "aliquota_csll", "aliquota_pis", "aliquota_cofins", "aliquota_administrativa"
    ],
    integerFields: [],
    fieldDescriptions: {
        empresa_id: "ID da Empresa (obter da tela de Empresas)",
        regime_tributario: "Valores: lucro_presumido, simples_nacional",
        vigencia_inicio: "Formato: AAAA-MM-DD",
        vigencia_fim: "Formato: AAAA-MM-DD (opcional)",
        aliquota_inss: "Percentual (ex: 20.00 para 20%)",
        aliquota_irrf: "Percentual (ex: 15.00 para 15%)",
        aliquota_iss: "Percentual (ex: 5.00 para 5%)",
        aliquota_irpj: "Percentual (ex: 1.20 para 1.2%)",
        aliquota_csll: "Percentual (ex: 1.08 para 1.08%)",
        aliquota_pis: "Percentual (ex: 0.65 para 0.65%)",
        aliquota_cofins: "Percentual (ex: 3.00 para 3%)",
        aliquota_administrativa: "Percentual (ex: 0.05 para 0.05%)"
    }
  },
  VinculoFiscalMedico: {
    label: "Vínculos Fiscais de Médicos",
    entity: allEntities.VinculoFiscalMedico,
    importFields: [
        "medico_id", "competencia_inicio", "competencia_fim", "cnpj_responsavel", 
        "nome_instituicao", "base_inss", "valor_inss_retido", "base_irrf", 
        "valor_irrf_retido", "tipo_vinculo", "observacoes", "ativo"
    ],
    dateFields: ["competencia_inicio", "competencia_fim"],
    booleanFields: ["ativo"],
    numberFields: ["base_inss", "valor_inss_retido", "base_irrf", "valor_irrf_retido"],
    integerFields: [],
    fieldDescriptions: {
        medico_id: "ID do Médico (obter da tela de Médicos)",
        competencia_inicio: "Formato: AAAA-MM-DD ou YYYY-MM",
        competencia_fim: "Formato: AAAA-MM-DD ou YYYY-MM (opcional)",
        cnpj_responsavel: "CNPJ no formato 00.000.000/0000-00",
        tipo_vinculo: "Valores: clt, pj, cooperativa, plantao_publico, outro",
        ativo: "true/false ou sim/não"
    }
  }
};

export default function ImportacaoExportacaoPage() {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityExport, setSelectedEntityExport] = useState(null);
  const [historicoFiltroEntidade, setHistoricoFiltroEntidade] = useState(null);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [shouldUpdateDuplicates, setShouldUpdateDuplicates] = useState(true);
  const [csvData, setCsvData] = useState(null); // Para visualização prévia
  const [csvRawData, setCsvRawData] = useState(null); // Dados brutos do CSV
  const [columnMapping, setColumnMapping] = useState({}); // Mapeamento de colunas
  const [showMappingInterface, setShowMappingInterface] = useState(false); // Controle da interface de mapeamento
  const [mappingComplete, setMappingComplete] = useState(false); // Status do mapeamento
  const [processedData, setProcessedData] = useState(null); // Dados processados após mapeamento
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await User.me(); 
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao buscar usuário atual:", error);
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          setCurrentUser({ 
            id: "mock-user-id", 
            full_name: "Usuário Teste Mock", 
            email: "teste@exemplo.com"
          });
        } else {
           console.error("Usuário não autenticado.");
        }
      }
    };
    fetchCurrentUser();
    loadHistorico();
  }, []);

  const loadHistorico = async () => {
    try {
      // Buscar histórico diretamente da API
      const data = await HistoricoOperacao.list("-data_operacao", 20);
      console.log("Histórico carregado:", data);
      setHistorico(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      // Tentar novamente com um limite menor
      try {
        const data = await HistoricoOperacao.list("-data_operacao", 5);
        setHistorico(data || []);
      } catch (retryError) {
        console.error("Erro ao carregar histórico (retry):", retryError);
        setHistorico([]);
      }
    }
  };

  const logOperacao = async (opData) => {
    if (!currentUser?.id) {
        console.warn("ID do usuário não disponível, não foi possível registrar a operação no histórico.");
        setImportStatus(prev => ({...prev, message: (prev?.message || "") + " Atenção: Falha ao registrar no histórico (usuário não identificado)."}));
        return;
    }
    try {
      console.log("Registrando operação no histórico:", opData);
      
      // Criar objeto de histórico
      const historicoData = {
        tipo_operacao: opData.tipo_operacao,
        entidade_alvo: opData.entidade_alvo,
        formato_arquivo: opData.formato_arquivo || "csv", 
        data_operacao: opData.data_operacao || new Date().toISOString(),
        status: opData.status,
        usuario_sistema_id: opData.usuario_sistema_id || currentUser.id,
        nome_usuario: opData.nome_usuario || currentUser.full_name || currentUser.email || "Usuário Desconhecido",
        detalhes_erro: opData.detalhes_erro,
        registros_processados: opData.registros_processados || 0,
        registros_falha: opData.registros_falha || 0,
        arquivo_nome_original: opData.arquivo_nome_original,
        arquivo_gerado_url: opData.arquivo_gerado_url
      };
      
      // Registrar no histórico
      const result = await HistoricoOperacao.create(historicoData);
      console.log("Operação registrada no histórico:", result);
      
      // Recarregar histórico
      await loadHistorico(); 
    } catch (error) {
      console.error("Erro ao registrar operação no histórico:", error);
      let errorMessage = "Atenção: Falha ao registrar no histórico.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage += ` Detalhe: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += ` Detalhe: ${error.message}`;
      }
      setImportStatus(prev => ({...prev, message: (prev?.message || "") + ` ${errorMessage}`}));
    }
  };

  // Função para ler o arquivo CSV diretamente no navegador
  const readCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          let content = event.target.result;
          
          // Remover BOM UTF-8 se presente
          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.substring(1);
          }
          
          // Dividir em linhas
          const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim());
          if (lines.length === 0) {
            reject(new Error("Arquivo CSV vazio"));
            return;
          }
          
          // Obter cabeçalhos (primeira linha)
          const headers = lines[0].split(',').map(header => header.trim());
          
          // Processar linhas de dados
          const data = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Pular linhas vazias
            
            const values = lines[i].split(',');
            const row = {};
            
            // Mapear valores para cabeçalhos
            for (let j = 0; j < headers.length; j++) {
              row[headers[j]] = values[j] ? values[j].trim() : '';
            }
            
            data.push(row);
          }
          
          // Guardar dados brutos para mapeamento manual
          const rawData = {
            headers: headers,
            rows: lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
          };
          
          resolve({ headers, data, rawData });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setImportStatus(null);
    setCsvData(null);
    setCsvRawData(null);
    setColumnMapping({});
    setShowMappingInterface(false);
    setMappingComplete(false);
    setProcessedData(null);
    
    if (selectedFile) {
      try {
        // Ler o arquivo para visualização prévia e dados brutos
        const { headers, data, rawData } = await readCSVFile(selectedFile);
        setCsvData({ headers, data });
        setCsvRawData(rawData);
        console.log("Visualização prévia do CSV:", { headers, data });
        console.log("Dados brutos do CSV:", rawData);
      } catch (error) {
        console.error("Erro ao ler arquivo CSV para visualização prévia:", error);
        setImportStatus({ 
          type: 'warning', 
          message: `Aviso: Não foi possível ler o arquivo para visualização prévia. Isso pode indicar problemas de formato. Detalhes: ${error.message}` 
        });
      }
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedEntity || !entityConfig[selectedEntity]) {
      setImportStatus({ type: 'error', message: 'Selecione uma entidade para baixar o modelo.' });
      return;
    }
    
    try {
      const currentConfig = entityConfig[selectedEntity];
      const headers = currentConfig.importFields.join(",");
      const csvContent = headers; 

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `modelo_${selectedEntity}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      setImportStatus({ 
        type: 'success', 
        message: `Modelo CSV para ${currentConfig.label} baixado. Certifique-se de que seu arquivo CSV final use VÍRGULA como delimitador e codificação UTF-8.` 
      });
    } catch (error) {
      console.error("Erro ao baixar modelo:", error);
      setImportStatus({ 
        type: 'error', 
        message: 'Erro ao gerar o arquivo modelo CSV. Tente novamente.' 
      });
    }
  };

  // Função para iniciar o mapeamento manual de colunas
  const handleStartMapping = () => {
    if (!selectedEntity || !csvRawData) {
      setImportStatus({ 
        type: 'error', 
        message: 'Selecione uma entidade e carregue um arquivo CSV para iniciar o mapeamento.' 
      });
      return;
    }
    
    // Inicializar mapeamento vazio
    const initialMapping = {};
    entityConfig[selectedEntity].importFields.forEach(field => {
      initialMapping[field] = null;
    });
    
    setColumnMapping(initialMapping);
    setShowMappingInterface(true);
    setMappingComplete(false);
    setProcessedData(null);
  };

  // Função para atualizar o mapeamento de uma coluna
  const handleColumnMappingChange = (field, columnIndex) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: columnIndex
    }));
  };

  // Função para processar os dados após o mapeamento
  const handleProcessMappedData = () => {
    if (!selectedEntity || !csvRawData) {
      setImportStatus({ 
        type: 'error', 
        message: 'Dados do CSV não disponíveis para processamento.' 
      });
      return;
    }
    
    // Verificar se todos os campos obrigatórios foram mapeados
    const missingFields = [];
    entityConfig[selectedEntity].importFields.forEach(field => {
      // Assuming a field is "mandatory" if it's in importFields and not explicitly marked as optional
      // For now, checking if it's mapped to 'null' (the sentinel value for unmapped)
      if (columnMapping[field] === null || columnMapping[field] === undefined) {
        // Here you might add logic to check if a field is actually required, 
        // for now all importFields are treated as needing a mapping or being intentionally left blank by user.
        // For simplicity, we just process all mapped fields.
        // The previous error message for missing fields was probably too strict given the "Não mapear" option.
        // Let's remove the "missingFields" check that generates a warning based on all importFields.
        // Instead, the processing below will handle unmapped fields by setting them to an empty string.
      }
    });
    
    try {
      // Processar dados com base no mapeamento
      const processedRows = [];
      
      csvRawData.rows.forEach((row, rowIndex) => {
        if (row.length === 0 || !row.some(cell => cell.trim())) {
          return; // Pular linhas vazias
        }
        
        const processedRow = {};
        
        // Mapear cada campo com base no índice da coluna
        entityConfig[selectedEntity].importFields.forEach(field => {
          const columnIndex = columnMapping[field];
          if (columnIndex !== null && columnIndex !== undefined) {
            processedRow[field] = row[columnIndex] || '';
          } else {
            processedRow[field] = ''; // Set to empty string if not mapped, or null if preferred
          }
        });
        
        processedRows.push(processedRow);
      });
      
      console.log("Dados processados após mapeamento:", processedRows);
      setProcessedData(processedRows);
      setMappingComplete(true);
      setImportStatus({ 
        type: 'success', 
        message: `Mapeamento concluído com sucesso. ${processedRows.length} registros prontos para importação.` 
      });
    } catch (error) {
      console.error("Erro ao processar dados mapeados:", error);
      setImportStatus({ 
        type: 'error', 
        message: `Erro ao processar dados mapeados: ${error.message}` 
      });
    }
  };

  const checkForDuplicatesAndPrepareRecords = async (EntityModel, recordsToProcess, entityName) => {
    const uniqueKeys = entityUniqueKeys[entityName];
    if (!uniqueKeys || uniqueKeys.length === 0) {
      return { toCreate: recordsToProcess, toUpdate: [], duplicatesFound: 0 };
    }

    const toCreate = [];
    const toUpdate = [];
    let duplicatesFound = 0;
    let existingRecords = [];
    try {
        existingRecords = await EntityModel.list();
        console.log(`Registros existentes para ${entityName}:`, existingRecords);
    } catch (listError) {
        console.error(`Erro ao listar registros existentes para ${entityName}:`, listError);
        throw new Error(`Não foi possível buscar registros existentes para ${entityName} para verificação de duplicidade. ${listError.message}`);
    }
    
    for (const newRecord of recordsToProcess) {
      let isDuplicate = false;
      let existingRecordId = null;

      for (const existing of existingRecords) {
        const isMatch = uniqueKeys.every(key => {
          const newValueRaw = newRecord[key];
          const existingValueRaw = existing[key];

          if (newValueRaw === null || typeof newValueRaw === 'undefined' || String(newValueRaw).trim() === '') {
            return existingValueRaw === null || typeof existingValueRaw === 'undefined' || String(existingValueRaw).trim() === '';
          }
          if (existingValueRaw === null || typeof existingValueRaw === 'undefined' || String(existingValueRaw).trim() === '') {
            return false; 
          }
          
          const newValue = typeof newValueRaw === 'string' ? 
            String(newValueRaw).toLowerCase().trim() : newValueRaw;
          const existingValue = typeof existingValueRaw === 'string' ? 
            String(existingValueRaw).toLowerCase().trim() : existingValueRaw;
            
          return newValue === existingValue;
        });

        if (isMatch) {
          isDuplicate = true;
          existingRecordId = existing.id; 
          break;
        }
      }

      if (isDuplicate) {
        duplicatesFound++;
        if (shouldUpdateDuplicates && existingRecordId) {
          toUpdate.push({
            id: existingRecordId, 
            ...newRecord
          });
        }
      } else {
        toCreate.push(newRecord);
      }
    }
    return { toCreate, toUpdate, duplicatesFound };
  };

  // Função para processar os dados antes da importação
  const processRecordsForImport = (records, entityConfig) => {
    const processedRecords = [];
    const errorDetails = [];
    let errorCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      const rawRecord = records[i];
      const processedRecord = {};
      
      try {
        for (const field of entityConfig.importFields) {
          let value = rawRecord[field];
          
          if (value !== undefined && value !== null) {
            value = String(value).trim();
            if (value.toLowerCase() === "null" || value === "") { // Treat explicit "null" string or empty string as actual null
              value = null;
            }
          } else {
            value = null;
          }
          
          // Tratamento de datas
          if (entityConfig.dateFields?.includes(field) && value !== null) {
            let dateStr = value;
            let dateObj = null;
            if (dateStr.includes('/')) { 
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10); 
                const month = parseInt(parts[1], 10) - 1; 
                const year = parseInt(parts[2], 10);
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                  dateObj = new Date(Date.UTC(year, month, day));
                }
              }
            } else if (dateStr.includes('-')) { 
              if (dateStr.length === 7 && dateStr.match(/^\d{4}-\d{2}$/)) { 
                const year = parseInt(dateStr.substring(0,4)); 
                const month = parseInt(dateStr.substring(5,7)) -1;
                dateObj = new Date(Date.UTC(year, month, 1));
              } else { 
                const parts = dateStr.split('T')[0].split('-'); 
                if(parts.length === 3) {
                  const year = parseInt(parts[0], 10); 
                  const month = parseInt(parts[1], 10) - 1; 
                  const day = parseInt(parts[2], 10);
                  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    dateObj = new Date(Date.UTC(year, month, day));
                  }
                }
              }
            }
            if (dateObj && !isNaN(dateObj.getTime())) {
              processedRecord[field] = (dateStr.length === 7 && dateStr.match(/^\d{4}-\d{2}$/)) 
                ? dateObj.toISOString().slice(0, 7) 
                : dateObj.toISOString().split('T')[0]; 
            } else { 
              processedRecord[field] = null; 
            }
          }
          // Tratamento de booleanos
          else if (entityConfig.booleanFields?.includes(field) && value !== null) {
            processedRecord[field] = ['true', 'sim', '1', 'verdadeiro', 's', 'v'].includes(String(value).toLowerCase());
          }
          // Tratamento de números
          else if (entityConfig.numberFields?.includes(field) && value !== null) {
            const numStr = String(value).replace(',', '.');
            const parsedNum = parseFloat(numStr);
            if (isNaN(parsedNum)) {
              throw new Error(`Valor numérico inválido "${value}" para ${field}.`);
            }
            processedRecord[field] = parsedNum;
          }
          // Tratamento de inteiros
          else if (entityConfig.integerFields?.includes(field) && value !== null) {
            const parsedInt = parseInt(String(value), 10);
            if (isNaN(parsedInt)) {
              throw new Error(`Valor inteiro inválido "${value}" para ${field}.`);
            }
            processedRecord[field] = parsedInt;
          }
          // Outros campos
          else {
            processedRecord[field] = value;
          }
        }
        
        processedRecords.push(processedRecord);
      } catch (err) {
        errorCount++;
        const errorMsg = `Linha ${i + 1}: ${err.message}`;
        errorDetails.push(errorMsg);
        console.error(`Erro processando registro ${i + 1}:`, errorMsg);
      }
    }
    
    return { processedRecords, errorDetails, errorCount };
  };

  const handleImport = async () => {
    // Verificar se temos uma entidade selecionada e dados para importar
    if (!selectedEntity || !entityConfig[selectedEntity]) {
      setImportStatus({ type: 'error', message: 'Selecione uma entidade para importar.' });
      return;
    }
    
    // Verificar se temos dados processados do mapeamento ou um arquivo CSV
    if (!processedData && !file) {
      setImportStatus({ type: 'error', message: 'Selecione um arquivo CSV ou complete o mapeamento de colunas.' });
      return;
    }
    
    if (!currentUser) {
      setImportStatus({ type: 'error', message: 'Usuário não identificado. Não é possível importar.' });
      return;
    }

    setIsLoading(true);
    setImportStatus(null);
    
    try {
      const currentEntityConfig = entityConfig[selectedEntity];
      console.log("[ImportDebug] ===== INÍCIO DA IMPORTAÇÃO =====");
      console.log("[ImportDebug] Entidade selecionada:", selectedEntity);
      
      let recordsToProcess = [];
      
      // Se temos dados processados do mapeamento, usamos eles
      if (processedData) {
        console.log("[ImportDebug] Usando dados processados do mapeamento manual");
        recordsToProcess = processedData;
      }
      // Caso contrário, processamos o arquivo CSV
      else {
        console.log("[ImportDebug] Processando arquivo CSV");
        
        // Fazer upload do arquivo
        const uploadResponse = await UploadFile({ file });
        const fileUrl = uploadResponse.file_url;
        
        console.log("[ImportDebug] Arquivo:", file.name);
        console.log("[ImportDebug] URL do arquivo:", fileUrl);
        
        // Schema para extração CSV
        const schemaForExtraction = {
          type: "array",
          items: {
            type: "object",
            additionalProperties: true 
          }
        };
        
        // Tentar extrair dados usando a API
        const extractionResult = await ExtractDataFromUploadedFile({
          file_url: fileUrl,
          json_schema: schemaForExtraction,
        });
        
        console.log("[ImportDebug] Status da extração:", extractionResult.status);
        
        let extractedData = null;
        
        // Verificar se a extração foi bem-sucedida
        if (extractionResult.status === "success" && Array.isArray(extractionResult.output) && extractionResult.output.length > 0) {
          extractedData = extractionResult.output;
        } else {
          console.warn("[ImportDebug] Extração via API falhou ou retornou formato inesperado. Tentando processar manualmente...");
          
          // Tentar processar o CSV manualmente como fallback
          try {
            // Usar os dados já lidos na visualização prévia
            if (csvData && csvData.data) {
              extractedData = csvData.data;
            } else {
              // Read the file content and pass it to readCSVFile
              const fileReader = new FileReader();
              const fileContent = await new Promise((resolve, reject) => {
                fileReader.onload = (e) => resolve(e.target.result);
                fileReader.onerror = (e) => reject(e);
                fileReader.readAsText(file, 'UTF-8');
              });
              
              // Create a dummy file object to reuse readCSVFile
              const tempFile = new File([fileContent], file.name, { type: file.type });
              const { data } = await readCSVFile(tempFile);
              extractedData = data;
            }
            
            console.log("[ImportDebug] Processamento manual do CSV bem-sucedido:", extractedData.slice(0, 3));
          } catch (manualError) {
            console.error("[ImportDebug] Falha no processamento manual do CSV:", manualError);
            throw new Error(`Falha na extração de dados do CSV. Tentativas automática e manual falharam. Verifique o formato do arquivo. Detalhes: ${manualError.message}`);
          }
        }
        
        if (!extractedData || extractedData.length === 0) {
          throw new Error("Não foi possível extrair dados do arquivo CSV ou o arquivo está vazio.");
        }
        
        console.log("[ImportDebug] Dados extraídos:", extractedData.slice(0, 3));
        
        // Verificar campos do CSV
        const firstRecord = extractedData[0] || {};
        const rawKeys = Object.keys(firstRecord);
        
        // Normalizar chaves para comparação
        const normalizedFoundFields = rawKeys.map(key => String(key).trim().toLowerCase());
        const normalizedExpectedFields = currentEntityConfig.importFields.map(field => String(field).trim().toLowerCase());
        
        // Verificar campos faltantes - now this is a warning, not an error that stops import
        const missingFields = normalizedExpectedFields.filter(
          expectedField => !normalizedFoundFields.includes(expectedField)
        );
        
        if (missingFields.length > 0) {
          setImportStatus({ 
            type: 'warning', 
            message: `Atenção: Alguns campos esperados (${missingFields.join(', ')}) não foram encontrados no cabeçalho do CSV. Isso pode causar dados incompletos. Considere usar o mapeamento manual.` 
          });
        }
        
        // recordsToProcess is already extractedData at this point
        recordsToProcess = extractedData;
      }
      
      // Process records for import
      const { processedRecords, errorDetails, errorCount } = processRecordsForImport(
        recordsToProcess, 
        currentEntityConfig
      );
      
      console.log("[ImportDebug] Registros processados:", processedRecords.length);
      console.log("[ImportDebug] Erros de processamento (formato/tipo):", errorCount);
      
      if (processedRecords.length === 0) {
        throw new Error("Nenhum registro válido para importar após processamento.");
      }
      
      let successCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let finalErrorCount = errorCount;
      let finalErrorDetails = [...errorDetails]; // Clone initial errors

      const UPDATE_DELAY_MS = 250; // Delay in milliseconds between update calls

      if (processedRecords.length > 0) {
          try {
            const { toCreate, toUpdate, duplicatesFound } = await checkForDuplicatesAndPrepareRecords(
              currentEntityConfig.entity,
              processedRecords,
              selectedEntity
            );

            console.log("[ImportDebug] Registros para criar (após duplicatas):", toCreate.length);
            console.log("[ImportDebug] Registros para atualizar (após duplicatas):", toUpdate.length);
            console.log("[ImportDebug] Duplicatas encontradas:", duplicatesFound);

            if (toCreate.length > 0) {
              console.log("[ImportDebug] Iniciando bulkCreate para", toCreate.length, "registros.");
              try {
                  await currentEntityConfig.entity.bulkCreate(toCreate); 
                  successCount = toCreate.length;
                  console.log("[ImportDebug] BulkCreate concluído com sucesso.");
              } catch (bulkCreateErr) {
                  console.error("[ImportDebug] Erro no bulkCreate:", bulkCreateErr);
                  // Mark all records that were supposed to be created as failed if bulk operation fails
                  finalErrorCount += toCreate.length; 
                  let detailMsg = bulkCreateErr.message;
                  if (bulkCreateErr.response?.data?.detail) {
                      detailMsg = JSON.stringify(bulkCreateErr.response.data.detail);
                  } else if (bulkCreateErr.response?.data?.error_description) {
                      detailMsg = bulkCreateErr.response.data.error_description;
                  }
                  finalErrorDetails.push(`Erro ao criar ${toCreate.length} registros via backend: ${detailMsg}`);
              }
            }

            if (toUpdate.length > 0) {
              console.log(`[ImportDebug] Iniciando atualização (backend) para ${toUpdate.length} registros com delay de ${UPDATE_DELAY_MS}ms entre cada.`);
              for (let i = 0; i < toUpdate.length; i++) {
                const recordToUpdate = toUpdate[i];
                try {
                  const { id, ...updateData } = recordToUpdate;
                  console.log(`[ImportDebug] Atualizando registro ID ${id} (${i + 1}/${toUpdate.length})`);
                  await currentEntityConfig.entity.update(id, updateData);
                  updatedCount++;
                  // Introduce delay after each successful or attempted update
                  if (i < toUpdate.length - 1) { // Don't delay after the last update
                      await new Promise(resolve => setTimeout(resolve, UPDATE_DELAY_MS));
                  }
                } catch (updateErr) { 
                  console.error(`[ImportDebug] Erro ao atualizar ID ${recordToUpdate.id} via backend:`, updateErr);
                  finalErrorCount++;
                  let detailMsg = updateErr.message;
                  if (updateErr.response?.data?.detail) {
                      detailMsg = JSON.stringify(updateErr.response.data.detail);
                  } else if (updateErr.response?.data?.error_description) { 
                      detailMsg = updateErr.response.data.error_description;
                  } else if (updateErr.response?.status === 429) {
                      detailMsg = "Rate limit exceeded. Tente importar menos registros ou aguarde um momento.";
                  }
                  finalErrorDetails.push(`Erro ao atualizar registro ID ${recordToUpdate.id} via backend: ${detailMsg}`);
                   // Optional: If a rate limit error specifically occurs, you could break or implement a longer backoff
                  if (updateErr.response?.status === 429) {
                      console.warn(`[ImportDebug] Rate limit atingido durante atualização. Pausando por ${UPDATE_DELAY_MS * 2}ms antes de continuar ou falhar.`);
                       await new Promise(resolve => setTimeout(resolve, UPDATE_DELAY_MS * 2)); // Longer pause if rate limited
                  } else if (i < toUpdate.length - 1) { // Still delay if not rate limited but error occurred
                       await new Promise(resolve => setTimeout(resolve, UPDATE_DELAY_MS));
                  }
                }
              }
              console.log("[ImportDebug] Atualização de registros (backend) concluída.");
            }
            
            skippedCount = duplicatesFound - updatedCount;

          } catch (processErr) { 
            console.error("[ImportDebug] Erro no processamento de duplicatas/operações em lote com backend:", processErr);
            finalErrorCount += (processedRecords.length - successCount - updatedCount - skippedCount); 
            finalErrorDetails.push(`Erro geral no processamento com backend: ${processErr.message}`);
          }
      }
      
      // Registrar operação no histórico
      await logOperacao({
        tipo_operacao: "importacao",
        entidade_alvo: selectedEntity,
        status: finalErrorCount > 0 ? "parcial" : "sucesso",
        registros_processados: successCount + updatedCount,
        registros_falha: finalErrorCount,
        arquivo_nome_original: file ? file.name : "importacao_mapeada",
        detalhes_erro: finalErrorDetails.length > 0 ? finalErrorDetails.join("\n").substring(0, 2000) : null
      });
      
      // Definir mensagem de status
      let statusMessage = `Importação concluída. `;
      statusMessage += `${successCount} registros criados, ${updatedCount} atualizados, ${skippedCount} ignorados (duplicatas). `;
      
      if (finalErrorCount > 0) {
        statusMessage += ` ${finalErrorCount} erros encontrados. `;
        if (finalErrorDetails.length > 0) {
          statusMessage += `Detalhes dos primeiros erros: ${finalErrorDetails.slice(0, 3).join(" | ")}`;
          if (finalErrorDetails.length > 3) {
            statusMessage += ` (e mais ${finalErrorDetails.length - 3} erros)`;
          }
        }
        setImportStatus({ type: 'warning', message: statusMessage });
      } else {
        setImportStatus({ type: 'success', message: statusMessage });
      }
      
      // Limpar estado de mapeamento
      setShowMappingInterface(false);
      setMappingComplete(false);
      setProcessedData(null);
      
      // Recarregar histórico
      await loadHistorico();
      
    } catch (error) {
      console.error("[ImportDebug] Erro geral na importação:", error);
      setImportStatus({ 
        type: 'error', 
        message: `Erro na importação: ${error.message}` 
      });
      
      try {
        await logOperacao({
          tipo_operacao: "importacao",
          entidade_alvo: selectedEntity,
          status: "erro",
          registros_processados: 0,
          registros_falha: 0,
          arquivo_nome_original: file ? file.name : "importacao_mapeada",
          detalhes_erro: error.message
        });
      } catch (logError) {
        console.error("Erro ao registrar falha no histórico:", logError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedEntityExport || !entityConfig[selectedEntityExport]) {
      setImportStatus({ type: 'error', message: 'Selecione uma entidade para exportar.' });
      return;
    }
    
    setIsLoading(true);
    setImportStatus(null);
    
    try {
      const currentConfig = entityConfig[selectedEntityExport];
      
      // Buscar todos os registros da entidade
      const records = await currentConfig.entity.list();
      
      if (!records || records.length === 0) {
        setImportStatus({ type: 'info', message: `Não há registros para exportar da entidade ${currentConfig.label}.` });
        setIsLoading(false);
        return;
      }
      
      // Preparar cabeçalhos
      const headers = currentConfig.importFields;
      
      // Preparar linhas de dados
      const rows = records.map(record => {
        return headers.map(field => {
          let value = record[field];
          
          // Formatação de valores
          if (value === null || value === undefined) {
            return '';
          }
          
          // Formatação de booleanos
          if (currentConfig.booleanFields?.includes(field)) {
            return value ? 'sim' : 'não';
          }
          
          // Retornar valor como string
          return String(value);
        });
      });
      
      // Montar conteúdo CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Criar blob e link para download
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const fileName = `exportacao_${selectedEntityExport}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      // Registrar operação no histórico
      await logOperacao({
        tipo_operacao: "exportacao",
        entidade_alvo: selectedEntityExport,
        status: "sucesso",
        registros_processados: records.length,
        registros_falha: 0,
        arquivo_nome_original: fileName
      });
      
      setImportStatus({ 
        type: 'success', 
        message: `Exportação concluída com sucesso. ${records.length} registros exportados.` 
      });
      
      // Recarregar histórico
      await loadHistorico();
      
    } catch (error) {
      console.error("Erro na exportação:", error);
      setImportStatus({ 
        type: 'error', 
        message: `Erro na exportação: ${error.message}` 
      });
      
      try {
        await logOperacao({
          tipo_operacao: "exportacao",
          entidade_alvo: selectedEntityExport,
          status: "erro",
          registros_processados: 0,
          registros_falha: 0,
          detalhes_erro: error.message
        });
      } catch (logError) {
        console.error("Erro ao registrar falha no histórico:", logError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Renderização da visualização prévia do CSV
  const renderCSVPreview = () => {
    if (!csvData) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
          <FileSpreadsheet className="h-4 w-4" />
          Visualização prévia do CSV
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-100">
              <tr>
                {csvData.headers.map((header, index) => (
                  <th key={index} className="px-2 py-1 text-left text-gray-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {csvData.data.slice(0, 3).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {csvData.headers.map((header, colIndex) => (
                    <td key={colIndex} className="px-2 py-1">{row[header] || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {csvData.data.length > 3 && (
          <p className="text-xs text-gray-500 mt-2">
            Mostrando 3 de {csvData.data.length} registros...
          </p>
        )}
      </div>
    );
  };

  // Renderização da interface de mapeamento manual
  const renderMappingInterface = () => {
    if (!showMappingInterface || !csvRawData || !selectedEntity) return null;
    
    const currentEntityConfig = entityConfig[selectedEntity];
    
    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-md font-medium flex items-center gap-2 mb-4">
          <Columns className="h-5 w-5 text-blue-600" />
          Mapeamento Manual de Colunas
        </h3>
        
        <p className="text-sm text-blue-700 mb-4">
          Selecione qual coluna do CSV corresponde a cada campo do sistema. Todos os campos obrigatórios devem ser mapeados.
        </p>
        
        <div className="space-y-4">
          {currentEntityConfig.importFields.map((field, index) => (
            <div key={field} className="flex items-center gap-3">
              <div className="w-1/3">
                <Label className="text-sm font-medium">
                  {field}
                  {currentEntityConfig.fieldDescriptions[field] && (
                    <span className="text-xs text-gray-500 block">
                      {currentEntityConfig.fieldDescriptions[field]}
                    </span>
                  )}
                </Label>
              </div>
              
              <div className="w-1/12 flex justify-center">
                <ArrowRight className="h-4 w-4 text-blue-500" />
              </div>
              
              <div className="w-1/2">
                <Select 
                  value={columnMapping[field] !== null && columnMapping[field] !== undefined ? String(columnMapping[field]) : "UNMAPPED_SENTINEL_VALUE"} // Ensure the Select's value matches an item or is "" for placeholder
                  onValueChange={(value) => handleColumnMappingChange(field, value === "UNMAPPED_SENTINEL_VALUE" ? null : parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNMAPPED_SENTINEL_VALUE">Não mapear</SelectItem> {/* Changed value from "" */}
                    {csvRawData.headers.map((header, colIndex) => (
                      <SelectItem key={colIndex} value={String(colIndex)}>
                        Coluna {colIndex + 1}: {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowMappingInterface(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleProcessMappedData}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Concluir Mapeamento
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Renderização da visualização dos dados processados
  const renderProcessedDataPreview = () => {
    if (!mappingComplete || !processedData || processedData.length === 0) return null;
    
    return (
      <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
        <h3 className="text-md font-medium flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Dados Processados Após Mapeamento
        </h3>
        
        <p className="text-sm text-green-700 mb-4">
          O mapeamento foi concluído com sucesso. Abaixo está uma prévia dos dados processados prontos para importação.
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-green-100">
              <tr>
                {entityConfig[selectedEntity].importFields.map((field) => (
                  <th key={field} className="px-2 py-1 text-left text-green-700">{field}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedData.slice(0, 3).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {entityConfig[selectedEntity].importFields.map((field) => (
                    <td key={field} className="px-2 py-1">{row[field] || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {processedData.length > 3 && (
          <p className="text-xs text-green-600 mt-2">
            Mostrando 3 de {processedData.length} registros...
          </p>
        )}
        
        <div className="mt-4">
          <Button
            onClick={handleImport}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Dados Processados
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Importação e Exportação de Dados</CardTitle>
          <CardDescription>
            Importe dados de arquivos CSV ou exporte dados para arquivos CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import">
            <TabsList className="mb-4">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importar
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entity-select-import">Selecione a Entidade</Label>
                  <Select 
                    value={selectedEntity || "NULL_SENTINEL_IMPORT"} 
                    onValueChange={(value) => setSelectedEntity(value === "NULL_SENTINEL_IMPORT" ? null : value)}
                  >
                    <SelectTrigger id="entity-select-import">
                      <SelectValue placeholder="Selecione uma entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NULL_SENTINEL_IMPORT">
                        <em>Selecione uma entidade</em>
                      </SelectItem>
                      {Object.keys(entityConfig).map((key) => (
                        <SelectItem key={key} value={key}>
                          {entityConfig[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="file-upload">Arquivo CSV</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={!selectedEntity || isLoading}
                  />
                </div>
              </div>
              
              {selectedEntity && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-blue-700">Instruções para {entityConfig[selectedEntity].label}</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Baixe o modelo CSV, preencha os dados conforme as instruções e faça o upload.
                      </p>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-blue-700">Campos Esperados</h4>
                          <ul className="text-xs text-blue-600 mt-1 list-disc list-inside">
                            {entityConfig[selectedEntity].importFields.map((field) => (
                              <li key={field}>
                                {field}
                                {entityConfig[selectedEntity].fieldDescriptions[field] && (
                                  <span className="text-blue-500 italic"> ({entityConfig[selectedEntity].fieldDescriptions[field]})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-700">Requisitos do Arquivo</h4>
                          <ul className="text-xs text-blue-600 mt-1 list-disc list-inside">
                            <li>Formato CSV com delimitador vírgula (,)</li>
                            <li>Codificação UTF-8</li>
                            <li>Primeira linha deve conter os nomes dos campos</li>
                            <li>Datas no formato DD/MM/AAAA ou AAAA-MM-DD</li>
                            <li>Valores booleanos: sim/não, true/false</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadTemplate}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Modelo CSV
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {file && selectedEntity && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">
                      Arquivo selecionado: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  
                  {renderCSVPreview()}
                  
                  {!showMappingInterface && !mappingComplete && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="update-duplicates"
                          checked={shouldUpdateDuplicates}
                          onChange={(e) => setShouldUpdateDuplicates(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="update-duplicates" className="text-sm">
                          Atualizar registros duplicados (baseado em {entityUniqueKeys[selectedEntity]?.join(', ') || 'chaves únicas'})
                        </Label>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleStartMapping}
                          variant="outline"
                          className="flex-1"
                        >
                          <Columns className="h-4 w-4 mr-2" />
                          Mapear Colunas Manualmente
                        </Button>
                        
                        <Button
                          onClick={handleImport}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importar Dados
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Importar Dados
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {renderMappingInterface()}
                  {renderProcessedDataPreview()}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <div>
                <Label htmlFor="entity-select-export">Selecione a Entidade para Exportar</Label>
                <Select 
                  value={selectedEntityExport || "NULL_SENTINEL_EXPORT"} 
                  onValueChange={(value) => setSelectedEntityExport(value === "NULL_SENTINEL_EXPORT" ? null : value)}
                >
                  <SelectTrigger id="entity-select-export">
                    <SelectValue placeholder="Selecione uma entidade" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="NULL_SENTINEL_EXPORT">
                        <em>Selecione uma entidade</em>
                      </SelectItem>
                    {Object.keys(entityConfig).map((key) => (
                      <SelectItem key={key} value={key}>
                        {entityConfig[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
               <Button
                onClick={handleExport}
                disabled={!selectedEntityExport || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Label htmlFor="historico-filtro" className="whitespace-nowrap">Filtrar por Entidade:</Label>
                <Select 
                  value={historicoFiltroEntidade || "ALL_ENTITIES_SENTINEL"} 
                  onValueChange={(value) => setHistoricoFiltroEntidade(value === "ALL_ENTITIES_SENTINEL" ? null : value)}
                >
                  <SelectTrigger id="historico-filtro" className="w-[200px]">
                    <SelectValue placeholder="Todas as entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_ENTITIES_SENTINEL">Todas as entidades</SelectItem>
                    {Object.keys(entityConfig).map((key) => (
                      <SelectItem key={key} value={key}>
                        {entityConfig[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadHistorico}
                  className="ml-auto"
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              
              {historico.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma operação de importação ou exportação registrada.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Operação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico
                        .filter(h => !historicoFiltroEntidade || h.entidade_alvo === historicoFiltroEntidade)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(item.data_operacao).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {item.tipo_operacao === 'importacao' ? (
                                <span className="flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Importação
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  Exportação
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {entityConfig[item.entidade_alvo]?.label || item.entidade_alvo}
                            </TableCell>
                            <TableCell>{item.nome_usuario}</TableCell>
                            <TableCell>
                              {item.status === 'sucesso' ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Sucesso
                                </span>
                              ) : item.status === 'parcial' ? (
                                <span className="inline-flex items-center gap-1 text-yellow-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Parcial
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Erro
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.registros_processados} processados
                              {item.registros_falha > 0 && (
                                <span className="text-red-500 ml-1">
                                  ({item.registros_falha} falhas)
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
           {importStatus && (
            <Alert 
              className={`mt-6 ${
                importStatus.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : importStatus.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : importStatus.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {importStatus.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : importStatus.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                ) : importStatus.type === 'info' ? (
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <AlertTitle>
                    {importStatus.type === 'success' 
                      ? 'Operação concluída com sucesso' 
                      : importStatus.type === 'warning'
                      ? 'Operação concluída com avisos'
                      : importStatus.type === 'info'
                      ? 'Informação'
                      : 'Erro na operação'}
                  </AlertTitle>
                  <AlertDescription className="whitespace-pre-line">
                    {importStatus.message}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
