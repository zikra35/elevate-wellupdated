"""Database and cache connection managers for Self-Trained AI System."""

import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import redis
from redis.exceptions import ConnectionError as RedisConnectionError
from config.settings import Settings

logger = logging.getLogger(__name__)


class MongoDBConnection:
    """MongoDB connection manager with connection pooling."""

    _instance: Optional[MongoClient] = None
    _db = None

    @classmethod
    def get_connection(cls) -> MongoClient:
        """Get or create MongoDB connection."""
        if cls._instance is None:
            try:
                logger.info(f"Connecting to MongoDB at {Settings.MONGODB_URI}")
                cls._instance = MongoClient(
                    Settings.MONGODB_URI,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=10000,
                    retryWrites=True,
                    maxPoolSize=50,
                    minPoolSize=10,
                )
                # Test connection
                cls._instance.admin.command("ping")
                logger.info("MongoDB connection established successfully")
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise

        return cls._instance

    @classmethod
    def get_database(cls):
        """Get MongoDB database instance."""
        if cls._db is None:
            connection = cls.get_connection()
            cls._db = connection[Settings.MONGODB_DB_NAME]
            logger.info(f"Connected to database: {Settings.MONGODB_DB_NAME}")

        return cls._db

    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a specific collection from MongoDB."""
        db = cls.get_database()
        return db[collection_name]

    @classmethod
    def close_connection(cls):
        """Close MongoDB connection."""
        if cls._instance is not None:
            cls._instance.close()
            cls._instance = None
            cls._db = None
            logger.info("MongoDB connection closed")

    @classmethod
    def create_indexes(cls):
        """Create necessary indexes for collections."""
        db = cls.get_database()

        try:
            # Training data indexes
            training_data_col = db[Settings.TRAINING_DATA_COLLECTION]
            training_data_col.create_index("userId")
            training_data_col.create_index("timestamp")
            training_data_col.create_index([("userId", 1), ("timestamp", -1)])
            training_data_col.create_index("dataType")
            logger.info("Training data indexes created")

            # User profile indexes
            user_profile_col = db[Settings.USER_PROFILE_COLLECTION]
            user_profile_col.create_index("userId", unique=True)
            user_profile_col.create_index("modelVersion")
            user_profile_col.create_index("lastRetrained")
            logger.info("User profile indexes created")

            # Feedback indexes
            feedback_col = db[Settings.FEEDBACK_COLLECTION]
            feedback_col.create_index("userId")
            feedback_col.create_index("recommendationId")
            feedback_col.create_index([("userId", 1), ("timestamp", -1)])
            logger.info("Feedback indexes created")

            # Recommendation indexes
            recommendation_col = db[Settings.RECOMMENDATION_COLLECTION]
            recommendation_col.create_index("userId")
            recommendation_col.create_index("timestamp")
            recommendation_col.create_index([("userId", 1), ("timestamp", -1)])
            logger.info("Recommendation indexes created")

            # Model metadata indexes
            model_metadata_col = db[Settings.MODEL_METADATA_COLLECTION]
            model_metadata_col.create_index("userId", unique=True)
            model_metadata_col.create_index("version")
            logger.info("Model metadata indexes created")

        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")
            raise


class RedisConnection:
    """Redis connection manager for caching."""

    _instance: Optional[redis.Redis] = None

    @classmethod
    def get_connection(cls) -> redis.Redis:
        """Get or create Redis connection."""
        if cls._instance is None:
            try:
                logger.info(f"Connecting to Redis at {Settings.REDIS_URL}")
                cls._instance = redis.from_url(
                    Settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    health_check_interval=30,
                )
                # Test connection
                cls._instance.ping()
                logger.info("Redis connection established successfully")
            except RedisConnectionError as e:
                logger.error(f"Failed to connect to Redis: {e}")
                raise

        return cls._instance

    @classmethod
    def close_connection(cls):
        """Close Redis connection."""
        if cls._instance is not None:
            cls._instance.close()
            cls._instance = None
            logger.info("Redis connection closed")

    @classmethod
    def set_cache(cls, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set a value in cache."""
        try:
            redis_conn = cls.get_connection()
            ttl = ttl or Settings.REDIS_CACHE_TTL
            redis_conn.setex(key, ttl, value)
            return True
        except RedisConnectionError as e:
            logger.error(f"Failed to set cache: {e}")
            return False

    @classmethod
    def get_cache(cls, key: str) -> Optional[str]:
        """Get a value from cache."""
        try:
            redis_conn = cls.get_connection()
            return redis_conn.get(key)
        except RedisConnectionError as e:
            logger.error(f"Failed to get cache: {e}")
            return None

    @classmethod
    def delete_cache(cls, key: str) -> bool:
        """Delete a value from cache."""
        try:
            redis_conn = cls.get_connection()
            redis_conn.delete(key)
            return True
        except RedisConnectionError as e:
            logger.error(f"Failed to delete cache: {e}")
            return False

    @classmethod
    def clear_cache(cls, pattern: str = "*") -> bool:
        """Clear cache by pattern."""
        try:
            redis_conn = cls.get_connection()
            keys = redis_conn.keys(pattern)
            if keys:
                redis_conn.delete(*keys)
            return True
        except RedisConnectionError as e:
            logger.error(f"Failed to clear cache: {e}")
            return False


def initialize_connections():
    """Initialize all database and cache connections."""
    try:
        logger.info("Initializing database and cache connections...")
        MongoDBConnection.get_connection()
        MongoDBConnection.get_database()
        MongoDBConnection.create_indexes()
        try:
            RedisConnection.get_connection()
        except Exception as redis_error:
            logger.warning(f"Redis connection failed (will continue without caching): {redis_error}")
        logger.info("All connections initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize connections: {e}")
        raise


def close_all_connections():
    """Close all database and cache connections."""
    try:
        logger.info("Closing all connections...")
        MongoDBConnection.close_connection()
        RedisConnection.close_connection()
        logger.info("All connections closed successfully")
    except Exception as e:
        logger.error(f"Failed to close connections: {e}")
        raise
