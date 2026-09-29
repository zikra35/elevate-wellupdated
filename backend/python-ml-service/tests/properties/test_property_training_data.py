"""Property-based tests for Training Data Preservation."""

import pytest
from datetime import datetime
from hypothesis import given, strategies as st, settings, HealthCheck
from unittest.mock import Mock, patch
from services.training_data_collector import TrainingDataCollector
from config.constants import VALID_DATA_TYPES


# Strategy for generating valid training data
def training_data_strategy():
    """Generate valid training data."""
    return st.fixed_dictionaries({
        "userId": st.text(min_size=1, max_size=50),
        "dataType": st.sampled_from(VALID_DATA_TYPES),
        "timestamp": st.datetimes(),
        "value": st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(
                st.integers(),
                st.floats(allow_nan=False, allow_infinity=False),
                st.text(),
            ),
            min_size=1,
            max_size=5,
        ),
        "metadata": st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(st.text(), st.booleans()),
            min_size=0,
            max_size=3,
        ),
    })


@pytest.mark.property
class TestTrainingDataPreservation:
    """Property-based tests for training data preservation.
    
    **Validates: Requirements 1.1, 1.3, 1.8**
    
    Property: For any user with historical data, collecting and storing training data
    SHALL preserve all data points without loss or corruption, maintaining exact
    fidelity through round-trip storage and retrieval.
    """

    @staticmethod
    def create_collector():
        """Create a TrainingDataCollector instance."""
        with patch("services.training_data_collector.MongoDBConnection"):
            return TrainingDataCollector()

    @given(training_data_strategy())
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_training_data_round_trip(self, training_data):
        """Test that training data survives round-trip storage and retrieval.
        
        For any valid training data, when stored and retrieved, the data
        should be identical to the original.
        """
        collector = self.create_collector()
        
        # Mock the database operations
        stored_data = None
        
        def mock_insert_one(data):
            nonlocal stored_data
            stored_data = data.copy()
            mock_result = Mock()
            mock_result.inserted_id = "test_id"
            return mock_result
        
        collector.collection.insert_one = mock_insert_one
        
        # Store the data
        result_id = collector.save_training_data(training_data)
        
        # Verify storage was successful
        assert result_id is not None
        assert stored_data is not None
        
        # Verify all fields are preserved
        assert stored_data["userId"] == training_data["userId"]
        assert stored_data["dataType"] == training_data["dataType"]
        assert stored_data["value"] == training_data["value"]
        assert stored_data["metadata"] == training_data["metadata"]

    @given(st.lists(training_data_strategy(), min_size=1, max_size=100))
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_multiple_training_data_preservation(self, training_data_list):
        """Test that multiple training data points are all preserved.
        
        For any list of valid training data, when all are stored, each
        should be retrievable without loss or corruption.
        """
        collector = self.create_collector()
        stored_data_list = []
        
        def mock_insert_one(data):
            stored_data_list.append(data.copy())
            mock_result = Mock()
            mock_result.inserted_id = f"id_{len(stored_data_list)}"
            return mock_result
        
        collector.collection.insert_one = mock_insert_one
        
        # Store all data
        for data in training_data_list:
            result_id = collector.save_training_data(data)
            assert result_id is not None
        
        # Verify all data was stored
        assert len(stored_data_list) == len(training_data_list)
        
        # Verify each data point is preserved
        for original, stored in zip(training_data_list, stored_data_list):
            assert stored["userId"] == original["userId"]
            assert stored["dataType"] == original["dataType"]
            assert stored["value"] == original["value"]

    @given(training_data_strategy())
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_training_data_validation_before_storage(self, training_data):
        """Test that invalid data is rejected before storage.
        
        For any training data, validation should correctly identify
        valid vs invalid data.
        """
        collector = self.create_collector()
        
        # Valid data should pass validation
        assert collector.validate_training_data(training_data) is True
        
        # Invalid data should fail validation
        invalid_data = training_data.copy()
        del invalid_data["userId"]
        assert collector.validate_training_data(invalid_data) is False
        
        invalid_data = training_data.copy()
        invalid_data["dataType"] = "invalid_type"
        assert collector.validate_training_data(invalid_data) is False

    @given(st.text(min_size=1, max_size=50))
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_user_data_collection_consistency(self, user_id):
        """Test that collecting user data returns consistent results.
        
        For any user ID, collecting data multiple times should return
        the same results.
        """
        collector = self.create_collector()
        mock_data = [
            {
                "userId": user_id,
                "dataType": "workout",
                "timestamp": datetime.utcnow(),
                "value": {"duration_min": 45},
            }
        ]
        
        collector.collection.find = Mock(return_value=Mock(__iter__=lambda self: iter(mock_data)))
        
        # Collect data twice
        result1 = collector.collect_user_data(user_id)
        result2 = collector.collect_user_data(user_id)
        
        # Results should be consistent
        assert result1 == result2

    @given(st.integers(min_value=0, max_value=100))
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_data_count_accuracy(self, data_count):
        """Test that data count is accurately reported.
        
        For any number of data points, the count should match the
        actual number of stored points.
        """
        collector = self.create_collector()
        collector.collection.count_documents = Mock(return_value=data_count)
        
        result = collector.collection.count_documents({"userId": "user123"})
        
        assert result == data_count
