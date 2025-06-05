from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.fiscais_usuarios import TabelaINSS

tabelas_inss_bp = Blueprint('tabelas_inss', __name__)

@tabelas_inss_bp.route('', methods=['GET'])
@jwt_required()
def list_tabelas_inss():
    """Listar todos os tabelas_inss"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = TabelaINSS.query
        if search:
            query = query.filter(
                db.or_(
                    TabelaINSS.ano.ilike(f'%{search}%')
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

@tabelas_inss_bp.route('', methods=['POST'])
@jwt_required()
def create_tabelas_in():
    """Criar novo tabelas_in"""
    try:
        data = request.get_json()
        
        if not data or not data.get('ano') or not data.get('faixa_inicial') or not data.get('faixa_final') or not data.get('aliquota'):
            return jsonify({'error': 'ano', 'faixa_inicial', 'faixa_final', 'aliquota' são obrigatórios'}), 400
        
        item = TabelaINSS(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'TabelaINSS criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tabelas_inss_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_tabelas_in(item_id):
    """Obter tabelas_in por ID"""
    try:
        item = TabelaINSS.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TabelaINSS não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tabelas_inss_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_tabelas_in(item_id):
    """Atualizar tabelas_in"""
    try:
        item = TabelaINSS.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TabelaINSS não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'TabelaINSS atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tabelas_inss_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_tabelas_in(item_id):
    """Deletar tabelas_in"""
    try:
        item = TabelaINSS.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'TabelaINSS não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'TabelaINSS deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
