from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from django.db.models import Sum
# ADICIONADO: Import do Model Configuracao
from .models import Transacao, LogSistema, Configuracao, Mensalidade
from datetime import datetime, date
import os
import calendar

def get_nome_capitulo():
    """Função auxiliar para pegar o nome do capítulo ou um fallback seguro."""
    try:
        config = Configuracao.objects.first()
        if config:
            return config.nome_capitulo
        return "Capítulo DeMolay (Nome Não Configurado)"
    except:
        return "Capítulo DeMolay"

def gerar_relatorio_mensal(request):
    # 1. Detectar Mês e Ano (Da URL ou Atual)
    try:
        mes_ref = int(request.GET.get('mes', datetime.now().month))
        ano_ref = int(request.GET.get('ano', datetime.now().year))
    except ValueError:
        mes_ref = datetime.now().month
        ano_ref = datetime.now().year

    # Define o intervalo do mês
    data_inicio = date(ano_ref, mes_ref, 1)
    ultimo_dia = calendar.monthrange(ano_ref, mes_ref)[1]
    data_fim = date(ano_ref, mes_ref, ultimo_dia)

    # Busca o nome dinâmico
    nome_capitulo = get_nome_capitulo()

    # 2. Configurar PDF
    response = HttpResponse(content_type='application/pdf')
    filename = f"Balancete_{mes_ref:02d}-{ano_ref}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    doc = SimpleDocTemplate(response, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []
    styles = getSampleStyleSheet()

    # --- MATEMÁTICA FINANCEIRA ---
    # A) Calcular Saldo Anterior (Tudo antes do dia 01 deste mês)
    entradas_ant = Transacao.objects.filter(data_transacao__date__lt=data_inicio, tipo='ENTRADA').aggregate(Sum('valor'))['valor__sum'] or 0
    saidas_ant = Transacao.objects.filter(data_transacao__date__lt=data_inicio, tipo='SAIDA').aggregate(Sum('valor'))['valor__sum'] or 0
    saldo_anterior = entradas_ant - saidas_ant

    # B) Transações do Mês (Período Atual)
    transacoes = Transacao.objects.filter(
        data_transacao__date__range=[data_inicio, data_fim]
    ).order_by('data_transacao')

    # 3. Cabeçalho
    logo_path = os.path.join(os.path.dirname(__file__), 'static', 'images', 'logo_capitulo.png')
    if os.path.exists(logo_path):
        im = Image(logo_path, width=2.5*cm, height=2.5*cm)
        im.hAlign = 'CENTER'
        elements.append(im)
        elements.append(Spacer(1, 0.5*cm))

    # USANDO O NOME DINÂMICO AQUI
    elements.append(Paragraph(nome_capitulo, ParagraphStyle('Title', parent=styles['Heading1'], alignment=1, textColor=colors.darkblue)))
    elements.append(Paragraph(f"Balancete Mensal: {mes_ref:02d}/{ano_ref}", ParagraphStyle('Sub', parent=styles['Heading2'], alignment=1, fontSize=12)))
    elements.append(Spacer(1, 0.5*cm))

    # 4. Linha de Saldo Anterior
    texto_anterior = f"<b>SALDO ANTERIOR (Em {data_inicio.strftime('%d/%m/%Y')}):</b> R$ {saldo_anterior:,.2f}"
    elements.append(Paragraph(texto_anterior, styles['Normal']))
    elements.append(Spacer(1, 0.5*cm))

    # 5. Tabela de Movimentação
    data_table = [['DATA', 'TIPO', 'DESCRIÇÃO', 'CAT.', 'VALOR']]
    
    total_entradas_mes = 0
    total_saidas_mes = 0

    if not transacoes.exists():
        data_table.append(['-', '-', 'Nenhuma movimentação neste mês', '-', '-'])
    else:
        for t in transacoes:
            data_fmt = t.data_transacao.strftime("%d/%m")
            tipo_abrev = "(+) ENT" if t.tipo == 'ENTRADA' else "(-) SAI"
            valor_fmt = f"{t.valor:,.2f}"
            
            if t.tipo == 'ENTRADA':
                total_entradas_mes += t.valor
            else:
                total_saidas_mes += t.valor

            data_table.append([data_fmt, tipo_abrev, t.nome[:28], t.categoria, valor_fmt])

    # Estilo da Tabela
    table = Table(data_table, colWidths=[2*cm, 2*cm, 7.5*cm, 2*cm, 3*cm])
    style_table = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white])
    ])
    table.setStyle(style_table)
    elements.append(table)
    elements.append(Spacer(1, 1*cm))

    # 6. Resumo Final
    saldo_atual = saldo_anterior + total_entradas_mes - total_saidas_mes
    cor_saldo = "green" if saldo_atual >= 0 else "red"

    resumo_texto = f"""
    <font size=12><b>RESUMO DO MÊS:</b></font><br/>
    (+) Entradas do Período: R$ {total_entradas_mes:,.2f}<br/>
    (-) Saídas do Período: R$ {total_saidas_mes:,.2f}<br/>
    -------------------------------------------------<br/>
    <font color={cor_saldo} size=14><b>SALDO EM {data_fim.strftime('%d/%m/%Y')}: R$ {saldo_atual:,.2f}</b></font>
    """
    
    p_resumo = Paragraph(resumo_texto, ParagraphStyle('Resumo', parent=styles['Normal'], alignment=2, leading=16))
    elements.append(p_resumo)

    # --- ASSINATURAS (TESOUREIRO E MESTRE CONSELHEIRO) ---
    elements.append(Spacer(1, 3*cm)) 

    # USANDO O NOME DINÂMICO NAS ASSINATURAS
    assinaturas_data = [
        ["_______________________________", "_______________________________"],
        ["TESOUREIRO", "MESTRE CONSELHEIRO"],
        [nome_capitulo, nome_capitulo]
    ]

    ass_table = Table(assinaturas_data, colWidths=[8.5*cm, 8.5*cm])
    ass_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
    ]))
    
    elements.append(ass_table)

    doc.build(elements)
    return response

def gerar_relatorio_logs(request):
    # 1. Detectar Mês e Ano
    try:
        mes_ref = int(request.GET.get('mes', datetime.now().month))
        ano_ref = int(request.GET.get('ano', datetime.now().year))
    except ValueError:
        mes_ref = datetime.now().month
        ano_ref = datetime.now().year
    
    # Busca Nome Dinâmico
    nome_capitulo = get_nome_capitulo()

    # 2. Configuração do Nome do Arquivo
    data_arquivo = datetime.now().strftime('%d-%m-%Y')
    response = HttpResponse(content_type='application/pdf')
    filename = f"relatorio_de_auditoria_{data_arquivo}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    # 3. Configuração da Página
    doc = SimpleDocTemplate(response, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=2*cm)
    elements = []
    styles = getSampleStyleSheet()

    # --- ESTILOS PERSONALIZADOS ---
    style_chapter = ParagraphStyle(
        'ChapterTitle',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1, 
        textColor=colors.black,
        fontName='Times-Bold',
        spaceAfter=2
    )
    
    style_sub = ParagraphStyle(
        'OrderTitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=1,
        textColor=colors.grey,
        fontName='Times-Roman',
        spaceAfter=12
    )

    style_report_title = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading2'],
        fontSize=14,
        alignment=0,
        textColor=colors.navy,
        fontName='Helvetica-Bold',
        spaceBefore=20,
        spaceAfter=10,
        borderPadding=5,
        borderColor=colors.navy,
        borderWidth=0,
        borderBottomWidth=1
    )

    style_cell = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Helvetica'
    )

    # --- MONTAGEM DO CABEÇALHO ---
    logo_path = os.path.join(os.path.dirname(__file__), 'static', 'images', 'logo_capitulo.png')
    if os.path.exists(logo_path):
        im = Image(logo_path, width=2.5*cm, height=2.5*cm)
        im.hAlign = 'CENTER'
        elements.append(im)
        elements.append(Spacer(1, 0.5*cm))

    # USANDO NOME DINÂMICO (EM MAIÚSCULO)
    elements.append(Paragraph(nome_capitulo.upper(), style_chapter))
    elements.append(Paragraph("ORDEM DEMOLAY - ESTADO DO AMAZONAS", style_sub))
    elements.append(Spacer(1, 0.5*cm))

    periodo_extenso = date(ano_ref, mes_ref, 1).strftime("%B de %Y").capitalize()
    elements.append(Paragraph(f"RELATÓRIO DE AUDITORIA INTERNA - {periodo_extenso}", style_report_title))
    
    data_emissao = datetime.now().strftime("%d/%m/%Y às %H:%M")
    elements.append(Paragraph(f"Documento emitido em: {data_emissao} | Usuário solicitante: {request.user.username}", 
                              ParagraphStyle('Meta', parent=styles['Normal'], fontSize=8, textColor=colors.grey)))
    elements.append(Spacer(1, 0.5*cm))

    # --- TABELA DE DADOS ---
    headers = [
        Paragraph('DATA/HORA', ParagraphStyle('H', parent=style_cell, textColor=colors.white, fontName='Helvetica-Bold')),
        Paragraph('USUÁRIO', ParagraphStyle('H', parent=style_cell, textColor=colors.white, fontName='Helvetica-Bold')),
        Paragraph('AÇÃO REGISTRADA', ParagraphStyle('H', parent=style_cell, textColor=colors.white, fontName='Helvetica-Bold')),
        Paragraph('DETALHES TÉCNICOS', ParagraphStyle('H', parent=style_cell, textColor=colors.white, fontName='Helvetica-Bold'))
    ]
    
    data_table = [headers]
    
    logs = LogSistema.objects.filter(
        data_criacao__month=mes_ref, 
        data_criacao__year=ano_ref
    ).order_by('-data_criacao')

    if not logs.exists():
         data_table.append(['-', '-', 'Nenhum registro de atividade encontrado neste período.', '-'])
    else:
        for log in logs:
            data_fmt = log.data_criacao.strftime("%d/%m/%Y\n%H:%M:%S")
            user_fmt = log.usuario.username if log.usuario else "SISTEMA"
            p_acao = Paragraph(log.acao, style_cell)
            texto_detalhes = log.detalhes if log.detalhes else ""
            p_detalhes = Paragraph(texto_detalhes, style_cell)
            
            data_table.append([data_fmt, user_fmt, p_acao, p_detalhes])

    table = Table(data_table, colWidths=[2.5*cm, 2.5*cm, 6*cm, 7*cm], repeatRows=1)
    
    style_table_obj = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('VALIGN', (0, 1), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ])
    table.setStyle(style_table_obj)
    elements.append(table)

    # --- ASSINATURAS (TESOUREIRO E MESTRE CONSELHEIRO) ---
    elements.append(Spacer(1, 2.5*cm))

    # USANDO NOME DINÂMICO
    assinaturas_data = [
        ["_______________________________", "_______________________________"],
        ["TESOUREIRO", "MESTRE CONSELHEIRO"],
        [nome_capitulo, nome_capitulo]
    ]

    ass_table = Table(assinaturas_data, colWidths=[9*cm, 9*cm])
    ass_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'), 
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
    ]))
    
    elements.append(ass_table)

    doc.build(elements)
    return response

# --- RELATÓRIO: RECIBO INDIVIDUAL ---
def gerar_recibo_mensalidade(request, pk):
    try:
        mensalidade = Mensalidade.objects.get(pk=pk, paga=True)
    except Mensalidade.DoesNotExist:
        return HttpResponse("Erro: Mensalidade não encontrada ou não paga.", status=404)

    # Configuração Dinâmica
    nome_capitulo = get_nome_capitulo()

    response = HttpResponse(content_type='application/pdf')
    filename = f"Recibo_{mensalidade.membro.nome}_{mensalidade.mes_referencia.strftime('%m-%Y')}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    # Tamanho A5 paisagem (bom para recibos)
    c = canvas.Canvas(response, pagesize=(21*cm, 14.8*cm)) 
    width, height = (21*cm, 14.8*cm)

    # Borda Decorativa
    c.setStrokeColor(colors.darkblue)
    c.setLineWidth(3)
    c.rect(1*cm, 1*cm, width-2*cm, height-2*cm)

    # Cabeçalho
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.darkblue)
    c.drawCentredString(width/2, height - 2.5*cm, nome_capitulo.upper())
    
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    c.drawCentredString(width/2, height - 3*cm, "ORDEM DEMOLAY")

    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2, height - 4.5*cm, "RECIBO DE MENSALIDADE")

    # Corpo do Recibo
    y = height - 6.5*cm
    c.setFont("Helvetica", 12)
    
    texto = f"Recebemos de {mensalidade.membro.nome}"
    c.drawString(2*cm, y, texto)
    
    y -= 1*cm
    texto_valor = f"A importância de R$ {mensalidade.valor:,.2f}"
    c.drawString(2*cm, y, texto_valor)

    y -= 1*cm
    mes_extenso = mensalidade.mes_referencia.strftime("%B de %Y").capitalize()
    texto_ref = f"Referente à Mensalidade de: {mes_extenso}"
    c.drawString(2*cm, y, texto_ref)

    # Data e Assinatura
    data_pagamento = mensalidade.data_pagamento.strftime("%d/%m/%Y") if mensalidade.data_pagamento else datetime.now().strftime("%d/%m/%Y")
    
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 2*cm, 3.5*cm, f"Manaus, {data_pagamento}")

    c.line(width - 8*cm, 2*cm, width - 2*cm, 2*cm)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width - 5*cm, 1.5*cm, "TESOUREIRO")

    # Marca d'água de "PAGO"
    c.saveState()
    c.translate(width/2, height/2)
    c.rotate(45)
    c.setFillColor(colors.lightgrey)
    c.setFont("Helvetica-Bold", 80)
    c.setFillAlpha(0.3)
    c.drawCentredString(0, 0, "PAGO")
    c.restoreState()

    c.showPage()
    c.save()
    return response