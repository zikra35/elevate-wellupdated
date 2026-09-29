"""Pytest configuration and fixtures for Self-Trained AI System tests."""

import os
import sys
from pathlib import Path

import pytest

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment
os.environ["FLASK_ENV"] = "testing"
os.environ["FLASK_DEBUG"] = "False"


@pytest.fixture
def app():
    """Create and configure a test Flask app."""
    from app import app as flask_app

    flask_app.config["TESTING"] = True
    return flask_app


@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def app_context(app):
    """Create an application context for testing."""
    with app.app_context():
        yield app


@pytest.fixture
def settings():
    """Get application settings."""
    from config.settings import Settings

    return Settings


@pytest.fixture
def logger():
    """Get application logger."""
    from config.logging import get_logger

    return get_logger("test")


@pytest.fixture
def constants():
    """Get application constants."""
    from config import constants

    return constants


# Markers for test organization
def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "property: mark test as a property-based test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line("markers", "asyncio: mark test as async")
    config.addinivalue_line("markers", "training: mark test as model training test")
    config.addinivalue_line("markers", "recommendation: mark test as recommendation test")
    config.addinivalue_line("markers", "feedback: mark test as feedback test")
    config.addinivalue_line("markers", "performance: mark test as performance test")
    config.addinivalue_line("markers", "security: mark test as security test")
