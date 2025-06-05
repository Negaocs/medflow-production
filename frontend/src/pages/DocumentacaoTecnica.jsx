import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Terminal, Cloud, FileText } from 'lucide-react';

const DocumentacaoTecnica = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        Documentação Técnica
        <BookOpen className="ml-2 h-6 w-6" />
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            Visão Geral do Sistema MedFlow
            <FileText className="ml-2 h-5 w-5" />
          </CardTitle>
          <CardDescription>
            Descrição geral do sistema e suas funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="prose max-w-none">
              <h2>1. Visão Geral do Sistema MedFlow</h2>
              <p>
                O MedFlow é um sistema de gestão para clínicas e grupos médicos, projetado para otimizar a administração 
                da produção médica, financeira e cadastral. Suas principais funcionalidades incluem:
              </p>
              <ul>
                <li>Cadastro detalhado de Médicos, Empresas, Hospitais e Tipos de Plantão.</li>
                <li>Gerenciamento de Contratos e os valores de plantão associados.</li>
                <li>Lançamento de Plantões, Procedimentos Particulares, Produção Administrativa e Pró-Labores.</li>
                <li>Registro de Descontos e Créditos.</li>
                <li>Cálculo de Produção Médica e Pró-Labore com detalhamento fiscal.</li>
                <li>Geração de Relatórios consolidados e individuais.</li>
                <li>Gestão de Usuários e Permissões de Acesso.</li>
              </ul>
              
              <h2>2. Arquitetura do Sistema</h2>
              <p>
                O sistema MedFlow utiliza uma arquitetura moderna baseada em:
              </p>
              <ul>
                <li><strong>Frontend:</strong> React, Shadcn/UI e Tailwind CSS</li>
                <li><strong>Backend:</strong> API RESTful com autenticação JWT</li>
                <li><strong>Banco de Dados:</strong> PostgreSQL para armazenamento relacional</li>
              </ul>
              
              <h2>3. Estrutura de Entidades Principais</h2>
              <ul>
                <li><strong>Médicos:</strong> Cadastro completo de profissionais</li>
                <li><strong>Empresas:</strong> Gestão de empresas prestadoras de serviço</li>
                <li><strong>Hospitais:</strong> Locais onde são realizados os plantões</li>
                <li><strong>Plantões:</strong> Registro de plantões realizados</li>
                <li><strong>Contratos:</strong> Acordos entre empresas e hospitais</li>
                <li><strong>Procedimentos:</strong> Procedimentos particulares realizados</li>
                <li><strong>Cálculos:</strong> Processamento de produção e pró-labores</li>
              </ul>
              
              <h2>4. Módulos do Sistema</h2>
              <ul>
                <li><strong>Dashboard:</strong> Visão geral com métricas e gráficos</li>
                <li><strong>Cadastros:</strong> Gestão de entidades principais</li>
                <li><strong>Lançamentos:</strong> Registro de atividades e valores</li>
                <li><strong>Financeiro:</strong> Cálculos e processamentos</li>
                <li><strong>Relatórios:</strong> Geração de documentos e análises</li>
                <li><strong>Administração:</strong> Configurações e permissões</li>
              </ul>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Aspectos Técnicos
              <Terminal className="ml-2 h-5 w-5" />
            </CardTitle>
            <CardDescription>
              Detalhes técnicos da implementação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="prose max-w-none">
                <h3>Tecnologias Utilizadas</h3>
                <ul>
                  <li><strong>Frontend:</strong> React, Vite, Tailwind CSS, Shadcn/UI</li>
                  <li><strong>Backend:</strong> Python, FastAPI, SQLAlchemy</li>
                  <li><strong>Banco de Dados:</strong> PostgreSQL</li>
                  <li><strong>Autenticação:</strong> JWT (JSON Web Tokens)</li>
                  <li><strong>Deploy:</strong> Render.com (CI/CD automatizado)</li>
                </ul>
                
                <h3>Estrutura de Diretórios</h3>
                <ul>
                  <li><strong>/frontend</strong> - Aplicação React</li>
                  <li><strong>/backend</strong> - API e lógica de negócios</li>
                  <li><strong>/docs</strong> - Documentação adicional</li>
                </ul>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Infraestrutura
              <Cloud className="ml-2 h-5 w-5" />
            </CardTitle>
            <CardDescription>
              Detalhes sobre hospedagem e serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="prose max-w-none">
                <h3>Ambiente de Produção</h3>
                <ul>
                  <li><strong>Hospedagem:</strong> Render.com</li>
                  <li><strong>Frontend:</strong> Static Site (React/Vite)</li>
                  <li><strong>Backend:</strong> Web Service (Python/FastAPI)</li>
                  <li><strong>Banco de Dados:</strong> PostgreSQL gerenciado</li>
                  <li><strong>SSL/HTTPS:</strong> Certificados automáticos</li>
                  <li><strong>CI/CD:</strong> Deploy automático via GitHub</li>
                </ul>
                
                <h3>Monitoramento</h3>
                <ul>
                  <li>Logs centralizados</li>
                  <li>Métricas de performance</li>
                  <li>Alertas automáticos</li>
                </ul>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentacaoTecnica;

