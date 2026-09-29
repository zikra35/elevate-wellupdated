"""Main Flask application entry point for Self-Trained AI System."""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config.settings import Settings
from config.logging import setup_logging, get_logger
from utils.db_connection import initialize_connections, close_all_connections

# Setup logging
logger = setup_logging()

# Create Flask app
app = Flask(__name__)

# Load configuration
app.config.from_object(Settings)

# Enable CORS
CORS(app)

# Validate configuration
try:
    Settings.validate()
except ValueError as e:
    logger.error(f"Configuration validation failed: {e}")
    raise

# Initialize database and cache connections
try:
    initialize_connections()
except Exception as e:
    logger.error(f"Failed to initialize connections: {e}")
    raise

# Register cleanup on shutdown
def cleanup():
    """Cleanup connections on shutdown."""
    close_all_connections()

app.teardown_appcontext(lambda exc: cleanup())


# ==================== Basic Endpoints ====================


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "ml-service"}), 200


@app.route("/api/ml/status", methods=["GET"])
def service_status():
    """Service status endpoint."""
    return (
        jsonify(
            {
                "status": "running",
                "service": "ml-service",
                "version": "1.0.0",
                "environment": Settings.FLASK_ENV,
            }
        ),
        200,
    )


# ==================== Error Handlers ====================


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({"error": "Not found", "message": str(error)}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500


# ==================== Register Routes ====================


def create_app():
    """Create and configure Flask app."""
    logger.info("Creating Flask app with ML routes")

    # Import and register ML routes
    from api.routes import register_ml_routes

    register_ml_routes(app)

    logger.info("ML routes registered successfully")

    return app


# Initialize app
app = create_app()


if __name__ == "__main__":
    logger.info(f"Starting ML Service on {Settings.SERVICE_HOST}:{Settings.SERVICE_PORT}")
    logger.info(f"Environment: {Settings.FLASK_ENV}")
    logger.info(f"Debug mode: {Settings.FLASK_DEBUG}")
    logger.info("Available endpoints:")
    logger.info("  GET  /health - Health check")
    logger.info("  GET  /api/ml/status - Service status")
    logger.info("  POST /api/ml/train - Train model")
    logger.info("  POST /api/ml/features - Extract features")
    logger.info("  GET  /api/ml/model/<user_id> - Get model status")
    logger.info("  POST /api/ml/feedback - Process feedback")
    logger.info("  GET  /api/ml/recommendations/<user_id> - Get recommendations")
    logger.info("  POST /api/chat/start - Start conversation")
    logger.info("  POST /api/chat/message/<conversation_id> - Send message")
    logger.info("  GET  /api/chat/history/<conversation_id> - Get history")
    logger.info("  GET  /api/chat/summary/<conversation_id> - Get summary")
    logger.info("  POST /api/chat/end/<conversation_id> - End conversation")

    app.run(
        host=Settings.SERVICE_HOST,
        port=Settings.SERVICE_PORT,
        debug=Settings.FLASK_DEBUG,
    )
