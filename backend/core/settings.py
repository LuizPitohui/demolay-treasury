"""
Django settings for core project.
"""

from pathlib import Path
from decouple import config, Csv  # Importante para ler o .env

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# ==============================================================================
# SECURITY & CONFIGURATION
# ==============================================================================

# A chave agora vem do arquivo .env. Se não achar, usa uma insegura (apenas dev)
SECRET_KEY = config('SECRET_KEY', default='django-insecure-fallback-dev-only')

# Nunca deixe True em produção
DEBUG = config('DEBUG', default=True, cast=bool)

# Lista de hosts permitidos (separados por vírgula no .env)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost', cast=Csv())


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
    'rest_framework',           # Para criar a API
    'rest_framework.authtoken', # <--- NOVO: Sistema de Login/Tokens
    'corsheaders',              # Para permitir conexão do Next.js
    
    # --- Local Apps ---
    'financeiro',               # Seu app de Tesouraria/Nexus
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # <--- OBRIGATÓRIO: Deve ser o primeiro!
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    #'financeiro.middleware.AuditMiddleware', # Seu middleware de Logs do Arasaka
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
# DATABASE
# ==============================================================================
# Por enquanto SQLite. No futuro, mudamos para Postgres via .env facilmente.

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# ==============================================================================
# PASSWORD VALIDATION
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ==============================================================================
# INTERNATIONALIZATION
# ==============================================================================

LANGUAGE_CODE = 'pt-br'  # Português do Brasil

TIME_ZONE = 'America/Manaus'  # Fuso horário correto para o Capítulo

USE_I18N = True
USE_TZ = True


# ==============================================================================
# STATIC FILES (CSS, JavaScript, Images)
# ==============================================================================

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' # Útil para o deploy no servidor Arasaka depois


# ==============================================================================
# CORS HEADERS (Conexão com Frontend)
# ==============================================================================
# Permite que o Next.js (rodando na porta 3000) converse com o Django

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


# ==============================================================================
# REST FRAMEWORK CONFIG
# ==============================================================================

REST_FRAMEWORK = {
    # Define como o sistema autentica os usuários
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',  # Autenticação via Token (App/Frontend)
        'rest_framework.authentication.SessionAuthentication', # Autenticação via Sessão (Admin do Django)
    ],

    # Formato de data brasileiro
    'DATETIME_FORMAT': "%d/%m/%Y %H:%M:%S",
    'DATE_FORMAT': "%d/%m/%Y",
}

# Configuração Padrão para Chave Primária
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'