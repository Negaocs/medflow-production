import os
import sys
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import logging
from logging.handlers import RotatingFileHandler

# Configuração de logging para produção
if not os.path.exists('logs'):
    os.mkdir('logs')

logging.basicConfig(
    handlers=[RotatingFileHandler('logs/medflow.log', maxBytes=100000, backupCount=10)],
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

app = Flask(__name__)

# Configurações de produção
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'medflow-super-secret-key-production-2024')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-medflow-production-2024')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Configuração do banco de dados
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Render PostgreSQL
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Fallback para SQLite em desenvolvimento
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///medflow.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar extensões
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Configurar CORS para produção
CORS(app, 
     origins=['https://medflow-frontend-i059.onrender.com', 'http://localhost:3000'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     expose_headers=['Content-Type', 'Authorization'])

# Adicionar headers CORS em todas as respostas
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'https://medflow-frontend-i059.onrender.com'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Modelos do banco de dados
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    tipo = db.Column(db.String(20), default='usuario')
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.senha_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.senha_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'tipo': self.tipo,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Medico(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    crm = db.Column(db.String(20), unique=True, nullable=False)
    especialidade = db.Column(db.String(100))
    telefone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'crm': self.crm,
            'especialidade': self.especialidade,
            'telefone': self.telefone,
            'email': self.email,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Interesse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    empresa = db.Column(db.String(100))
    telefone = db.Column(db.String(20))
    mensagem = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'empresa': self.empresa,
            'telefone': self.telefone,
            'mensagem': self.mensagem,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Rotas da API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    # Tratar requisições OPTIONS (preflight)
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'https://medflow-frontend-i059.onrender.com')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        data = request.get_json()
        app.logger.info(f"Tentativa de login recebida: {data}")
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            app.logger.warning("Email ou senha não fornecidos")
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        user = User.query.filter_by(email=email).first()
        app.logger.info(f"Usuário encontrado: {user}")
        
        if user and user.check_password(password) and user.ativo:
            access_token = create_access_token(identity=user.id)
            app.logger.info(f'Login realizado com sucesso para usuário: {email}')
            
            response = jsonify({
                'success': True,
                'message': 'Login realizado com sucesso',
                'access_token': access_token,
                'user': user.to_dict()
            })
            
            # Adicionar headers CORS específicos
            response.headers.add('Access-Control-Allow-Origin', 'https://medflow-frontend-i059.onrender.com')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
        else:
            app.logger.warning(f'Tentativa de login falhada para usuário: {email}')
            return jsonify({'error': 'Credenciais inválidas'}), 401
            
    except Exception as e:
        app.logger.error(f'Erro no login: {str(e)}')
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        nome = data.get('nome')
        email = data.get('email')
        password = data.get('password')
        
        if not all([nome, email, password]):
            return jsonify({'error': 'Nome, email e senha são obrigatórios'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        user = User(nome=nome, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        app.logger.info(f'Usuário registrado com sucesso: {email}')
        return jsonify({
            'success': True,
            'message': 'Usuário registrado com sucesso',
            'user': user.to_dict()
        })
        
    except Exception as e:
        app.logger.error(f'Erro no registro: {str(e)}')
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/interesse', methods=['POST'])
def cadastrar_interesse():
    try:
        data = request.get_json()
        nome = data.get('nome')
        email = data.get('email')
        empresa = data.get('empresa', '')
        telefone = data.get('telefone', '')
        mensagem = data.get('mensagem', '')
        
        if not nome or not email:
            return jsonify({'error': 'Nome e email são obrigatórios'}), 400
        
        interesse = Interesse(
            nome=nome,
            email=email,
            empresa=empresa,
            telefone=telefone,
            mensagem=mensagem
        )
        
        db.session.add(interesse)
        db.session.commit()
        
        app.logger.info(f'Interesse cadastrado: {email}')
        return jsonify({
            'success': True,
            'message': 'Interesse cadastrado com sucesso'
        })
        
    except Exception as e:
        app.logger.error(f'Erro ao cadastrar interesse: {str(e)}')
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/medicos', methods=['GET'])
@jwt_required()
def listar_medicos():
    try:
        medicos = Medico.query.filter_by(ativo=True).all()
        return jsonify({
            'success': True,
            'medicos': [medico.to_dict() for medico in medicos]
        })
    except Exception as e:
        app.logger.error(f'Erro ao listar médicos: {str(e)}')
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/medicos', methods=['POST'])
@jwt_required()
def criar_medico():
    try:
        data = request.get_json()
        nome = data.get('nome')
        crm = data.get('crm')
        especialidade = data.get('especialidade', '')
        telefone = data.get('telefone', '')
        email = data.get('email', '')
        
        if not nome or not crm:
            return jsonify({'error': 'Nome e CRM são obrigatórios'}), 400
        
        if Medico.query.filter_by(crm=crm).first():
            return jsonify({'error': 'CRM já cadastrado'}), 400
        
        medico = Medico(
            nome=nome,
            crm=crm,
            especialidade=especialidade,
            telefone=telefone,
            email=email
        )
        
        db.session.add(medico)
        db.session.commit()
        
        app.logger.info(f'Médico cadastrado: {nome} - CRM: {crm}')
        return jsonify({
            'success': True,
            'message': 'Médico cadastrado com sucesso',
            'medico': medico.to_dict()
        })
        
    except Exception as e:
        app.logger.error(f'Erro ao cadastrar médico: {str(e)}')
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Servir arquivos estáticos do frontend (se necessário)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    else:
        return send_from_directory('static', 'index.html')

def create_admin_user():
    """Criar usuário administrador padrão"""
    admin = User.query.filter_by(email='admin@medflow.com').first()
    if not admin:
        admin = User(
            nome='Administrador',
            email='admin@medflow.com',
            tipo='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        app.logger.info('Usuário administrador criado')

def init_database():
    """Inicializar banco de dados"""
    with app.app_context():
        db.create_all()
        create_admin_user()
        app.logger.info('Banco de dados inicializado')

if __name__ == '__main__':
    init_database()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

