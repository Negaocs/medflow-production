import os
import sys
from app import app, db, User

def init_database():
    """Inicializar banco de dados e criar usuário admin"""
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
            print("Usuário administrador criado com sucesso!")
        else:
            print("Usuário administrador já existe.")
        
        # Listar todos os usuários para verificação
        users = User.query.all()
        print(f"Total de usuários no banco: {len(users)}")
        for user in users:
            print(f"ID: {user.id}, Nome: {user.nome}, Email: {user.email}, Tipo: {user.tipo}, Ativo: {user.ativo}")

if __name__ == "__main__":
    init_database()

