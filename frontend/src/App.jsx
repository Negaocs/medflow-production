import React, { useState, useEffect } from 'react'
import axios from 'axios'

// Configuração da API baseada no ambiente
const API_BASE_URL = 'https://medflow-backend.onrender.com'

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

  // Verificar se o usuário está logado ao carregar a página
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        setCurrentView('dashboard')
      } catch (err) {
        console.error('Erro ao recuperar dados do usuário:', err)
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
      }
    }
  }, [])

  // Função de login
  const handleLogin = async (email, password) => {
    setLoading(true)
    setError('')
    try {
      console.log('Tentando login com:', { email, password })
      
      // Simulação de login bem-sucedido para demonstração
      // Em produção, isso seria substituído pela chamada real à API
      const mockResponse = {
        success: true,
        access_token: 'demo_token_123456',
        user: {
          id: 1,
          nome: 'Administrador',
          email: email,
          tipo: 'admin',
          ativo: true
        }
      }
      
      localStorage.setItem('access_token', mockResponse.access_token)
      localStorage.setItem('user_data', JSON.stringify(mockResponse.user))
      setUser(mockResponse.user)
      setCurrentView('dashboard')
      setSuccess('Login realizado com sucesso!')
      
    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro ao fazer login. Verifique suas credenciais.')
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
  }

  // Componente Home
  const HomeView = () => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(0,83,159,0.9)', backdropFilter: 'blur(10px)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>Hospitalia</h1>
          <div>
            <button className="btn btn-secondary" onClick={() => setCurrentView('login')} style={{ marginRight: '10px', background: '#ffffff', color: '#00539F' }}>
              Entrar
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentView('interesse')} style={{ background: '#FF6B35', border: 'none' }}>
              Solicite uma demonstração
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '80px 0', background: 'linear-gradient(135deg, #00539F 0%, #0077CC 100%)' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.2' }}>
              Hospitalia - Gestão Hospitalar Inteligente
            </h2>
            <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9 }}>
              Plataforma completa para gestão hospitalar, controle de plantões médicos, 
              faturamento e administração de recursos hospitalares.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setCurrentView('interesse')} style={{ fontSize: '18px', padding: '15px 30px', background: '#FF6B35', border: 'none' }}>
                Solicitar Demonstração
              </button>
              <button className="btn btn-secondary" onClick={() => setCurrentView('login')} style={{ fontSize: '18px', padding: '15px 30px', background: '#ffffff', color: '#00539F' }}>
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section style={{ background: '#f5f8fa', padding: '80px 0' }}>
        <div className="container">
          <h3 style={{ textAlign: 'center', color: '#00539F', fontSize: '36px', marginBottom: '60px' }}>
            Principais Funcionalidades
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div className="card" style={{ borderColor: '#e0e6ed', boxShadow: '0 5px 15px rgba(0,83,159,0.05)' }}>
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#00539F' }}>Gestão de Plantões</h4>
              <p style={{ color: '#555', lineHeight: '1.6' }}>
                Controle completo de escalas médicas, substituições e horas trabalhadas com relatórios detalhados.
              </p>
            </div>
            <div className="card" style={{ borderColor: '#e0e6ed', boxShadow: '0 5px 15px rgba(0,83,159,0.05)' }}>
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#00539F' }}>Faturamento Hospitalar</h4>
              <p style={{ color: '#555', lineHeight: '1.6' }}>
                Gestão financeira integrada com controle de pagamentos, recebimentos e relatórios gerenciais.
              </p>
            </div>
            <div className="card" style={{ borderColor: '#e0e6ed', boxShadow: '0 5px 15px rgba(0,83,159,0.05)' }}>
              <h4 style={{ fontSize: '24px', marginBottom: '15px', color: '#00539F' }}>Controle de Recursos</h4>
              <p style={{ color: '#555', lineHeight: '1.6' }}>
                Administração eficiente de recursos hospitalares, equipamentos e insumos médicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#00539F', color: 'white', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>Hospitalia</h3>
              <p style={{ maxWidth: '300px', opacity: 0.8 }}>
                Soluções inteligentes para gestão hospitalar e administração de recursos médicos.
              </p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '18px', marginBottom: '15px' }}>Contato</h4>
              <p style={{ opacity: 0.8 }}>contato@hospitalia.com.br</p>
              <p style={{ opacity: 0.8 }}>+55 (11) 3456-7890</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px', textAlign: 'center' }}>
            <p style={{ opacity: 0.6 }}>© {new Date().getFullYear()} Hospitalia. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )

  // Componente Login
  const LoginView = () => (
    <div className="container" style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#00539F' }}>Login</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={(e) => {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        
        // Verificar credenciais de demonstração
        if (email === 'admin@medflow.com' && password === 'admin123') {
          handleLogin(email, password)
        } else {
          setError('Credenciais inválidas. Use admin@medflow.com / admin123')
        }
      }}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input type="email" className="form-control" id="email" name="email" required />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Senha</label>
          <input type="password" className="form-control" id="password" name="password" required />
        </div>
        <button type="submit" className="btn btn-primary w-100" style={{ background: '#00539F' }} disabled={loading}>
          {loading ? 'Carregando...' : 'Entrar'}
        </button>
        
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <p>Credenciais de demonstração:</p>
          <p><strong>Email:</strong> admin@medflow.com</p>
          <p><strong>Senha:</strong> admin123</p>
        </div>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className="btn btn-link" onClick={() => setCurrentView('home')}>Voltar para Home</button>
      </div>
    </div>
  )

  // Componente Dashboard
  const DashboardView = () => (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#00539F' }}>Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={handleLogout}>Sair</button>
      </div>
      
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Bem-vindo, {user?.nome || 'Usuário'}!</h5>
          <p className="card-text">Você está logado como {user?.tipo || 'usuário'}.</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Plantões</h5>
              <p className="card-text">Gerencie os plantões médicos.</p>
              <button className="btn btn-primary" style={{ background: '#00539F' }}>Acessar</button>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Faturamento</h5>
              <p className="card-text">Controle financeiro e relatórios.</p>
              <button className="btn btn-primary" style={{ background: '#00539F' }}>Acessar</button>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recursos</h5>
              <p className="card-text">Administração de recursos hospitalares.</p>
              <button className="btn btn-primary" style={{ background: '#00539F' }}>Acessar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Componente Interesse
  const InteresseView = () => {
    const [formData, setFormData] = useState({
      nome: '',
      email: '',
      empresa: '',
      telefone: '',
      mensagem: ''
    })
    const [formStatus, setFormStatus] = useState({
      loading: false,
      error: '',
      success: ''
    })

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      })
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      setFormStatus({ loading: true, error: '', success: '' })
      
      try {
        await axios.post('/interesse', formData)
        setFormStatus({
          loading: false,
          error: '',
          success: 'Interesse cadastrado com sucesso! Entraremos em contato em breve.'
        })
        setFormData({
          nome: '',
          email: '',
          empresa: '',
          telefone: '',
          mensagem: ''
        })
      } catch (err) {
        setFormStatus({
          loading: false,
          error: 'Erro ao cadastrar interesse. Por favor, tente novamente.',
          success: ''
        })
      }
    }

    return (
      <div className="container" style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#00539F' }}>Solicitar Demonstração</h2>
        
        {formStatus.error && <div className="alert alert-danger">{formStatus.error}</div>}
        {formStatus.success && <div className="alert alert-success">{formStatus.success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nome" className="form-label">Nome*</label>
            <input 
              type="text" 
              className="form-control" 
              id="nome" 
              name="nome" 
              value={formData.nome}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email*</label>
            <input 
              type="email" 
              className="form-control" 
              id="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="mb-3">
            <label htmlFor="empresa" className="form-label">Empresa/Hospital</label>
            <input 
              type="text" 
              className="form-control" 
              id="empresa" 
              name="empresa" 
              value={formData.empresa}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="telefone" className="form-label">Telefone</label>
            <input 
              type="tel" 
              className="form-control" 
              id="telefone" 
              name="telefone" 
              value={formData.telefone}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="mensagem" className="form-label">Mensagem</label>
            <textarea 
              className="form-control" 
              id="mensagem" 
              name="mensagem" 
              rows="4"
              value={formData.mensagem}
              onChange={handleChange}
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100" 
            style={{ background: '#FF6B35', border: 'none' }} 
            disabled={formStatus.loading}
          >
            {formStatus.loading ? 'Enviando...' : 'Enviar Solicitação'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="btn btn-link" onClick={() => setCurrentView('home')}>Voltar para Home</button>
        </div>
      </div>
    )
  }

  // Renderizar a view atual
  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginView />
      case 'dashboard':
        return <DashboardView />
      case 'interesse':
        return <InteresseView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="App">
      {renderView()}
    </div>
  )
}

export default App

