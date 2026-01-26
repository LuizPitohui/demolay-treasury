# Usa uma imagem leve do Python
FROM python:3.11-slim

# Evita que o Python escreva arquivos .pyc e bufferize stdout
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instala dependências do sistema necessárias para o PostgreSQL e compiladores
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Instala o Poetry
RUN pip install poetry

# Copia os arquivos de configuração do Poetry
COPY pyproject.toml poetry.lock ./

# Configura o Poetry para não criar virtualenv (instala direto no sistema do container)
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Copia o restante do código
COPY . .

# Expõe a porta 8000
EXPOSE 8000

# Comando para rodar o servidor (Gunicorn)
# Nota: O script build.sh que criamos antes pode ser útil, mas aqui vamos direto
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:8000"]