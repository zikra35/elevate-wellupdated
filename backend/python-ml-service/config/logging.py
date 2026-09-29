"""Logging configuration for Self-Trained AI System."""

import logging
import logging.handlers
import os
from config.settings import Settings


def setup_logging():
    """Configure logging for the application."""
    # Create logs directory if it doesn't exist
    log_dir = Settings.LOG_FILE_PATH
    os.makedirs(log_dir, exist_ok=True)

    # Create logger
    logger = logging.getLogger("ml_service")
    logger.setLevel(getattr(logging, Settings.LOG_LEVEL))

    # Create formatters
    formatter = logging.Formatter(Settings.LOG_FORMAT)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, Settings.LOG_LEVEL))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler with rotation
    log_file = os.path.join(log_dir, "ml_service.log")
    file_handler = logging.handlers.RotatingFileHandler(
        log_file, maxBytes=10485760, backupCount=10  # 10MB per file, keep 10 files
    )
    file_handler.setLevel(getattr(logging, Settings.LOG_LEVEL))
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Error file handler
    error_log_file = os.path.join(log_dir, "ml_service_error.log")
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file, maxBytes=10485760, backupCount=10
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)

    return logger


def get_logger(name):
    """Get a logger instance."""
    return logging.getLogger(name)
