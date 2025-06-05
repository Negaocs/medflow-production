from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.outros_modelos import ProducaoAdministrativa

producao_administrativa_bp = Blueprint('producao_administrativa', __name__)

@producao_administrativa_bp.route('', methods=['GET'])
@jwt_required()
def list_producao_administrativa():
    """Listar todos os producao_administrativa"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = ProducaoAdministrativa.query
        if search:
            query = query.filter(
                db.or_(
                    ProducaoAdministrativa.descricao.ilike(f'%{search}%'),
                    ProducaoAdministrativa.competencia.ilike(f'%{search}%')
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

@producao_administrativa_bp.route('', methods=['POST'])
@jwt_required()
def create_producao_administrativa():
    """Criar novo producao_administrativa"""
    try:
        data = request.get_json()
        
        if not data or not data.get('descricao') or not data.get('valor_total') or not data.get('competencia') or not data.get('data_lancamento'):
            return jsonify({'error': 'descricao', 'valor_total', 'competencia', 'data_lancamento' são obrigatórios'}), 400
        
        item = ProducaoAdministrativa(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'ProducaoAdministrativa criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@producao_administrativa_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_producao_administrativa(item_id):
    """Obter producao_administrativa por ID"""
    try:
        item = ProducaoAdministrativa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ProducaoAdministrativa não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@producao_administrativa_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_producao_administrativa(item_id):
    """Atualizar producao_administrativa"""
    try:
        item = ProducaoAdministrativa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ProducaoAdministrativa não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'ProducaoAdministrativa atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@producao_administrativa_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_producao_administrativa(item_id):
    """Deletar producao_administrativa"""
    try:
        item = ProducaoAdministrativa.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ProducaoAdministrativa não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'ProducaoAdministrativa deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
