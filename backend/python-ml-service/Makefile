.PHONY: help install dev test lint format clean docker-up docker-down docker-logs

# Default target
help:
	@echo "Self-Trained AI System - ML Service"
	@echo ""
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run development server"
	@echo "  make test          - Run tests"
	@echo "  make test-cov      - Run tests with coverage"
	@echo "  make test-property - Run property-based tests"
	@echo "  make lint          - Run linting checks"
	@echo "  make format        - Format code with Black"
	@echo "  make type-check    - Run type checking with mypy"
	@echo "  make clean         - Clean up generated files"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-logs   - View Docker logs"
	@echo "  make docker-build  - Build Docker image"

# Install dependencies
install:
	pip install -r requirements.txt

# Run development server
dev:
	python app.py

# Run all tests
test:
	pytest -v

# Run tests with coverage
test-cov:
	pytest --cov=. --cov-report=html --cov-report=term-missing

# Run property-based tests
test-property:
	pytest -v -m property

# Run unit tests
test-unit:
	pytest -v -m unit

# Run integration tests
test-integration:
	pytest -v -m integration

# Lint code
lint:
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

# Format code
format:
	black .

# Type checking
type-check:
	mypy . --ignore-missing-imports

# Clean up
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name "dist" -exec rm -rf {} +
	find . -type d -name "build" -exec rm -rf {} +

# Docker commands
docker-build:
	docker build -t ml-service:latest .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f ml-service

docker-logs-all:
	docker-compose logs -f

docker-clean:
	docker-compose down -v

# Development setup
setup: install
	cp .env.example .env
	@echo "Setup complete! Edit .env with your configuration."

# Run all checks
check: lint type-check test

# Full development environment
dev-full: docker-up
	@echo "Development environment started!"
	@echo "ML Service: http://localhost:5001"
	@echo "Flower (Celery): http://localhost:5555"
	@echo "MongoDB: localhost:27017"
	@echo "Redis: localhost:6379"
