"""
Django settings for core project.
"""

import os
from pathlib import Path
from decouple import config, Csv
import dj_database_url # <--- IMPORTANTE: Para ler a URL do banco do Docker

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# ==============================================================================
# SECURITY & CONFIGURATION
# ==============================================================================

SECRET_KEY = config('SECRET_KEY', default='django-insecure-fallback-dev-only')

# Em produção (Docker), DEBUG deve ser False. No .env do docker-compose definiremos isso.
DEBUG = config('DEBUG', default=True, cast=bool)

# Aceita tudo no Docker (*) ou lista específica
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=Csv())


# ==============================================================================
# APPLICATION DEFINITION
# ==============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # --- Third Party Apps ---
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    
    # --- Local Apps ---
    'financeiro',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',            # 1. CORS (Primeiro)
    'django.middleware.security.SecurityMiddleware',    # 2. Security
    'whitenoise.middleware.WhiteNoiseMiddleware',       # 3. WhiteNoise (Essencial para Docker/Static)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'financeiro.middleware.AuditMiddleware',          # Seu middleware de Logs (Descomente se estiver pronto)
]
    
ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# ==============================================================================
# DATABASE (SQLite vs PostgreSQL)
# ==============================================================================
# A mágica acontece aqui:
# 1. Tenta ler a variável DATABASE_URL do ambiente (Docker/Postgres).
# 2. Se não achar, usa o SQLite local (Desenvolvimento fora do Docker).

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
        conn_health_checks=True,
    )
}


# ==============================================================================
# PASSWORD VALIDATION
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]


# ==============================================================================
# INTERNATIONALIZATION
# ==============================================================================

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Manaus'
USE_I18N = True
USE_TZ = True


# ==============================================================================
# STATIC FILES (WhiteNoise Configuration)
# ==============================================================================

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Compressão e Cache de arquivos estáticos para produção
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ==============================================================================
# MEDIA FILES (Uploads de CSV, Logos, etc)
# ==============================================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# ==============================================================================
# CORS & CSRF (Conexão com Frontend)
# ==============================================================================

# Lista de origens permitidas
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS', 
    default='http://localhost:8051,http://127.0.0.1:8051', 
    cast=Csv()
)

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS', 
    default='http://localhost:8051', 
    cast=Csv()
)

# ==============================================================================
# REST FRAMEWORK CONFIG
# ==============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DATETIME_FORMAT': "%d/%m/%Y %H:%M:%S",
    'DATE_FORMAT': "%d/%m/%Y",
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'