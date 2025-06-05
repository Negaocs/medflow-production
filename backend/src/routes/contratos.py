from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.contrato import Contrato

contratos_bp = Blueprint('contratos', __name__)

@contratos_bp.route('', methods=['GET'])
@jwt_required()
def list_contratos():
    """Listar todos os contratos"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = Contrato.query
        if search:
            query = query.filter(
                db.or_(
                    Contrato.numero.ilike(f'%{search}%'),
                    Contrato.objeto.ilike(f'%{search}%')
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

@contratos_bp.route('', methods=['POST'])
@jwt_required()
def create_contrato():
    """Criar novo contrato"""
    try:
        data = request.get_json()
        
        if not data or not data.get('numero') or not data.get('empresa_id') or not data.get('hospital_id') or not data.get('data_inicio'):
            return jsonify({'error': 'numero', 'empresa_id', 'hospital_id', 'data_inicio' são obrigatórios'}), 400
        # Verificar se numero já existe
        if Contrato.query.filter_by(numero=data['numero']).first():
            return jsonify({'error': 'NUMERO já cadastrado'}), 400
        
        item = Contrato(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Contrato criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contratos_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_contrato(item_id):
    """Obter contrato por ID"""
    try:
        item = Contrato.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Contrato não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contratos_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_contrato(item_id):
    """Atualizar contrato"""
    try:
        item = Contrato.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Contrato não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Contrato atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contratos_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_contrato(item_id):
    """Deletar contrato"""
    try:
        item = Contrato.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Contrato não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Contrato deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
