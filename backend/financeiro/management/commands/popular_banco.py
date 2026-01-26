import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from financeiro.models import Transacao, Evento

class Command(BaseCommand):
    help = 'Popula o banco de dados com dados fictícios para teste (2024-2026)'

    def add_arguments(self, parser):
        # Opção para limpar o banco antes
        parser.add_argument(
            '--limpar',
            action='store_true',
            help='Apaga todas as transações e eventos antes de criar novos',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Pega o primeiro usuário (Admin) ou cria um se não existir
        admin_user = User.objects.first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Crie um superusuário antes: python manage.py createsuperuser'))
            return

        # --- LIMPEZA (Opcional) ---
        if options['limpar']:
            self.stdout.write(self.style.WARNING('Limpando dados antigos...'))
            Transacao.objects.all().delete()
            Evento.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Dados limpos!'))

        self.stdout.write('Iniciando população de dados...')

        # 1. CRIAR EVENTOS
        ev_feijoada = Evento.objects.create(nome="Feijoada 2024", data_evento="2024-06-15", status="CONCLUIDO")
        ev_natal = Evento.objects.create(nome="Natal Solidário 2025", data_evento="2025-12-20", status="CONCLUIDO")
        ev_pizza = Evento.objects.create(nome="Noite da Pizza 2026", data_evento="2026-03-10", status="ATIVO")

        # Função auxiliar interna
        def criar_t(data_ref, tipo, valor, nome, cat, ev=None):
            # CORREÇÃO: Removi 'responsavel_nome' pois ele não existe no Model
            Transacao.objects.create(
                tipo=tipo,
                valor=valor,
                nome=nome,
                categoria=cat,
                data_transacao=data_ref,
                responsavel=admin_user, 
                evento=ev,
                descricao="Mock Data gerado pelo script"
            )

        # 2. POPULAR 2024 e 2025 (Recorrentes)
        anos = [2024, 2025]
        meses = range(1, 13)

        for ano in anos:
            for mes in meses:
                data_base = date(ano, mes, 10)
                
                # Entradas (Mensalidades variam entre 400 e 1000 reais por mês)
                total_mes = random.randint(5, 12) * 85.00
                criar_t(data_base, 'ENTRADA', total_mes, f"Mensalidades {mes}/{ano}", "MENSALIDADE")
                
                # Saídas Fixas
                criar_t(data_base - timedelta(days=5), 'SAIDA', 1200.00, "Aluguel Sede", "ALUGUEL")
                criar_t(data_base + timedelta(days=2), 'SAIDA', random.uniform(180, 350), "Luz/Energia", "ADM")

        # 3. POPULAR JANEIRO 2026 (Detalhado dia a dia)
        transacoes_2026 = [
            ("2026-01-02", "SAIDA", 1250.00, "Aluguel Janeiro", "ALUGUEL", None),
            ("2026-01-05", "ENTRADA", 350.00, "Mensalidades (Pix)", "MENSALIDADE", None),
            ("2026-01-06", "ENTRADA", 170.00, "Mensalidades (Dinheiro)", "MENSALIDADE", None),
            ("2026-01-10", "SAIDA", 280.50, "Energia Equatorial", "ADM", None),
            ("2026-01-15", "ENTRADA", 1500.00, "Patrocínio Pizza", "OUTRO_ENTRADA", ev_pizza),
            ("2026-01-20", "ENTRADA", 500.00, "Doação Anônima", "DOACAO", None),
            ("2026-01-25", "SAIDA", 600.00, "Adiantamento Buffet", "EVE", ev_pizza),
        ]

        for t in transacoes_2026:
            criar_t(t[0], t[1], t[2], t[3], t[4], t[5])

        # 4. MOVIMENTAÇÃO DOS EVENTOS ANTIGOS
        # Feijoada (Junho 2024)
        criar_t("2024-06-05", 'ENTRADA', 4500.00, "Venda Ingressos", "EVE", ev_feijoada)
        criar_t("2024-06-02", 'SAIDA', 1500.00, "Mercado/Carne", "EVE", ev_feijoada)

        # Natal (Dezembro 2025)
        criar_t("2025-12-10", 'SAIDA', 3000.00, "Cestas Básicas", "FIL", ev_natal)
        criar_t("2025-11-25", 'ENTRADA', 1000.00, "Doação Loja", "DOACAO", ev_natal)

        self.stdout.write(self.style.SUCCESS('Concluído! Banco de dados populado com sucesso (2024-2026).'))