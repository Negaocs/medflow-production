import os
import sys
from app import app, db, User

def test_database():
    """Testar conexão com o banco de dados"""
    try:
        with app.app_context():
            # Verificar se as tabelas existem
            tables = db.engine.table_names()
            print(f"Tabelas no banco: {tables}")
            
            # Criar usuário de teste
            test_user = User(
                nome='Teste',
                email='teste@medflow.com',
                tipo='usuario',
                ativo=True
            )
            test_user.set_password('teste123')
            
            # Adicionar ao banco
            db.session.add(test_user)
            db.session.commit()
            print(f"Usuário de teste criado: {test_user.email}")
            
            # Buscar usuário
            found_user = User.query.filter_by(email='teste@medflow.com').first()
            print(f"Usuário encontrado: {found_user.email if found_user else 'Não encontrado'}")
            
            # Listar todos os usuários
            users = User.query.all()
            print(f"Total de usuários: {len(users)}")
            for user in users:
                print(f"ID: {user.id}, Nome: {user.nome}, Email: {user.email}, Tipo: {user.tipo}")
            
            # Limpar usuário de teste
            if found_user:
                db.session.delete(found_user)
                db.session.commit()
                print("Usuário de teste removido")
            
            print("Teste de banco de dados concluído com sucesso!")
            return True
    except Exception as e:
        print(f"ERRO no teste de banco de dados: {str(e)}")
        return False

if __name__ == "__main__":
    test_database()

