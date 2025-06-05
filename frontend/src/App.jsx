import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Componente de Login
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já está logado
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Para demonstração, vamos usar credenciais fixas
      if (email === 'admin@medflow.com' && password === 'admin123') {
        // Login bem-sucedido
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          name: 'Administrador',
          email: 'admin@medflow.com',
          isAdmin: true
        }));
        setIsLoggedIn(true);
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      console.error('Erro de login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">MedFlow</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sistema de Gestão de Produção Médica
            </p>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="text-center text-sm">
              <p className="text-gray-500">
                Credenciais de demonstração:
              </p>
              <p className="text-gray-500">
                Email: admin@medflow.com
              </p>
              <p className="text-gray-500">
                Senha: admin123
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-600">
            &copy; 2025 MedFlow. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente Dashboard (placeholder)
function Dashboard() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">MedFlow</h1>
          <div className="flex items-center space-x-4">
            <span>Olá, {user.name}</span>
            <button 
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p className="mb-4">Bem-vindo ao sistema MedFlow!</p>
          <p>Esta é uma versão de demonstração. O sistema completo está em desenvolvimento.</p>
        </div>
      </div>
    </div>
  );
}

// Componente principal
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

