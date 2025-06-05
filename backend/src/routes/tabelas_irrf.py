from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.fiscais_usuarios import TabelaIRRF

tabelas_irrf_bp = Blueprint('tabelas_irrf', __name__)

@tabelas_irrf_bp.route('', methods=['GET'])
@jwt_required()
def list_tabelas_irrf():
    """Listar todos os tabelas_irrf"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = TabelaIRRF.query
        if search:
            query = query.filter(
                db.or_(
                    TabelaIRRF.ano.ilike(f'%{search}%')
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

@tabelas_irrf_bp.route('', methods=['POST'])
@jwt_required()
def create_tabelas_irrf():
    """Criar novo tabelas_irrf"""
    try:
        data = request.get_json()
        
        if not data or not data.get('ano') or not data.get('faixa_inicial') or not data.get('faixa_final') or not data.get('aliquota'):
            return jsonify({'error': 'ano', 'faixa_inicial', 'faixa_final', 'aliquota' são obrigatórios'}), 400
        
        item = TabelaIRRF(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'TabelaIRRF criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tabelas_irrf_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_tabelas_irrf(item_id):
    """Obter tabelas_irrf por ID"""
    try:
        item = TabelaIRRF.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TabelaIRRF não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tabelas_irrf_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_tabelas_irrf(item_id):
    """Atualizar tabelas_irrf"""
    try:
        item = TabelaIRRF.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TabelaIRRF não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'TabelaIRRF atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tabelas_irrf_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_tabelas_irrf(item_id):
    """Deletar tabelas_irrf"""
    try:
        item = TabelaIRRF.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TabelaIRRF não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'TabelaIRRF deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
