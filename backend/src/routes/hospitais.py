from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.hospital import Hospital

hospitais_bp = Blueprint('hospitais', __name__)

@hospitais_bp.route('', methods=['GET'])
@jwt_required()
def list_hospitais():
    """Listar todos os hospitais"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = Hospital.query
        if search:
            query = query.filter(
                db.or_(
                    Hospital.nome.ilike(f'%{search}%'),
                    Hospital.cnpj.ilike(f'%{search}%')
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

@hospitais_bp.route('', methods=['POST'])
@jwt_required()
def create_hospitai():
    """Criar novo hospitai"""
    try:
        data = request.get_json()
        
        if not data or not data.get('nome'):
            return jsonify({'error': 'nome' são obrigatórios'}), 400
        # Verificar se cnpj já existe
        if Hospital.query.filter_by(cnpj=data['cnpj']).first():
            return jsonify({'error': 'CNPJ já cadastrado'}), 400
        
        item = Hospital(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Hospital criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hospitais_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_hospitai(item_id):
    """Obter hospitai por ID"""
    try:
        item = Hospital.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Hospital não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hospitais_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_hospitai(item_id):
    """Atualizar hospitai"""
    try:
        item = Hospital.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Hospital não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Hospital atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hospitais_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_hospitai(item_id):
    """Deletar hospitai"""
    try:
        item = Hospital.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Hospital não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Hospital deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
