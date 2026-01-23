from rest_framework import serializers
from .models import Transacao, LogSistema # <--- Import corrigido (AuditLog saiu, LogSistema entrou)

class TransacaoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.ReadOnlyField(source='responsavel.username')
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = Transacao
        fields = [
            'id', 'tipo', 'tipo_display', 'categoria', 'categoria_display',
            'valor', 'nome', 'descricao', 'forma_pagamento',
            'data_transacao', 'responsavel_nome'
        ]

class LogSistemaSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = LogSistema
        fields = ['id', 'usuario_nome', 'acao', 'detalhes', 'ip_address', 'data_criacao']