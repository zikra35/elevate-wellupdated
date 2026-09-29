"""Feature Extractor service for Self-Trained AI System."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from config.settings import Settings
from config.constants import (
    VALID_WORKOUT_TYPES,
    VALID_MEAL_TYPES,
    VALID_MOOD_LEVELS,
    VALID_INTENSITY_LEVELS,
)
from models.feature_vector import FeatureVector
from services.training_data_collector import TrainingDataCollector

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """Extracts personalization features from training data."""

    def __init__(self):
        """Initialize the extractor."""
        self.collector = TrainingDataCollector()
        self.feature_min = 0.0
        self.feature_max = 1.0

    def extract_features(self, user_id: str) -> Optional[FeatureVector]:
        """
        Extract all personalization features from user's training data.
        
        Args:
            user_id: User ID
            
        Returns:
            FeatureVector object, or None if extraction fails
        """
        try:
            logger.info(f"Extracting features for user {user_id}")
            
            # Collect user data
            user_data = self.collector.collect_user_data(user_id)
            if not user_data:
                logger.warning(f"No data available for feature extraction for user {user_id}")
                return None
            
            # Create feature vector
            features = FeatureVector(user_id=user_id)
            
            # Extract features from overall data
            if "overall" in user_data:
                overall_data = user_data["overall"]
                
                # Extract workout features
                features.workout_frequency = self._extract_workout_frequency(overall_data)
                features.workout_intensity_preference = self._extract_workout_intensity(user_id)
                features.workout_type_preference = self._extract_workout_type_preference(user_id)
                
                # Extract meal features
                features.meal_timing_patterns = self._extract_meal_timing_patterns(user_id)
                features.meal_type_preferences = self._extract_meal_type_preferences(user_id)
                
                # Extract sleep features
                features.sleep_duration_patterns = self._extract_sleep_duration(user_id)
                features.sleep_quality_patterns = self._extract_sleep_quality(user_id)
                
                # Extract mood features
                features.mood_patterns = self._extract_mood_patterns(user_id)
                features.stress_level_patterns = self._extract_stress_level(user_id)
                features.anxiety_level_patterns = self._extract_anxiety_level(user_id)
                features.energy_level_patterns = self._extract_energy_level(user_id)
                
                # Extract goal features
                features.goal_progress_rate = self._extract_goal_progress_rate(user_id)
                
                # Extract feedback features
                features.feedback_patterns = self._extract_feedback_patterns(user_id)
                
                # Extract temporal features
                features.morning_preference = self._extract_morning_preference(user_id)
                features.evening_preference = self._extract_evening_preference(user_id)
                
                # Extract cycle features if applicable
                features.cycle_phase_preference = self._extract_cycle_phase_preference(user_id)
                
                # Calculate correlations
                features.feature_correlations = self._calculate_correlations(features)
                
                # Set metadata
                features.data_points_count = overall_data.get("count", 0)
                features.confidence_scores = self._calculate_confidence_scores(features)
            
            logger.info(f"Successfully extracted {features.get_feature_count()} features for user {user_id}")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features for user {user_id}: {e}")
            return None

    def _extract_workout_frequency(self, overall_data: Dict[str, Any]) -> float:
        """Extract workout frequency (0-1)."""
        try:
            workout_count = overall_data.get("workout_count", 0)
            total_count = overall_data.get("count", 1)
            
            # Normalize: assume 3-4 workouts per week is ideal (0.5-0.7)
            frequency = min(workout_count / max(total_count, 1), 1.0)
            return self._normalize_feature(frequency)
            
        except Exception as e:
            logger.error(f"Error extracting workout frequency: {e}")
            return 0.5

    def _extract_workout_intensity(self, user_id: str) -> float:
        """Extract preferred workout intensity (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "workout")
            if not data_list:
                return 0.5
            
            intensity_map = {
                "low": 0.25,
                "moderate": 0.5,
                "high": 0.75,
                "very_high": 1.0,
            }
            
            intensities = []
            for data in data_list:
                intensity = data.get("value", {}).get("intensity", "moderate")
                intensities.append(intensity_map.get(intensity, 0.5))
            
            avg_intensity = np.mean(intensities) if intensities else 0.5
            return self._normalize_feature(avg_intensity)
            
        except Exception as e:
            logger.error(f"Error extracting workout intensity: {e}")
            return 0.5

    def _extract_workout_type_preference(self, user_id: str) -> Dict[str, float]:
        """Extract preference for each workout type."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "workout")
            if not data_list:
                return {}
            
            type_counts = {}
            for data in data_list:
                workout_type = data.get("value", {}).get("workout_type", "unknown")
                type_counts[workout_type] = type_counts.get(workout_type, 0) + 1
            
            # Normalize counts to 0-1
            total = sum(type_counts.values()) if type_counts else 1
            preferences = {
                wtype: self._normalize_feature(count / total)
                for wtype, count in type_counts.items()
            }
            
            return preferences
            
        except Exception as e:
            logger.error(f"Error extracting workout type preference: {e}")
            return {}

    def _extract_meal_timing_patterns(self, user_id: str) -> Dict[str, float]:
        """Extract meal timing patterns."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "meal")
            if not data_list:
                return {}
            
            timing_counts = {}
            for data in data_list:
                meal_type = data.get("value", {}).get("meal_type", "unknown")
                timing_counts[meal_type] = timing_counts.get(meal_type, 0) + 1
            
            # Normalize to 0-1
            total = sum(timing_counts.values()) if timing_counts else 1
            patterns = {
                timing: self._normalize_feature(count / total)
                for timing, count in timing_counts.items()
            }
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error extracting meal timing patterns: {e}")
            return {}

    def _extract_meal_type_preferences(self, user_id: str) -> Dict[str, float]:
        """Extract preference for each meal type."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "meal")
            if not data_list:
                return {}
            
            type_counts = {}
            for data in data_list:
                meal_type = data.get("value", {}).get("meal_type", "unknown")
                type_counts[meal_type] = type_counts.get(meal_type, 0) + 1
            
            # Normalize to 0-1
            total = sum(type_counts.values()) if type_counts else 1
            preferences = {
                mtype: self._normalize_feature(count / total)
                for mtype, count in type_counts.items()
            }
            
            return preferences
            
        except Exception as e:
            logger.error(f"Error extracting meal type preferences: {e}")
            return {}

    def _extract_sleep_duration(self, user_id: str) -> float:
        """Extract sleep duration patterns (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "sleep")
            if not data_list:
                return 0.5
            
            durations = []
            for data in data_list:
                duration = data.get("value", {}).get("duration_hr", 7)
                durations.append(float(duration))
            
            avg_duration = np.mean(durations) if durations else 7
            # Normalize: 8 hours = 1.0, 4 hours = 0.0
            normalized = (avg_duration - 4) / 4
            return self._normalize_feature(normalized)
            
        except Exception as e:
            logger.error(f"Error extracting sleep duration: {e}")
            return 0.5

    def _extract_sleep_quality(self, user_id: str) -> float:
        """Extract sleep quality patterns (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "sleep")
            if not data_list:
                return 0.5
            
            quality_map = {
                "poor": 0.0,
                "fair": 0.33,
                "good": 0.67,
                "excellent": 1.0,
            }
            
            qualities = []
            for data in data_list:
                quality = data.get("value", {}).get("quality", "good")
                qualities.append(quality_map.get(quality, 0.5))
            
            avg_quality = np.mean(qualities) if qualities else 0.5
            return self._normalize_feature(avg_quality)
            
        except Exception as e:
            logger.error(f"Error extracting sleep quality: {e}")
            return 0.5

    def _extract_mood_patterns(self, user_id: str) -> float:
        """Extract mood patterns (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "mood")
            if not data_list:
                return 0.5
            
            mood_map = {
                "very_sad": 0.0,
                "sad": 0.25,
                "neutral": 0.5,
                "happy": 0.75,
                "very_happy": 1.0,
            }
            
            moods = []
            for data in data_list:
                mood = data.get("value", {}).get("mood_level", "neutral")
                moods.append(mood_map.get(mood, 0.5))
            
            avg_mood = np.mean(moods) if moods else 0.5
            return self._normalize_feature(avg_mood)
            
        except Exception as e:
            logger.error(f"Error extracting mood patterns: {e}")
            return 0.5

    def _extract_stress_level(self, user_id: str) -> float:
        """Extract stress level patterns (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "mood")
            if not data_list:
                return 0.5
            
            stress_levels = []
            for data in data_list:
                stress = data.get("value", {}).get("stress_level", 5)
                stress_levels.append(float(stress))
            
            avg_stress = np.mean(stress_levels) if stress_levels else 5
            # Normalize: 10 = 1.0, 0 = 0.0
            normalized = avg_stress / 10.0
            return self._normalize_feature(normalized)
            
        except Exception as e:
            logger.error(f"Error extracting stress level: {e}")
            return 0.5

    def _extract_anxiety_level(self, user_id: str) -> float:
        """Extract anxiety level patterns (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "mood")
            if not data_list:
                return 0.5
            
            anxiety_levels = []
            for data in data_list:
                anxiety = data.get("value", {}).get("anxiety_level", 5)
                anxiety_levels.append(float(anxiety))
            
            avg_anxiety = np.mean(anxiety_levels) if anxiety_levels else 5
            # Normalize: 10 = 1.0, 0 = 0.0
            normalized = avg_anxiety / 10.0
            return self._normalize_feature(normalized)
            
        except Exception as e:
            logger.error(f"Error extracting anxiety level: {e}")
            return 0.5

    def _extract_energy_level(self, user_id: str) -> float:
        """Extract energy level patterns (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "mood")
            if not data_list:
                return 0.5
            
            energy_levels = []
            for data in data_list:
                energy = data.get("value", {}).get("energy_level", 5)
                energy_levels.append(float(energy))
            
            avg_energy = np.mean(energy_levels) if energy_levels else 5
            # Normalize: 10 = 1.0, 0 = 0.0
            normalized = avg_energy / 10.0
            return self._normalize_feature(normalized)
            
        except Exception as e:
            logger.error(f"Error extracting energy level: {e}")
            return 0.5

    def _extract_goal_progress_rate(self, user_id: str) -> float:
        """Extract goal progress rate (0-1)."""
        # This would typically come from goal tracking data
        # For now, return a default value
        return 0.5

    def _extract_feedback_patterns(self, user_id: str) -> Dict[str, float]:
        """Extract feedback patterns."""
        # This would typically come from feedback data
        # For now, return empty dict
        return {"acceptance_rate": 0.5}

    def _extract_morning_preference(self, user_id: str) -> float:
        """Extract morning activity preference (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "workout")
            if not data_list:
                return 0.5
            
            morning_count = 0
            for data in data_list:
                timestamp = data.get("timestamp")
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp)
                if timestamp.hour < 12:
                    morning_count += 1
            
            morning_preference = morning_count / len(data_list) if data_list else 0.5
            return self._normalize_feature(morning_preference)
            
        except Exception as e:
            logger.error(f"Error extracting morning preference: {e}")
            return 0.5

    def _extract_evening_preference(self, user_id: str) -> float:
        """Extract evening activity preference (0-1)."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "workout")
            if not data_list:
                return 0.5
            
            evening_count = 0
            for data in data_list:
                timestamp = data.get("timestamp")
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp)
                if timestamp.hour >= 18:
                    evening_count += 1
            
            evening_preference = evening_count / len(data_list) if data_list else 0.5
            return self._normalize_feature(evening_preference)
            
        except Exception as e:
            logger.error(f"Error extracting evening preference: {e}")
            return 0.5

    def _extract_cycle_phase_preference(self, user_id: str) -> Optional[Dict[str, float]]:
        """Extract cycle phase preferences."""
        try:
            data_list = self.collector.get_user_data_by_type(user_id, "cycle")
            if not data_list:
                return None
            
            phase_counts = {}
            for data in data_list:
                phase = data.get("value", {}).get("phase", "unknown")
                phase_counts[phase] = phase_counts.get(phase, 0) + 1
            
            # Normalize to 0-1
            total = sum(phase_counts.values()) if phase_counts else 1
            preferences = {
                phase: self._normalize_feature(count / total)
                for phase, count in phase_counts.items()
            }
            
            return preferences if preferences else None
            
        except Exception as e:
            logger.error(f"Error extracting cycle phase preference: {e}")
            return None

    def _calculate_correlations(self, features: FeatureVector) -> Dict[str, float]:
        """Calculate correlations between features."""
        # This is a simplified version - in production, would use actual correlation analysis
        correlations = {}
        
        # Example: stress and energy are negatively correlated
        if features.stress_level_patterns > 0.6:
            correlations["stress_energy_correlation"] = -0.7
        
        return correlations

    def _calculate_confidence_scores(self, features: FeatureVector) -> Dict[str, float]:
        """Calculate confidence scores for each feature."""
        confidence_scores = {}
        
        # Base confidence on data points count
        base_confidence = min(features.data_points_count / 100, 1.0)
        
        for feature_name in features.get_all_features().keys():
            # Adjust confidence based on feature type
            if "preference" in feature_name or "pattern" in feature_name:
                confidence_scores[feature_name] = base_confidence * 0.9
            else:
                confidence_scores[feature_name] = base_confidence
        
        return confidence_scores

    def _normalize_feature(self, value: float) -> float:
        """Normalize a feature value to 0-1 range."""
        return max(self.feature_min, min(self.feature_max, value))
