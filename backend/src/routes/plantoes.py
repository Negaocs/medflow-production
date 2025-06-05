from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.plantao import Plantao

plantoes_bp = Blueprint('plantoes', __name__)

@plantoes_bp.route('', methods=['GET'])
@jwt_required()
def list_plantoes():
    """Listar todos os plantoes"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = Plantao.query
        if search:
            query = query.filter(
                db.or_(
                    Plantao.competencia.ilike(f'%{search}%')
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

@plantoes_bp.route('', methods=['POST'])
@jwt_required()
def create_plantoe():
    """Criar novo plantoe"""
    try:
        data = request.get_json()
        
        if not data or not data.get('medico_id') or not data.get('hospital_id') or not data.get('tipo_plantao_id') or not data.get('data_inicio') or not data.get('data_fim'):
            return jsonify({'error': 'medico_id', 'hospital_id', 'tipo_plantao_id', 'data_inicio', 'data_fim' são obrigatórios'}), 400
        
        item = Plantao(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Plantao criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@plantoes_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_plantoe(item_id):
    """Obter plantoe por ID"""
    try:
        item = Plantao.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Plantao não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plantoes_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_plantoe(item_id):
    """Atualizar plantoe"""
    try:
        item = Plantao.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Plantao não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Plantao atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@plantoes_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_plantoe(item_id):
    """Deletar plantoe"""
    try:
        item = Plantao.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Plantao não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Plantao deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
