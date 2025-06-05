import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import time

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("medflow-migrations")

# Carregar variáveis de ambiente
load_dotenv()

def run_migrations():
    """Executa migrações no banco de dados."""
    try:
        # Obter URL do banco de dados
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.error("Variável de ambiente DATABASE_URL não encontrada")
            sys.exit(1)
        
        logger.info(f"Conectando ao banco de dados: {database_url.split('@')[1] if '@' in database_url else 'URL oculta'}")
        
        # Esperar um pouco para garantir que o banco de dados esteja pronto
        logger.info("Aguardando banco de dados ficar disponível...")
        time.sleep(5)
        
        # Criar engine
        engine = create_engine(database_url)
        
        # Testar conexão
        max_retries = 5
        retry_count = 0
        connected = False
        
        while not connected and retry_count < max_retries:
            try:
                with engine.connect() as conn:
                    result = conn.execute(text("SELECT 1"))
                    logger.info(f"Conexão com banco de dados estabelecida: {result.fetchone()}")
                    connected = True
            except Exception as e:
                retry_count += 1
                logger.warning(f"Tentativa {retry_count}/{max_retries} falhou: {str(e)}")
                time.sleep(5)
        
        if not connected:
            logger.error("Não foi possível conectar ao banco de dados após várias tentativas")
            sys.exit(1)
        
        # Importar modelos após garantir que a conexão está funcionando
        from src.models import Base, User, Medico, Empresa, Hospital, TipoPlantao, Plantao
        from src.models import get_password_hash
        
        # Criar tabelas
        logger.info("Criando tabelas...")
        Base.metadata.create_all(engine)
        logger.info("Tabelas criadas com sucesso")
        
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
        
        # Criar médico exemplo
        medico = session.query(Medico).filter_by(nome="Dr. João Silva").first()
        if not medico:
            logger.info("Criando médico exemplo...")
            medico = Medico(
                nome="Dr. João Silva",
                crm="12345/SP",
                cpf="123.456.789-00",
                rg="12.345.678-9",
                data_nascimento="1980-01-01",
                telefone="(11) 2222-3333",
                celular="(11) 99999-8888",
                email="joao.silva@exemplo.com",
                endereco="Rua dos Médicos, 100",
                cidade="São Paulo",
                estado="SP",
                cep="04123-000",
                especialidade="Clínica Geral",
                banco="Banco do Brasil",
                agencia="1234-5",
                conta="12345-6",
                pix="joao.silva@exemplo.com",
                observacoes="Médico exemplo para testes",
                is_active=True
            )
            session.add(medico)
            session.commit()
            logger.info("Médico exemplo criado com sucesso")
        else:
            logger.info("Médico exemplo já existe")
        
        # Criar empresa exemplo
        empresa = session.query(Empresa).filter_by(nome="Hospital Modelo S.A.").first()
        if not empresa:
            logger.info("Criando empresa exemplo...")
            empresa = Empresa(
                nome="Hospital Modelo S.A.",
                razao_social="Hospital Modelo S.A.",
                cnpj="12.345.678/0001-99",
                endereco="Av. Paulista, 1000",
                cidade="São Paulo",
                estado="SP",
                cep="01310-100",
                telefone="(11) 3333-4444",
                email="contato@hospitalmodelo.com.br",
                website="www.hospitalmodelo.com.br",
                is_active=True
            )
            session.add(empresa)
            session.commit()
            logger.info("Empresa exemplo criada com sucesso")
        else:
            logger.info("Empresa exemplo já existe")
        
        # Criar hospital exemplo
        hospital = session.query(Hospital).filter_by(nome="Hospital Modelo - Unidade Centro").first()
        if not hospital:
            logger.info("Criando hospital exemplo...")
            hospital = Hospital(
                nome="Hospital Modelo - Unidade Centro",
                endereco="Rua Augusta, 500",
                cidade="São Paulo",
                estado="SP",
                cep="01304-000",
                telefone="(11) 3333-5555",
                email="centro@hospitalmodelo.com.br",
                empresa_id=empresa.id if empresa else None,
                is_active=True
            )
            session.add(hospital)
            session.commit()
            logger.info("Hospital exemplo criado com sucesso")
        else:
            logger.info("Hospital exemplo já existe")
        
        # Criar tipos de plantão exemplo
        tipos_plantao = [
            {"nome": "Plantão 12h Diurno", "descricao": "Plantão de 12 horas durante o dia"},
            {"nome": "Plantão 12h Noturno", "descricao": "Plantão de 12 horas durante a noite"},
            {"nome": "Plantão 24h", "descricao": "Plantão de 24 horas"},
            {"nome": "Plantão 6h", "descricao": "Plantão de 6 horas"}
        ]
        
        for tipo in tipos_plantao:
            tipo_plantao = session.query(TipoPlantao).filter_by(nome=tipo["nome"]).first()
            if not tipo_plantao:
                logger.info(f"Criando tipo de plantão: {tipo['nome']}...")
                tipo_plantao = TipoPlantao(
                    nome=tipo["nome"],
                    descricao=tipo["descricao"],
                    is_active=True
                )
                session.add(tipo_plantao)
                session.commit()
                logger.info(f"Tipo de plantão {tipo['nome']} criado com sucesso")
            else:
                logger.info(f"Tipo de plantão {tipo['nome']} já existe")
        
        session.close()
        logger.info("Migrações concluídas com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao executar migrações: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    run_migrations()

