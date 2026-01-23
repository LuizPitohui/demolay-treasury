from django.contrib import admin
from django.utils.html import format_html
from .models import Transacao, LogSistema

# ==============================================================================
# 1. ADMIN DE TRANSAÇÕES (Visual Rico)
# ==============================================================================
@admin.register(Transacao)
class TransacaoAdmin(admin.ModelAdmin):
    list_display = ('data_transacao_fmt', 'nome', 'tipo_fmt', 'categoria', 'valor_fmt', 'responsavel')
    list_filter = ('tipo', 'categoria', 'forma_pagamento', 'data_transacao')
    search_fields = ('nome', 'descricao')
    date_hierarchy = 'data_transacao'
    ordering = ('-data_transacao',)

    def valor_fmt(self, obj):
        # Formata o valor como moeda R$ e colore
        color = 'green' if obj.tipo == 'ENTRADA' else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">R$ {}</span>',
            color,
            f"{obj.valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        )
    valor_fmt.short_description = 'Valor'

    def tipo_fmt(self, obj):
        # Ícones visuais para entrada e saída
        icon = '⬆️' if obj.tipo == 'ENTRADA' else '⬇️'
        return f"{icon} {obj.get_tipo_display()}"
    tipo_fmt.short_description = 'Tipo'

    def data_transacao_fmt(self, obj):
        return obj.data_transacao.strftime('%d/%m/%Y %H:%M')
    data_transacao_fmt.short_description = 'Data'


# ==============================================================================
# 2. ADMIN DE LOGS (Auditoria Inviolável)
# ==============================================================================
@admin.register(LogSistema)
class LogSistemaAdmin(admin.ModelAdmin):
    # O "Nexus" deve ser inviolável
    list_display = ('timestamp_fmt', 'acao_colorida', 'usuario', 'ip_address', 'detalhes_resumidos')
    list_filter = ('acao', 'usuario', 'data_criacao')
    search_fields = ('acao', 'detalhes', 'usuario__username')
    ordering = ('-data_criacao',)
    
    # Torna TODOS os campos apenas leitura dinamicamente
    readonly_fields = [field.name for field in LogSistema._meta.fields]

    # --- Bloqueio Total de Edição (Segurança Máxima) ---
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    # --- Formatação Visual ---
    def acao_colorida(self, obj):
        # Tenta deduzir a cor baseada no texto da ação, já que agora é texto livre
        acao_lower = obj.acao.lower()
        if 'cri' in acao_lower or 'add' in acao_lower: # Criou, create
            color = 'green'
        elif 'rem' in acao_lower or 'del' in acao_lower or 'apa' in acao_lower: # Removeu, delete, apagou
            color = 'red'
        elif 'pdf' in acao_lower or 'rel' in acao_lower: # PDF, Relatório
            color = 'blue'
        else:
            color = 'orange' # Edição ou outros

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.acao
        )
    acao_colorida.short_description = 'Ação'

    def timestamp_fmt(self, obj):
        return obj.data_criacao.strftime('%d/%m/%Y %H:%M:%S')
    timestamp_fmt.short_description = 'Quando'

    def detalhes_resumidos(self, obj):
        # Corta o texto se for muito grande para não quebrar o layout da tabela
        if obj.detalhes and len(obj.detalhes) > 50:
            return obj.detalhes[:50] + "..."
        return obj.detalhes or "-"
    detalhes_resumidos.short_description = 'Detalhes'