from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.outros_modelos import DescontoCredito

descontos_creditos_bp = Blueprint('descontos_creditos', __name__)

@descontos_creditos_bp.route('', methods=['GET'])
@jwt_required()
def list_descontos_creditos():
    """Listar todos os descontos_creditos"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = DescontoCredito.query
        if search:
            query = query.filter(
                db.or_(
                    DescontoCredito.descricao.ilike(f'%{search}%'),
                    DescontoCredito.tipo.ilike(f'%{search}%'),
                    DescontoCredito.competencia.ilike(f'%{search}%')
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

@descontos_creditos_bp.route('', methods=['POST'])
@jwt_required()
def create_descontos_credito():
    """Criar novo descontos_credito"""
    try:
        data = request.get_json()
        
        if not data or not data.get('descricao') or not data.get('tipo') or not data.get('valor') or not data.get('competencia') or not data.get('data_lancamento'):
            return jsonify({'error': 'descricao', 'tipo', 'valor', 'competencia', 'data_lancamento' são obrigatórios'}), 400
        
        item = DescontoCredito(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'DescontoCredito criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@descontos_creditos_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_descontos_credito(item_id):
    """Obter descontos_credito por ID"""
    try:
        item = DescontoCredito.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'DescontoCredito não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@descontos_creditos_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_descontos_credito(item_id):
    """Atualizar descontos_credito"""
    try:
        item = DescontoCredito.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'DescontoCredito não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'DescontoCredito atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@descontos_creditos_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_descontos_credito(item_id):
    """Deletar descontos_credito"""
    try:
        item = DescontoCredito.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'DescontoCredito não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'DescontoCredito deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
