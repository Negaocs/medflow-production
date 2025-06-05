from app import app, init_database

# Inicializar banco de dados
init_database()

if __name__ == "__main__":
    app.run()

