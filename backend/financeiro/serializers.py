from rest_framework import serializers
from django.utils import timezone
from .models import Transacao, LogSistema, Membro, Mensalidade, Configuracao

# ==============================================================================
# 1. TRANSAÇÕES
# ==============================================================================
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

# ==============================================================================
# 2. LOGS DO SISTEMA
# ==============================================================================
class LogSistemaSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = LogSistema
        fields = ['id', 'usuario_nome', 'acao', 'detalhes', 'ip_address', 'data_criacao']

# ==============================================================================
# 3. MENSALIDADES (NOVO)
# ==============================================================================
class MensalidadeSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Mensalidade
        fields = ['id', 'mes_referencia', 'valor', 'paga', 'data_vencimento', 'status']

    def get_status(self, obj):
        # Lógica para o Frontend pintar de vermelho ou verde
        if obj.paga:
            return 'PAGO'
        # Se venceu antes de hoje, está atrasado
        if obj.data_vencimento < timezone.now().date():
            return 'ATRASADO'
        return 'ABERTO'

# ==============================================================================
# 4. MEMBROS (NOVO)
# ==============================================================================
class MembroSerializer(serializers.ModelSerializer):
    # Traz a lista de dívidas em aberto junto com o membro
    mensalidades_abertas = serializers.SerializerMethodField()
    
    class Meta:
        model = Membro
        fields = ['id', 'nome', 'dm_id', 'status', 'mensalidades_abertas']

    def get_mensalidades_abertas(self, obj):
        # Filtra apenas o que não foi pago, ordenado do mais antigo para o mais novo
        pendentes = obj.mensalidades.filter(paga=False).order_by('mes_referencia')
        return MensalidadeSerializer(pendentes, many=True).data


# ==============================================================================
# 5. CONFIGURAÇÕES (NOVO)
# ==============================================================================   

class ConfiguracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracao
        fields = '__all__'