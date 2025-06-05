# MedFlow - Sistema de Gestão de Produção Médica

Este repositório contém o código-fonte do sistema MedFlow, uma aplicação web para gestão de produção médica.

## Estrutura do Projeto

O projeto está organizado em duas partes principais:

- `frontend/`: Aplicação React/Vite para interface do usuário
- `backend/`: API FastAPI para lógica de negócios e acesso a dados

## Requisitos

### Frontend
- Node.js 16+
- npm ou yarn

### Backend
- Python 3.9+
- PostgreSQL 13+

## Configuração para Desenvolvimento

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

## Configuração para Produção

Este projeto está configurado para deploy no Render.com usando o arquivo `render.yaml`.

### Variáveis de Ambiente

#### Backend
- `DATABASE_URL`: URL de conexão com o PostgreSQL
- `SECRET_KEY`: Chave secreta para tokens JWT
- `CORS_ORIGINS`: URLs permitidas para CORS
- `ENVIRONMENT`: Ambiente de execução (development, production)

#### Frontend
- `VITE_API_URL`: URL da API do backend

## Deploy

O deploy é automatizado através do Render.com. Qualquer push para a branch principal iniciará um novo deploy.

## Usuários Padrão

### Administrador
- Email: admin@medflow.com
- Senha: admin123

### Médico (Teste)
- Email: medico@medflow.com
- Senha: medico123

## Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

