from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY')

DEBUG = True # False in production

ALLOWED_HOSTS = ["*"] # Only the frontend application need to have access in production

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'authenticate',
    'djoser',
    'rest_framework',
    'corsheaders',

]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'settings.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'settings.wsgi.application'


DATABASES = {
   'default': {
       'ENGINE': 'django.db.backends.postgresql',
       'NAME': os.getenv('DB_NAME'),
       'HOST': os.getenv('DB_HOST'),
       'USER': os.getenv('DB_USER'),
       'PASSWORD': os.getenv('DB_PASSWORD'),
       'HOST': os.getenv('DB_HOST', 'localhost'),
       'PORT': os.getenv('DB_PORT', '5432'),
   }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

# STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = 'api/static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'



CORS_ORIGIN_ALLOW_ALL = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # 'DEFAULT_PERMISSION_CLASSES': (
    #         'rest_framework.permissions.IsAuthenticated',
    # ),
    # 'DEFAULT_RENDERER_CLASSES': (
    #     'rest_framework.renderers.JSONRenderer',
    # )
}

DJOSER = {
    "USER_CREATE_PASSWORD_RETYPE" : True,
    "SEND_ACTIVATION_EMAIL" : True,
    "SEND_CONFIRMATION_EMAIL" : False,
    "SET_PASSWORD_RETYPE" : True,
    "PASSWORD_RESET_CONFIRM_RETYPE" : True,
    "PASSWORD_CHANGED_EMAIL_CONFIRMATION" : False,
    "ACTIVATION_URL" : os.getenv("ACTIVATION_URL"),
    "PASSWORD_RESET_CONFIRM_URL" : os.getenv("PASSWORD_RESET_CONFIRM_URL"),
    "EMAIL_FRONTEND_PROTOCOL" : os.getenv("EMAIL_FRONTEND_PROTOCOL"),
    "EMAIL_FRONTEND_DOMAIN" : os.getenv("EMAIL_FRONTEND_DOMAIN"),
    "EMAIL_FRONTEND_SITE_NAME" : "AdaptAI",
    'SERIALIZERS' : {
        'user_create' : 'djoser.serializers.UserCreateSerializer',
        'current_user' : 'djoser.serializers.UserSerializer',
        'user_delete' : 'djoser.serializers.UserDeleteSerializer',
    }
}

SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ("JWT",),
    'ACCESS_TOKEN_LIFETIME' : timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
