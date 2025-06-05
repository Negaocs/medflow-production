from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.tipo_plantao import TipoPlantao

tipos_plantao_bp = Blueprint('tipos_plantao', __name__)

@tipos_plantao_bp.route('', methods=['GET'])
@jwt_required()
def list_tipos_plantao():
    """Listar todos os tipos_plantao"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = TipoPlantao.query
        if search:
            query = query.filter(
                db.or_(
                    TipoPlantao.nome.ilike(f'%{search}%'),
                    TipoPlantao.descricao.ilike(f'%{search}%')
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

@tipos_plantao_bp.route('', methods=['POST'])
@jwt_required()
def create_tipos_plantao():
    """Criar novo tipos_plantao"""
    try:
        data = request.get_json()
        
        if not data or not data.get('nome'):
            return jsonify({'error': 'nome' são obrigatórios'}), 400
        
        item = TipoPlantao(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'TipoPlantao criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tipos_plantao_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_tipos_plantao(item_id):
    """Obter tipos_plantao por ID"""
    try:
        item = TipoPlantao.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TipoPlantao não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tipos_plantao_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_tipos_plantao(item_id):
    """Atualizar tipos_plantao"""
    try:
        item = TipoPlantao.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TipoPlantao não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'TipoPlantao atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tipos_plantao_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_tipos_plantao(item_id):
    """Deletar tipos_plantao"""
    try:
        item = TipoPlantao.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TipoPlantao não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'TipoPlantao deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
