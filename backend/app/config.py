"""
nena-man · backend/app/config.py
Configuration classes for Flask application environments.
Each config reads from environment variables set in backend/.env
"""

import os


class Config:
    """Base configuration shared across all environments."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    PORT = int(os.environ.get('PORT', 5000))
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = False

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH = os.environ.get(
        'FIREBASE_SERVICE_ACCOUNT_PATH', './firebase-adminsdk.json'
    )
    FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', '')
    FIREBASE_STORAGE_BUCKET = os.environ.get('FIREBASE_STORAGE_BUCKET', '')

    # ML Model Paths — each module checks these for trained weight files
    M1_MODEL_PATH = os.environ.get(
        'M1_MODEL_PATH', './app/modules/speech_classifier/models/'
    )
    M2_MODEL_PATH = os.environ.get(
        'M2_MODEL_PATH', './app/modules/text_difficulty/models/'
    )
    M3_MODEL_PATH = os.environ.get(
        'M3_MODEL_PATH', './app/modules/recommendation_engine/models/'
    )
    M4_MODEL_PATH = os.environ.get(
        'M4_MODEL_PATH', './app/modules/behavioral_detection/models/'
    )


class DevelopmentConfig(Config):
    """Development configuration — debug mode on, verbose logging."""
    DEBUG = True
    TESTING = False
    FLASK_ENV = 'development'


class TestingConfig(Config):
    """Testing configuration — used by pytest."""
    DEBUG = False
    TESTING = True
    FIREBASE_SERVICE_ACCOUNT_PATH = ''  # Skip Firebase init in tests


class ProductionConfig(Config):
    """Production configuration — strict and secure."""
    DEBUG = False
    TESTING = False
    FLASK_ENV = 'production'


# Map string names to config classes (used by create_app factory)
config_map = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
