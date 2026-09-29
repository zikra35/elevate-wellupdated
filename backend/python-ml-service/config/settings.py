"""Configuration settings for Self-Trained AI System."""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # Flask Configuration
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    # MongoDB Configuration
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "radiant_health")

    # Redis Configuration
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_CACHE_TTL = int(os.getenv("REDIS_CACHE_TTL", "3600"))

    # Service Configuration
    SERVICE_PORT = int(os.getenv("SERVICE_PORT", "5001"))
    SERVICE_HOST = os.getenv("SERVICE_HOST", "0.0.0.0")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Model Configuration
    MIN_TRAINING_DATA_DAYS = int(os.getenv("MIN_TRAINING_DATA_DAYS", "30"))
    MODEL_TRAINING_TIMEOUT = int(os.getenv("MODEL_TRAINING_TIMEOUT", "300"))
    MODEL_CONFIDENCE_THRESHOLD = int(os.getenv("MODEL_CONFIDENCE_THRESHOLD", "60"))

    # Celery Configuration
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    # OpenAI Configuration (for fallback)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # Security
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "dev-encryption-key-change-in-production")
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret-change-in-production")

    # Feature Flags
    ENABLE_SELF_TRAINED_AI = os.getenv("ENABLE_SELF_TRAINED_AI", "True").lower() == "true"
    ENABLE_OFFLINE_MODE = os.getenv("ENABLE_OFFLINE_MODE", "True").lower() == "true"
    ENABLE_PRIVACY_ENCRYPTION = os.getenv("ENABLE_PRIVACY_ENCRYPTION", "True").lower() == "true"

    # API Configuration
    API_PREFIX = "/api/ml"
    API_VERSION = "v1"

    # Database Collections
    TRAINING_DATA_COLLECTION = "training_data"
    USER_PROFILE_COLLECTION = "user_profiles"
    FEEDBACK_COLLECTION = "feedback"
    RECOMMENDATION_COLLECTION = "recommendations"
    MODEL_METADATA_COLLECTION = "model_metadata"

    # Model Storage
    MODEL_STORAGE_PATH = os.getenv("MODEL_STORAGE_PATH", "./models")
    MODEL_ARCHIVE_PATH = os.path.join(MODEL_STORAGE_PATH, "archive")

    # Logging
    LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", "./logs")
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Performance Targets
    RECOMMENDATION_TIMEOUT = 2.0  # seconds
    MODEL_TRAINING_TARGET_TIME = 300  # seconds (5 minutes)
    FEEDBACK_PROCESSING_BATCH_SIZE = 50

    # Model Parameters
    TRAIN_TEST_SPLIT = 0.7
    VALIDATION_SPLIT = 0.15
    TEST_SPLIT = 0.15
    CROSS_VALIDATION_FOLDS = 5

    # Feature Configuration
    PERSONALIZATION_DIMENSIONS = [
        "workout_frequency",
        "workout_intensity_preference",
        "workout_type_preference",
        "meal_timing_patterns",
        "meal_type_preferences",
        "sleep_duration_patterns",
        "sleep_quality_patterns",
        "mood_patterns",
        "stress_level_patterns",
        "goal_progress_rate",
        "feedback_patterns",
    ]

    # Recommendation Configuration
    RECOMMENDATIONS_PER_CATEGORY = 5
    MIN_CONFIDENCE_FOR_RECOMMENDATION = 0.3
    CONFIDENCE_THRESHOLD_FOR_FALLBACK = 0.6

    # Cold Start Configuration
    COLD_START_DAYS_THRESHOLD_1 = 7
    COLD_START_DAYS_THRESHOLD_2 = 14
    COLD_START_DAYS_THRESHOLD_3 = 30

    # Offline Mode Configuration
    OFFLINE_MODEL_CACHE_TTL = 7 * 24 * 60 * 60  # 7 days in seconds
    OFFLINE_FEEDBACK_QUEUE_MAX_SIZE = 1000

    # Feedback Configuration
    FEEDBACK_ACCUMULATION_THRESHOLD = 50
    FEEDBACK_TEMPORAL_DECAY_FACTOR = 0.95

    # Monitoring Configuration
    PERFORMANCE_TRACKING_ENABLED = True
    AUDIT_LOGGING_ENABLED = True
    METRICS_COLLECTION_INTERVAL = 60  # seconds

    @classmethod
    def get_config(cls):
        """Return configuration as dictionary."""
        return {
            key: getattr(cls, key)
            for key in dir(cls)
            if not key.startswith("_") and key.isupper()
        }

    @classmethod
    def validate(cls):
        """Validate critical configuration settings."""
        errors = []

        if not cls.SECRET_KEY or cls.SECRET_KEY == "dev-secret-key-change-in-production":
            if cls.FLASK_ENV == "production":
                errors.append("SECRET_KEY must be set in production")

        if not cls.ENCRYPTION_KEY or cls.ENCRYPTION_KEY == "dev-encryption-key-change-in-production":
            if cls.ENABLE_PRIVACY_ENCRYPTION and cls.FLASK_ENV == "production":
                errors.append("ENCRYPTION_KEY must be set when privacy encryption is enabled in production")

        if errors:
            raise ValueError("Configuration validation failed: " + "; ".join(errors))

        return True
