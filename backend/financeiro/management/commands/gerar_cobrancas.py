# ... imports ...
from financeiro.models import Configuracao # <--- IMPORTANTE

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # 1. Pega a configuração
        config, _ = Configuracao.objects.get_or_create(pk=1)
        valor_atual = config.valor_mensalidade
        dia_venc = config.dia_vencimento

        hoje = timezone.now().date()
        mes_ref = date(hoje.year, hoje.month, 1)
        
        # Usa o dia configurado
        try:
            vencimento = date(hoje.year, hoje.month, dia_venc)
        except ValueError:
             # Caso coloque dia 31 num mês de 30 dias, ajusta para o ultimo dia
            import calendar
            ultimo_dia = calendar.monthrange(hoje.year, hoje.month)[1]
            vencimento = date(hoje.year, hoje.month, ultimo_dia)

        self.stdout.write(f"Usando valor: R$ {valor_atual} e Dia: {dia_venc}")

        # ... resto do código usa 'valor_atual' em vez de 35.00