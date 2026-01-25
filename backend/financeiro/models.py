from django.db import models
from django.conf import settings
from django.utils import timezone

# ==============================================================================
# 1. ENUMS (OPÇÕES)
# ==============================================================================
class TipoTransacao(models.TextChoices):
    ENTRADA = 'ENTRADA', 'Entrada (+)'
    SAIDA = 'SAIDA', 'Saída (-)'

class CategoriaCaixa(models.TextChoices):
    ADMINISTRATIVO = 'ADM', 'Administrativo'
    FILANTROPIA = 'FIL', 'Filantropia'
    EVENTOS = 'EVE', 'Eventos/Festas'
    CAMPANHA = 'CAM', 'Campanhas'
    MENSALIDADE = 'MENSALIDADE', 'Mensalidade'
    DOACAO = 'DOACAO', 'Doação'
    OUTRO_ENTRADA = 'OUTRO_ENTRADA', 'Outros (Entrada)'
    ALUGUEL = 'ALUGUEL', 'Aluguel/Contas'
    COMIDA = 'COMIDA', 'Alimentação'
    OUTRO_SAIDA = 'OUTRO_SAIDA', 'Outros (Saída)'

class MetodoPagamento(models.TextChoices):
    PIX = 'PIX', 'Pix'
    DINHEIRO = 'DIN', 'Dinheiro'
    CARTAO_CREDITO = 'CRED', 'Cartão de Crédito'
    CARTAO_DEBITO = 'DEB', 'Cartão de Débito'
    BOLETO = 'BOL', 'Boleto'
    TRANSFERENCIA = 'TRANS', 'Transferência'

# ==============================================================================
# 2. MODELOS
# ==============================================================================
class Transacao(models.Model):
    tipo = models.CharField(max_length=15, choices=TipoTransacao.choices)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    nome = models.CharField(max_length=150)
    descricao = models.TextField(blank=True, null=True)
    categoria = models.CharField(max_length=20, choices=CategoriaCaixa.choices, default=CategoriaCaixa.OUTRO_ENTRADA)
    forma_pagamento = models.CharField(max_length=5, choices=MetodoPagamento.choices, default=MetodoPagamento.PIX)
    data_transacao = models.DateTimeField(default=timezone.now)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='transacoes'
    )
    comprovante = models.FileField(upload_to='comprovantes/', blank=True, null=True)

    class Meta:
        verbose_name = "Transação"
        verbose_name_plural = "Transações"
        ordering = ['-data_transacao']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.nome} (R$ {self.valor})"



class LogSistema(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    acao = models.CharField(max_length=255)
    detalhes = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log do Sistema"
        verbose_name_plural = "Logs de Auditoria"
        ordering = ['-data_criacao']

    def __str__(self):
        user_str = self.usuario.username if self.usuario else "Sistema"
        return f"[{self.data_criacao}] {user_str} - {self.acao}"
    

# Classe Membro (Baseada no seu CSV)
class Membro(models.Model):
    STATUS_CHOICES = [
        ('REGULAR', 'Regular'),
        ('IRREGULAR', 'Irregular'),
    ]

    nome = models.CharField(max_length=255)
    dm_id = models.IntegerField(unique=True, verbose_name="ID DeMolay")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REGULAR')
    
    def atualizar_status(self):
        # Se tiver mensalidade vencida e não paga, vira IRREGULAR
        tem_atraso = self.mensalidades.filter(paga=False, data_vencimento__lt=timezone.now().date()).exists()
        self.status = 'IRREGULAR' if tem_atraso else 'REGULAR'
        self.save()

    def __str__(self):
        return f"{self.nome} ({self.dm_id})"

# Classe Mensalidade
class Mensalidade(models.Model):
    membro = models.ForeignKey(Membro, on_delete=models.CASCADE, related_name='mensalidades')
    mes_referencia = models.DateField(help_text="Dia 1 do mês de referência")
    data_vencimento = models.DateField()
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=35.00)
    
    paga = models.BooleanField(default=False)
    data_pagamento = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('membro', 'mes_referencia')
        ordering = ['-mes_referencia']

class Configuracao(models.Model):
    # Singleton: Só queremos uma linha nessa tabela
    valor_mensalidade = models.DecimalField(max_digits=10, decimal_places=2, default=35.00, verbose_name="Valor Mensalidade (R$)")
    dia_vencimento = models.IntegerField(default=10, verbose_name="Dia do Vencimento")
    chave_pix = models.CharField(max_length=255, default="capitulo29@demolay.org.br", blank=True)
    nome_capitulo = models.CharField(max_length=255, default="Capítulo Unidos da Esperança nº 29")

    def save(self, *args, **kwargs):
        # Garante que sempre seja o ID 1
        self.pk = 1
        super(Configuracao, self).save(*args, **kwargs)

    def __str__(self):
        return "Configurações do Sistema"

    class Meta:
        verbose_name = "Configuração do Sistema"
        verbose_name_plural = "Configurações"