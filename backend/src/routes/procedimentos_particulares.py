from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db
from src.models.procedimento_particular import ProcedimentoParticular

procedimentos_particulares_bp = Blueprint('procedimentos_particulares', __name__)

@procedimentos_particulares_bp.route('', methods=['GET'])
@jwt_required()
def list_procedimentos_particulares():
    """Listar todos os procedimentos_particulares"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = ProcedimentoParticular.query
        if search:
            query = query.filter(
                db.or_(
                    ProcedimentoParticular.nome_paciente.ilike(f'%{search}%'),
                    ProcedimentoParticular.descricao.ilike(f'%{search}%'),
                    ProcedimentoParticular.competencia.ilike(f'%{search}%')
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

@procedimentos_particulares_bp.route('', methods=['POST'])
@jwt_required()
def create_procedimentos_particulare():
    """Criar novo procedimentos_particulare"""
    try:
        data = request.get_json()
        
        if not data or not data.get('medico_id') or not data.get('nome_paciente') or not data.get('data_procedimento') or not data.get('descricao') or not data.get('valor_bruto'):
            return jsonify({'error': 'medico_id', 'nome_paciente', 'data_procedimento', 'descricao', 'valor_bruto' são obrigatórios'}), 400
        
        item = ProcedimentoParticular(**data)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'ProcedimentoParticular criado com sucesso',
            'data': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@procedimentos_particulares_bp.route('/<item_id>', methods=['GET'])
@jwt_required()
def get_procedimentos_particulare(item_id):
    """Obter procedimentos_particulare por ID"""
    try:
        item = ProcedimentoParticular.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ProcedimentoParticular não encontrado'}), 404
        
        return jsonify({'data': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@procedimentos_particulares_bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_procedimentos_particulare(item_id):
    """Atualizar procedimentos_particulare"""
    try:
        item = ProcedimentoParticular.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ProcedimentoParticular não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'ProcedimentoParticular atualizado com sucesso',
            'data': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@procedimentos_particulares_bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_procedimentos_particulare(item_id):
    """Deletar procedimentos_particulare"""
    try:
        item = ProcedimentoParticular.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'ProcedimentoParticular não encontrado'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'ProcedimentoParticular deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
