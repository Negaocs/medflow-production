// Simulação de entidades para o frontend
// Este arquivo simula as entidades do Base44 para permitir o funcionamento do frontend

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

// Classe base para entidades
class BaseEntity {
  static async list(orderBy = null, limit = null) {
    const data = getStoredData(this.storageKey);
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
  }
  
  static async get(id) {
    const data = getStoredData(this.storageKey);
    return data.find(item => item.id === id) || null;
  }
  
  static async create(item) {
    const data = getStoredData(this.storageKey);
    const newItem = {
      ...item,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    data.push(newItem);
    saveData(this.storageKey, data);
    return newItem;
  }
  
  static async update(id, updates) {
    const data = getStoredData(this.storageKey);
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
    saveData(this.storageKey, data);
    return updatedItem;
  }
  
  static async delete(id) {
    const data = getStoredData(this.storageKey);
    const filteredData = data.filter(item => item.id !== id);
    saveData(this.storageKey, filteredData);
    return { success: true };
  }
  
  static async filter(filters) {
    const data = getStoredData(this.storageKey);
    return data.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
}

// Definição das entidades
export class User extends BaseEntity {
  static storageKey = 'medflow_users';
}

export class Medico extends BaseEntity {
  static storageKey = 'medflow_medicos';
}

export class Empresa extends BaseEntity {
  static storageKey = 'medflow_empresas';
}

export class Hospital extends BaseEntity {
  static storageKey = 'medflow_hospitais';
}

export class TipoPlantao extends BaseEntity {
  static storageKey = 'medflow_tipos_plantao';
}

export class Plantao extends BaseEntity {
  static storageKey = 'medflow_plantoes';
}

export class ProcedimentoParticular extends BaseEntity {
  static storageKey = 'medflow_procedimentos';
}

export class ProducaoAdministrativa extends BaseEntity {
  static storageKey = 'medflow_producao_administrativa';
}

export class ProLabore extends BaseEntity {
  static storageKey = 'medflow_prolabores';
}

export class DescontoCredito extends BaseEntity {
  static storageKey = 'medflow_descontos_creditos';
}

export class MedicoEmpresa extends BaseEntity {
  static storageKey = 'medflow_medico_empresa';
}

export class Contrato extends BaseEntity {
  static storageKey = 'medflow_contratos';
}

export class ContratoTipoPlantao extends BaseEntity {
  static storageKey = 'medflow_contrato_tipo_plantao';
}

export class UsuarioSistema extends BaseEntity {
  static storageKey = 'medflow_usuarios_sistema';
}

export class GrupoAcesso extends BaseEntity {
  static storageKey = 'medflow_grupos_acesso';
}

export class UsuarioGrupo extends BaseEntity {
  static storageKey = 'medflow_usuario_grupo';
}

export class TabelaINSS extends BaseEntity {
  static storageKey = 'medflow_tabela_inss';
}

export class TabelaIRRF extends BaseEntity {
  static storageKey = 'medflow_tabela_irrf';
}

export class ParametrosFiscaisEmpresa extends BaseEntity {
  static storageKey = 'medflow_parametros_fiscais_empresa';
}

export class VinculoFiscalMedico extends BaseEntity {
  static storageKey = 'medflow_vinculo_fiscal_medico';
}

export class ResultadoCalculoProducao extends BaseEntity {
  static storageKey = 'medflow_resultado_calculo_producao';
}

export class ItemCalculadoProducao extends BaseEntity {
  static storageKey = 'medflow_item_calculado_producao';
}

export class ResultadoCalculoProLabore extends BaseEntity {
  static storageKey = 'medflow_resultado_calculo_prolabore';
}

export class ItemCalculadoProLabore extends BaseEntity {
  static storageKey = 'medflow_item_calculado_prolabore';
}

// Inicializar dados de exemplo se não existirem
const initializeExampleData = () => {
  // Usuários do sistema
  if (!localStorage.getItem(UsuarioSistema.storageKey)) {
    const usuarios = [
      {
        id: 'admin-user-id',
        nome_completo: 'Administrador',
        email: 'admin@medflow.com',
        senha: 'admin123', // Em produção, isso seria um hash
        perfil: 'administrador',
        ativo: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      },
      {
        id: 'medico-user-id',
        nome_completo: 'Médico Teste',
        email: 'medico@medflow.com',
        senha: 'medico123', // Em produção, isso seria um hash
        perfil: 'medico',
        ativo: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      }
    ];
    saveData(UsuarioSistema.storageKey, usuarios);
  }
};

// Inicializar dados de exemplo
initializeExampleData();

