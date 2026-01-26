from rest_framework import serializers
from django.utils import timezone
from django.db.models import Sum # <--- IMPORTANTE: Para calcular totais
from .models import Transacao, LogSistema, Membro, Mensalidade, Configuracao, Evento

# ==============================================================================
# 1. TRANSAÇÕES (ATUALIZADO COM EVENTO)
# ==============================================================================
class TransacaoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.ReadOnlyField(source='responsavel.username')
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    # --- CAMPOS NOVOS PARA VÍNCULO DE EVENTO ---
    # Para LEITURA: Mostra o nome do evento na tabela
    evento_nome = serializers.ReadOnlyField(source='evento.nome')
    
    # Para ESCRITA: Recebe o ID do evento do formulário
    evento_id = serializers.PrimaryKeyRelatedField(
        queryset=Evento.objects.all(), 
        source='evento', 
        write_only=True, 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = Transacao
        fields = [
            'id', 'tipo', 'tipo_display', 'categoria', 'categoria_display',
            'valor', 'nome', 'descricao', 'forma_pagamento',
            'data_transacao', 'responsavel_nome',
            'evento_id', 'evento_nome' # <--- Adicionados aqui
        ]

# ==============================================================================
# 2. EVENTOS (NOVO)
# ==============================================================================
class EventoSerializer(serializers.ModelSerializer):
    # Campos Calculados (O Backend faz a conta)
    total_entradas = serializers.SerializerMethodField()
    total_saidas = serializers.SerializerMethodField()
    lucro = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Evento
        fields = [
            'id', 'nome', 'data_evento', 'status', 'status_display',
            'descricao', 'total_entradas', 'total_saidas', 'lucro'
        ]

    def get_total_entradas(self, obj):
        # Soma todas as transações de ENTRADA vinculadas a este evento
        return obj.transacoes.filter(tipo='ENTRADA').aggregate(Sum('valor'))['valor__sum'] or 0

    def get_total_saidas(self, obj):
        # Soma todas as transações de SAIDA vinculadas a este evento
        return obj.transacoes.filter(tipo='SAIDA').aggregate(Sum('valor'))['valor__sum'] or 0

    def get_lucro(self, obj):
        # Entradas - Saídas
        ent = self.get_total_entradas(obj)
        sai = self.get_total_saidas(obj)
        return ent - sai

# ==============================================================================
# 3. LOGS DO SISTEMA
# ==============================================================================
class LogSistemaSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = LogSistema
        fields = ['id', 'usuario_nome', 'acao', 'detalhes', 'ip_address', 'data_criacao']

# ==============================================================================
# 4. MENSALIDADES
# ==============================================================================
class MensalidadeSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Mensalidade
        fields = ['id', 'mes_referencia', 'valor', 'paga', 'data_vencimento', 'status']

    def get_status(self, obj):
        if obj.paga:
            return 'PAGO'
        if obj.data_vencimento < timezone.now().date():
            return 'ATRASADO'
        return 'ABERTO'

# ==============================================================================
# 5. MEMBROS
# ==============================================================================
class MembroSerializer(serializers.ModelSerializer):
    mensalidades_abertas = serializers.SerializerMethodField()
    historico_pagamentos = serializers.SerializerMethodField() 
    
    class Meta:
        model = Membro
        fields = [
            'id', 'nome', 'dm_id', 'status', 
            'mensalidades_abertas', 
            'historico_pagamentos'
        ]

    def get_mensalidades_abertas(self, obj):
        pendentes = obj.mensalidades.filter(paga=False).order_by('mes_referencia')
        return MensalidadeSerializer(pendentes, many=True).data
        
    def get_historico_pagamentos(self, obj):
        pagas = obj.mensalidades.filter(paga=True).order_by('-mes_referencia')[:5]
        return MensalidadeSerializer(pagas, many=True).data

# ==============================================================================
# 6. CONFIGURAÇÕES
# ==============================================================================  
class ConfiguracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracao
        fields = '__all__'