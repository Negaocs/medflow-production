import os
import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Empresa, Hospital, TipoPlantao
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("medflow-create-initial-data")

# Carregar variáveis de ambiente
load_dotenv()

def create_initial_data():
    """Cria dados iniciais no banco de dados."""
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
        
        # Criar empresa exemplo
        empresa = session.query(Empresa).filter_by(nome="Hospital Modelo S.A.").first()
        if not empresa:
            logger.info("Criando empresa exemplo...")
            empresa = Empresa(
                nome="Hospital Modelo S.A.",
                razao_social="Hospital Modelo S.A.",
                cnpj="12345678000199",
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
        logger.info("Criação de dados iniciais concluída com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao criar dados iniciais: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    create_initial_data()

