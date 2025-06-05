import { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioSistema } from '../api/entities';

// Criar contexto de autenticação
const AuthContext = createContext();

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provedor de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('medflow_user');
        const storedToken = localStorage.getItem('medflow_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Função para fazer login
  const login = async (email, senha) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular uma chamada de API para autenticação
      const usuarios = await UsuarioSistema.list();
      const usuario = usuarios.find(u => u.email === email);
      
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      // Simular verificação de senha (em produção, usar bcrypt ou similar)
      const senhaHash = btoa(senha + "salt_medflow_2024"); // Base64 simples para demonstração
      
      if (usuario.senha_hash !== senhaHash) {
        throw new Error('Senha incorreta');
      }
      
      if (!usuario.ativo) {
        throw new Error('Usuário está inativo');
      }
      
      // Gerar token simulado
      const token = btoa(JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
      }));
      
      // Remover senha_hash antes de armazenar no estado
      const { senha_hash, ...userWithoutPassword } = usuario;
      
      // Salvar no localStorage
      localStorage.setItem('medflow_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('medflow_token', token);
      
      // Atualizar estado
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      
      return userWithoutPassword;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer logout
  const logout = () => {
    localStorage.removeItem('medflow_user');
    localStorage.removeItem('medflow_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Função para verificar se o token está expirado
  const isTokenExpired = () => {
    try {
      const token = localStorage.getItem('medflow_token');
      if (!token) return true;
      
      const { exp } = JSON.parse(atob(token));
      return Date.now() > exp;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true;
    }
  };

  // Verificar expiração do token periodicamente
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkTokenInterval = setInterval(() => {
      if (isTokenExpired()) {
        logout();
      }
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(checkTokenInterval);
  }, [isAuthenticated]);

  // Valores e funções expostos pelo contexto
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

