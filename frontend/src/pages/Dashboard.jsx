import React, { useState, useEffect } from "react";
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
import { Medico, Empresa, Hospital as HospitalEntity, Plantao, ProcedimentoParticular, ProducaoAdministrativa } from "@/api/entities";
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

const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? { value: "+100%", icon: ArrowUp, color: "text-green-600" } : { value: "0%", icon: Minus, color: "text-slate-500" };
  }
  if (current === previous) return { value: "0%", icon: Minus, color: "text-slate-500" };
  const change = ((current - previous) / previous) * 100;
  const icon = change > 0 ? ArrowUp : ArrowDown;
  const color = change > 0 ? "text-green-600" : "text-red-600";
  return { value: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`, icon, color };
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    novosMedicosMes: 0,
    novosMedicosMesComparison: { value: "0%", icon: Minus, color: "text-slate-500" },
    novasEmpresasMes: 0,
    novasEmpresasMesComparison: { value: "0%", icon: Minus, color: "text-slate-500" },
    novosHospitaisMes: 0,
    novosHospitaisMesComparison: { value: "0%", icon: Minus, color: "text-slate-500" },
    totalPlantoesMes: 0,
    totalPlantoesMesComparison: { value: "0%", icon: Minus, color: "text-slate-500" },
    producaoFinanceiraMes: 0,
    producaoFinanceiraMesComparison: { value: "0%", icon: Minus, color: "text-slate-500" },
    plantoesConfirmadosMes: 0,
    plantoesPendentesMes: 0,
    totalProcedimentosMes: 0,
    totalProcedimentosMesComparison: { value: "0%", icon: Minus, color: "text-slate-500" },
    valorProcedimentosMes: 0,
    totalProducaoAdmMes: 0,
    totalProducaoAdmMesComparison: { value: "0%", icon: Minus, color: "text-slate-500" },
    valorProducaoAdmMes: 0,
  });
  const [atividadesRecentes, setAtividadesRecentes] = useState([]);
  const [producaoFinanceiraHistorico, setProducaoFinanceiraHistorico] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthDisplay, setCurrentMonthDisplay] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getProducaoFinanceiraMensal = (plantoes, procedimentos, producaoAdm, mesISO) => {
    const plantoesDoMes = plantoes.filter(p => p.competencia === mesISO);
    const procedimentosDoMes = procedimentos.filter(p => p.competencia === mesISO);
    const producaoAdmDoMes = producaoAdm.filter(p => p.competencia === mesISO);
    
    const valorPlantoes = plantoesDoMes.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    const valorProcedimentos = procedimentosDoMes.reduce((sum, p) => sum + (p.valor_liquido_repasse || 0), 0);
    const valorProducaoAdm = producaoAdmDoMes.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    
    return valorPlantoes + valorProcedimentos + valorProducaoAdm;
  };

  const countNewRecordsInMonth = (records, monthISO) => {
    const monthStartDate = startOfMonth(parseISO(`${monthISO}-01`));
    const monthEndDate = endOfMonth(parseISO(`${monthISO}-01`));
    return records.filter(r => {
      const createdDate = parseISO(r.created_date);
      return createdDate >= monthStartDate && createdDate <= monthEndDate;
    }).length;
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const currentMonthISO = format(today, "yyyy-MM");
      const previousMonthISO = format(subMonths(today, 1), "yyyy-MM");
      setCurrentMonthDisplay(format(parseISO(`${currentMonthISO}-01`), "MMMM/yyyy", { locale: ptBR }));

      const [
        medicosData, 
        empresasData, 
        hospitaisData, 
        allPlantoes,
        allProcedimentos,
        allProducaoAdm
      ] = await Promise.all([
        Medico.list(null, 10000),
        Empresa.list(null, 10000),
        HospitalEntity.list(null, 10000),
        Plantao.list(null, 10000),
        ProcedimentoParticular.list(null, 10000),
        ProducaoAdministrativa.list(null, 10000)
      ]);

      // Dados do Mês Atual
      const plantoesMesAtual = allPlantoes.filter(p => p.competencia === currentMonthISO);
      const procedimentosMesAtual = allProcedimentos.filter(p => p.competencia === currentMonthISO);
      const producaoAdmMesAtual = allProducaoAdm.filter(p => p.competencia === currentMonthISO);

      const producaoFinanceiraMesAtual = getProducaoFinanceiraMensal(allPlantoes, allProcedimentos, allProducaoAdm, currentMonthISO);
      const novosMedicosMesAtual = countNewRecordsInMonth(medicosData, currentMonthISO);
      const novasEmpresasMesAtual = countNewRecordsInMonth(empresasData, currentMonthISO);
      const novosHospitaisMesAtual = countNewRecordsInMonth(hospitaisData, currentMonthISO);
      
      // Dados do Mês Anterior para Comparação
      const plantoesMesAnterior = allPlantoes.filter(p => p.competencia === previousMonthISO);
      const procedimentosMesAnterior = allProcedimentos.filter(p => p.competencia === previousMonthISO);
      const producaoAdmMesAnterior = allProducaoAdm.filter(p => p.competencia === previousMonthISO);
      
      const producaoFinanceiraMesAnterior = getProducaoFinanceiraMensal(allPlantoes, allProcedimentos, allProducaoAdm, previousMonthISO);
      const novosMedicosMesAnterior = countNewRecordsInMonth(medicosData, previousMonthISO);
      const novasEmpresasMesAnterior = countNewRecordsInMonth(empresasData, previousMonthISO);
      const novosHospitaisMesAnterior = countNewRecordsInMonth(hospitaisData, previousMonthISO);

      setStats({
        novosMedicosMes: novosMedicosMesAtual,
        novosMedicosMesComparison: calculatePercentageChange(novosMedicosMesAtual, novosMedicosMesAnterior),
        novasEmpresasMes: novasEmpresasMesAtual,
        novasEmpresasMesComparison: calculatePercentageChange(novasEmpresasMesAtual, novasEmpresasMesAnterior),
        novosHospitaisMes: novosHospitaisMesAtual,
        novosHospitaisMesComparison: calculatePercentageChange(novosHospitaisMesAtual, novosHospitaisMesAnterior),
        
        totalPlantoesMes: plantoesMesAtual.length,
        totalPlantoesMesComparison: calculatePercentageChange(plantoesMesAtual.length, plantoesMesAnterior.length),
        producaoFinanceiraMes: producaoFinanceiraMesAtual,
        producaoFinanceiraMesComparison: calculatePercentageChange(producaoFinanceiraMesAtual, producaoFinanceiraMesAnterior),
        
        plantoesConfirmadosMes: plantoesMesAtual.filter(p => p.confirmado).length,
        plantoesPendentesMes: plantoesMesAtual.filter(p => !p.confirmado).length,
        
        totalProcedimentosMes: procedimentosMesAtual.length,
        totalProcedimentosMesComparison: calculatePercentageChange(procedimentosMesAtual.length, procedimentosMesAnterior.length),
        valorProcedimentosMes: procedimentosMesAtual.reduce((total, p) => total + (p.valor_liquido_repasse || 0), 0),
        
        totalProducaoAdmMes: producaoAdmMesAtual.length,
        totalProducaoAdmMesComparison: calculatePercentageChange(producaoAdmMesAtual.length, producaoAdmMesAnterior.length),
        valorProducaoAdmMes: producaoAdmMesAtual.reduce((total, p) => total + (p.valor_total || 0), 0),
      });

      // Histórico de Produção Financeira (Últimos 6 meses)
      const historico = [];
      for (let i = 5; i >= 0; i--) {
        const mesParaHistoricoDate = subMonths(today, i);
        const mesParaHistoricoISO = format(mesParaHistoricoDate, "yyyy-MM");
        const valorMes = getProducaoFinanceiraMensal(allPlantoes, allProcedimentos, allProducaoAdm, mesParaHistoricoISO);
        historico.push({
          name: format(mesParaHistoricoDate, "MMM/yy", { locale: ptBR }),
          "Produção Financeira": valorMes,
        });
      }
      setProducaoFinanceiraHistorico(historico);

      // Atividades Recentes
      const recentes = [];
      const ultimosPlantoes = await Plantao.list("-created_date", 2);
      ultimosPlantoes.forEach(p => {
        const medico = medicosData.find(m => m.id === p.medico_id);
        recentes.push({
          tipo: "Plantão",
          descricao: `Novo plantão para ${medico?.nome || 'Médico N/A'}`,
          data: p.created_date,
          icon: Calendar,
          color: "bg-blue-500"
        });
      });

      const ultimosMedicos = await Medico.list("-created_date", 2);
      ultimosMedicos.forEach(m => {
        recentes.push({
          tipo: "Médico",
          descricao: `Médico ${m.nome} cadastrado`,
          data: m.created_date,
          icon: Stethoscope,
          color: "bg-green-500"
        });
      });
      
      const ultimoProcedimento = await ProcedimentoParticular.list("-created_date", 1);
      if (ultimoProcedimento.length > 0) {
        const proc = ultimoProcedimento[0];
        const medico = medicosData.find(m => m.id === proc.medico_id);
        recentes.push({
          tipo: "Procedimento",
          descricao: `Proced. ${proc.nome_paciente} por ${medico?.nome || 'Médico N/A'}`,
          data: proc.created_date,
          icon: Paperclip,
          color: "bg-purple-500"
        });
      }
      setAtividadesRecentes(recentes.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5));

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, comparison, isLoading }) => (
    <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        {Icon && (
          <div className={`p-2 rounded-lg ${color || 'bg-slate-500'}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800">
          {isLoading ? (
            <div className="animate-pulse bg-slate-200 h-8 w-16 rounded"></div>
          ) : (
            value
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        {!isLoading && comparison && (
          <div className={`text-xs flex items-center mt-1 ${comparison.color}`}>
            <comparison.icon className="w-3 h-3 mr-1" />
            {comparison.value} vs mês anterior
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ActivityItem = ({ icon: Icon, color, title, timeAgo }) => (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{timeAgo}</p>
      </div>
    </div>
  );
  
  const timeSince = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos atrás";
    return Math.floor(seconds) + " segundos atrás";
  };


  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Visão geral da produção médica e indicadores para {currentMonthDisplay || "o mês atual"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Novos Médicos (Mês)"
          value={stats.novosMedicosMes}
          icon={Users}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          comparison={stats.novosMedicosMesComparison}
          isLoading={isLoading}
        />
        <StatCard
          title="Novas Empresas (Mês)"
          value={stats.novasEmpresasMes}
          icon={Building2}
          color="bg-gradient-to-r from-teal-500 to-teal-600"
          comparison={stats.novasEmpresasMesComparison}
          isLoading={isLoading}
        />
        <StatCard
          title="Novos Hospitais (Mês)"
          value={stats.novosHospitaisMes}
          icon={HospitalIcon}
          color="bg-gradient-to-r from-sky-500 to-sky-600"
          comparison={stats.novosHospitaisMesComparison}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Plantões (Mês)"
          value={stats.totalPlantoesMes}
          icon={Calendar}
          color="bg-gradient-to-r from-amber-500 to-amber-600"
          comparison={stats.totalPlantoesMesComparison}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <DollarSign className="h-5 w-5 text-green-600" />
              Produção Financeira ({currentMonthDisplay})
            </CardTitle>
            <CardDescription className="flex items-center">
              Soma de Plantões, Procedimentos (líquido) e Produção Administrativa.
              {!isLoading && stats.producaoFinanceiraMesComparison && (
                <span className={`ml-2 text-xs flex items-center ${stats.producaoFinanceiraMesComparison.color}`}>
                  <stats.producaoFinanceiraMesComparison.icon className="w-3 h-3 mr-1" />
                  {stats.producaoFinanceiraMesComparison.value} vs mês anterior
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-green-600">
                {isLoading ? (
                  <div className="animate-pulse bg-slate-200 h-10 w-48 mx-auto rounded"></div>
                ) : (
                  formatCurrency(stats.producaoFinanceiraMes)
                )}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">PLANTÕES CONFIRMADOS</p>
                <p className="text-xl font-semibold text-green-800">{isLoading ? '-' : stats.plantoesConfirmadosMes}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700 font-medium">PLANTÕES PENDENTES</p>
                <p className="text-xl font-semibold text-yellow-800">{isLoading ? '-' : stats.plantoesPendentesMes}</p>
              </div>
               <div className="text-center p-3 bg-sky-50 rounded-lg">
                <p className="text-xs text-sky-700 font-medium">PROCEDIMENTOS (MÊS)</p>
                <p className="text-xl font-semibold text-sky-800">{isLoading ? '-' : stats.totalProcedimentosMes}</p>
                <p className="text-sm text-sky-600">
                    {isLoading ? '-' : formatCurrency(stats.valorProcedimentosMes)}
                    {!isLoading && stats.totalProcedimentosMesComparison && (
                        <span className={`ml-1 text-xs flex items-center justify-center ${stats.totalProcedimentosMesComparison.color}`}>
                            <stats.totalProcedimentosMesComparison.icon className="w-2.5 h-2.5 mr-0.5" />
                            {stats.totalProcedimentosMesComparison.value}
                        </span>
                    )}
                </p>
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-indigo-50 rounded-lg sm:col-start-2">
                <p className="text-xs text-indigo-700 font-medium">PROD. ADMIN. (MÊS)</p>
                <p className="text-xl font-semibold text-indigo-800">{isLoading ? '-' : stats.totalProducaoAdmMes}</p>
                <p className="text-sm text-indigo-600">
                    {isLoading ? '-' : formatCurrency(stats.valorProducaoAdmMes)}
                     {!isLoading && stats.totalProducaoAdmMesComparison && (
                        <span className={`ml-1 text-xs flex items-center justify-center ${stats.totalProducaoAdmMesComparison.color}`}>
                            <stats.totalProducaoAdmMesComparison.icon className="w-2.5 h-2.5 mr-0.5" />
                            {stats.totalProducaoAdmMesComparison.value}
                        </span>
                    )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Clock className="h-5 w-5 text-blue-600" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading && Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
            {!isLoading && atividadesRecentes.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Nenhuma atividade recente para mostrar.</p>
            )}
            {!isLoading && atividadesRecentes.map((activity, index) => (
              <ActivityItem
                key={index}
                icon={activity.icon}
                color={activity.color}
                title={activity.descricao}
                timeAgo={timeSince(activity.data)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Histórico de Produção Financeira (Últimos 6 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80"> {/* Definir uma altura para o container do gráfico */}
          {isLoading ? (
            <div className="animate-pulse bg-slate-200 h-full w-full rounded-lg"></div>
          ) : producaoFinanceiraHistorico.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={producaoFinanceiraHistorico} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip formatter={(value) => [formatCurrency(value), "Produção"]} labelStyle={{color: '#334155'}} itemStyle={{color: '#8b5cf6'}}/>
                <Legend wrapperStyle={{fontSize: "14px"}}/>
                <Line type="monotone" dataKey="Produção Financeira" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500 text-center py-10">Dados insuficientes para exibir o histórico.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}