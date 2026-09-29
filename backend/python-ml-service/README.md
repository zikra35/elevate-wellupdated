# Self-Trained AI System - ML Service

A machine learning-based personalization engine that learns from individual user data and behavior patterns to generate personalized wellness recommendations.

## Project Structure

```
ml-service/
├── app.py                          # Main Flask application entry point
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker containerization
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
│
├── config/                         # Configuration module
│   ├── __init__.py                # Package initialization
│   ├── settings.py                # Application settings (environment-based)
│   ├── logging.py                 # Logging configuration
│   └── constants.py               # Application constants
│
├── models/                         # Data models and schemas
│   └── __init__.py                # Package initialization
│
├── services/                       # Business logic services
│   └── __init__.py                # Package initialization
│
├── repositories/                   # Data access layer
│   └── __init__.py                # Package initialization
│
├── api/                            # API endpoints and routes
│   └── __init__.py                # Package initialization
│
├── utils/                          # Utility functions and helpers
│   └── __init__.py                # Package initialization
│
├── ml/                             # Machine learning components
│   └── __init__.py                # Package initialization
│
├── cache/                          # Caching layer (Redis)
│   └── __init__.py                # Package initialization
│
├── tasks/                          # Celery async tasks
│   └── __init__.py                # Package initialization
│
└── tests/                          # Test suite
    └── __init__.py                # Package initialization
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:

- **Flask Configuration**
  - `FLASK_ENV`: development/production
  - `FLASK_DEBUG`: Enable debug mode
  - `SECRET_KEY`: Flask secret key

- **Database**
  - `MONGODB_URI`: MongoDB connection string
  - `MONGODB_DB_NAME`: Database name

- **Cache**
  - `REDIS_URL`: Redis connection string
  - `REDIS_CACHE_TTL`: Cache time-to-live (seconds)

- **Model Configuration**
  - `MIN_TRAINING_DATA_DAYS`: Minimum days of data before training (default: 30)
  - `MODEL_TRAINING_TIMEOUT`: Training timeout in seconds (default: 300)
  - `MODEL_CONFIDENCE_THRESHOLD`: Confidence threshold for recommendations (default: 60)

- **Async Processing**
  - `CELERY_BROKER_URL`: Celery broker URL
  - `CELERY_RESULT_BACKEND`: Celery result backend URL

- **Security**
  - `ENCRYPTION_KEY`: Data encryption key
  - `JWT_SECRET`: JWT secret for authentication

- **Feature Flags**
  - `ENABLE_SELF_TRAINED_AI`: Enable self-trained recommendations
  - `ENABLE_OFFLINE_MODE`: Enable offline capability
  - `ENABLE_PRIVACY_ENCRYPTION`: Enable data encryption

## Installation

### Prerequisites

- Python 3.11+
- MongoDB
- Redis
- pip

### Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Application

### Development

```bash
python app.py
```

The service will start on `http://localhost:5001`

### Docker

Build and run with Docker:

```bash
docker build -t ml-service .
docker run -p 5001:5001 --env-file .env ml-service
```

## Dependencies

### Web Framework
- Flask 2.3.0 - Web framework
- Flask-CORS 4.0.0 - CORS support

### Data Processing
- pandas 2.0.0 - Data manipulation
- numpy 1.24.0 - Numerical computing
- scipy 1.10.0 - Scientific computing

### Machine Learning
- scikit-learn 1.2.0 - ML algorithms
- joblib 1.2.0 - Model serialization

### Database & Cache
- pymongo 4.3.0 - MongoDB driver
- motor 3.1.0 - Async MongoDB driver
- redis 4.5.0 - Redis client

### Async Processing
- celery 5.2.0 - Distributed task queue
- flower 2.0.0 - Celery monitoring

### Testing
- pytest 7.3.0 - Testing framework
- pytest-asyncio 0.21.0 - Async test support
- hypothesis 6.75.0 - Property-based testing
- pytest-cov 4.0.0 - Coverage reporting

### Utilities
- pydantic 1.10.0 - Data validation
- cryptography 40.0.0 - Encryption
- python-dotenv 1.0.0 - Environment variables
- requests 2.31.0 - HTTP client

### Monitoring & Logging
- python-json-logger 2.0.0 - JSON logging
- prometheus-client 0.16.0 - Metrics

### Development
- black 23.3.0 - Code formatter
- flake8 6.0.0 - Linter
- mypy 1.0.0 - Type checker

## API Endpoints

### Health Check
- `GET /health` - Service health status
- `GET /api/ml/status` - Service status with version

### Recommendations (Phase 2)
- `POST /api/ml/recommendations` - Generate recommendations
- `GET /api/ml/recommendations/:id` - Get recommendation details

### Feedback (Phase 3)
- `POST /api/ml/feedback` - Record user feedback
- `GET /api/ml/feedback/:userId` - Get user feedback history

### Model Management (Phase 5)
- `POST /api/ml/train` - Trigger model training
- `GET /api/ml/status/:userId` - Get model status
- `GET /api/ml/config` - Get configuration
- `PUT /api/ml/config` - Update configuration

### Insights (Phase 5)
- `GET /api/ml/insights/:userId` - Get personalization insights
- `PUT /api/ml/insights/:userId` - Update preferences

## Development Workflow

### Code Style

Format code with Black:
```bash
black .
```

Check with flake8:
```bash
flake8 .
```

Type checking with mypy:
```bash
mypy .
```

### Testing

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=. --cov-report=html
```

Run property-based tests:
```bash
pytest -v -k "property"
```

## Logging

Logs are written to:
- Console: Real-time output
- `logs/ml_service.log`: General logs
- `logs/ml_service_error.log`: Error logs

Log level configured via `LOG_LEVEL` environment variable (DEBUG, INFO, WARNING, ERROR, CRITICAL).

## Architecture

### Layered Architecture

1. **API Layer** (`api/`) - HTTP endpoints and request handling
2. **Service Layer** (`services/`) - Business logic and orchestration
3. **Repository Layer** (`repositories/`) - Data access and persistence
4. **Model Layer** (`models/`) - Data models and schemas
5. **ML Layer** (`ml/`) - Machine learning algorithms
6. **Cache Layer** (`cache/`) - Redis caching
7. **Utilities** (`utils/`) - Helper functions

### Key Components

- **TrainingDataCollector** - Collects and stores user training data
- **FeatureExtractor** - Extracts personalization features
- **ModelTrainer** - Trains personalized ML models
- **RecommendationEngine** - Generates recommendations
- **FeedbackCollector** - Records user feedback
- **ReinforcementLearningSystem** - Updates models based on feedback
- **PerformanceMonitor** - Tracks model accuracy
- **ColdStartHandler** - Handles new users
- **OfflineModeSystem** - Enables offline recommendations
- **FallbackStrategy** - Fallback to OpenAI API
- **PrivacyManager** - Handles data encryption and privacy

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- Project structure and configuration ✓
- Database and cache connections
- Core data models
- Training data collection
- Feature extraction
- Data repositories

### Phase 2: Recommendation Engine (Weeks 5-8)
- Recommendation generation
- Confidence scoring
- Recommendation ranking
- Caching layer
- API endpoints

### Phase 3: Feedback Loop (Weeks 9-12)
- Feedback collection
- Reinforcement learning
- Automatic retraining
- Performance monitoring

### Phase 4: Advanced Features (Weeks 13-16)
- Cold start handling
- Offline capability
- Fallback strategies
- Privacy management

### Phase 5: Model Management (Weeks 17-20)
- Model versioning
- Integration with Node.js backend
- Configuration system
- Insights dashboard
- A/B testing

### Phase 6: Optimization (Weeks 21-24)
- Performance optimization
- Security hardening
- Deployment configuration
- End-to-end testing

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### Redis Connection Issues
- Ensure Redis is running: `redis-server`
- Check `REDIS_URL` in `.env`
- Verify network connectivity

### Model Training Issues
- Check minimum data threshold: `MIN_TRAINING_DATA_DAYS`
- Verify training data quality
- Check logs for detailed errors

### Performance Issues
- Monitor Redis memory usage
- Check MongoDB query performance
- Review Celery task queue

## Contributing

1. Follow PEP 8 style guidelines
2. Write tests for new features
3. Use property-based tests for core logic
4. Update documentation
5. Run linting and type checking before committing

## License

Part of the Radiant Health Companion project.

## Support

For issues and questions, refer to the main project documentation or contact the development team.
