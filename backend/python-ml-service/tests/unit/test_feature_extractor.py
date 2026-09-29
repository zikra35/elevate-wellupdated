"""Unit tests for FeatureExtractor service."""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from services.feature_extractor import FeatureExtractor
from models.feature_vector import FeatureVector


@pytest.mark.unit
class TestFeatureExtractor:
    """Test cases for FeatureExtractor."""

    @pytest.fixture
    def extractor(self):
        """Create a FeatureExtractor instance."""
        with patch("services.feature_extractor.TrainingDataCollector"):
            return FeatureExtractor()

    def test_normalize_feature_within_range(self, extractor):
        """Test normalizing a feature within range."""
        result = extractor._normalize_feature(0.5)
        assert 0.0 <= result <= 1.0
        assert result == 0.5

    def test_normalize_feature_below_min(self, extractor):
        """Test normalizing a feature below minimum."""
        result = extractor._normalize_feature(-0.5)
        assert result == 0.0

    def test_normalize_feature_above_max(self, extractor):
        """Test normalizing a feature above maximum."""
        result = extractor._normalize_feature(1.5)
        assert result == 1.0

    def test_extract_workout_frequency(self, extractor):
        """Test extracting workout frequency."""
        overall_data = {
            "count": 100,
            "workout_count": 30,
        }
        
        result = extractor._extract_workout_frequency(overall_data)
        
        assert 0.0 <= result <= 1.0

    def test_extract_workout_intensity_no_data(self, extractor):
        """Test extracting workout intensity with no data."""
        extractor.collector.get_user_data_by_type = Mock(return_value=[])
        
        result = extractor._extract_workout_intensity("user123")
        
        assert result == 0.5

    def test_extract_workout_intensity_with_data(self, extractor):
        """Test extracting workout intensity with data."""
        mock_data = [
            {"value": {"intensity": "high"}},
            {"value": {"intensity": "moderate"}},
            {"value": {"intensity": "low"}},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_workout_intensity("user123")
        
        assert 0.0 <= result <= 1.0

    def test_extract_workout_type_preference(self, extractor):
        """Test extracting workout type preferences."""
        mock_data = [
            {"value": {"workout_type": "running"}},
            {"value": {"workout_type": "running"}},
            {"value": {"workout_type": "cycling"}},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_workout_type_preference("user123")
        
        assert isinstance(result, dict)
        assert "running" in result
        assert "cycling" in result
        assert result["running"] > result["cycling"]

    def test_extract_sleep_duration(self, extractor):
        """Test extracting sleep duration."""
        mock_data = [
            {"value": {"duration_hr": 7}},
            {"value": {"duration_hr": 8}},
            {"value": {"duration_hr": 6}},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_sleep_duration("user123")
        
        assert 0.0 <= result <= 1.0

    def test_extract_sleep_quality(self, extractor):
        """Test extracting sleep quality."""
        mock_data = [
            {"value": {"quality": "good"}},
            {"value": {"quality": "excellent"}},
            {"value": {"quality": "fair"}},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_sleep_quality("user123")
        
        assert 0.0 <= result <= 1.0

    def test_extract_mood_patterns(self, extractor):
        """Test extracting mood patterns."""
        mock_data = [
            {"value": {"mood_level": "happy"}},
            {"value": {"mood_level": "very_happy"}},
            {"value": {"mood_level": "neutral"}},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_mood_patterns("user123")
        
        assert 0.0 <= result <= 1.0

    def test_extract_stress_level(self, extractor):
        """Test extracting stress level."""
        mock_data = [
            {"value": {"stress_level": 3}},
            {"value": {"stress_level": 5}},
            {"value": {"stress_level": 4}},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_stress_level("user123")
        
        assert 0.0 <= result <= 1.0

    def test_extract_morning_preference(self, extractor):
        """Test extracting morning preference."""
        mock_data = [
            {"timestamp": datetime(2024, 1, 1, 8, 0)},
            {"timestamp": datetime(2024, 1, 2, 18, 0)},
            {"timestamp": datetime(2024, 1, 3, 9, 0)},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_morning_preference("user123")
        
        assert 0.0 <= result <= 1.0

    def test_extract_evening_preference(self, extractor):
        """Test extracting evening preference."""
        mock_data = [
            {"timestamp": datetime(2024, 1, 1, 8, 0)},
            {"timestamp": datetime(2024, 1, 2, 18, 0)},
            {"timestamp": datetime(2024, 1, 3, 20, 0)},
        ]
        
        extractor.collector.get_user_data_by_type = Mock(return_value=mock_data)
        
        result = extractor._extract_evening_preference("user123")
        
        assert 0.0 <= result <= 1.0

    def test_calculate_confidence_scores(self, extractor):
        """Test calculating confidence scores."""
        features = FeatureVector(user_id="user123", data_points_count=100)
        
        result = extractor._calculate_confidence_scores(features)
        
        assert isinstance(result, dict)
        assert len(result) > 0
        for score in result.values():
            assert 0.0 <= score <= 1.0

    def test_extract_features_no_data(self, extractor):
        """Test extracting features with no data."""
        extractor.collector.collect_user_data = Mock(return_value={})
        
        result = extractor.extract_features("user123")
        
        assert result is None

    def test_extract_features_with_data(self, extractor):
        """Test extracting features with data."""
        mock_data = {
            "overall": {
                "count": 100,
                "workout_count": 30,
                "meal_count": 90,
                "sleep_count": 30,
                "mood_count": 30,
            }
        }
        
        extractor.collector.collect_user_data = Mock(return_value=mock_data)
        extractor.collector.get_user_data_by_type = Mock(return_value=[])
        
        result = extractor.extract_features("user123")
        
        assert result is not None
        assert isinstance(result, FeatureVector)
        assert result.user_id == "user123"
        assert result.data_points_count == 100
