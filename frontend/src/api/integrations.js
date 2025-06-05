// Simulação de integrações do Base44 para o frontend
// Este arquivo simula as integrações do Base44 para permitir o funcionamento do frontend

export const api = {
  get: async (url) => {
    console.log(`Simulando GET para ${url}`);
    return { success: true, data: [] };
  },
  
  post: async (url, data) => {
    console.log(`Simulando POST para ${url}`, data);
    return { success: true, data: { id: 'new-id', ...data } };
  },
  
  put: async (url, data) => {
    console.log(`Simulando PUT para ${url}`, data);
    return { success: true, data };
  },
  
  delete: async (url) => {
    console.log(`Simulando DELETE para ${url}`);
    return { success: true };
  }
};

export const file = {
  upload: async (file) => {
    console.log(`Simulando upload de arquivo ${file.name}`);
    return { success: true, url: `https://example.com/files/${file.name}` };
  },
  
  download: async (url) => {
    console.log(`Simulando download de arquivo ${url}`);
    return { success: true, data: new Blob(['conteúdo simulado']) };
  }
};

