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