// Simulação do cliente Base44 para o frontend
// Este arquivo simula o cliente Base44 para permitir o funcionamento do frontend

class Base44Client {
  constructor() {
    this.isAuthenticated = false;
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (this.token) {
      this.isAuthenticated = true;
    }
  }
  
  async login(email, password) {
    // Simulação de login
    if (email === 'admin@medflow.com' && password === 'admin123') {
      this.token = 'demo-token';
      this.user = {
        id: 1,
        name: 'Administrador',
        email: 'admin@medflow.com',
        isAdmin: true
      };
      
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      this.isAuthenticated = true;
      
      return { success: true, user: this.user };
    } else {
      throw new Error('Email ou senha incorretos');
    }
  }
  
  async logout() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return { success: true };
  }
  
  async getUser() {
    if (!this.isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }
    
    return this.user;
  }
  
  async isLoggedIn() {
    return this.isAuthenticated;
  }
}

export default new Base44Client();

