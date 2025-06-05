from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.user import User

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('', methods=['GET'])
@jwt_required()
def list_usuarios():
    """Listar todos os usuarios"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = User.query
        if search:
            query = query.filter(
                db.or_(
                    User.nome.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )
        
        items = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'data': [item.to_dict() for item in items.items],
            'pagination': {
                'page': items.page,
                'pages': items.pages,
                'per_page': items.per_page,
                'total': items.total,
                'has_next': items.has_next,
                'has_prev': items.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('', methods=['POST'])
@jwt_required()
def create_usuario():
    """Criar novo usuario"""
    try:
        data = request.get_json()
        
        if not data or not data.get('nome') or not data.get('email'):
            return jsonify({'error': 'nome', 'email' são obrigatórios'}), 400
        # Verificar se email já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'EMAIL já cadastrado'}), 400
        
        item = User(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'User criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_usuario(item_id):
    """Obter usuario por ID"""
    try:
        item = User.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'User não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_usuario(item_id):
    """Atualizar usuario"""
    try:
        item = User.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'User não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'User atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_usuario(item_id):
    """Deletar usuario"""
    try:
        item = User.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'User não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'User deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
