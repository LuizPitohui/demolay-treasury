from rest_framework import viewsets, views, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from datetime import datetime

# ==============================================================================
# IMPORTS DOS MODELS E SERIALIZERS
# ==============================================================================

# Import unificado dos Models (incluindo Configuracao)
from .models import (
    Transacao, 
    LogSistema, 
    Membro, 
    Mensalidade, 
    Configuracao
)

# Import dos Serializers (incluindo ConfiguracaoSerializer)
from .serializers import (
    TransacaoSerializer, 
    LogSistemaSerializer, 
    MembroSerializer,
    ConfiguracaoSerializer
)

# Import dos Geradores de PDF
from .reports import gerar_relatorio_mensal, gerar_relatorio_logs

# ==============================================================================
# 1. VIEW DE STATUS (HEALTH CHECK)
# ==============================================================================
class HealthCheckView(views.APIView):
    """
    Endpoint leve para o Frontend saber se o Backend está vivo.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "status": "online", 
            "server": "Nexus-Arasaka", 
            "version": "1.3 (Configurações)"
        })

# ==============================================================================
# 2. TRANSAÇÕES E LOGS (CRUD)
# ==============================================================================

class TransacaoViewSet(viewsets.ModelViewSet):
    queryset = Transacao.objects.all().order_by('-data_transacao')
    serializer_class = TransacaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        return queryset

    # --- LÓGICA DE AUDITORIA MANUAL (LOGS) ---
    def perform_create(self, serializer):
        instance = serializer.save(responsavel=self.request.user)
        LogSistema.objects.create(
            usuario=self.request.user,
            acao=f"Criou Transação: {instance.nome} (R$ {instance.valor})",
            detalhes=f"Categoria: {instance.categoria} | Tipo: {instance.tipo}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        LogSistema.objects.create(
            usuario=self.request.user,
            acao=f"Editou Transação: {instance.nome}",
            detalhes=f"Novo Valor: R$ {instance.valor}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_destroy(self, instance):
        LogSistema.objects.create(
            usuario=self.request.user,
            acao=f"Apagou Transação: {instance.nome}",
            detalhes=f"Valor apagado: R$ {instance.valor}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        instance.delete()

class LogSistemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogSistema.objects.all().order_by('-data_criacao')
    serializer_class = LogSistemaSerializer
    permission_classes = [permissions.IsAuthenticated]

# ==============================================================================
# 3. MEMBROS E MENSALIDADES
# ==============================================================================

class MembroViewSet(viewsets.ModelViewSet):
    """
    Gerencia os membros e permite pagar mensalidades via ação personalizada.
    """
    queryset = Membro.objects.all().order_by('nome')
    serializer_class = MembroSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Ação Personalizada: Pagar Mensalidade
    # Rota: POST /api/membros/{id}/pagar_mensalidade/
    @action(detail=True, methods=['post'])
    def pagar_mensalidade(self, request, pk=None):
        membro = self.get_object()
        mensalidade_id = request.data.get('mensalidade_id')
        
        try:
            mensalidade = Mensalidade.objects.get(id=mensalidade_id, membro=membro)
            
            # Validação
            if mensalidade.paga:
                return Response({"erro": "Esta mensalidade já foi paga."}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Marca a mensalidade como PAGA
            mensalidade.paga = True
            mensalidade.data_pagamento = datetime.now().date()
            mensalidade.save()

            # 2. Cria AUTOMATICAMENTE a Transação no Caixa (Receita)
            Transacao.objects.create(
                tipo='ENTRADA',
                valor=mensalidade.valor,
                nome=f"Mensalidade - {membro.nome}",
                descricao=f"Ref: {mensalidade.mes_referencia.strftime('%m/%Y')} (ID DeMolay: {membro.dm_id})",
                categoria='MENSALIDADE',
                responsavel=request.user,
                forma_pagamento='PIX' 
            )
            
            # 3. Atualiza o status do membro (Regular/Irregular)
            if hasattr(membro, 'atualizar_status'):
                membro.atualizar_status()

            # 4. Gera Log de Auditoria
            LogSistema.objects.create(
                usuario=request.user,
                acao=f"Recebeu Mensalidade: {membro.nome}",
                detalhes=f"Ref: {mensalidade.mes_referencia.strftime('%m/%Y')} - R$ {mensalidade.valor}",
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({"status": "Pagamento registrado com sucesso!"}, status=status.HTTP_200_OK)
            
        except Mensalidade.DoesNotExist:
            return Response({"erro": "Mensalidade não encontrada ou não pertence a este membro."}, status=status.HTTP_404_NOT_FOUND)

# ==============================================================================
# 4. DASHBOARD (ESTATÍSTICAS)
# ==============================================================================

class DashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Totais Gerais
        total_entradas = Transacao.objects.filter(tipo='ENTRADA').aggregate(Sum('valor'))['valor__sum'] or 0
        total_saidas = Transacao.objects.filter(tipo='SAIDA').aggregate(Sum('valor'))['valor__sum'] or 0
        saldo_atual = total_entradas - total_saidas

        # 2. Gráfico Pizza
        por_categoria = Transacao.objects.values('categoria').annotate(total=Sum('valor')).order_by('-total')

        # 3. Gráfico Linha (Fluxo)
        fluxo_mensal = Transacao.objects.annotate(
            mes=TruncMonth('data_transacao')
        ).values('mes', 'tipo').annotate(total=Sum('valor')).order_by('mes')

        # 4. Recentes
        ultimas = Transacao.objects.all().order_by('-data_transacao')[:5]
        ultimas_serializer = TransacaoSerializer(ultimas, many=True)

        return Response({
            "cards": {
                "saldo": saldo_atual,
                "entradas": total_entradas,
                "saidas": total_saidas
            },
            "graficos": {
                "por_categoria": por_categoria,
                "fluxo_mensal": fluxo_mensal
            },
            "recentes": ultimas_serializer.data
        })

# ==============================================================================
# 5. RELATÓRIOS PDF
# ==============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def relatorio_pdf(request):
    return gerar_relatorio_mensal(request)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def relatorio_logs_view(request):
    return gerar_relatorio_logs(request)


# ==============================================================================
# 6. CONFIGURAÇÕES DO SISTEMA
# ==============================================================================
class ConfiguracaoViewSet(viewsets.ViewSet):
    """
    ViewSet especial que sempre retorna o objeto de ID 1.
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        # Pega a config ou cria a padrão se não existir
        config, _ = Configuracao.objects.get_or_create(pk=1)
        serializer = ConfiguracaoSerializer(config)
        return Response(serializer.data)

    def create(self, request):
        # Funciona como um Update (sempre no ID 1)
        config, _ = Configuracao.objects.get_or_create(pk=1)
        serializer = ConfiguracaoSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Log de Auditoria
            LogSistema.objects.create(
                usuario=request.user,
                acao="Alterou Configurações",
                detalhes="Atualizou parâmetros do sistema",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
class ConfiguracaoViewSet(viewsets.ViewSet):
    """
    ViewSet singleton para Configurações Globais.
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        config, _ = Configuracao.objects.get_or_create(pk=1)
        serializer = ConfiguracaoSerializer(config)
        return Response(serializer.data)

    def create(self, request):
        config, _ = Configuracao.objects.get_or_create(pk=1)
        serializer = ConfiguracaoSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            LogSistema.objects.create(
                usuario=request.user,
                acao="Alterou Configurações",
                detalhes="Atualizou parâmetros do sistema",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    # --- NOVA AÇÃO: REAJUSTAR VALORES ---
    @action(detail=False, methods=['post'])
    def aplicar_reajuste(self, request):
        """
        Pega o valor atual da configuração e aplica a todas as mensalidades
        que ainda não foram pagas.
        """
        config = Configuracao.objects.get(pk=1)
        novo_valor = config.valor_mensalidade
        
        # Filtra apenas o que NÃO foi pago
        afetados = Mensalidade.objects.filter(paga=False)
        total_afetados = afetados.count()
        
        if total_afetados == 0:
            return Response({"mensagem": "Nenhuma mensalidade em aberto para atualizar."}, status=200)

        # Atualiza o banco
        afetados.update(valor=novo_valor)

        # Gera Log
        LogSistema.objects.create(
            usuario=request.user,
            acao="Reajuste de Mensalidades",
            detalhes=f"Atualizou {total_afetados} mensalidades em aberto para R$ {novo_valor}",
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            "mensagem": "Sucesso!",
            "detalhes": f"{total_afetados} mensalidades foram atualizadas para R$ {novo_valor}"
        }, status=200)