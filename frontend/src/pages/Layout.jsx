

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Hospital,
  FileText,
  Calculator,
  DollarSign,
  BarChart3,
  Settings,
  Stethoscope,
  Calendar,
  Receipt,
  Paperclip,
  Shield,
  Briefcase,
  BadgeDollarSign,
  Percent,
  FileBadge,
  UserCog,
  UploadCloud,
  FileSliders,
  Combine,
  ListChecks,
  BookOpen // Added BookOpen icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { PermissionProvider, PermissionGuard, PERMISSIONS, usePermissions } from "@/components/auth/PermissionChecker";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    group: "principal",
    permission: PERMISSIONS.DASHBOARD_VIEW
  },
  {
    title: "Médicos",
    url: createPageUrl("Medicos"),
    icon: Stethoscope,
    group: "cadastros",
    permission: PERMISSIONS.MEDICOS_LISTAR
  },
  {
    title: "Empresas",
    url: createPageUrl("Empresas"),
    icon: Building2,
    group: "cadastros",
    permission: PERMISSIONS.EMPRESAS_LISTAR
  },
  {
    title: "Hospitais",
    url: createPageUrl("Hospitais"),
    icon: Hospital,
    group: "cadastros",
    permission: PERMISSIONS.HOSPITAIS_LISTAR
  },
  {
    title: "Tipos de Plantão",
    url: createPageUrl("TiposPlantao"),
    icon: ListChecks,
    group: "cadastros",
    permission: PERMISSIONS.TIPOS_PLANTAO_LISTAR
  },
  {
    title: "Contratos",
    url: createPageUrl("Contratos"),
    icon: FileText,
    group: "cadastros",
    permission: PERMISSIONS.CONTRATOS_LISTAR
  },
  {
    title: "Plantões",
    url: createPageUrl("Plantoes"),
    icon: Calendar,
    group: "lancamentos",
    permission: PERMISSIONS.PLANTOES_LISTAR
  },
  {
    title: "Proced. Particulares",
    url: createPageUrl("ProcedimentosParticulares"),
    icon: Paperclip,
    group: "lancamentos",
    permission: PERMISSIONS.PROCEDIMENTOS_LISTAR
  },
  {
    title: "Prod. Administrativa",
    url: createPageUrl("ProducaoAdministrativa"),
    icon: Briefcase,
    group: "lancamentos",
    permission: PERMISSIONS.PROD_ADMIN_LISTAR
  },
  {
    title: "Pró-labores",
    url: createPageUrl("ProLabores"),
    icon: BadgeDollarSign,
    group: "lancamentos",
    permission: PERMISSIONS.PROLABORE_LISTAR
  },
  {
    title: "Descontos/Créditos",
    url: createPageUrl("DescontosCreditos"),
    icon: Receipt,
    group: "lancamentos",
    permission: PERMISSIONS.DESCONTOS_CREDITOS_LISTAR
  },
  {
    title: "Vínculos Fiscais",
    url: createPageUrl("VinculosFiscaisMedicos"),
    icon: Building2, // Reutilizando para representar vínculos com outras entidades
    group: "lancamentos", // Mantido em lançamentos pois é um dado de suporte a eles
    permission: PERMISSIONS.VINCULOS_FISCAIS_GERENCIAR
  },
  {
    title: "Cálculo de Produção", // Novo nome da página CalculoProducaoPage
    url: createPageUrl("CalculoProducaoPage"), // URL ajustada
    icon: Combine, // Ícone ajustado
    group: "financeiro",
    permission: PERMISSIONS.CALCULOS_PRODUCAO_GERENCIAR // Permissão existente
  },
  {
    title: "Cálculo de Pró-Labore", // Novo nome da página CalculoProLaborePage
    url: createPageUrl("CalculoProLaborePage"), // URL ajustada
    icon: Calculator, // Ícone mantido
    group: "financeiro",
    permission: PERMISSIONS.CALCULOS_PROLABORE_GERENCIAR // Permissão existente
  },
  {
    title: "Relatórios", // Nome da página RelatoriosPage
    url: createPageUrl("RelatoriosPage"), // URL ajustada
    icon: BarChart3, // Ícone mantido
    group: "relatorios", // Agrupamento mantido
    permission: PERMISSIONS.RELATORIOS_VIEW // Permissão existente
  },
  {
    title: "Documentação Técnica",
    url: createPageUrl("DocumentacaoTecnica"),
    icon: BookOpen, // Ícone para documentação
    group: "administracao", // Adicionado ao grupo de administração
    permission: PERMISSIONS.USUARIOS_GERENCIAR // Reutilizando uma permissão de admin por ora
  },
  {
    title: "Parâmetros PDF",
    url: createPageUrl("ParametrosPDF"),
    icon: FileSliders,
    group: "administracao",
    permission: PERMISSIONS.USUARIOS_GERENCIAR
  },
  {
    title: "Tabelas INSS",
    url: createPageUrl("TabelasINSS"),
    icon: Percent,
    group: "tabelas_fiscais",
    permission: PERMISSIONS.TABELAS_INSS_GERENCIAR
  },
  {
    title: "Tabelas IRRF",
    url: createPageUrl("TabelasIRRF"),
    icon: FileBadge,
    group: "tabelas_fiscais",
    permission: PERMISSIONS.TABELAS_IRRF_GERENCIAR
  },
  {
    title: "Parâmetros Fiscais",
    url: createPageUrl("ParametrosFiscaisEmpresaPage"),
    icon: FileSliders,
    group: "tabelas_fiscais",
    permission: PERMISSIONS.PARAMETROS_FISCAIS_GERENCIAR
  },
  {
    title: "Importar/Exportar",
    url: createPageUrl("ImportacaoExportacao"),
    icon: UploadCloud,
    group: "administracao",
    permission: PERMISSIONS.DADOS_IMPORTAR_EXPORTAR
  },
  {
    title: "Usuários",
    url: createPageUrl("Usuarios"),
    icon: UserCog,
    group: "administracao",
    permission: PERMISSIONS.USUARIOS_GERENCIAR
  },
  {
    title: "Grupos de Acesso",
    url: createPageUrl("GruposAcesso"),
    icon: Shield,
    group: "administracao",
    permission: PERMISSIONS.GRUPOS_GERENCIAR
  }
];

const groupLabels = {
  principal: "Principal",
  cadastros: "Cadastros",
  lancamentos: "Lançamentos",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  tabelas_fiscais: "Tabelas Fiscais",
  administracao: "Administração"
};

// Componente interno para o conteúdo do Layout que precisa de permissões
function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const { isLoading: permissionsLoading } = usePermissions(); // Corrigido para usar alias

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider> {/* Adicionado SidebarProvider conforme estrutura do Shadcn UI Sidebar */}
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200 bg-white shadow-lg">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              {/* Logo e Nome do App */}
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-800">Hospitalia</h2>
                <p className="text-sm text-slate-500 font-medium">Produção Médica</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            {Object.entries(groupedItems).map(([group, items]) => {
              const itemsToRender = items.map((item) => (
                <PermissionGuard key={item.title} permission={item.permission} fallback={null}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 mx-2 ${
                        location.pathname === item.url
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700 hover:text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </PermissionGuard>
              ));

              // Filtrar itens nulos (sem permissão)
              const visibleItems = itemsToRender.filter(item => item !== null);
              if (visibleItems.length === 0) return null; // Não renderizar o grupo se não houver itens visíveis

              return (
                <SidebarGroup key={group}>
                  <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                    {groupLabels[group]}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            {/* Informações do Usuário */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">U</span> {/* Placeholder para avatar */}
              </div>
              <div className="flex-1 min-w-0"> {/* Garante que o texto não estoure o container */}
                <p className="font-semibold text-slate-800 text-sm truncate">Usuário</p>
                <p className="text-xs text-slate-500 truncate">admin@hospitalia.com</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {/* Header para mobile com botão de menu */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-800">Hospitalia</h1>
            </div>
          </header>

          {/* Conteúdo da Página */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Layout principal que agora envolve tudo com PermissionProvider
export default function Layout({ children, currentPageName }) {
  return (
    <PermissionProvider>
      <LayoutContent currentPageName={currentPageName}>
        {children}
      </LayoutContent>
    </PermissionProvider>
  );
}

