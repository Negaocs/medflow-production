import os
import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, get_password_hash
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("medflow-create-admin")

# Carregar variáveis de ambiente
load_dotenv()

def create_admin_user():
    """Cria usuário admin no banco de dados."""
    try:
        # Obter URL do banco de dados
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.error("Variável de ambiente DATABASE_URL não encontrada")
            sys.exit(1)
        
        logger.info(f"Conectando ao banco de dados: {database_url.split('@')[1] if '@' in database_url else 'URL oculta'}")
        
        # Criar engine
        engine = create_engine(database_url)
        
        # Criar sessão
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Verificar se usuário admin existe
        admin_user = session.query(User).filter_by(email="admin@medflow.com").first()
        if not admin_user:
            logger.info("Criando usuário admin...")
            admin_user = User(
                nome="Administrador",
                email="admin@medflow.com",
                senha_hash=get_password_hash("admin123"),
                is_admin=True,
                is_active=True
            )
            session.add(admin_user)
            session.commit()
            logger.info("Usuário admin criado com sucesso")
        else:
            logger.info("Usuário admin já existe")
        
        # Verificar se usuário médico existe
        medico_user = session.query(User).filter_by(email="medico@medflow.com").first()
        if not medico_user:
            logger.info("Criando usuário médico...")
            medico_user = User(
                nome="Médico Teste",
                email="medico@medflow.com",
                senha_hash=get_password_hash("medico123"),
                is_admin=False,
                is_active=True
            )
            session.add(medico_user)
            session.commit()
            logger.info("Usuário médico criado com sucesso")
        else:
            logger.info("Usuário médico já existe")
        
        session.close()
        logger.info("Criação de usuários concluída com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao criar usuários: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    create_admin_user()

