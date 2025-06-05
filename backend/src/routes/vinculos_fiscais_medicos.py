from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.outros_modelos import VinculoFiscalMedico

vinculos_fiscais_medicos_bp = Blueprint('vinculos_fiscais_medicos', __name__)

@vinculos_fiscais_medicos_bp.route('', methods=['GET'])
@jwt_required()
def list_vinculos_fiscais_medicos():
    """Listar todos os vinculos_fiscais_medicos"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = VinculoFiscalMedico.query
        if search:
            query = query.filter(
                db.or_(
                    VinculoFiscalMedico.tipo_vinculo.ilike(f'%{search}%')
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

@vinculos_fiscais_medicos_bp.route('', methods=['POST'])
@jwt_required()
def create_vinculos_fiscais_medico():
    """Criar novo vinculos_fiscais_medico"""
    try:
        data = request.get_json()
        
        if not data or not data.get('medico_id') or not data.get('tipo_vinculo') or not data.get('data_inicio'):
            return jsonify({'error': 'medico_id', 'tipo_vinculo', 'data_inicio' são obrigatórios'}), 400
        
        item = VinculoFiscalMedico(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'VinculoFiscalMedico criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vinculos_fiscais_medicos_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_vinculos_fiscais_medico(item_id):
    """Obter vinculos_fiscais_medico por ID"""
    try:
        item = VinculoFiscalMedico.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'VinculoFiscalMedico não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vinculos_fiscais_medicos_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_vinculos_fiscais_medico(item_id):
    """Atualizar vinculos_fiscais_medico"""
    try:
        item = VinculoFiscalMedico.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'VinculoFiscalMedico não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'VinculoFiscalMedico atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vinculos_fiscais_medicos_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_vinculos_fiscais_medico(item_id):
    """Deletar vinculos_fiscais_medico"""
    try:
        item = VinculoFiscalMedico.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'VinculoFiscalMedico não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'VinculoFiscalMedico deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
