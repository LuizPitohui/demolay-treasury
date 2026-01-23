# 🛡️ Nexus - Sistema de Tesouraria DeMolay

> **Capítulo Unidos da Esperança nº 29 - Ordem DeMolay**

![Status](https://img.shields.io/badge/Status-Desenvolvimento-green)
![Backend](https://img.shields.io/badge/Backend-Django_5-092E20?style=flat&logo=django)
![Frontend](https://img.shields.io/badge/Frontend-Next.js_14-black?style=flat&logo=next.js)
![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?style=flat&logo=docker)

O **Nexus** é um sistema de gestão financeira e auditoria desenvolvido sob medida para garantir a transparência, segurança e organização das contas do Capítulo Unidos da Esperança nº 29.

O sistema substitui planilhas manuais por uma aplicação web robusta, com geração de relatórios oficiais em PDF, logs de auditoria imutáveis e dashboards interativos.

---

## 🚀 Funcionalidades Principais

### 💰 Gestão Financeira
- **Dashboard Interativo:** KPIs em tempo real (Saldo, Entradas, Saídas), Gráficos de Fluxo Mensal e Distribuição por Categoria.
- **CRUD de Transações:** Registro detalhado de receitas e despesas com categorização oficial (Filantropia, Administrativo, Eventos, etc.).
- **Relatórios Oficiais:** Geração de balancetes mensais em PDF com cálculo automático de saldo anterior e campos para assinatura do Tesoureiro e Mestre Conselheiro.

### 🛡️ Segurança e Auditoria
- **Autenticação Segura:** Sistema de Login com Tokens (JWT/AuthToken).
- **Logs de Auditoria (Matrix Mode):** Rastreamento completo de quem fez o quê, quando e de onde (IP).
- **Relatório de Logs:** Exportação de histórico de atividades em PDF para fins de corregedoria e transparência.
- **Monitoramento:** Indicador de status do servidor (Health Check) em tempo real no Frontend.

---

## 🛠️ Tecnologias Utilizadas

### Backend (API)
- **Linguagem:** Python 3.12+
- **Framework:** Django 5 + Django REST Framework
- **Gerenciador de Pacotes:** Poetry
- **PDF Engine:** ReportLab
- **Banco de Dados:** SQLite (Desenvolvimento) / PostgreSQL (Produção)

### Frontend (Interface)
- **Framework:** Next.js 14 (React)
- **Estilização:** Tailwind CSS
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Http Client:** Axios

### Infraestrutura
- **Containerização:** Docker & Docker Compose
- **Servidor:** Arasaka Server (Ubuntu/Linux)

---

## 📸 Screenshots

*(Adicione aqui prints das telas do sistema)*

| Dashboard | Auditoria |
|:---:|:---:|
| ![Dashboard Preview](link-da-imagem-dashboard) | ![Auditoria Preview](link-da-imagem-logs) |

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- [Docker](https://www.docker.com/) e Docker Compose instalados.
- OU Python 3.12 e Node.js 18+ (para rodar manualmente).

### 🐳 Opção 1: Rodando com Docker (Recomendado)

Esta opção sobe o Backend e o Frontend simultaneamente em containers isolados.

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/demolay-treasury.git](https://github.com/seu-usuario/demolay-treasury.git)
   cd demolay-treasury