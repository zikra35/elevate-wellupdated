"""Property-based tests for Feature Extraction Consistency."""

import pytest
from hypothesis import given, strategies as st
from unittest.mock import Mock, patch
from services.feature_extractor import FeatureExtractor
from models.feature_vector import FeatureVector


@pytest.mark.property
class TestFeatureExtractionConsistency:
    """Property-based tests for feature extraction consistency.
    
    **Validates: Requirements 2.1, 2.2, 2.3, 2.6**
    
    Property: For any set of training data, extracting features SHALL produce
    consistent, normalized feature vectors (0-1 or -1 to 1 range) that can be
    reliably used for model training.
    """

    @pytest.fixture
    def extractor(self):
        """Create a FeatureExtractor instance."""
        with patch("services.feature_extractor.TrainingDataCollector"):
            return FeatureExtractor()

    @given(st.floats(min_value=-100, max_value=100, allow_nan=False, allow_infinity=False))
    def test_feature_normalization_range(self, extractor, value):
        """Test that all features are normalized to 0-1 range.
        
        For any input value, normalization should produce a value
        within the 0-1 range.
        """
        normalized = extractor._normalize_feature(value)
        
        assert 0.0 <= normalized <= 1.0

    @given(st.lists(
        st.dictionaries({
            "value": st.dictionaries({
                "intensity": st.sampled_from(["low", "moderate", "high", "very_high"])
            })
        }),
        min_size=1,
        max_size=100
    ))
    def test_feature_extraction_produces_valid_range(self, extractor, workout_data):
        """Test that extracted features are within valid range.
        
        For any workout data, extracted intensity preference should
        be normalized to 0-1 range.
        """
        extractor.collector.get_user_data_by_type = Mock(return_value=workout_data)
        
        result = extractor._extract_workout_intensity("user123")
        
        assert 0.0 <= result <= 1.0

    @given(st.lists(
        st.dictionaries({
            "value": st.dictionaries({
                "workout_type": st.sampled_from([
                    "cardio", "strength", "flexibility", "yoga", "pilates"
                ])
            })
        }),
        min_size=1,
        max_size=50
    ))
    def test_workout_type_preferences_sum_to_one(self, extractor, workout_data):
        """Test that workout type preferences sum to approximately 1.0.
        
        For any workout data, the sum of all type preferences should
        be approximately 1.0 (allowing for floating point precision).
        """
        extractor.collector.get_user_data_by_type = Mock(return_value=workout_data)
        
        result = extractor._extract_workout_type_preference("user123")
        
        if result:
            total = sum(result.values())
            assert 0.99 <= total <= 1.01  # Allow for floating point precision

    @given(st.lists(
        st.dictionaries({
            "value": st.dictionaries({
                "meal_type": st.sampled_from(["breakfast", "lunch", "dinner", "snack"])
            })
        }),
        min_size=1,
        max_size=50
    ))
    def test_meal_type_preferences_normalized(self, extractor, meal_data):
        """Test that meal type preferences are normalized.
        
        For any meal data, each preference should be in 0-1 range.
        """
        extractor.collector.get_user_data_by_type = Mock(return_value=meal_data)
        
        result = extractor._extract_meal_type_preferences("user123")
        
        for preference in result.values():
            assert 0.0 <= preference <= 1.0

    @given(st.lists(
        st.dictionaries({
            "value": st.dictionaries({
                "quality": st.sampled_from(["poor", "fair", "good", "excellent"])
            })
        }),
        min_size=1,
        max_size=50
    ))
    def test_sleep_quality_normalized(self, extractor, sleep_data):
        """Test that sleep quality is normalized to 0-1 range.
        
        For any sleep data, extracted quality should be in 0-1 range.
        """
        extractor.collector.get_user_data_by_type = Mock(return_value=sleep_data)
        
        result = extractor._extract_sleep_quality("user123")
        
        assert 0.0 <= result <= 1.0

    @given(st.lists(
        st.dictionaries({
            "value": st.dictionaries({
                "mood_level": st.sampled_from([
                    "very_sad", "sad", "neutral", "happy", "very_happy"
                ])
            })
        }),
        min_size=1,
        max_size=50
    ))
    def test_mood_patterns_normalized(self, extractor, mood_data):
        """Test that mood patterns are normalized to 0-1 range.
        
        For any mood data, extracted mood should be in 0-1 range.
        """
        extractor.collector.get_user_data_by_type = Mock(return_value=mood_data)
        
        result = extractor._extract_mood_patterns("user123")
        
        assert 0.0 <= result <= 1.0

    @given(st.lists(
        st.dictionaries({
            "value": st.dictionaries({
                "stress_level": st.integers(min_value=0, max_value=10)
            })
        }),
        min_size=1,
        max_size=50
    ))
    def test_stress_level_normalized(self, extractor, mood_data):
        """Test that stress level is normalized to 0-1 range.
        
        For any stress data, extracted stress should be in 0-1 range.
        """
        extractor.collector.get_user_data_by_type = Mock(return_value=mood_data)
        
        result = extractor._extract_stress_level("user123")
        
        assert 0.0 <= result <= 1.0

    @given(st.integers(min_value=0, max_value=1000))
    def test_confidence_scores_valid_range(self, extractor, data_points):
        """Test that confidence scores are in valid range.
        
        For any number of data points, confidence scores should be
        in 0-1 range.
        """
        features = FeatureVector(user_id="user123", data_points_count=data_points)
        
        result = extractor._calculate_confidence_scores(features)
        
        for score in result.values():
            assert 0.0 <= score <= 1.0

    @given(st.lists(
        st.dictionaries({
            "value": st.dictionaries({
                "duration_hr": st.floats(min_value=0, max_value=12)
            })
        }),
        min_size=1,
        max_size=50
    ))
    def test_sleep_duration_normalized(self, extractor, sleep_data):
        """Test that sleep duration is normalized to 0-1 range.
        
        For any sleep duration data, extracted duration should be
        in 0-1 range.
        """
        extractor.collector.get_user_data_by_type = Mock(return_value=sleep_data)
        
        result = extractor._extract_sleep_duration("user123")
        
        assert 0.0 <= result <= 1.0

    def test_feature_vector_all_features_normalized(self, extractor):
        """Test that all features in a feature vector are normalized.
        
        For any extracted feature vector, all features should be
        in valid ranges.
        """
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
        
        if result:
            # Check all features are in valid range
            for feature_name, feature_value in result.get_all_features().items():
                assert 0.0 <= feature_value <= 1.0, f"Feature {feature_name} out of range: {feature_value}"
