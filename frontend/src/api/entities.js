// Simulação de entidades para o frontend
// Este arquivo simula as entidades do sistema para permitir o funcionamento do frontend

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

// Modelo base para todas as entidades
const createBaseModel = (storageKey, exampleData = []) => {
  // Inicializar dados de exemplo se não existirem
  if (typeof window !== 'undefined' && !localStorage.getItem(storageKey)) {
    saveData(storageKey, exampleData);
  }

  return {
    storageKey,
    
    list: async (orderBy = null, limit = null) => {
      const data = getStoredData(storageKey);
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
      const data = getStoredData(storageKey);
      return data.find(item => item.id === id) || null;
    },
    
    create: async (item) => {
      const data = getStoredData(storageKey);
      const newItem = {
        ...item,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      data.push(newItem);
      saveData(storageKey, data);
      return newItem;
    },
    
    update: async (id, updates) => {
      const data = getStoredData(storageKey);
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
      saveData(storageKey, data);
      return updatedItem;
    },
    
    delete: async (id) => {
      const data = getStoredData(storageKey);
      const filteredData = data.filter(item => item.id !== id);
      saveData(storageKey, filteredData);
      return { success: true };
    },
    
    filter: async (filters, orderBy = null) => {
      const data = getStoredData(storageKey);
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
};

// Modelo Medico
export const Medico = createBaseModel('medflow_medicos', [
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
]);

// Modelo Empresa
export const Empresa = createBaseModel('medflow_empresas', [
  {
    id: 'emp-1',
    nome: 'Hospital São Lucas',
    cnpj: '12.345.678/0001-90',
    email: 'contato@saolucas.com',
    telefone: '(11) 3333-4444',
    endereco: 'Av. Paulista, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: 'emp-2',
    nome: 'Clínica Saúde Total',
    cnpj: '98.765.432/0001-10',
    email: 'contato@saudetotal.com',
    telefone: '(11) 2222-3333',
    endereco: 'Rua Augusta, 500',
    cidade: 'São Paulo',
    estado: 'SP',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
]);

// Modelo Hospital
export const Hospital = createBaseModel('medflow_hospitais', [
  {
    id: 'hosp-1',
    nome: 'Hospital São Lucas',
    cnpj: '12.345.678/0001-90',
    email: 'contato@saolucas.com',
    telefone: '(11) 3333-4444',
    endereco: 'Av. Paulista, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: 'hosp-2',
    nome: 'Hospital Santa Casa',
    cnpj: '98.765.432/0001-10',
    email: 'contato@santacasa.com',
    telefone: '(11) 2222-3333',
    endereco: 'Rua Augusta, 500',
    cidade: 'São Paulo',
    estado: 'SP',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
]);

// Modelo Contrato
export const Contrato = createBaseModel('medflow_contratos', [
  {
    id: 'cont-1',
    empresa_id: 'emp-1',
    hospital_id: 'hosp-1',
    numero_contrato: 'CT-2023-001',
    data_inicio: '2023-01-01',
    data_fim: '2023-12-31',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: 'cont-2',
    empresa_id: 'emp-2',
    hospital_id: 'hosp-2',
    numero_contrato: 'CT-2023-002',
    data_inicio: '2023-02-01',
    data_fim: '2023-12-31',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
]);

// Modelo TipoPlantao
export const TipoPlantao = createBaseModel('medflow_tipos_plantao', [
  {
    id: 'tp-1',
    nome: 'Plantão Diurno',
    carga_horaria: 12,
    descricao: 'Plantão de 12 horas durante o dia',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: 'tp-2',
    nome: 'Plantão Noturno',
    carga_horaria: 12,
    descricao: 'Plantão de 12 horas durante a noite',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
]);

// Modelo ContratoTipoPlantao
export const ContratoTipoPlantao = createBaseModel('medflow_contratos_tipos_plantao', [
  {
    id: 'ctp-1',
    contrato_id: 'cont-1',
    tipo_plantao_id: 'tp-1',
    valor: 1200.00,
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: 'ctp-2',
    contrato_id: 'cont-1',
    tipo_plantao_id: 'tp-2',
    valor: 1500.00,
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
]);

// Modelo MedicoEmpresa (vínculo entre médicos e empresas)
export const MedicoEmpresa = createBaseModel('medflow_medicos_empresas', [
  {
    id: 'vinc-1',
    medico_id: 'med-1',
    empresa_id: 'emp-1',
    data_inicio: '2023-01-01',
    data_fim: null,
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: 'vinc-2',
    medico_id: 'med-2',
    empresa_id: 'emp-1',
    data_inicio: '2023-02-15',
    data_fim: null,
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
]);

// Modelo UsuarioSistema
export const UsuarioSistema = createBaseModel('medflow_usuarios', [
  {
    id: 'user-1',
    nome_completo: 'Administrador',
    email: 'admin@medflow.com',
    senha_hash: 'YWRtaW4xMjNzYWx0X21lZGZsb3dfMjAyNA==', // admin123
    perfil: 'administrador',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: 'user-2',
    nome_completo: 'João Silva',
    email: 'joao.silva@medflow.com',
    senha_hash: 'am9hbzEyM3NhbHRfbWVkZmxvd18yMDI0', // joao123
    perfil: 'medico',
    ativo: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
]);

// Exportar todas as entidades
export default {
  Medico,
  Empresa,
  Hospital,
  Contrato,
  TipoPlantao,
  ContratoTipoPlantao,
  MedicoEmpresa,
  UsuarioSistema
};
