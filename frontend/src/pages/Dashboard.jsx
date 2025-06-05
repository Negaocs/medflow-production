import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
  Hospital as HospitalIcon, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Paperclip,
  Briefcase,
  Stethoscope,
  BarChartHorizontalBig,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { Medico, Empresa } from "@/api/entities";
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return "R$ 0,00";
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Dados simulados para o dashboard
const simulateData = () => {
  // Dados de hospitais simulados
  const hospitais = [
    { id: 'hosp-1', nome: 'Hospital São Lucas', cidade: 'São Paulo', estado: 'SP' },
    { id: 'hosp-2', nome: 'Hospital Santa Casa', cidade: 'Rio de Janeiro', estado: 'RJ' }
  ];
  
  // Dados de plantões simulados
  const plantoes = [
    { id: 'plant-1', medico_id: 'med-1', hospital_id: 'hosp-1', data_inicio: '2023-05-01T08:00:00', data_fim: '2023-05-01T20:00:00', valor: 1200.00 },
    { id: 'plant-2', medico_id: 'med-2', hospital_id: 'hosp-1', data_inicio: '2023-05-02T20:00:00', data_fim: '2023-05-03T08:00:00', valor: 1500.00 }
  ];
  
  // Dados de procedimentos particulares simulados
  const procedimentosParticulares = [
    { id: 'proc-1', medico_id: 'med-1', paciente: 'Carlos Oliveira', data: '2023-05-10', procedimento: 'Consulta', valor: 300.00 },
    { id: 'proc-2', medico_id: 'med-2', paciente: 'Ana Silva', data: '2023-05-12', procedimento: 'Exame', valor: 500.00 }
  ];
  
  // Dados de produção administrativa simulados
  const producaoAdministrativa = [
    { id: 'prod-1', medico_id: 'med-1', empresa_id: 'emp-1', data: '2023-05-15', descricao: 'Reunião administrativa', valor: 200.00 },
    { id: 'prod-2', medico_id: 'med-2', empresa_id: 'emp-1', data: '2023-05-20', descricao: 'Treinamento de equipe', valor: 350.00 }
  ];
  
  return { hospitais, plantoes, procedimentosParticulares, producaoAdministrativa };
};

export default function Dashboard() {
  // Obter dados simulados
  const { hospitais, plantoes, procedimentosParticulares, producaoAdministrativa } = simulateData();
  
  // Calcular estatísticas
  const totalMedicos = 15; // Simulado
  const totalEmpresas = 5; // Simulado
  const totalHospitais = hospitais.length;
  const totalPlantoes = plantoes.length;
  const totalProcedimentos = procedimentosParticulares.length;
  const totalProducao = producaoAdministrativa.length;
  
  // Calcular valores financeiros
  const valorTotalPlantoes = plantoes.reduce((total, plantao) => total + plantao.valor, 0);
  const valorTotalProcedimentos = procedimentosParticulares.reduce((total, proc) => total + proc.valor, 0);
  const valorTotalProducao = producaoAdministrativa.reduce((total, prod) => total + prod.valor, 0);
  const valorTotalGeral = valorTotalPlantoes + valorTotalProcedimentos + valorTotalProducao;
  
  // Dados para o gráfico
  const chartData = [
    { name: 'Jan', plantoes: 12000, procedimentos: 5000, producao: 3000 },
    { name: 'Fev', plantoes: 15000, procedimentos: 6000, producao: 2500 },
    { name: 'Mar', plantoes: 18000, procedimentos: 7500, producao: 4000 },
    { name: 'Abr', plantoes: 16000, procedimentos: 8000, producao: 3500 },
    { name: 'Mai', plantoes: 20000, procedimentos: 9000, producao: 5000 },
    { name: 'Jun', plantoes: 22000, procedimentos: 8500, producao: 4500 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da produção médica e financeira
        </p>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMedicos}</div>
            <p className="text-xs text-muted-foreground">
              Médicos cadastrados no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmpresas}</div>
            <p className="text-xs text-muted-foreground">
              Empresas parceiras
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hospitais</CardTitle>
            <HospitalIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHospitais}</div>
            <p className="text-xs text-muted-foreground">
              Hospitais conveniados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalGeral)}</div>
            <p className="text-xs text-muted-foreground">
              Produção total no período
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de produção */}
      <Card>
        <CardHeader>
          <CardTitle>Produção Financeira</CardTitle>
          <CardDescription>
            Evolução da produção financeira nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="plantoes"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Plantões"
                />
                <Line
                  type="monotone"
                  dataKey="procedimentos"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Procedimentos"
                />
                <Line
                  type="monotone"
                  dataKey="producao"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Produção Adm."
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Cards de produção detalhada */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plantões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalPlantoes)}</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{totalPlantoes} plantões realizados</span>
              <span className="flex items-center text-sm text-green-500">
                <ArrowUp className="h-4 w-4 mr-1" />
                12%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procedimentos</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalProcedimentos)}</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{totalProcedimentos} procedimentos realizados</span>
              <span className="flex items-center text-sm text-green-500">
                <ArrowUp className="h-4 w-4 mr-1" />
                8%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produção Administrativa</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalProducao)}</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{totalProducao} atividades registradas</span>
              <span className="flex items-center text-sm text-red-500">
                <ArrowDown className="h-4 w-4 mr-1" />
                3%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Status de tarefas */}
      <Card>
        <CardHeader>
          <CardTitle>Status de Tarefas</CardTitle>
          <CardDescription>
            Visão geral das tarefas pendentes e concluídas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span>Plantões pendentes de aprovação</span>
              </div>
              <span className="font-medium">5</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Plantões aprovados este mês</span>
              </div>
              <span className="font-medium">28</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Cálculos pendentes</span>
              </div>
              <span className="font-medium">3</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <span>Relatórios gerados este mês</span>
              </div>
              <span className="font-medium">12</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

