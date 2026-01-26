from rest_framework import viewsets, views, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.db.models import Sum
from django.db.models.functions import TruncMonth, TruncDay, ExtractYear
from datetime import datetime
import csv
import io

# ==============================================================================
# IMPORTS DOS PARSERS
# ==============================================================================
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

# ==============================================================================
# IMPORTS DOS MODELS E SERIALIZERS (CORRIGIDO AQUI)
# ==============================================================================
from .models import (
    Transacao, 
    LogSistema, 
    Membro, 
    Mensalidade, 
    Configuracao,
    Evento # <--- FALTAVA IMPORTAR ISSO
)

from .serializers import (
    TransacaoSerializer, 
    LogSistemaSerializer, 
    MembroSerializer,
    ConfiguracaoSerializer,
    EventoSerializer # <--- FALTAVA IMPORTAR ISSO
)

from .reports import (
    gerar_relatorio_mensal, 
    gerar_relatorio_logs,
    gerar_recibo_mensalidade 
)

# ==============================================================================
# 1. VIEW DE STATUS (HEALTH CHECK)
# ==============================================================================
class HealthCheckView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "status": "online", 
            "server": "Nexus-Arasaka", 
            "version": "1.5 (Eventos)"
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
    queryset = Membro.objects.all().order_by('nome')
    serializer_class = MembroSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    # --- AÇÃO 1: PAGAR MENSALIDADE ---
    @action(detail=True, methods=['post'])
    def pagar_mensalidade(self, request, pk=None):
        membro = self.get_object()
        mensalidade_id = request.data.get('mensalidade_id')
        
        try:
            mensalidade = Mensalidade.objects.get(id=mensalidade_id, membro=membro)
            
            if mensalidade.paga:
                return Response({"erro": "Esta mensalidade já foi paga."}, status=status.HTTP_400_BAD_REQUEST)

            mensalidade.paga = True
            mensalidade.data_pagamento = datetime.now().date()
            mensalidade.save()

            Transacao.objects.create(
                tipo='ENTRADA',
                valor=mensalidade.valor,
                nome=f"Mensalidade - {membro.nome}",
                descricao=f"Ref: {mensalidade.mes_referencia.strftime('%m/%Y')} (ID DeMolay: {membro.dm_id})",
                categoria='MENSALIDADE',
                responsavel=request.user,
                forma_pagamento='PIX' 
            )
            
            if hasattr(membro, 'atualizar_status'):
                membro.atualizar_status()

            LogSistema.objects.create(
                usuario=request.user,
                acao=f"Recebeu Mensalidade: {membro.nome}",
                detalhes=f"Ref: {mensalidade.mes_referencia.strftime('%m/%Y')} - R$ {mensalidade.valor}",
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({"status": "Pagamento registrado com sucesso!"}, status=status.HTTP_200_OK)
            
        except Mensalidade.DoesNotExist:
            return Response({"erro": "Mensalidade não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    # --- AÇÃO 2: IMPORTAR CSV ---
    @action(detail=False, methods=['post'], url_path='importar')
    def importar_csv(self, request):
        file_obj = request.FILES.get('arquivo')
        
        if not file_obj:
            return Response({"erro": "Nenhum arquivo enviado."}, status=400)

        if not file_obj.name.lower().endswith('.csv'):
            return Response({"erro": "O arquivo deve ser um CSV."}, status=400)

        try:
            decoded_file = file_obj.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            
            primeira_linha = io_string.readline()
            io_string.seek(0)

            separador = ';' if ';' in primeira_linha else ','
            reader = csv.DictReader(io_string, delimiter=separador)

            if reader.fieldnames:
                reader.fieldnames = [name.strip().upper() for name in reader.fieldnames]
            else:
                 return Response({"erro": "O arquivo CSV parece estar vazio."}, status=400)
            
            if 'NOME' not in reader.fieldnames or 'ID' not in reader.fieldnames:
                 return Response({"erro": "Necessário colunas 'NOME' e 'ID'."}, status=400)

            criados = 0
            atualizados = 0

            for row in reader:
                nome = row.get('NOME', '').strip()
                dm_id_str = row.get('ID', '').strip()

                if not nome or not dm_id_str: continue
                
                try:
                    dm_id = int(dm_id_str)
                except ValueError:
                    continue

                _, created = Membro.objects.update_or_create(
                    dm_id=dm_id,
                    defaults={'nome': nome, 'status': 'REGULAR'}
                )

                if created: criados += 1
                else: atualizados += 1
            
            LogSistema.objects.create(
                usuario=request.user,
                acao="Importação de Membros",
                detalhes=f"Importou CSV. {criados} novos, {atualizados} atualizados.",
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({
                "mensagem": "Importação concluída!",
                "detalhes": f"{criados} membros cadastrados e {atualizados} verificados."
            }, status=200)

        except UnicodeDecodeError:
            return Response({"erro": "Erro de codificação. Salve como CSV UTF-8."}, status=400)
        except Exception as e:
            return Response({"erro": f"Erro interno: {str(e)}"}, status=500)

# ==============================================================================
# 4. DASHBOARD
# ==============================================================================
class DashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Filtros da Requisição
        hoje = datetime.now()
        ano_selecionado = request.GET.get('ano', hoje.year)
        mes_selecionado = request.GET.get('mes', None) # Se vier vazio, é ANUAL

        # 2. Base Queryset (Filtra pelo Ano primeiro)
        # Convertemos para int para evitar erro, se falhar usa o ano atual
        try:
            ano_selecionado = int(ano_selecionado)
        except:
            ano_selecionado = hoje.year

        transacoes_ano = Transacao.objects.filter(data_transacao__year=ano_selecionado)

        # Se tiver mês selecionado, filtra o mês também
        if mes_selecionado:
            try:
                mes_int = int(mes_selecionado)
                transacoes_filtro = transacoes_ano.filter(data_transacao__month=mes_int)
                # Agrupamento por DIA
                trunc_func = TruncDay('data_transacao')
            except:
                transacoes_filtro = transacoes_ano
                trunc_func = TruncMonth('data_transacao')
        else:
            transacoes_filtro = transacoes_ano
            # Agrupamento por MÊS (Visão Anual)
            trunc_func = TruncMonth('data_transacao')

        # 3. Totais (Baseados no Filtro Atual)
        total_entradas = transacoes_filtro.filter(tipo='ENTRADA').aggregate(Sum('valor'))['valor__sum'] or 0
        total_saidas = transacoes_filtro.filter(tipo='SAIDA').aggregate(Sum('valor'))['valor__sum'] or 0
        saldo_total = total_entradas - total_saidas

        # 4. Potes (Sempre baseados no saldo acumulado do filtro ou geral? 
        # Geralmente saldo é "foto do momento", mas aqui faremos baseado no filtro para bater com o gráfico)
        cats_filantropia = ['FIL', 'CAM', 'DOACAO'] 
        ent_fil = transacoes_filtro.filter(tipo='ENTRADA', categoria__in=cats_filantropia).aggregate(Sum('valor'))['valor__sum'] or 0
        sai_fil = transacoes_filtro.filter(tipo='SAIDA', categoria__in=cats_filantropia).aggregate(Sum('valor'))['valor__sum'] or 0
        saldo_filantropia = ent_fil - sai_fil
        saldo_adm = saldo_total - saldo_filantropia

        # 5. Gráficos
        por_categoria = transacoes_filtro.values('categoria').annotate(total=Sum('valor')).order_by('-total')

        # Fluxo (A Mágica: muda entre Dia e Mês dependendo do filtro)
        fluxo = transacoes_filtro.annotate(
            data_ref=trunc_func
        ).values('data_ref', 'tipo').annotate(total=Sum('valor')).order_by('data_ref')

        # 6. Recentes (Do filtro atual)
        ultimas = transacoes_filtro.order_by('-data_transacao')[:5]
        ultimas_serializer = TransacaoSerializer(ultimas, many=True)

        # 7. Lista de Anos Disponíveis (Para o Dropdown)
        anos_disponiveis = Transacao.objects.annotate(year=ExtractYear('data_transacao')).values_list('year', flat=True).distinct().order_by('-year')
        # Garante que o ano atual esteja na lista mesmo se não tiver transação
        lista_anos = list(anos_disponiveis)
        if hoje.year not in lista_anos:
            lista_anos.insert(0, hoje.year)

        return Response({
            "cards": {
                "saldo": saldo_total,
                "entradas": total_entradas,
                "saidas": total_saidas,
                "saldo_adm": saldo_adm,
                "saldo_filantropia": saldo_filantropia
            },
            "graficos": {
                "por_categoria": por_categoria,
                "fluxo": fluxo # Renomeei de fluxo_mensal para fluxo (pois pode ser diario)
            },
            "recentes": ultimas_serializer.data,
            "meta": {
                "anos_disponiveis": lista_anos,
                "ano_atual": ano_selecionado,
                "mes_atual": mes_selecionado
            }
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

    @action(detail=False, methods=['post'])
    def aplicar_reajuste(self, request):
        config = Configuracao.objects.get(pk=1)
        novo_valor = config.valor_mensalidade
        afetados = Mensalidade.objects.filter(paga=False)
        total_afetados = afetados.count()
        
        if total_afetados == 0:
            return Response({"mensagem": "Nenhuma mensalidade em aberto para atualizar."}, status=200)

        afetados.update(valor=novo_valor)
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

# ==============================================================================
# 7. EVENTOS (NOVO)
# ==============================================================================
class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all().order_by('-data_evento')
    serializer_class = EventoSerializer
    permission_classes = [permissions.IsAuthenticated]