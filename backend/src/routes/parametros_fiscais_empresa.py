from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.fiscais_usuarios import ParametrosFiscaisEmpresa

parametros_fiscais_empresa_bp = Blueprint('parametros_fiscais_empresa', __name__)

@parametros_fiscais_empresa_bp.route('', methods=['GET'])
@jwt_required()
def list_parametros_fiscais_empresa():
    """Listar todos os parametros_fiscais_empresa"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = ParametrosFiscaisEmpresa.query
        if search:
            query = query.filter(
                db.or_(
                    ParametrosFiscaisEmpresa.ano.ilike(f'%{search}%')
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

@parametros_fiscais_empresa_bp.route('', methods=['POST'])
@jwt_required()
def create_parametros_fiscais_empresa():
    """Criar novo parametros_fiscais_empresa"""
    try:
        data = request.get_json()
        
        if not data or not data.get('empresa_id') or not data.get('ano'):
            return jsonify({'error': 'empresa_id', 'ano' são obrigatórios'}), 400
        
        item = ParametrosFiscaisEmpresa(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'ParametrosFiscaisEmpresa criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@parametros_fiscais_empresa_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_parametros_fiscais_empresa(item_id):
    """Obter parametros_fiscais_empresa por ID"""
    try:
        item = ParametrosFiscaisEmpresa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ParametrosFiscaisEmpresa não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@parametros_fiscais_empresa_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_parametros_fiscais_empresa(item_id):
    """Atualizar parametros_fiscais_empresa"""
    try:
        item = ParametrosFiscaisEmpresa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ParametrosFiscaisEmpresa não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'ParametrosFiscaisEmpresa atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@parametros_fiscais_empresa_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_parametros_fiscais_empresa(item_id):
    """Deletar parametros_fiscais_empresa"""
    try:
        item = ParametrosFiscaisEmpresa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ParametrosFiscaisEmpresa não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'ParametrosFiscaisEmpresa deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
