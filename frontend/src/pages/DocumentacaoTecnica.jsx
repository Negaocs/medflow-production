
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Terminal, Cloud, FileText } from 'lucide-react';

const markdownContent = `
# Documentação Técnica do Sistema MedFlow <FileText className="inline-block ml-2" />

## 1. Visão Geral do Sistema MedFlow

O MedFlow é um sistema de gestão para clínicas e grupos médicos, projetado para otimizar a administração da produção médica, financeira e cadastral. Suas principais funcionalidades incluem:

*   Cadastro detalhado de Médicos, Empresas, Hospitais e Tipos de Plantão.
*   Gerenciamento de Contratos e os valores de plantão associados.
*   Lançamento de Plantões, Procedimentos Particulares, Produção Administrativa e Pró-Labores.
*   Registro de Descontos e Créditos.
*   Cálculo de Produção Médica e Pró-Labore com detalhamento fiscal.
*   Geração de Relatórios consolidados e individuais.
*   Gestão de Usuários e Permissões de Acesso.

## 2. Arquitetura Atual (Plataforma base44)

O sistema MedFlow é atualmente desenvolvido e hospedado na plataforma base44. Isso implica uma arquitetura primariamente focada no **frontend (React)**.

*   **Interface do Usuário (UI):** Construída com React, Shadcn/UI e Tailwind CSS.
*   **Lógica de Negócios (Frontend):** Grande parte da lógica de validação, cálculos preliminares e interações com o usuário reside no frontend.
*   **Persistência de Dados:** Gerenciada pela plataforma base44 através de "Entidades" (semelhantes a tabelas de banco de dados, acessíveis via SDK fornecido).
*   **Limitações:**
    *   **Operações de Backend Intensivas:** Tarefas como geração complexa de arquivos (ex: PDFs estilizados do lado do servidor), processamento de grandes volumes de dados em background, ou integrações diretas com APIs externas (que exijam chaves de API seguras no servidor) são limitadas ou precisam de soluções alternativas.
    *   **Controle sobre o Ambiente do Servidor:** Menor controle sobre o ambiente de hospedagem, configurações de servidor, ou instalação de dependências de sistema operacional.

## 3. Estrutura de Entidades e Relacionamentos

### 3.1 Entidades Principais de Cadastro

#### **Medico** - Entidade principal dos profissionais
- **Campos Principais:**
  - \`nome\`: Nome completo
  - \`cpf\`: CPF único
  - \`crm\`: Número do CRM
  - \`estado_crm\`: Estado do CRM
  - \`email\`: E-mail para contato/login
  - \`usuario_sistema_id\`: Link para UsuarioSistema (se médico tem acesso)
  - \`dependentes_irrf\`: Número de dependentes para cálculo IRRF
  - Dados bancários: \`banco\`, \`agencia\`, \`conta\`, \`pix\`

#### **Empresa** - Empresas prestadoras de serviço
- **Campos Principais:**
  - \`razao_social\`: Razão social oficial
  - \`nome_fantasia\`: Nome fantasia
  - \`cnpj\`: CNPJ único
  - \`regime_tributario\`: simples_nacional, lucro_presumido, lucro_real
  - Dados de contato: \`endereco\`, \`telefone\`, \`email\`, \`responsavel\`

#### **Hospital** - Hospitais onde são realizados os plantões
- **Campos Principais:**
  - \`nome\`: Nome do hospital
  - \`cnpj\`: CNPJ do hospital
  - \`empresa_id\`: Empresa à qual está vinculado (FK)
  - Dados de contato: \`endereco\`, \`telefone\`, \`email\`, \`contato_responsavel\`

#### **TipoPlantao** - Tipos de plantões disponíveis
- **Campos Principais:**
  - \`nome\`: Nome do tipo (ex: "Presencial 12h", "Sobreaviso")
  - \`descricao\`: Descrição detalhada
  - \`carga_horaria\`: Horas do plantão
  - \`observacoes\`: Observações específicas

### 3.2 Entidades de Relacionamento

#### **MedicoEmpresa** - Vínculos entre médicos e empresas
- **Relacionamento:** N:N entre Medico e Empresa
- **Campos:**
  - \`medico_id\`: ID do médico (FK)
  - \`empresa_id\`: ID da empresa (FK)  
  - \`data_vinculo\`: Data de início do vínculo
  - \`data_desvinculo\`: Data de fim (opcional)
  - \`ativo\`: Status do vínculo

#### **Contrato** - Contratos entre empresas e hospitais
- **Relacionamento:** Liga Empresa e Hospital
- **Campos:**
  - \`empresa_id\`: Empresa contratante (FK)
  - \`hospital_id\`: Hospital contratado (FK)
  - \`numero_contrato\`: Identificador do contrato
  - \`data_inicio\`: Data de início
  - \`data_fim\`: Data de fim (opcional)

#### **ContratoTipoPlantao** - Valores dos plantões por contrato
- **Relacionamento:** Define valores específicos por tipo de plantão em cada contrato
- **Campos:**
  - \`contrato_id\`: ID do contrato (FK)
  - \`tipo_plantao_id\`: ID do tipo de plantão (FK)
  - \`valor\`: Valor unitário para este tipo neste contrato

### 3.3 Entidades Operacionais (Lançamentos)

#### **Plantao** - Registros de plantões realizados
- **Campos Principais:**
  - \`medico_id\`: Médico que realizou (FK)
  - \`contrato_id\`: Contrato sob o qual foi realizado (FK)
  - \`tipo_plantao_id\`: Tipo do plantão (FK)
  - \`data_plantao\`: Data específica
  - \`competencia\`: Mês/ano (YYYY-MM)
  - \`quantidade\`: Quantidade de plantões
  - \`valor_unitario\`: Valor por plantão
  - \`valor_total\`: Valor total calculado
  - \`confirmado\`: Status de confirmação

#### **ProcedimentoParticular** - Procedimentos particulares
- **Campos Principais:**
  - \`medico_id\`: Médico responsável (FK)
  - \`empresa_id\`: Empresa prestadora (FK)
  - \`hospital_id\`: Local de realização (FK)
  - \`data_procedimento\`: Data de realização
  - \`nome_paciente\`: Nome do paciente
  - \`descricao_procedimentos\`: Descrição detalhada
  - \`valor_bruto\`: Valor total do procedimento
  - \`valor_liquido_repasse\`: Valor líquido para o médico

#### **ProducaoAdministrativa** - Atividades administrativas
- **Campos Principais:**
  - \`medico_id\`: Médico responsável (FK)
  - \`empresa_id\`: Empresa beneficiária (FK)
  - \`descricao_atividade\`: Descrição da atividade
  - \`tipo_producao\`: cedula_presenca, administrativa
  - \`horas_dedicadas\`: Horas trabalhadas
  - \`valor_hora\`: Valor por hora
  - \`valor_total\`: Valor total

#### **ProLabore** - Pró-labores dos médicos
- **Campos Principais:**
  - \`medico_id\`: Médico beneficiário (FK)
  - \`empresa_pagamento_id\`: Empresa pagadora (FK)
  - \`descricao\`: Descrição do pró-labore
  - \`valor_bruto\`: Valor bruto
  - \`tributavel\`: Se incide tributos
  - \`recorrente\`: Se é recorrente

#### **DescontoCredito** - Descontos e créditos
- **Campos Principais:**
  - \`medico_id\`: Médico afetado (FK)
  - \`empresa_id\`: Empresa relacionada (FK)
  - \`tipo\`: "desconto" ou "credito"
  - \`descricao\`: Descrição do item
  - \`valor\`: Valor do desconto/crédito
  - \`tributavel\`: Se incide tributos

### 3.4 Entidades Fiscais e Tabelas

#### **TabelaINSS** - Faixas de contribuição INSS
- **Campos:**
  - \`vigencia_inicio\`: Data de início da vigência
  - \`vigencia_fim\`: Data de fim (opcional)
  - \`tipo_contribuinte\`: empregado, pro_labore
  - \`faixa\`: Número da faixa
  - \`salario_de\`: Valor inicial da faixa
  - \`salario_ate\`: Valor final da faixa
  - \`aliquota\`: Percentual de contribuição
  - \`teto_contribuicao\`: Teto máximo

#### **TabelaIRRF** - Faixas de Imposto de Renda
- **Campos:**
  - \`vigencia_inicio\`: Data de início da vigência
  - \`vigencia_fim\`: Data de fim (opcional)
  - \`faixa\`: Número da faixa
  - \`base_calculo_de\`: Base inicial
  - \`base_calculo_ate\`: Base final
  - \`aliquota\`: Percentual do IR
  - \`parcela_deduzir\`: Parcela a deduzir

#### **ParametrosFiscaisEmpresa** - Parâmetros fiscais por empresa
- **Campos:**
  - \`empresa_id\`: Empresa relacionada (FK)
  - \`regime_tributario\`: Regime específico
  - \`vigencia_inicio\`: Data de início
  - \`vigencia_fim\`: Data de fim (opcional)
  - Alíquotas: \`aliquota_inss\`, \`aliquota_irrf\`, \`aliquota_iss\`, etc.

#### **VinculoFiscalMedico** - Vínculos fiscais externos dos médicos
- **Campos:**
  - \`medico_id\`: Médico relacionado (FK)
  - \`cnpj_responsavel\`: CNPJ da instituição
  - \`nome_instituicao\`: Nome da instituição
  - \`tipo_vinculo\`: clt, pj, cooperativa, plantao_publico
  - Valores: \`base_inss\`, \`valor_inss_retido\`, \`base_irrf\`, \`valor_irrf_retido\`

### 3.5 Entidades de Cálculo e Resultados

#### **ResultadoCalculoProducao** - Resultados de cálculos de produção
- **Campos:**
  - \`competencia_producao\`: Competência calculada
  - \`medico_id\`: Médico específico (opcional)
  - \`empresa_id\`: Empresa específica (opcional)
  - \`status\`: simulacao, consolidado, cancelado
  - Totais: \`total_bruto_plantoes\`, \`total_bruto_procedimentos\`, etc.

#### **ItemCalculadoProducao** - Itens detalhados do cálculo de produção
- **Campos:**
  - \`resultado_calculo_producao_id\`: Resultado pai (FK)
  - \`item_original_id\`: ID do plantão/procedimento original
  - \`tipo_item\`: plantao, procedimento_particular
  - Valores calculados: impostos, descontos, líquido

#### **ResultadoCalculoProLabore** - Resultados de cálculos de pró-labore
- **Campos:**
  - \`competencia_prolabore\`: Competência calculada
  - \`medico_id\`: Médico específico (opcional)
  - \`status\`: simulacao, consolidado, cancelado
  - Totais de pró-labore e descontos

#### **ItemCalculadoProLabore** - Itens detalhados do cálculo de pró-labore
- **Campos:**
  - \`resultado_calculo_prolabore_id\`: Resultado pai (FK)
  - \`item_original_id\`: ID do pró-labore original
  - \`tipo_item\`: prolabore
  - Valores calculados: impostos, descontos, líquido

### 3.6 Entidades de Usuário e Segurança

#### **UsuarioSistema** - Usuários do sistema
- **Campos:**
  - \`nome_usuario\`: Nome de login
  - \`email\`: E-mail
  - \`senha_hash\`: Senha criptografada
  - \`ultimo_login\`: Data/hora
  - \`status\`: ativo, inativo, bloqueado

#### **Permissao** - Permissões granulares
- **Campos:**
  - \`nome\`: Ex: "gerenciar_medicos", "lancar_plantao"
  - \`descricao\`: Descrição detalhada

#### **Papel** - Grupos de permissões (ex: Administrador, Lançador)
- **Campos:**
  - \`nome\`: Ex: "Administrador", "Financeiro", "Médico"
  - \`descricao\`: Descrição do papel

#### **UsuarioPapel** - Relacionamento entre usuários e papéis
- **Campos:**
  - \`usuario_id\`: ID do usuário (FK)
  - \`papel_id\`: ID do papel (FK)

## 4. Telas do Sistema (Fluxos e Funcionalidades)

### 4.1. Módulos Principais

*   **Dashboard:** Visão geral do sistema com gráficos e resumos de produção/financeiro.
*   **Cadastros:** Gestão de Médicos, Empresas, Hospitais, Tipos de Plantão, Contratos.
*   **Lançamentos:** Registro de Plantões, Procedimentos Particulares, Produção Administrativa, Pró-Labores, Descontos/Créditos.
*   **Processamento/Cálculos:**
    *   **Cálculo de Produção:** Processa todos os lançamentos para gerar o resumo da produção médica de um período.
    *   **Cálculo de Pró-Labore:** Calcula os valores de pró-labore devidos, aplicando deduções fiscais.
*   **Relatórios:** Geração de diversos relatórios consolidados e individuais.
*   **Administração:** Gestão de Usuários, Permissões, Papéis, Parâmetros do Sistema.

### 4.2. Fluxos de Exemplo

#### a) Lançamento de Plantões e Cálculo de Produção

1.  **Navegação:** Usuário acessa a tela "Lançar Plantões".
2.  **Seleção:** Seleciona o Médico, Empresa/Hospital e Contrato, Tipo de Plantão.
3.  **Dados:** Informa a data do plantão, a quantidade, e o sistema preenche o valor unitário/total baseado no \`ContratoTipoPlantao\`.
4.  **Gravação:** Salva o plantão (Entidade \`Plantao\`).
5.  **Cálculo:** No final do mês/período, o sistema ou um administrador aciona o "Cálculo de Produção".
    *   O cálculo varre os \`Plantao\`s e \`ProcedimentoParticular\`s e \`ProducaoAdministrativa\`s para a competência.
    *   Aplica regras de negócio, descontos e créditos (\`DescontoCredito\`).
    *   Consulta \`TabelaINSS\`, \`TabelaIRRF\` e \`ParametrosFiscaisEmpresa\` para determinar retenções.
    *   Gera \`ResultadoCalculoProducao\` e \`ItemCalculadoProducao\`.
6.  **Visualização:** O médico pode acessar um "Relatório Individual de Produção" para ver o detalhamento do seu líquido a receber.

#### b) Cadastro de Novo Contrato

1.  **Navegação:** Administrador acessa a tela "Gestão de Contratos".
2.  **Criação:** Clica em "Novo Contrato".
3.  **Dados Básicos:** Informa Empresa, Hospital, Número do Contrato, Data de Início/Fim.
4.  **Associação de Valores:** Para cada \`TipoPlantao\`, o administrador informa o \`valor\` unitário que será pago sob este contrato.
5.  **Gravação:** Salva a entidade \`Contrato\` e suas \`ContratoTipoPlantao\`s associadas.
6.  **Disponibilidade:** Este novo contrato e seus valores estão agora disponíveis para seleção na tela de "Lançamento de Plantões".

## 5. Geração de PDF para Relatórios

A geração de relatórios em formato PDF, especialmente o "Relatório Individual de Produção Médica", é uma funcionalidade crucial.

### Cenário Atual (Frontend-Only no base44)

*   **Abordagem:** O relatório é renderizado como uma página HTML bem estruturada e estilizada para impressão.
*   **Ação do Usuário:** O usuário utiliza a funcionalidade "Imprimir" do seu navegador e seleciona a opção "Salvar como PDF".
*   **Nomeação do Arquivo:** O usuário precisa nomear o arquivo manualmente ao salvá-lo.
*   **Limitações:** Menor controle sobre o layout fino do PDF, paginação, cabeçalhos/rodapés dinâmicos, e performance para relatórios muito extensos.

### Cenário Ideal com Backend Dedicado

Para um controle total sobre a geração de PDFs, incluindo nomeação automática e layouts complexos, a integração com um serviço de backend é recomendada.

*   **Arquitetura Sugerida:**
    1.  **Frontend (App base44):**
        *   Coleta parâmetros do relatório (médico, competência, datas de pagamento).
        *   Envia uma requisição HTTP (ex: POST) para um endpoint da API do seu backend.
    2.  **Backend (Seu Servidor):**
        *   **Endpoint da API:** Recebe a requisição.
        *   **Coleta de Dados:**
            *   O backend busca os dados necessários. Idealmente, o base44 poderia oferecer uma API para que seu backend consultasse as entidades. Alternativamente, os dados relevantes poderiam ser enviados pelo frontend na requisição (cuidado com o volume).
        *   **Lógica de Negócio:** Processa os dados para montar o relatório.
        *   **Geração do PDF:** Utiliza uma biblioteca como **WeasyPrint** (Python, converte HTML+CSS para PDF) ou **ReportLab** (Python, criação programática de PDF).
            *   **Exemplo com WeasyPrint (Python):**
                \`\`\`python
                from weasyprint import HTML, CSS
                # Suponha que 'html_string' é o HTML do relatório e 'css_string' o CSS
                # html_string = render_template_to_string('template_relatorio.html', data=dados_relatorio)
                # css_string = carregar_arquivo_css('estilo_relatorio.css')
                pdf_file = HTML(string=html_string).write_pdf(stylesheets=[CSS(string=css_string)])
                # Retorna o pdf_file como resposta HTTP
                \`\`\`
        *   **Nomeação do Arquivo:** O backend define o nome do arquivo (ex: \`relatorio_DrJoaoSilva_2024-05.pdf\`) e envia o PDF como resposta HTTP com os cabeçalhos apropriados (\`Content-Disposition\`).
    *   **Fluxo:** Usuário clica em "Gerar PDF" -> Frontend envia dados -> Backend gera PDF -> Backend envia PDF de volta -> Navegador inicia download.

## 6. Setup e Desenvolvimento em Ambiente Local (com Backend Hipotético) <Terminal className="inline-block ml-2" />

Esta seção descreve como você poderia configurar um ambiente de desenvolvimento local se quisesse desenvolver e testar um componente de backend para funcionalidades como a geração de PDF.

### Pré-requisitos

*   **Node.js e npm/yarn:** Para o frontend.
*   **Python e pip:** Para o backend de exemplo (Flask + WeasyPrint).
*   **Git:** Para controle de versão.

### Frontend (App base44)

1.  **Exportação do Código:**
    *   Atualmente, o base44 não possui uma funcionalidade explícita de "exportar projeto para rodar localmente". Você está desenvolvendo diretamente na plataforma.
    *   Para um desenvolvimento local *paralelo* (especialmente do backend), você pode manter seu código frontend atualizado no base44.
2.  **Rodar Localmente (se fosse possível exportar):**
    *   \`git clone <seu-repositorio-se-existisse>\`
    *   \`cd <pasta-do-projeto>\`
    *   \`npm install\` (ou \`yarn install\`)
    *   \`npm run dev\` (ou \`yarn dev\`)
    *   O frontend precisaria ser configurado para apontar para a API do seu backend local (ex: \`http://localhost:5000/api/gerar-pdf\`).

### Backend (Exemplo Python/Flask para Geração de PDF)

1.  **Estrutura de Pastas (Sugestão):**
    \`\`\`
    medflow_backend/
    |-- app.py             # Arquivo principal do Flask
    |-- templates/         # Para templates HTML (usados pelo WeasyPrint)
    |   |-- relatorio_individual.html
    |-- static/            # Para arquivos CSS
    |   |-- estilo_relatorio.css
    |-- requirements.txt   # Dependências Python
    \`\`\`
2.  **Dependências (\`requirements.txt\`):**
    \`\`\`
    Flask
    WeasyPrint
    requests # Se precisar chamar APIs externas ou a API do base44
    \`\`\`
3.  **Instalar Dependências:**
    \`\`\`bash
    pip install -r requirements.txt
    \`\`\`
4.  **Exemplo de Código (\`app.py\`):**
    \`\`\`python
    from flask import Flask, request, send_file, jsonify
    from weasyprint import HTML, CSS
    import io

    app = Flask(__name__)

    # Mock - Em um cenário real, você buscaria isso de um banco de dados
    # ou receberia da API do base44 / frontend.
    def fetch_medico_data(medico_id, competencia):
        # Simula a busca de dados
        return {
            "nomeMedico": "Dr. Exemplo Silva",
            "cpf": "123.456.789-00",
            "competencia": competencia,
            "proLabore": {"totalLiquido": 5000, "porEmpresa": [{"nome": "Empresa A", "valor": 3000}, {"nome": "Empresa B", "valor": 2000}]},
            "producao": {"totalLiquido": 10000, "porEmpresa": [{"nome": "Empresa A", "valor": 6000}, {"nome": "Hospital X", "valor": 4000}]},
            "totalGeralLiquido": 15000,
            "dataPagProLabore": "10/07/2024",
            "dataPagProducao": "15/07/2024",
            "descontos": [{"descricao": "INSS Pró-Labore", "valor": 550}, {"descricao": "IRRF Produção", "valor": 1200}],
            "totalDescontos": 1750,
            "creditos": [{"descricao": "Participação Lucros", "valor": 300}],
            "totalCreditos": 300,
            # ... outros dados para o template
        }

    def formatCompetencia(competencia_str): # Função auxiliar para formatar competência
        # Exemplo simples, adapte conforme necessário
        if not competencia_str or '-' not in competencia_str:
            return competencia_str
        year, month = competencia_str.split('-')
        # Você pode usar uma biblioteca de datas para formatação mais robusta se quiser
        months_pt = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        return f"{months_pt[int(month)-1]}/{year}"

    @app.route('/api/gerar-pdf/relatorio-individual', methods=['POST'])
    def gerar_relatorio_individual_pdf():
        data = request.json
        medico_id = data.get('medicoId')
        competencia = data.get('competencia')
        # datas_pagamento = data.get('datasPagamento') # Exemplo

        if not medico_id or not competencia:
            return jsonify({"error": "medicoId e competencia são obrigatórios"}), 400

        # 1. Buscar dados do médico e da produção (simulado)
        dados_relatorio = fetch_medico_data(medico_id, competencia)
        
        # 2. Renderizar HTML (usando um sistema de template como Jinja2 seria melhor)
        #    Para simplificar, vamos usar uma f-string com HTML básico.
        #    Idealmente, 'relatorio_individual_template.html' seria um arquivo.
        html_string = f"""
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Recibo de Produção Médica</title>
                <style>
                    body {{ font-family: sans-serif; margin: 20px; }}
                    h1 {{ color: #333; text-align: center; }}
                    .secao {{ margin-bottom: 20px; padding: 10px; border: 1px solid #eee; }}
                    .secao h2 {{ margin-top: 0; color: #555; border-bottom: 1px solid #ccc; }}
                    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                    .total {{ font-weight: bold; }}
                    .rodape {{ text-align: center; font-size: 0.8em; color: #777; margin-top: 30px; }}
                </style>
            </head>
            <body>
                <h1>Recibo de Produção Médica – Distribuição de Lucros</h1>
                <p><strong>Médico:</strong> {dados_relatorio['nomeMedico']}</p>
                <p><strong>CPF:</strong> {dados_relatorio['cpf']}</p>
                <p><strong>Competência:</strong> {formatCompetencia(competencia)}</p>
                <hr/>

                <div class="secao">
                    <h2>Resumo Financeiro – Líquido a Receber</h2>
                    <p>Total Pró-Labore Líquido: R$ {dados_relatorio['proLabore']['totalLiquido']:.2f}</p>
                    <p>Total Produção Líquida: R$ {dados_relatorio['producao']['totalLiquido']:.2f}</p>
                    <p class="total">Total Geral Líquido: R$ {dados_relatorio['totalGeralLiquido']:.2f}</p>
                    <p>Data Pag. Pró-Labore: {dados_relatorio['dataPagProLabore']}</p>
                    <p>Data Pag. Produção: {dados_relatorio['dataPagProducao']}</p>
                </div>

                <div class="secao">
                    <h2>Descontos</h2>
                    <table>
                        <thead><tr><th>Descrição</th><th>Valor (R$)</th></tr></thead>
                        <tbody>
                            {''.join([f"<tr><td>{d['descricao']}</td><td>{d['valor']:.2f}</td></tr>" for d in dados_relatorio['descontos']])}
                            <tr class="total"><td>Total Descontos:</td><td>{dados_relatorio['totalDescontos']:.2f}</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="secao">
                    <h2>Créditos</h2>
                     <table>
                        <thead><tr><th>Descrição</th><th>Valor (R$)</th></tr></thead>
                        <tbody>
                            {''.join([f"<tr><td>{c['descricao']}</td><td>{c['valor']:.2f}</td></tr>" for c in dados_relatorio['creditos']])}
                            <tr class="total"><td>Total Créditos:</td><td>{dados_relatorio['totalCreditos']:.2f}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="rodape">
                    <p>MedFlow Gestão Médica LTDA - CNPJ: 00.000.000/0001-00</p>
                    <p>Rua Exemplo, 123 - Bairro, Cidade - UF</p>
                </div>
            </body>
            </html>
        """
        # CSS pode ser um arquivo separado ou string
        # css = CSS(string='body { font-family: sans-serif; } h1 { color: blue; }')

        # 3. Gerar PDF
        pdf_bytes = HTML(string=html_string).write_pdf() # pode adicionar stylesheets=[css]

        # 4. Enviar PDF como resposta
        pdf_filename = f"Relatorio_{dados_relatorio['nomeMedico'].replace(' ', '_')}_{competencia}.pdf"
        
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=pdf_filename # Nome sugerido para o arquivo
        )

    if __name__ == '__main__':
        app.run(debug=True, port=5001) # Rodar em uma porta diferente do frontend base44 (se rodando localmente)
    \`\`\`
    *   **Templates e CSS:** Para relatórios mais complexos, use Jinja2 para renderizar o HTML a partir de um arquivo de template (\`templates/relatorio_individual.html\`) e sirva um CSS de \`static/estilo_relatorio.css\`.

5.  **Rodar o Servidor Flask:**
    \`\`\`bash
    python app.py
    \`\`\`
    O servidor estará rodando (por padrão) em \`http://127.0.0.1:5001\`.

### Acesso aos Dados do base44

Esta é a parte mais desafiadora para um backend local separado. Opções:

*   **API do base44 (Ideal, se existir):** Se a plataforma base44 fornecer uma API REST ou GraphQL para consulta de entidades, seu backend local a utilizaria. Isso requer autenticação segura.
*   **Frontend Envia os Dados:** O frontend coleta todos os dados brutos necessários para o relatório e os envia no corpo da requisição POST para o backend.
    *   *Prós:* Simples de implementar inicialmente.
    *   *Contras:* Pode envolver a transferência de grandes volumes de dados; duplicação da lógica de busca de dados.
*   **Exportação Periódica/Webhook:** O base44 poderia ter uma função de exportar dados (ex: CSV, JSON) que seu backend importaria. Ou webhooks poderiam notificar seu backend sobre atualizações.
    *   *Contras:* Dados podem não ser em tempo real.

## 7. Deploy em Produção (com Backend Hipotético) <Cloud className="inline-block ml-2" />

### Frontend (App base44)

*   O deploy do frontend continua sendo gerenciado pela plataforma base44.
*   A única mudança seria configurar o frontend para apontar para a URL de produção da sua API de backend.

### Backend (Exemplo Python/Flask)

1.  **Escolha da Plataforma de Hospedagem:**
    *   **Serviços PaaS (Platform as a Service):** Heroku, Google App Engine, AWS Elastic Beanstalk, Render.com. Simplificam o deploy.
    *   **Servidores Virtuais (IaaS - Infrastructure as a Service):** DigitalOcean, Linode, AWS EC2. Mais controle, mais configuração.
    *   **Serverless Functions:** AWS Lambda, Google Cloud Functions, Vercel Functions. Bom para endpoints específicos, pode ser custo-efetivo.

2.  **Configuração para Produção:**
    *   **WSGI Server (para Python/Flask):** Não use o servidor de desenvolvimento do Flask em produção. Use um WSGI server como Gunicorn ou uWSGI.
        *   Exemplo com Gunicorn: \`gunicorn -w 4 app:app\` (4 workers)
    *   **Variáveis de Ambiente:** Para chaves de API, URLs de banco de dados, segredos. NÃO coloque-os diretamente no código.
    *   **Banco de Dados:** Se seu backend precisar de seu próprio banco de dados.
    *   **HTTPS:** Essencial. A maioria das plataformas PaaS configura isso automaticamente. Em IaaS, você pode usar Let's Encrypt com Nginx ou Apache.
    *   **Logging e Monitoramento:** Para acompanhar a saúde e os erros do seu backend.

3.  **Exemplo de Arquivo para Deploy (ex: \`Procfile\` para Heroku):**
    \`\`\`
    web: gunicorn app:app
    \`\`\`

## 8. Futuras Melhorias e Considerações

*   **Segurança:** Proteja seu endpoint de backend com autenticação/autorização adequadas (ex: tokens API, OAuth).
*   **Escalabilidade:** Se o volume de relatórios for alto, considere a escalabilidade do seu backend.
*   **Tratamento de Erros:** Implemente um tratamento de erros robusto no backend e forneça feedback claro ao frontend.
*   **Templates de Relatório:** Invista tempo em bons templates HTML/CSS para WeasyPrint, pois a qualidade do PDF dependerá disso.
*   **Funções de Backend no base44:** A longo prazo, se a plataforma base44 adicionar suporte para "funções de backend" ou "serverless functions" customizadas, a geração de PDF poderia ser integrada mais diretamente, eliminando a necessidade de um servidor externo.

Esta documentação visa fornecer um guia. A implementação exata dependerá das ferramentas e plataformas escolhidas.
`;

export default function DocumentacaoTecnicaPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <Card className="shadow-xl border-0 bg-white max-w-4xl mx-auto">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Documentação Técnica do Sistema MedFlow
              </CardTitle>
              <CardDescription className="text-slate-600">
                Visão geral, arquitetura, entidades, telas, geração de PDF, setup local e deploy.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ScrollArea className="h-[calc(100vh-200px)] pr-4"> {/* Adjust height as needed */}
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-4 pb-2 border-b border-slate-300" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-5 mb-3 pb-1 border-b border-slate-200" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <pre className="bg-slate-800 text-slate-100 p-4 rounded-md my-4 overflow-x-auto text-sm">
                      <code className={className} {...props}>{String(children).replace(/\n$/, '')}</code>
                    </pre>
                  ) : (
                    <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded-sm font-mono text-sm" {...props}>
                      {String(children)}
                    </code>
                  )
                },
                blockquote: ({node, ...props}) => <blockquote className="pl-4 border-l-4 border-slate-300 italic text-slate-600 my-4" {...props} />,
                hr: ({node, ...props}) => <hr className="my-6 border-slate-300" {...props} />,
                // Adicionar renderização para ícones se precisar deles diretamente no markdown (mais complexo)
                // Aqui, os ícones são usados no cabeçalho da página.
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
