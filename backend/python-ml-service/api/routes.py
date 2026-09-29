"""API routes for ML training and recommendations."""

import logging
import time
from flask import Blueprint, request, jsonify
from typing import Dict, Any
import numpy as np

from ml.feature_extractor import FeatureExtractor
from ml.supervised_trainer import SupervisedLearningEngine
from ml.reinforcement_updater import ReinforcementLearningEngine
from services.ai_services import RecommendationEngine, AdvancedChatbotService

logger = logging.getLogger(__name__)

# Create blueprints
ml_bp = Blueprint("ml", __name__, url_prefix="/api/ml")
chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

# Initialize services
feature_extractor = FeatureExtractor()
supervised_engine = SupervisedLearningEngine()
rl_engine = ReinforcementLearningEngine()
recommendation_engine = RecommendationEngine()
chatbot_service = AdvancedChatbotService()

# In-memory storage (replace with database in production)
user_models = {}
conversation_histories = {}


# ==================== ML Training Endpoints ====================


@ml_bp.route("/train", methods=["POST"])
def train_model():
    """
    Train a new model for user.

    Request body:
    {
        "user_id": "user123",
        "training_data": [...]
    }
    """
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        training_data = data.get("training_data", [])

        if not user_id:
            return jsonify({"error": "user_id required"}), 400

        if not training_data or len(training_data) < 30:
            return (
                jsonify(
                    {
                        "error": "insufficient_training_data",
                        "minimum_required": 30,
                        "provided": len(training_data),
                    }
                ),
                400,
            )

        # Extract features
        logger.info(f"Extracting features for user {user_id}")
        features = feature_extractor.extract_user_features(training_data)

        if "error" in features:
            return jsonify(features), 400

        # Prepare training data
        X = np.array([features["normalized_features"][f] for f in feature_extractor.DIMENSIONS])
        y = np.array([d.get("label", 0) for d in training_data])

        # Train model
        logger.info(f"Training model for user {user_id}")
        metrics = supervised_engine.train_model(
            X.reshape(1, -1) if len(X.shape) == 1 else X,
            y,
            feature_extractor.DIMENSIONS,
            model_id=f"{user_id}_model",
        )

        # Store model
        user_models[user_id] = metrics
        logger.info(f"Model trained successfully for user {user_id}")

        return (
            jsonify(
                {
                    "status": "model_trained",
                    "user_id": user_id,
                    "metrics": metrics,
                    "message": "Model trained successfully",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({"error": str(e)}), 500


@ml_bp.route("/features", methods=["POST"])
def extract_features():
    """
    Extract features from user data.

    Request body:
    {
        "training_data": [...]
    }
    """
    try:
        data = request.get_json()
        training_data = data.get("training_data", [])

        if not training_data:
            return jsonify({"error": "training_data required"}), 400

        features = feature_extractor.extract_user_features(training_data)

        return jsonify({"features": features}), 200

    except Exception as e:
        logger.error(f"Feature extraction error: {e}")
        return jsonify({"error": str(e)}), 500


@ml_bp.route("/model/<user_id>", methods=["GET"])
def get_model_status(user_id: str):
    """Get current model status for user."""
    try:
        if user_id not in user_models:
            return (
                jsonify({"status": "no_model", "user_id": user_id}),
                404,
            )

        model_info = user_models[user_id]
        update_status = rl_engine.get_model_update_status(
            model_info.get("model_id", "")
        )

        return (
            jsonify(
                {
                    "user_id": user_id,
                    "model": model_info,
                    "update_status": update_status,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get model error: {e}")
        return jsonify({"error": str(e)}), 500


@ml_bp.route("/feedback", methods=["POST"])
def process_feedback():
    """
    Process user feedback for model improvement.

    Request body:
    {
        "user_id": "user123",
        "feedback": [...]
    }
    """
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        feedback = data.get("feedback", [])

        if not user_id:
            return jsonify({"error": "user_id required"}), 400

        if user_id not in user_models:
            return jsonify({"error": "user_model_not_found"}), 404

        current_model = user_models[user_id]
        feedback_results = rl_engine.process_user_feedback(
            current_model.get("model_id", ""),
            feedback,
            current_model,
        )

        logger.info(f"Processed feedback for user {user_id}")

        return jsonify(feedback_results), 200

    except Exception as e:
        logger.error(f"Feedback processing error: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== Recommendation Endpoints ====================


@ml_bp.route("/recommendations/<user_id>", methods=["GET"])
def get_recommendations(user_id: str):
    """Get personalized recommendations for user."""
    try:
        if user_id not in user_models:
            model = None
        else:
            model = user_models[user_id]

        # In production, fetch user profile from database
        user_profile = {"age": 30, "gender": "unknown", "goals": []}

        recommendations = recommendation_engine.generate_recommendations(
            user_id, model, user_profile
        )

        return jsonify(recommendations), 200

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== Chatbot Endpoints ====================


@chat_bp.route("/start", methods=["POST"])
def start_conversation():
    """
    Start a new chatbot conversation.

    Request body:
    {
        "user_id": "user123",
        "mode": "free_form"
    }
    """
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        mode = data.get("mode", "free_form")

        if not user_id:
            return jsonify({"error": "user_id required"}), 400

        # Initialize conversation
        conversation_id = f"{user_id}_{int(time.time())}"
        conversation_histories[conversation_id] = {
            "user_id": user_id,
            "mode": mode,
            "messages": [],
            "started_at": time.time(),
        }

        logger.info(f"Started conversation {conversation_id}")

        return (
            jsonify(
                {
                    "conversation_id": conversation_id,
                    "status": "started",
                    "mode": mode,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Start conversation error: {e}")
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/message/<conversation_id>", methods=["POST"])
def send_message(conversation_id: str):
    """
    Send message to chatbot.

    Request body:
    {
        "user_id": "user123",
        "message": "I'm feeling anxious"
    }
    """
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        message = data.get("message")

        if not message:
            return jsonify({"error": "message required"}), 400

        if conversation_id not in conversation_histories:
            return jsonify({"error": "conversation_not_found"}), 404

        # Process message
        result = chatbot_service.process_message(
            user_id,
            message,
            conversation_histories[conversation_id].get("mode", "free_form"),
        )

        # Store in history
        conversation_histories[conversation_id]["messages"].append(
            {"role": "user", "content": message, **result}
        )

        logger.info(f"Processed message in conversation {conversation_id}")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Send message error: {e}")
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/history/<conversation_id>", methods=["GET"])
def get_history(conversation_id: str):
    """Get conversation history."""
    try:
        if conversation_id not in conversation_histories:
            return jsonify({"error": "conversation_not_found"}), 404

        history = conversation_histories[conversation_id]

        return (
            jsonify(
                {
                    "conversation_id": conversation_id,
                    "messages": history["messages"],
                    "mode": history["mode"],
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get history error: {e}")
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/summary/<conversation_id>", methods=["GET"])
def get_summary(conversation_id: str):
    """Get conversation summary."""
    try:
        if conversation_id not in conversation_histories:
            return jsonify({"error": "conversation_not_found"}), 404

        history = conversation_histories[conversation_id]
        summary = chatbot_service.get_conversation_summary(history["messages"])

        return (
            jsonify(
                {
                    "conversation_id": conversation_id,
                    "summary": summary,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get summary error: {e}")
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/end/<conversation_id>", methods=["POST"])
def end_conversation(conversation_id: str):
    """End conversation and save to history."""
    try:
        if conversation_id not in conversation_histories:
            return jsonify({"error": "conversation_not_found"}), 404

        # In production, save to database
        conversation_histories[conversation_id]["ended_at"] = time.time()

        logger.info(f"Ended conversation {conversation_id}")

        return (
            jsonify(
                {
                    "conversation_id": conversation_id,
                    "status": "ended",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"End conversation error: {e}")
        return jsonify({"error": str(e)}), 500


# Register blueprints
def register_ml_routes(app):
    """Register ML routes with Flask app."""
    import time
    app.register_blueprint(ml_bp)
    app.register_blueprint(chat_bp)
    logger.info("ML routes registered")
