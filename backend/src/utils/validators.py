from typing import Optional
import re
from datetime import datetime

def validar_cpf(cpf: str) -> bool:
    """Valida um CPF."""
    # Remover caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, cpf))
    
    # Verificar se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verificar se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Calcular primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf[i]) * (10 - i)
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Verificar primeiro dígito
    if digito1 != int(cpf[9]):
        return False
    
    # Calcular segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf[i]) * (11 - i)
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verificar segundo dígito
    return digito2 == int(cpf[10])

def validar_cnpj(cnpj: str) -> bool:
    """Valida um CNPJ."""
    # Remover caracteres não numéricos
    cnpj = ''.join(filter(str.isdigit, cnpj))
    
    # Verificar se tem 14 dígitos
    if len(cnpj) != 14:
        return False
    
    # Verificar se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        return False
    
    # Calcular primeiro dígito verificador
    pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = 0
    for i in range(12):
        soma += int(cnpj[i]) * pesos[i]
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Verificar primeiro dígito
    if digito1 != int(cnpj[12]):
        return False
    
    # Calcular segundo dígito verificador
    pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = 0
    for i in range(13):
        soma += int(cnpj[i]) * pesos[i]
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verificar segundo dígito
    return digito2 == int(cnpj[13])

def validar_email(email: str) -> bool:
    """Valida um endereço de email."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validar_data(data_str: str, formato: str = '%Y-%m-%d') -> bool:
    """Valida uma data no formato especificado."""
    try:
        datetime.strptime(data_str, formato)
        return True
    except ValueError:
        return False

def formatar_cpf(cpf: str) -> str:
    """Formata um CPF para o padrão XXX.XXX.XXX-XX."""
    # Remover caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, cpf))
    
    # Verificar se tem 11 dígitos
    if len(cpf) != 11:
        return cpf
    
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"

def formatar_cnpj(cnpj: str) -> str:
    """Formata um CNPJ para o padrão XX.XXX.XXX/XXXX-XX."""
    # Remover caracteres não numéricos
    cnpj = ''.join(filter(str.isdigit, cnpj))
    
    # Verificar se tem 14 dígitos
    if len(cnpj) != 14:
        return cnpj
    
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"

def formatar_telefone(telefone: str) -> str:
    """Formata um telefone para o padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX."""
    # Remover caracteres não numéricos
    telefone = ''.join(filter(str.isdigit, telefone))
    
    # Verificar se tem 10 ou 11 dígitos
    if len(telefone) == 11:
        return f"({telefone[:2]}) {telefone[2:7]}-{telefone[7:]}"
    elif len(telefone) == 10:
        return f"({telefone[:2]}) {telefone[2:6]}-{telefone[6:]}"
    else:
        return telefone

