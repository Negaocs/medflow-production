import os
import logging
from app import app
from migrations import run_migrations

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("medflow-wsgi")

# Executar migrações ao iniciar
try:
    logger.info("Executando migrações do banco de dados...")
    run_migrations()
    logger.info("Migrações concluídas com sucesso")
except Exception as e:
    logger.error(f"Erro ao executar migrações: {str(e)}", exc_info=True)

# Aplicação para o Gunicorn
application = app

if __name__ == "__main__":
    # Para execução direta (não via Gunicorn)
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)

