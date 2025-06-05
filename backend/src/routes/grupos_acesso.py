from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.fiscais_usuarios import GrupoAcesso

grupos_acesso_bp = Blueprint('grupos_acesso', __name__)

@grupos_acesso_bp.route('', methods=['GET'])
@jwt_required()
def list_grupos_acesso():
    """Listar todos os grupos_acesso"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = GrupoAcesso.query
        if search:
            query = query.filter(
                db.or_(
                    GrupoAcesso.nome.ilike(f'%{search}%'),
                    GrupoAcesso.descricao.ilike(f'%{search}%')
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

@grupos_acesso_bp.route('', methods=['POST'])
@jwt_required()
def create_grupos_acesso():
    """Criar novo grupos_acesso"""
    try:
        data = request.get_json()
        
        if not data or not data.get('nome'):
            return jsonify({'error': 'nome' são obrigatórios'}), 400
        
        item = GrupoAcesso(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'GrupoAcesso criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@grupos_acesso_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_grupos_acesso(item_id):
    """Obter grupos_acesso por ID"""
    try:
        item = GrupoAcesso.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'GrupoAcesso não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@grupos_acesso_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_grupos_acesso(item_id):
    """Atualizar grupos_acesso"""
    try:
        item = GrupoAcesso.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'GrupoAcesso não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'GrupoAcesso atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@grupos_acesso_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_grupos_acesso(item_id):
    """Deletar grupos_acesso"""
    try:
        item = GrupoAcesso.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'GrupoAcesso não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'GrupoAcesso deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
