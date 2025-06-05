import { useState, useEffect } from 'react'
import axios from 'axios'

// Configuração da API baseada no ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Configurar axios
axios.defaults.baseURL = API_BASE_URL
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Interceptor para adicionar token de autenticação
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Verificar se usuário está logado ao carregar a aplicação
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    if (token && userData) {
      setUser(JSON.parse(userData))
      setCurrentView('dashboard')
    }
  }, [])

  // Função de login
  const handleLogin = async (email, password) => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('/auth/login', { email, password })
      if (response.data.success) {
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user_data', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setCurrentView('dashboard')
        setSuccess('Login realizado com sucesso!')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    setUser(null)
    setCurrentView('home')
    setSuccess('Logout realizado com sucesso!')
  }

  // Função para cadastrar interesse
  const handleInteresse = async (dados) => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('/interesse', dados)
      if (response.data.success) {
        setSuccess('Interesse cadastrado com sucesso! Entraremos em contato em breve.')
        setCurrentView('home')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar interesse')
    } finally {
      setLoading(false)
    }
  }

  // Componente Home
  const HomeView = () => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>Med-Flow</h1>
          <div>
            <button className="btn btn-secondary" onClick={() => setCurrentView('login')} style={{ marginRight: '10px' }}>
              Entrar
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentView('interesse')}>
              Solicite uma demonstração
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '80px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.2' }}>
              Sistema Completo de Gestão Médica
            </h2>
            <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9 }}>
              Gerencie sua clínica ou consultório com eficiência. Controle de pacientes, agendamentos, 
              prontuários eletrônicos e muito mais em uma plataforma moderna e segura.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setCurrentView('interesse')} style={{ fontSize: '18px', padding: '15px 30px' }}>
                Solicitar Demonstração
              </button>
              <button className="btn btn-secondary" onClick={() => setCurrentView('login')} style={{ fontSize: '18px', padding: '15px 30px' }}>
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section style={{ background: 'rgba(255,255,255,0.1)', padding: '80px 0' }}>
        <div className="container">
          <h3 style={{ textAlign: 'center', color: 'white', fontSize: '36px', marginBottom: '60px' }}>
            Principais Funcionalidades
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div className="card">
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>Gestão de Pacientes</h4>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Cadastro completo de pacientes com histórico médico, documentos e informações de contato.
              </p>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>Agendamentos</h4>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Sistema inteligente de agendamentos com controle de horários e notificações automáticas.
              </p>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>Prontuário Eletrônico</h4>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Prontuários digitais seguros com assinatura eletrônica e backup automático.
              </p>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>Relatórios</h4>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Relatórios detalhados de atendimentos, faturamento e indicadores de performance.
              </p>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>Segurança</h4>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Criptografia de dados, controle de acesso e conformidade com LGPD.
              </p>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>Suporte 24/7</h4>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Suporte técnico especializado disponível 24 horas por dia, 7 dias por semana.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )

  // Componente Login
  const LoginView = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e) => {
      e.preventDefault()
      handleLogin(email, password)
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center mb-4">
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Entrar no Med-Flow</h2>
            <p style={{ color: '#666' }}>Acesse sua conta para gerenciar sua clínica</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Senha:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
              {loading ? <span className="loading"></span> : 'Entrar'}
            </button>
          </form>

          <div className="text-center mt-4">
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>Credenciais de demonstração:</p>
            <p style={{ color: '#667eea', fontSize: '14px' }}>
              <strong>Email:</strong> admin@medflow.com<br />
              <strong>Senha:</strong> admin123
            </p>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-secondary" onClick={() => setCurrentView('home')}>
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Componente Interesse
  const InteresseView = () => {
    const [dados, setDados] = useState({
      nome: '',
      email: '',
      empresa: '',
      telefone: '',
      mensagem: ''
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      handleInteresse(dados)
    }

    const handleChange = (e) => {
      setDados({ ...dados, [e.target.name]: e.target.value })
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
          <div className="text-center mb-4">
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Solicitar Demonstração</h2>
            <p style={{ color: '#666' }}>Preencha o formulário e entraremos em contato para agendar uma demonstração personalizada</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo:</label>
              <input
                type="text"
                name="nome"
                value={dados.nome}
                onChange={handleChange}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={dados.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Empresa/Clínica:</label>
              <input
                type="text"
                name="empresa"
                value={dados.empresa}
                onChange={handleChange}
                placeholder="Nome da sua clínica ou empresa"
              />
            </div>

            <div className="form-group">
              <label>Telefone:</label>
              <input
                type="tel"
                name="telefone"
                value={dados.telefone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="form-group">
              <label>Mensagem (opcional):</label>
              <textarea
                name="mensagem"
                value={dados.mensagem}
                onChange={handleChange}
                placeholder="Conte-nos mais sobre suas necessidades..."
                rows="4"
              ></textarea>
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
              {loading ? <span className="loading"></span> : 'Solicitar Demonstração'}
            </button>
          </form>

          <div className="text-center mt-4">
            <button className="btn btn-secondary" onClick={() => setCurrentView('home')}>
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Componente Dashboard
  const DashboardView = () => (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <header style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#333', fontSize: '24px' }}>Med-Flow Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#666' }}>Olá, {user?.nome}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div className="card">
              <h3 style={{ color: '#333', marginBottom: '20px' }}>Bem-vindo ao Med-Flow!</h3>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                Este é o painel principal do seu sistema de gestão médica. Aqui você pode acessar todas as funcionalidades do sistema.
              </p>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#333', fontSize: '16px', marginBottom: '10px' }}>Funcionalidades Disponíveis:</h4>
                <ul style={{ color: '#666', paddingLeft: '20px' }}>
                  <li>Gestão de Pacientes</li>
                  <li>Agendamentos</li>
                  <li>Prontuários Eletrônicos</li>
                  <li>Relatórios e Analytics</li>
                  <li>Configurações do Sistema</li>
                </ul>
              </div>
            </div>

            <div className="card">
              <h3 style={{ color: '#333', marginBottom: '20px' }}>Estatísticas Rápidas</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>0</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Pacientes</div>
                </div>
                <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>0</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Consultas Hoje</div>
                </div>
                <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>0</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Agendamentos</div>
                </div>
                <div style={{ background: '#fce4ec', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2185b' }}>0</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Relatórios</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ color: '#333', marginBottom: '20px' }}>Ações Rápidas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn btn-primary">Novo Paciente</button>
                <button className="btn btn-primary">Novo Agendamento</button>
                <button className="btn btn-primary">Novo Prontuário</button>
                <button className="btn btn-secondary">Ver Relatórios</button>
              </div>
            </div>
          </div>

          {success && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '8px' }}>
              {success}
            </div>
          )}
        </div>
      </main>
    </div>
  )

  // Renderizar view atual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginView />
      case 'interesse':
        return <InteresseView />
      case 'dashboard':
        return <DashboardView />
      default:
        return <HomeView />
    }
  }

  return renderCurrentView()
}

export default App

