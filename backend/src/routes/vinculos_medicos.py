from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.outros_modelos import MedicoEmpresa

vinculos_medicos_bp = Blueprint('vinculos_medicos', __name__)

@vinculos_medicos_bp.route('', methods=['GET'])
@jwt_required()
def list_vinculos_medicos():
    """Listar todos os vinculos_medicos"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = MedicoEmpresa.query
        
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

@vinculos_medicos_bp.route('', methods=['POST'])
@jwt_required()
def create_vinculos_medico():
    """Criar novo vinculos_medico"""
    try:
        data = request.get_json()
        
        if not data or not data.get('medico_id') or not data.get('empresa_id') or not data.get('data_inicio'):
            return jsonify({'error': 'medico_id', 'empresa_id', 'data_inicio' são obrigatórios'}), 400
        
        item = MedicoEmpresa(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'MedicoEmpresa criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vinculos_medicos_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_vinculos_medico(item_id):
    """Obter vinculos_medico por ID"""
    try:
        item = MedicoEmpresa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'MedicoEmpresa não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vinculos_medicos_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_vinculos_medico(item_id):
    """Atualizar vinculos_medico"""
    try:
        item = MedicoEmpresa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'MedicoEmpresa não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'MedicoEmpresa atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vinculos_medicos_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_vinculos_medico(item_id):
    """Deletar vinculos_medico"""
    try:
        item = MedicoEmpresa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'MedicoEmpresa não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'MedicoEmpresa deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
