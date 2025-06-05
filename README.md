# Med-Flow - Sistema de Gestão Médica

Sistema completo de gestão médica desenvolvido com Flask (backend) e React (frontend), otimizado para deploy no Render.

## 🚀 Deploy no Render

### Pré-requisitos
- Conta no Render (https://render.com)
- Conta no GitHub
- Repositório GitHub com este código

### Passos para Deploy

#### 1. Preparar Repositório GitHub
```bash
# Clonar ou fazer upload deste código para um repositório GitHub
git init
git add .
git commit -m "Initial commit - Med-Flow production ready"
git remote add origin https://github.com/SEU_USUARIO/medflow-production.git
git push -u origin main
```

#### 2. Conectar ao Render
1. Acesse https://render.com e faça login
2. Clique em "New +" e selecione "Blueprint"
3. Conecte seu repositório GitHub
4. Selecione o repositório com o código do Med-Flow
5. O Render detectará automaticamente o arquivo `render.yaml`

#### 3. Configurar Variáveis de Ambiente
O Render configurará automaticamente as seguintes variáveis:
- `SECRET_KEY` (gerada automaticamente)
- `JWT_SECRET_KEY` (gerada automaticamente)
- `DATABASE_URL` (conectada ao PostgreSQL)
- `CORS_ORIGINS` (configurada para o frontend)
- `VITE_API_URL` (configurada para o backend)

#### 4. Deploy Automático
- O Render fará o deploy automático de:
  - Backend Flask (medflow-backend.onrender.com)
  - Frontend React (medflow-frontend.onrender.com)
  - Banco PostgreSQL (gerenciado)

### URLs de Acesso
Após o deploy, você terá:
- **Frontend:** https://medflow-frontend.onrender.com
- **Backend API:** https://medflow-backend.onrender.com/api
- **Health Check:** https://medflow-backend.onrender.com/api/health

## 🔐 Credenciais Padrão

### Usuário Administrador
- **Email:** admin@medflow.com
- **Senha:** admin123

## 🛠️ Desenvolvimento Local

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Funcionalidades

### ✅ Implementadas
- Sistema de autenticação JWT
- Cadastro de interesse
- Dashboard básico
- Gestão de usuários
- API REST completa
- Interface responsiva

### 🔄 Em Desenvolvimento
- Gestão de pacientes
- Sistema de agendamentos
- Prontuários eletrônicos
- Relatórios avançados
- Integrações externas

## 🔧 Configurações de Produção

### Segurança
- HTTPS obrigatório
- CORS configurado
- Variáveis de ambiente seguras
- Logs estruturados
- Backup automático do banco

### Performance
- Build otimizado do React
- Compressão de assets
- CDN automático
- Cache de API
- Monitoramento de performance

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema:
- Email: suporte@medflow.com
- Documentação: https://docs.medflow.com

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

