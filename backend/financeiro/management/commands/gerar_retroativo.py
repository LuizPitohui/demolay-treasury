from django.core.management.base import BaseCommand
from financeiro.models import Membro, Mensalidade
from datetime import date

class Command(BaseCommand):
    help = 'Gera mensalidades para meses específicos (Retroativo)'

    def handle(self, *args, **kwargs):
        # --- CONFIGURAÇÃO DAS DATAS ---
        # Aqui definimos os meses que queremos gerar (Dia 1 de cada mês)
        meses_para_gerar = [
            date(2025, 12, 1), # Dezembro de 2025
            date(2026, 1, 1),  # Janeiro de 2026
        ]

        # Pega todos os membros regulares
        membros = Membro.objects.filter(status='REGULAR')
        
        self.stdout.write("Iniciando geração retroativa...")

        for mes_ref in meses_para_gerar:
            # Vencimento será sempre dia 10 daquele mês
            vencimento = date(mes_ref.year, mes_ref.month, 10)
            
            count = 0
            for membro in membros:
                # get_or_create: Se já existe (ex: Jan 2026), ele não duplica!
                obj, created = Mensalidade.objects.get_or_create(
                    membro=membro,
                    mes_referencia=mes_ref,
                    defaults={
                        'data_vencimento': vencimento,
                        'valor': 35.00 # Valor da mensalidade
                    }
                )
                if created:
                    count += 1
            
            self.stdout.write(self.style.SUCCESS(
                f'-> Mês {mes_ref.strftime("%m/%Y")}: {count} novas cobranças geradas.'
            ))

        self.stdout.write(self.style.SUCCESS('Processo concluído!'))