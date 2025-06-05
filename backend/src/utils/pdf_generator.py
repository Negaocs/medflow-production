from typing import Dict, List, Any, Optional
from datetime import datetime
import os
import tempfile
from fpdf import FPDF
import locale

# Configurar locale para formatação de números
locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')

class PDF(FPDF):
    """Classe personalizada para geração de PDF."""
    
    def header(self):
        """Cabeçalho do PDF."""
        # Logo
        if hasattr(self, 'logo_path') and os.path.exists(self.logo_path):
            self.image(self.logo_path, 10, 8, 33)
        
        # Título
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, self.title, 0, 1, 'C')
        
        # Data
        self.set_font('Arial', '', 10)
        self.cell(0, 10, f'Gerado em: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}', 0, 1, 'R')
        
        # Linha
        self.line(10, 30, 200, 30)
        self.ln(10)
    
    def footer(self):
        """Rodapé do PDF."""
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}/{{nb}}', 0, 0, 'C')
    
    def chapter_title(self, title):
        """Título de capítulo."""
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(4)
    
    def chapter_body(self, body):
        """Corpo de capítulo."""
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 5, body)
        self.ln()
    
    def add_table(self, headers, data, widths=None):
        """Adiciona uma tabela ao PDF."""
        # Configurar larguras das colunas
        if widths is None:
            widths = [190 / len(headers)] * len(headers)
        
        # Cabeçalho da tabela
        self.set_font('Arial', 'B', 10)
        self.set_fill_color(200, 220, 255)
        
        for i, header in enumerate(headers):
            self.cell(widths[i], 7, header, 1, 0, 'C', 1)
        self.ln()
        
        # Dados da tabela
        self.set_font('Arial', '', 10)
        self.set_fill_color(255, 255, 255)
        
        fill = False
        for row in data:
            for i, cell in enumerate(row):
                self.cell(widths[i], 6, str(cell), 1, 0, 'L', fill)
            self.ln()
            fill = not fill
    
    def add_info_block(self, title, info_dict):
        """Adiciona um bloco de informações ao PDF."""
        self.set_font('Arial', 'B', 11)
        self.cell(0, 10, title, 0, 1, 'L')
        
        self.set_font('Arial', '', 10)
        for key, value in info_dict.items():
            self.cell(50, 6, f"{key}:", 0, 0, 'L')
            self.cell(0, 6, str(value), 0, 1, 'L')
        
        self.ln(5)

def gerar_pdf_producao_medica(dados: Dict[str, Any], logo_path: Optional[str] = None) -> str:
    """
    Gera um PDF de produção médica.
    
    Args:
        dados: Dados da produção médica
        logo_path: Caminho para o logo (opcional)
    
    Returns:
        str: Caminho para o arquivo PDF gerado
    """
    # Criar PDF
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Configurar título e logo
    pdf.title = "Relatório de Produção Médica"
    if logo_path:
        pdf.logo_path = logo_path
    
    # Informações do médico
    pdf.add_info_block("Informações do Médico", {
        "Nome": dados["nome_medico"],
        "Competência": dados["competencia"],
        "CPF": dados.get("cpf", ""),
        "CRM": dados.get("crm", "")
    })
    
    # Resumo financeiro
    pdf.add_info_block("Resumo Financeiro", {
        "Valor Bruto Plantões": locale.currency(dados["valor_bruto_plantoes"], grouping=True),
        "Valor Bruto Procedimentos": locale.currency(dados["valor_bruto_procedimentos"], grouping=True),
        "Valor Bruto Produção Administrativa": locale.currency(dados["valor_bruto_producao_administrativa"], grouping=True),
        "Valor Bruto Total": locale.currency(dados["valor_bruto_total"], grouping=True),
        "Valor Descontos": locale.currency(dados["valor_descontos"], grouping=True),
        "Valor Líquido Total": locale.currency(dados["valor_liquido_total"], grouping=True)
    })
    
    # Detalhes dos plantões
    if dados["detalhes"]["plantoes"]:
        pdf.chapter_title("Detalhes dos Plantões")
        
        headers = ["Hospital", "Data", "Tipo", "Valor"]
        data = [
            [
                p["hospital"],
                p["data"],
                p["tipo_plantao"],
                locale.currency(p["valor_total"], grouping=True)
            ]
            for p in dados["detalhes"]["plantoes"]
        ]
        
        pdf.add_table(headers, data, [60, 40, 50, 40])
    
    # Detalhes dos procedimentos
    if dados["detalhes"]["procedimentos"]:
        pdf.add_page()
        pdf.chapter_title("Detalhes dos Procedimentos")
        
        headers = ["Tipo", "Paciente", "Data", "Valor"]
        data = [
            [
                p["tipo_procedimento"],
                p["nome_paciente"],
                p["data_procedimento"],
                locale.currency(p["valor_liquido_repasse"], grouping=True)
            ]
            for p in dados["detalhes"]["procedimentos"]
        ]
        
        pdf.add_table(headers, data, [50, 60, 40, 40])
    
    # Detalhes da produção administrativa
    if dados["detalhes"]["producao_administrativa"]:
        pdf.add_page()
        pdf.chapter_title("Detalhes da Produção Administrativa")
        
        headers = ["Descrição", "Período", "Valor"]
        data = [
            [
                p["descricao"],
                f"{p['data_inicio']} a {p['data_fim']}" if p['data_inicio'] and p['data_fim'] else "",
                locale.currency(p["valor_total"], grouping=True)
            ]
            for p in dados["detalhes"]["producao_administrativa"]
        ]
        
        pdf.add_table(headers, data, [90, 60, 40])
    
    # Detalhes dos descontos e créditos
    if dados["detalhes"]["descontos_creditos"]:
        pdf.add_page()
        pdf.chapter_title("Detalhes dos Descontos e Créditos")
        
        headers = ["Tipo", "Descrição", "Data", "Valor"]
        data = [
            [
                dc["tipo"].capitalize(),
                dc["descricao"],
                dc["data"],
                locale.currency(dc["valor"], grouping=True)
            ]
            for dc in dados["detalhes"]["descontos_creditos"]
        ]
        
        pdf.add_table(headers, data, [30, 80, 40, 40])
    
    # Salvar PDF
    output_path = os.path.join(tempfile.gettempdir(), f"producao_medica_{dados['medico_id']}_{dados['competencia']}.pdf")
    pdf.output(output_path)
    
    return output_path

def gerar_pdf_prolabore(dados: Dict[str, Any], logo_path: Optional[str] = None) -> str:
    """
    Gera um PDF de pró-labore.
    
    Args:
        dados: Dados do pró-labore
        logo_path: Caminho para o logo (opcional)
    
    Returns:
        str: Caminho para o arquivo PDF gerado
    """
    # Criar PDF
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Configurar título e logo
    pdf.title = "Relatório de Pró-Labore"
    if logo_path:
        pdf.logo_path = logo_path
    
    # Informações do médico
    pdf.add_info_block("Informações do Médico", {
        "Nome": dados["nome_medico"],
        "Competência": dados["competencia"],
        "CPF": dados.get("cpf", ""),
        "CRM": dados.get("crm", "")
    })
    
    # Resumo financeiro
    pdf.add_info_block("Resumo Financeiro", {
        "Valor Bruto Total": locale.currency(dados["valor_bruto_total"], grouping=True),
        "Valor INSS": locale.currency(dados["valor_inss"], grouping=True),
        "Valor IRRF": locale.currency(dados["valor_irrf"], grouping=True),
        "Valor Outros Descontos": locale.currency(dados["valor_outros_descontos"], grouping=True),
        "Valor Líquido Total": locale.currency(dados["valor_liquido_total"], grouping=True)
    })
    
    # Detalhes dos pró-labores
    if dados["detalhes"]["prolabores"]:
        pdf.chapter_title("Detalhes dos Pró-Labores")
        
        headers = ["Empresa", "Descrição", "Data", "Valor"]
        data = [
            [
                p["empresa"],
                p["descricao"],
                p["data"],
                locale.currency(p["valor_bruto"], grouping=True)
            ]
            for p in dados["detalhes"]["prolabores"]
        ]
        
        pdf.add_table(headers, data, [60, 50, 40, 40])
    
    # Informações do cálculo
    if dados["detalhes"]["calculo_id"]:
        pdf.add_info_block("Informações do Cálculo", {
            "Data do Cálculo": dados["detalhes"]["data_calculo"],
            "Responsável": dados["detalhes"]["usuario_calculo"]
        })
    
    # Salvar PDF
    output_path = os.path.join(tempfile.gettempdir(), f"prolabore_{dados['medico_id']}_{dados['competencia']}.pdf")
    pdf.output(output_path)
    
    return output_path

