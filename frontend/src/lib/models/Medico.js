// Simulação do modelo Medico para o frontend
// Este arquivo simula o modelo Medico para permitir o funcionamento do frontend

// Função para gerar um ID único
const generateId = () => Math.random().toString(36).substring(2, 15);

// Função para obter dados do localStorage ou retornar um array vazio
const getStoredData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Erro ao obter dados de ${key}:`, error);
    return [];
  }
};

// Função para salvar dados no localStorage
const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar dados em ${key}:`, error);
  }
};

// Modelo Medico
const Medico = {
  storageKey: 'medflow_medicos',
  
  list: async (orderBy = null, limit = null) => {
    const data = getStoredData(Medico.storageKey);
    let result = [...data];
    
    if (orderBy) {
      const desc = orderBy.startsWith('-');
      const field = desc ? orderBy.substring(1) : orderBy;
      result.sort((a, b) => {
        if (desc) {
          return a[field] > b[field] ? -1 : 1;
        } else {
          return a[field] > b[field] ? 1 : -1;
        }
      });
    }
    
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  },
  
  get: async (id) => {
    const data = getStoredData(Medico.storageKey);
    return data.find(item => item.id === id) || null;
  },
  
  create: async (item) => {
    const data = getStoredData(Medico.storageKey);
    const newItem = {
      ...item,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    data.push(newItem);
    saveData(Medico.storageKey, data);
    return newItem;
  },
  
  update: async (id, updates) => {
    const data = getStoredData(Medico.storageKey);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Item com ID ${id} não encontrado`);
    }
    
    const updatedItem = {
      ...data[index],
      ...updates,
      updated_date: new Date().toISOString()
    };
    
    data[index] = updatedItem;
    saveData(Medico.storageKey, data);
    return updatedItem;
  },
  
  delete: async (id) => {
    const data = getStoredData(Medico.storageKey);
    const filteredData = data.filter(item => item.id !== id);
    saveData(Medico.storageKey, filteredData);
    return { success: true };
  },
  
  filter: async (filters, orderBy = null) => {
    const data = getStoredData(Medico.storageKey);
    let result = data.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
    
    if (orderBy) {
      const desc = orderBy.startsWith('-');
      const field = desc ? orderBy.substring(1) : orderBy;
      result.sort((a, b) => {
        if (desc) {
          return a[field] > b[field] ? -1 : 1;
        } else {
          return a[field] > b[field] ? 1 : -1;
        }
      });
    }
    
    return result;
  }
};

// Inicializar dados de exemplo se não existirem
const initializeExampleData = () => {
  if (!localStorage.getItem(Medico.storageKey)) {
    const medicos = [
      {
        id: 'med-1',
        nome: 'Dr. João Silva',
        crm: '12345',
        estado_crm: 'SP',
        email: 'joao.silva@medflow.com',
        telefone: '(11) 98765-4321',
        especialidade: 'Clínica Geral',
        ativo: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      },
      {
        id: 'med-2',
        nome: 'Dra. Maria Santos',
        crm: '54321',
        estado_crm: 'RJ',
        email: 'maria.santos@medflow.com',
        telefone: '(21) 98765-4321',
        especialidade: 'Cardiologia',
        ativo: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      }
    ];
    saveData(Medico.storageKey, medicos);
  }
};

// Inicializar dados de exemplo
initializeExampleData();

export default Medico;

