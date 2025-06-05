// Simulação de funções do Base44 para o frontend
// Este arquivo simula as funções do Base44 para permitir o funcionamento do frontend

import base44Client from './base44Client';

export const auth = {
  login: async (email, password) => {
    return await base44Client.login(email, password);
  },
  
  logout: async () => {
    return await base44Client.logout();
  },
  
  getUser: async () => {
    return await base44Client.getUser();
  },
  
  isLoggedIn: async () => {
    return await base44Client.isLoggedIn();
  }
};

export const utils = {
  formatCurrency: (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },
  
  formatDate: (date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  },
  
  formatCPF: (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  
  formatCNPJ: (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
};

export const storage = {
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  get: (key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};

