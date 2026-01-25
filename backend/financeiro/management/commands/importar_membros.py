import csv
import os
from django.core.management.base import BaseCommand
from financeiro.models import Membro

class Command(BaseCommand):
    help = 'Importa membros do arquivo CSV com detecção automática de separador'

    def handle(self, *args, **kwargs):
        csv_path = 'membros.csv' 
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'ERRO: O arquivo "{csv_path}" não foi encontrado!'))
            return

        self.stdout.write(f"Lendo arquivo: {csv_path}...")

        # Abre o arquivo para descobrir o separador (vírgula ou ponto-e-vírgula)
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            sample = f.read(1024)
            try:
                dialect = csv.Sniffer().sniff(sample)
                self.stdout.write(self.style.WARNING(f"Separador detectado: '{dialect.delimiter}'"))
            except csv.Error:
                # Se falhar, assume ponto e vírgula que é o padrão Brasil
                dialect = csv.excel()
                dialect.delimiter = ';'
            
            f.seek(0) # Volta para o começo do arquivo

            reader = csv.DictReader(f, dialect=dialect)
            
            # Normaliza cabeçalhos (Remove espaços e coloca em maiúsculo)
            # Ex: " Nome " vira "NOME"
            if reader.fieldnames:
                reader.fieldnames = [name.strip().upper() for name in reader.fieldnames]
                self.stdout.write(f"Colunas encontradas: {reader.fieldnames}")
            else:
                self.stdout.write(self.style.ERROR("ERRO: O arquivo parece vazio ou sem cabeçalho."))
                return

            count_criados = 0
            count_atualizados = 0

            for row in reader:
                try:
                    # Tenta pegar NOME ou Nome ou nome...
                    nome_raw = row.get('NOME')
                    id_raw = row.get('ID')

                    if not nome_raw or not id_raw:
                        # Tenta procurar sem ser pelo nome exato caso tenha falhado
                        # Pega a primeira e segunda coluna se não achar pelo nome
                        values = list(row.values())
                        if len(values) >= 2:
                            nome_raw = values[0]
                            id_raw = values[1]
                    
                    if not nome_raw or not id_raw:
                        continue

                    dm_id = int(str(id_raw).strip())
                    nome_limpo = str(nome_raw).strip()

                    membro, created = Membro.objects.update_or_create(
                        dm_id=dm_id,
                        defaults={
                            'nome': nome_limpo,
                            'status': 'REGULAR'
                        }
                    )
                    
                    if created:
                        count_criados += 1
                        self.stdout.write(f'+ Criado: {nome_limpo}')
                    else:
                        count_atualizados += 1

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Erro na linha: {e}'))

        self.stdout.write(self.style.SUCCESS(f'-'*30))
        self.stdout.write(self.style.SUCCESS(f'IMPORTAÇÃO CONCLUÍDA!'))
        self.stdout.write(self.style.SUCCESS(f'Novos: {count_criados} | Atualizados: {count_atualizados}'))