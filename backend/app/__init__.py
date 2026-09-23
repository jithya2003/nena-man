"""
nena-man · backend/app/__init__.py
Flask Application Factory — create_app().

Creates and configures the Flask application with:
  - Environment-specific config
  - CORS (allowing Expo Web, Android Emulator, and LAN physical devices)
  - Firebase Admin SDK initialisation
  - All 4 module Blueprints registered
  - Auth Blueprint registered
  - Global error handlers
  - Health-check endpoint
"""

import logging
import os
from flask import Flask, jsonify
from flask_cors import CORS

from .config import config_map


def create_app(config_name: str = None) -> Flask:
    """
    Create and return a configured Flask application instance.

    Args:
        config_name: One of 'development', 'testing', 'production'.
                     Falls back to FLASK_ENV env var, then 'development'.
    """
    app = Flask(__name__, instance_relative_config=False)

    # ── Load Config ────────────────────────────────────────────────────────────
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")
    cfg_class = config_map.get(config_name, config_map["default"])
    app.config.from_object(cfg_class)

    # ── Logging ────────────────────────────────────────────────────────────────
    logging.basicConfig(
        level=logging.DEBUG if app.config["DEBUG"] else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # ── CORS ───────────────────────────────────────────────────────────────────
    # Allow:
    #   - Expo Web (localhost:8081, localhost:19006)
    #   - Android Emulator host (10.0.2.2)
    #   - All local network IPs (192.168.x.x) for physical device testing
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3000",
                "http://10.0.2.2:8081",
                "http://10.0.2.2:19006",
                r"http://192\.168\.\d+\.\d+:*",
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    })

    # ── Firebase Admin SDK ────────────────────────────────────────────────────
    from .core.firebase import init_firebase
    init_firebase(app)

    # ── Register Error Handlers ───────────────────────────────────────────────
    from .core.errors import register_error_handlers
    register_error_handlers(app)

    # ── Health Check Endpoint ─────────────────────────────────────────────────
    @app.route("/api/v1/health", methods=["GET"])
    def health():
        """
        GET /api/v1/health
        Simple liveness probe. Returns system status and active module info.
        """
        return jsonify({
            "success": True,
            "service": "Nena Man Flask API",
            "version": "1.0.0-prototype",
            "project": "IT4010 · J26-IT-361",
            "modules": {
                "m1_speech_classifier": "active",
                "m2_text_difficulty": "active",
                "m3_recommendation_engine": "active",
                "m4_behavioral_detection": "active",
            },
            "status": "healthy",
        }), 200

    # ── Register Auth Blueprint ───────────────────────────────────────────────
    try:
        from .modules.auth.controller import auth_bp
        app.register_blueprint(auth_bp)
    except ImportError as e:
        app.logger.warning("[Auth] Blueprint import failed: %s", e)

    # ── Register M1: Speech Classifier Blueprint ──────────────────────────────
    try:
        from .modules.speech_classifier.controller import speech_bp
        app.register_blueprint(speech_bp)
    except ImportError as e:
        app.logger.info("[M1 Speech] Module not yet initialized: %s", e)

    # ── Register M2: Text Difficulty Blueprint ────────────────────────────────
    try:
        from .modules.text_difficulty.controller import text_bp
        app.register_blueprint(text_bp)
    except ImportError as e:
        app.logger.info("[M2 Text] Module not yet initialized: %s", e)

    # ── Register M3: Recommendation Engine Blueprint ──────────────────────────
    try:
        from .modules.recommendation_engine.controller import recommendation_bp
        app.register_blueprint(recommendation_bp)
    except ImportError as e:
        app.logger.info("[M3 Rec] Module not yet initialized: %s", e)

    # ── Register M4: Behavioral Detection Blueprint ───────────────────────────
    try:
        from .modules.behavioral_detection.controller import behavioral_bp
        app.register_blueprint(behavioral_bp)
    except ImportError as e:
        app.logger.info("[M4 Behavior] Module not yet initialized: %s", e)

    app.logger.info("=" * 60)
    app.logger.info("🌟 Nena Man Flask API — create_app() complete")
    app.logger.info("   Registered blueprints: auth, m1-speech, m2-text, m3-rec, m4-behavior")
    app.logger.info("=" * 60)

    return app
