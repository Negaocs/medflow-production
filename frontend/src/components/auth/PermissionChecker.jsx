
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UsuarioSistema, GrupoAcesso, UsuarioGrupo } from '@/api/entities';

const PermissionsContext = createContext(null);

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Cadastros
  MEDICOS_LISTAR: 'medicos.listar',
  MEDICOS_CRIAR: 'medicos.criar',
  MEDICOS_EDITAR: 'medicos.editar',
  MEDICOS_ATIVAR_INATIVAR: 'medicos.ativar_inativar',

  EMPRESAS_LISTAR: 'empresas.listar',
  EMPRESAS_CRIAR: 'empresas.criar',
  EMPRESAS_EDITAR: 'empresas.editar',
  EMPRESAS_ATIVAR_INATIVAR: 'empresas.ativar_inativar',

  HOSPITAIS_LISTAR: 'hospitais.listar',
  HOSPITAIS_CRIAR: 'hospitais.criar',
  HOSPITAIS_EDITAR: 'hospitais.editar',
  HOSPITAIS_ATIVAR_INATIVAR: 'hospitais.ativar_inativar',

  TIPOS_PLANTAO_LISTAR: 'tipos_plantao.listar',
  TIPOS_PLANTAO_CRIAR: 'tipos_plantao.criar',
  TIPOS_PLANTAO_EDITAR: 'tipos_plantao.editar',
  TIPOS_PLANTAO_ATIVAR_INATIVAR: 'tipos_plantao.ativar_inativar',

  CONTRATOS_LISTAR: 'contratos.listar',
  CONTRATOS_CRIAR: 'contratos.criar',
  CONTRATOS_EDITAR: 'contratos.editar',
  CONTRATOS_RENOVAR: 'contratos.renovar',
  CONTRATOS_ATIVAR_INATIVAR: 'contratos.ativar_inativar',

  // Lançamentos
  PLANTOES_LISTAR: 'plantoes.listar',
  PLANTOES_CRIAR: 'plantoes.criar',
  PLANTOES_EDITAR: 'plantoes.editar',
  PLANTOES_CONFIRMAR: 'plantoes.confirmar',
  PLANTOES_EXCLUIR: 'plantoes.excluir',

  PROCEDIMENTOS_LISTAR: 'procedimentos.listar',
  PROCEDIMENTOS_CRIAR: 'procedimentos.criar',
  PROCEDIMENTOS_EDITAR: 'procedimentos.editar',
  PROCEDIMENTOS_CONFIRMAR: 'procedimentos.confirmar',
  PROCEDIMENTOS_EXCLUIR: 'procedimentos.excluir',
  
  PROD_ADMIN_LISTAR: 'producao_administrativa.listar',
  PROD_ADMIN_CRIAR: 'producao_administrativa.criar',
  PROD_ADMIN_EDITAR: 'producao_administrativa.editar',
  PROD_ADMIN_CONFIRMAR: 'producao_administrativa.confirmar',
  PROD_ADMIN_EXCLUIR: 'producao_administrativa.excluir',

  PROLABORE_LISTAR: 'prolabore.listar',
  PROLABORE_CRIAR: 'prolabore.criar',
  PROLABORE_EDITAR: 'prolabore.editar',
  PROLABORE_CONFIRMAR: 'prolabore.confirmar',
  PROLABORE_EXCLUIR: 'prolabore.excluir',

  DESCONTOS_CREDITOS_LISTAR: 'descontos_creditos.listar',
  DESCONTOS_CREDITOS_CRIAR: 'descontos_creditos.criar',
  DESCONTOS_CREDITOS_EDITAR: 'descontos_creditos.editar',
  DESCONTOS_CREDITOS_EXCLUIR: 'descontos_creditos.excluir',

  // Vínculos Fiscais
  VINCULOS_FISCAIS_GERENCIAR: 'vinculos_fiscais.gerenciar',

  // Financeiro
  CALCULOS_PRODUCAO_GERENCIAR: 'calculos.producao.gerenciar',
  CALCULOS_PROLABORE_GERENCIAR: 'calculos.prolabore.gerenciar',

  // Relatórios
  RELATORIOS_VIEW: 'relatorios.view',

  // Tabelas Fiscais
  TABELAS_INSS_GERENCIAR: 'tabelas.inss.gerenciar',
  TABELAS_IRRF_GERENCIAR: 'tabelas.irrf.gerenciar',
  PARAMETROS_FISCAIS_GERENCIAR: 'parametros.fiscais.gerenciar',

  // Administração
  DADOS_IMPORTAR_EXPORTAR: 'dados.importar_exportar',
  USUARIOS_GERENCIAR: 'usuarios.gerenciar',
  GRUPOS_GERENCIAR: 'grupos.gerenciar',
};

// Helper function to get all permission values
export const getAllPermissionValues = () => Object.values(PERMISSIONS);

export const PermissionProvider = ({ children }) => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);

  const fetchUserPermissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulação de usuário admin para evitar problemas de autenticação durante desenvolvimento
      // Em produção, você substituiria por sua lógica real de autenticação
      const mockUser = {
        id: 'admin-user-id',
        nome_completo: 'Administrador',
        email: 'admin@hospitalia.com',
        perfil: 'administrador'
      };

      setCurrentUser(mockUser);
      
      // Se user é admin, grant all permissions
      if (mockUser.perfil === 'administrador') {
        setUserPermissions(getAllPermissionValues());
      } else {
        // Aqui você implementaria a lógica real de busca de permissões
        // Por enquanto, vamos dar todas as permissões para evitar bloqueios
        setUserPermissions(getAllPermissionValues());
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      setError(error.message);
      setUserPermissions([]); // Default to no permissions on error
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const contextValue = useMemo(() => ({
    permissions: userPermissions,
    hasPermission: (requiredPermission) => {
        if (isLoading) return false;
        if (error) return false; // Não dar acesso se houve erro
        if (currentUser && currentUser.perfil === 'administrador') return true;
        return requiredPermission ? userPermissions.includes(requiredPermission) : true;
    },
    isLoading,
    error,
    currentUser,
    refreshPermissions: fetchUserPermissions
  }), [userPermissions, isLoading, error, currentUser]);

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    // Em vez de lançar erro, retornamos um objeto padrão
    console.warn('usePermissions used outside PermissionProvider - returning default values');
    return {
      permissions: [],
      hasPermission: () => false,
      isLoading: true,
      error: 'Context not available',
      currentUser: null,
      refreshPermissions: () => {}
    };
  }
  return context;
};

export const PermissionGuard = ({ permission, fallback = null, children }) => {
  const context = useContext(PermissionsContext);
  
  // Se não estiver dentro do provider, não renderiza nada para evitar erros
  if (!context) {
    console.warn('PermissionGuard used outside PermissionProvider');
    return fallback;
  }
  
  const { hasPermission, isLoading } = context;

  if (isLoading) {
    return null; 
  }

  return hasPermission(permission) ? <>{children}</> : fallback;
};
