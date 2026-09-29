"""Feature extraction engine for self-trained AI system."""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """Extract personalization features from raw health data."""

    # 16 personalization dimensions
    DIMENSIONS = [
        "workout_frequency",
        "workout_intensity",
        "workout_type_preference",
        "meal_timing",
        "meal_types",
        "dietary_restrictions",
        "sleep_duration",
        "sleep_quality",
        "mood_pattern",
        "stress_level",
        "cycle_phase_awareness",
        "goal_progress_rate",
        "feedback_patterns",
        "time_preference",
        "recovery_preference",
        "social_preference",
    ]

    def __init__(self):
        """Initialize feature extractor."""
        self.dimensions = self.DIMENSIONS
        self.feature_vector_size = len(self.DIMENSIONS)

    def extract_user_features(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract features from user training data.

        Args:
            training_data: List of health data points from 30-90 days

        Returns:
            Dict with extracted features, normalized values, and aggregate stats
        """
        if not training_data or len(training_data) < 30:
            logger.warning(f"Insufficient data: {len(training_data)} points (need 30+)")
            return {"error": "insufficient_data", "data_points": len(training_data)}

        features = {}

        # Extract individual dimensions
        features["workout_frequency"] = self._extract_workout_frequency(training_data)
        features["workout_intensity"] = self._extract_workout_intensity(training_data)
        features["workout_type_preference"] = self._extract_workout_type_preference(training_data)
        features["meal_timing"] = self._extract_meal_timing(training_data)
        features["meal_types"] = self._extract_meal_types(training_data)
        features["dietary_restrictions"] = self._extract_dietary_restrictions(training_data)
        features["sleep_duration"] = self._extract_sleep_duration(training_data)
        features["sleep_quality"] = self._extract_sleep_quality(training_data)
        features["mood_pattern"] = self._extract_mood_pattern(training_data)
        features["stress_level"] = self._extract_stress_level(training_data)
        features["cycle_phase_awareness"] = self._extract_cycle_phase_awareness(training_data)
        features["goal_progress_rate"] = self._extract_goal_progress_rate(training_data)
        features["feedback_patterns"] = self._extract_feedback_patterns(training_data)
        features["time_preference"] = self._extract_time_preference(training_data)
        features["recovery_preference"] = self._extract_recovery_preference(training_data)
        features["social_preference"] = self._extract_social_preference(training_data)

        # Normalize features to 0-1 range
        normalized_features = self._normalize_features(features)

        # Calculate aggregate statistics
        aggregate_stats = self._calculate_aggregate_stats(features)

        # Calculate feature correlations
        correlations = self._calculate_correlations(training_data)

        # Calculate confidence flags
        confidence_flags = self._calculate_confidence_flags(training_data)

        return {
            "raw_features": features,
            "normalized_features": normalized_features,
            "aggregate_stats": aggregate_stats,
            "correlations": correlations,
            "confidence_flags": confidence_flags,
            "data_points_used": len(training_data),
        }

    def _extract_workout_frequency(self, data: List[Dict]) -> float:
        """Workouts per week (0-7)."""
        workouts = [d for d in data if d.get("type") == "workout"]
        if not workouts:
            return 0.0

        # Calculate average workouts per week
        try:
            recent_count = 0
            for w in workouts[-20:]:  # Look at last 20 workouts
                recent_count += 1
            
            # Assume roughly 4 weeks of data, so divide by 4
            return min(1.0, float(recent_count) / 20.0)
        except (ValueError, TypeError):
            return 0.0

    def _extract_workout_intensity(self, data: List[Dict]) -> float:
        """Average workout intensity (0-10)."""
        workouts = [d for d in data if d.get("type") == "workout"]
        if not workouts:
            return 0.0

        intensity_map = {"low": 1, "moderate": 2, "high": 3}
        intensities = []
        for w in workouts[-20:]:
            intens = w.get("intensity", "moderate")
            if isinstance(intens, str):
                intensities.append(intensity_map.get(intens, 2))
            elif isinstance(intens, (int, float)):
                intensities.append(float(intens))
        
        return float(np.mean(intensities)) / 3.0 if intensities else 0.0

    def _extract_workout_type_preference(self, data: List[Dict]) -> Dict[str, float]:
        """Preference distribution across workout types."""
        workouts = [d for d in data if d.get("type") == "workout"]
        if not workouts:
            return {}

        type_counts = {}
        for w in workouts:
            wtype = w.get("workout_type", "other")
            type_counts[wtype] = type_counts.get(wtype, 0) + 1

        total = sum(type_counts.values())
        return {k: v / total for k, v in type_counts.items()}

    def _extract_meal_timing(self, data: List[Dict]) -> Dict[str, int]:
        """Meal timing patterns (hours in day)."""
        meals = [d for d in data if d.get("type") == "meal"]
        if not meals:
            return {}

        timing = {"breakfast": 0, "lunch": 0, "dinner": 0, "snack": 0}
        for meal in meals:
            meal_time = meal.get("meal_time", "other")
            if meal_time in timing:
                timing[meal_time] += 1

        return timing

    def _extract_meal_types(self, data: List[Dict]) -> Dict[str, float]:
        """Distribution of meal types."""
        meals = [d for d in data if d.get("type") == "meal"]
        if not meals:
            return {}

        type_counts = {}
        for m in meals:
            mtype = m.get("meal_type", "other")
            type_counts[mtype] = type_counts.get(mtype, 0) + 1

        total = sum(type_counts.values())
        return {k: v / total for k, v in type_counts.items()}

    def _extract_dietary_restrictions(self, data: List[Dict]) -> List[str]:
        """Dietary restrictions identified from data."""
        meals = [d for d in data if d.get("type") == "meal"]
        restrictions = set()

        for meal in meals:
            if meal.get("is_vegetarian"):
                restrictions.add("vegetarian")
            if meal.get("is_vegan"):
                restrictions.add("vegan")
            if meal.get("is_gluten_free"):
                restrictions.add("gluten_free")
            if meal.get("is_keto"):
                restrictions.add("keto")

        return list(restrictions)

    def _extract_sleep_duration(self, data: List[Dict]) -> float:
        """Average sleep duration in hours."""
        sleep_logs = [d for d in data if d.get("type") == "sleep"]
        if not sleep_logs:
            return 0.0

        durations = []
        for s in sleep_logs[-30:]:
            dur = s.get("duration", 0)
            if isinstance(dur, (int, float)):
                durations.append(float(dur))
        
        return float(np.mean(durations)) if durations else 0.0

    def _extract_sleep_quality(self, data: List[Dict]) -> float:
        """Average sleep quality (0-10)."""
        sleep_logs = [d for d in data if d.get("type") == "sleep"]
        if not sleep_logs:
            return 5.0

        quality_map = {"poor": 1, "fair": 2, "good": 3, "excellent": 4}
        qualities = []
        for s in sleep_logs[-30:]:
            qual = s.get("quality", "fair")
            if isinstance(qual, str):
                qualities.append(quality_map.get(qual, 2))
            elif isinstance(qual, (int, float)):
                qualities.append(float(qual))
        
        return float(np.mean(qualities)) / 4.0 if qualities else 0.5

    def _extract_mood_pattern(self, data: List[Dict]) -> Dict[str, float]:
        """Distribution of mood states."""
        mood_logs = [d for d in data if d.get("type") == "mental_health"]
        if not mood_logs:
            return {}

        moods = {}
        for log in mood_logs:
            mood = log.get("mood", "neutral")
            moods[mood] = moods.get(mood, 0) + 1

        total = sum(moods.values())
        return {k: v / total for k, v in moods.items()}

    def _extract_stress_level(self, data: List[Dict]) -> float:
        """Average stress level (0-10)."""
        mental_logs = [d for d in data if d.get("type") == "mental_health"]
        if not mental_logs:
            return 5.0

        stress_levels = [m.get("stress_level", 5) for m in mental_logs[-30:]]
        return np.mean(stress_levels) / 10.0 if stress_levels else 0.5

    def _extract_cycle_phase_awareness(self, data: List[Dict]) -> bool:
        """Whether user tracks cycle phases."""
        cycle_logs = [d for d in data if d.get("type") == "cycle"]
        return len(cycle_logs) > 0

    def _extract_goal_progress_rate(self, data: List[Dict]) -> float:
        """User's goal achievement rate (0-1)."""
        goals = [d for d in data if d.get("type") == "goal"]
        if not goals:
            return 0.0

        completed = sum(1 for g in goals if g.get("completed", False))
        return completed / len(goals) if goals else 0.0

    def _extract_feedback_patterns(self, data: List[Dict]) -> Dict[str, float]:
        """Feedback acceptance patterns."""
        feedback = [d for d in data if d.get("type") == "feedback"]
        if not feedback:
            return {}

        accepted = sum(1 for f in feedback if f.get("action") == "accept")
        rejected = sum(1 for f in feedback if f.get("action") == "reject")
        total = len(feedback)

        return {"acceptance_rate": accepted / total if total > 0 else 0.0, "rejection_rate": rejected / total if total > 0 else 0.0}

    def _extract_time_preference(self, data: List[Dict]) -> Dict[str, float]:
        """Time of day preferences for activities."""
        time_prefs = {"morning": 0, "afternoon": 0, "evening": 0, "night": 0}

        for d in data:
            if "timestamp" in d:
                try:
                    # Handle both string and numeric timestamps
                    ts = d["timestamp"]
                    if isinstance(ts, str):
                        # Parse ISO format timestamp
                        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                        hour = dt.hour
                    else:
                        # Assume numeric timestamp
                        dt = datetime.fromtimestamp(float(ts))
                        hour = dt.hour
                    
                    if 5 <= hour < 12:
                        time_prefs["morning"] += 1
                    elif 12 <= hour < 17:
                        time_prefs["afternoon"] += 1
                    elif 17 <= hour < 21:
                        time_prefs["evening"] += 1
                    else:
                        time_prefs["night"] += 1
                except (ValueError, TypeError):
                    # Skip if timestamp parsing fails
                    pass

        total = sum(time_prefs.values())
        return {k: v / total for k, v in time_prefs.items()} if total > 0 else time_prefs

    def _extract_recovery_preference(self, data: List[Dict]) -> str:
        """Recovery method preference."""
        recovery = [d for d in data if d.get("type") == "recovery"]
        if not recovery:
            return "unknown"

        types = {}
        for r in recovery:
            rtype = r.get("recovery_type", "rest")
            types[rtype] = types.get(rtype, 0) + 1

        return max(types, key=types.get) if types else "unknown"

    def _extract_social_preference(self, data: List[Dict]) -> str:
        """Solo vs group activity preference."""
        workouts = [d for d in data if d.get("type") == "workout"]
        if not workouts:
            return "unknown"

        solo = sum(1 for w in workouts if w.get("is_group", False) is False)
        group = sum(1 for w in workouts if w.get("is_group", False) is True)

        if solo > group:
            return "solo"
        elif group > solo:
            return "group"
        else:
            return "mixed"

    def _normalize_features(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Normalize all features to 0-1 range."""
        normalized = {}

        for key, value in features.items():
            if isinstance(value, (int, float)):
                # Already in 0-1 range or normalize
                normalized[key] = min(1.0, max(0.0, float(value)))
            elif isinstance(value, dict):
                # For dicts, take average of values
                if value:
                    normalized[key] = np.mean(list(value.values()))
                else:
                    normalized[key] = 0.0
            elif isinstance(value, list):
                # For lists, use length normalized
                normalized[key] = min(1.0, len(value) / 10.0)
            elif isinstance(value, bool):
                # Boolean to float
                normalized[key] = 1.0 if value else 0.0
            elif isinstance(value, str):
                # String to 0 or 1 for now
                normalized[key] = 0.5
            else:
                normalized[key] = 0.0

        return normalized

    def _calculate_aggregate_stats(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate aggregate statistics across features."""
        numeric_features = [v for v in features.values() if isinstance(v, (int, float))]

        if not numeric_features:
            return {}

        return {
            "mean": float(np.mean(numeric_features)),
            "median": float(np.median(numeric_features)),
            "std_dev": float(np.std(numeric_features)),
            "min": float(np.min(numeric_features)),
            "max": float(np.max(numeric_features)),
        }

    def _calculate_correlations(self, data: List[Dict]) -> Dict[str, Dict[str, float]]:
        """Calculate feature correlations."""
        # Simplified correlation calculation
        return {"note": "correlation_analysis_available_in_full_implementation"}

    def _calculate_confidence_flags(self, data: List[Dict]) -> Dict[str, bool]:
        """Identify dimensions with insufficient data."""
        type_counts = {}
        for d in data:
            dtype = d.get("type", "unknown")
            type_counts[dtype] = type_counts.get(dtype, 0) + 1

        # Flag dimensions with <5 data points
        confidence_flags = {}
        for dtype, count in type_counts.items():
            confidence_flags[f"{dtype}_confident"] = count >= 5

        return confidence_flags
