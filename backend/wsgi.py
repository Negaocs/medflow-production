from app import app, db, User
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Inicializar banco de dados e criar usuário admin"""
    try:
        with app.app_context():
            # Criar tabelas
            db.create_all()
            
            # Verificar se usuário admin já existe
            admin = User.query.filter_by(email='admin@medflow.com').first()
            if not admin:
                # Criar usuário admin
                admin = User(
                    nome='Administrador',
                    email='admin@medflow.com',
                    tipo='admin',
                    ativo=True
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                logger.info("Usuário administrador criado com sucesso!")
            else:
                logger.info("Usuário administrador já existe.")
            
            # Listar todos os usuários para verificação
            users = User.query.all()
            logger.info(f"Total de usuários no banco: {len(users)}")
            for user in users:
                logger.info(f"ID: {user.id}, Nome: {user.nome}, Email: {user.email}, Tipo: {user.tipo}, Ativo: {user.ativo}")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {str(e)}")

# Inicializar banco de dados
init_database()

if __name__ == "__main__":
    app.run()

