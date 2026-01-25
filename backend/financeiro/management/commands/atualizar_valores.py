from django.core.management.base import BaseCommand
from financeiro.models import Mensalidade, Configuracao

class Command(BaseCommand):
    help = 'Atualiza o valor das mensalidades EM ABERTO para o valor da configuração atual'

    def handle(self, *args, **kwargs):
        # 1. Pega o valor atual da configuração
        try:
            config = Configuracao.objects.get(pk=1)
            novo_valor = config.valor_mensalidade
        except Configuracao.DoesNotExist:
            self.stdout.write(self.style.ERROR('Configuração não encontrada!'))
            return

        # 2. Pergunta de segurança
        self.stdout.write(self.style.WARNING(f'Isso vai alterar todas as mensalidades NÃO PAGAS para R$ {novo_valor}.'))
        confirm = input("Tem certeza? (s/n): ")
        
        if confirm.lower() != 's':
            self.stdout.write(self.style.ERROR('Operação cancelada.'))
            return

        # 3. Filtra apenas quem NÃO PAGOU (paga=False)
        # Não filtramos por mês propositalmente: se o cara deve a de Dezembro, 
        # e a mensalidade aumentou, ele vai pagar o valor novo (reajuste).
        # Se quiser mudar só do mês atual, avise que eu ajusto o filtro.
        afetados = Mensalidade.objects.filter(paga=False)
        
        count = afetados.update(valor=novo_valor)

        self.stdout.write(self.style.SUCCESS(f'Sucesso! {count} mensalidades em aberto foram atualizadas para R$ {novo_valor}.'))