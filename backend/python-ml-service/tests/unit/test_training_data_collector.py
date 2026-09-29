"""Unit tests for TrainingDataCollector service."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from services.training_data_collector import TrainingDataCollector
from config.constants import DATA_TYPE_WORKOUT, DATA_TYPE_MEAL, DATA_TYPE_SLEEP


@pytest.mark.unit
class TestTrainingDataCollector:
    """Test cases for TrainingDataCollector."""

    @pytest.fixture
    def collector(self):
        """Create a TrainingDataCollector instance."""
        with patch("services.training_data_collector.MongoDBConnection"):
            return TrainingDataCollector()

    @pytest.fixture
    def sample_training_data(self):
        """Create sample training data."""
        return {
            "userId": "user123",
            "dataType": DATA_TYPE_WORKOUT,
            "timestamp": datetime.utcnow(),
            "value": {
                "duration_min": 45,
                "intensity": "high",
                "workout_type": "running",
                "calories_burned": 500,
            },
            "metadata": {
                "source": "mobile_app",
                "reliability": "high",
                "user_confirmed": True,
            },
        }

    def test_validate_training_data_valid(self, collector, sample_training_data):
        """Test validation of valid training data."""
        assert collector.validate_training_data(sample_training_data) is True

    def test_validate_training_data_missing_user_id(self, collector, sample_training_data):
        """Test validation fails when user_id is missing."""
        del sample_training_data["userId"]
        assert collector.validate_training_data(sample_training_data) is False

    def test_validate_training_data_missing_data_type(self, collector, sample_training_data):
        """Test validation fails when dataType is missing."""
        del sample_training_data["dataType"]
        assert collector.validate_training_data(sample_training_data) is False

    def test_validate_training_data_invalid_data_type(self, collector, sample_training_data):
        """Test validation fails with invalid data type."""
        sample_training_data["dataType"] = "invalid_type"
        assert collector.validate_training_data(sample_training_data) is False

    def test_validate_training_data_missing_value(self, collector, sample_training_data):
        """Test validation fails when value is missing."""
        del sample_training_data["value"]
        assert collector.validate_training_data(sample_training_data) is False

    def test_validate_training_data_invalid_value(self, collector, sample_training_data):
        """Test validation fails when value is not a dict."""
        sample_training_data["value"] = "not_a_dict"
        assert collector.validate_training_data(sample_training_data) is False

    def test_get_data_date_range_with_data(self, collector):
        """Test getting date range when data exists."""
        first_date = datetime.utcnow() - timedelta(days=30)
        last_date = datetime.utcnow()
        
        mock_first_doc = {"timestamp": first_date}
        mock_last_doc = {"timestamp": last_date}
        
        collector.collection.find_one = Mock(side_effect=[mock_first_doc, mock_last_doc])
        
        result = collector.get_data_date_range("user123")
        
        assert result is not None
        assert result["first_date"] == first_date
        assert result["last_date"] == last_date
        assert result["days_of_data"] == 30

    def test_get_data_date_range_no_data(self, collector):
        """Test getting date range when no data exists."""
        collector.collection.find_one = Mock(return_value=None)
        
        result = collector.get_data_date_range("user123")
        
        assert result is None

    def test_get_user_data_by_type(self, collector):
        """Test getting data by type."""
        mock_data = [
            {
                "userId": "user123",
                "dataType": DATA_TYPE_WORKOUT,
                "timestamp": datetime.utcnow(),
                "value": {"duration_min": 45},
            }
        ]
        
        mock_cursor = Mock()
        mock_cursor.__iter__ = Mock(return_value=iter(mock_data))
        mock_cursor.sort = Mock(return_value=mock_cursor)
        collector.collection.find = Mock(return_value=mock_cursor)
        
        result = collector.get_user_data_by_type("user123", DATA_TYPE_WORKOUT)
        
        assert len(result) == 1
        assert result[0]["dataType"] == DATA_TYPE_WORKOUT

    def test_get_user_data_by_date_range(self, collector):
        """Test getting data by date range."""
        start_date = datetime.utcnow() - timedelta(days=7)
        end_date = datetime.utcnow()
        
        mock_data = [
            {
                "userId": "user123",
                "dataType": DATA_TYPE_WORKOUT,
                "timestamp": datetime.utcnow(),
                "value": {"duration_min": 45},
            }
        ]
        
        mock_cursor = Mock()
        mock_cursor.__iter__ = Mock(return_value=iter(mock_data))
        mock_cursor.sort = Mock(return_value=mock_cursor)
        collector.collection.find = Mock(return_value=mock_cursor)
        
        result = collector.get_user_data_by_date_range("user123", start_date, end_date)
        
        assert len(result) == 1

    def test_delete_user_data(self, collector):
        """Test deleting user data."""
        mock_result = Mock(deleted_count=5)
        collector.collection.delete_many = Mock(return_value=mock_result)
        
        result = collector.delete_user_data("user123")
        
        assert result == 5

    def test_get_data_statistics(self, collector):
        """Test getting data statistics."""
        # Mock count_documents to return values for each call
        call_count = [0]
        def mock_count(query):
            call_count[0] += 1
            if call_count[0] == 1:  # total count
                return 10
            elif call_count[0] <= 6:  # data type counts
                return 2 if call_count[0] <= 3 else 0
            return 0
        
        collector.collection.count_documents = mock_count
        collector.get_data_date_range = Mock(return_value={
            "first_date": datetime.utcnow() - timedelta(days=30),
            "last_date": datetime.utcnow(),
            "days_of_data": 30,
        })
        
        result = collector.get_data_statistics("user123")
        
        # Check that result is not empty (exception was not raised)
        assert len(result) > 0
        assert result.get("user_id") == "user123"
        assert result.get("total_data_points") == 10
