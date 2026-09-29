"""Reinforcement learning model updater for self-trained AI system."""

import numpy as np
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json

logger = logging.getLogger(__name__)


class ReinforcementLearningEngine:
    """Update and improve models based on user feedback using reinforcement learning."""

    def __init__(self, feedback_threshold: int = 50, temporal_decay_rate: float = 0.99):
        """
        Initialize reinforcement learning engine.

        Args:
            feedback_threshold: Retraining trigger (number of feedback items)
            temporal_decay_rate: Decay rate for older feedback (0.99 = 1% decay per day)
        """
        self.feedback_threshold = feedback_threshold
        self.temporal_decay_rate = temporal_decay_rate
        self.model_history = []
        self.performance_tracking = {}

    def process_user_feedback(
        self,
        current_model_id: str,
        feedback_items: List[Dict[str, Any]],
        current_model: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Process user feedback and determine if retraining is needed.

        Args:
            current_model_id: ID of current model
            feedback_items: List of user feedback
            current_model: Current model metrics and state

        Returns:
            Dict with feedback processing results
        """
        if not feedback_items:
            return {"status": "no_feedback", "action": "none"}

        # Collect unprocessed feedback
        unprocessed_feedback = [f for f in feedback_items if not f.get("processed", False)]

        if len(unprocessed_feedback) < self.feedback_threshold:
            logger.info(f"Insufficient feedback: {len(unprocessed_feedback)}/{self.feedback_threshold}")
            return {
                "status": "insufficient_feedback",
                "feedback_count": len(unprocessed_feedback),
                "threshold": self.feedback_threshold,
                "action": "none",
            }

        # Update model weights based on feedback
        updated_weights = self._update_model_weights(unprocessed_feedback, current_model)

        # Calculate performance metrics
        performance_change = self._monitor_performance(
            current_model_id, unprocessed_feedback
        )

        return {
            "status": "feedback_processed",
            "feedback_count": len(unprocessed_feedback),
            "action": "retrain_recommended",
            "updated_weights": updated_weights,
            "performance_change": performance_change,
            "trigger_retraining": len(unprocessed_feedback) >= self.feedback_threshold,
        }

    def _update_model_weights(
        self, feedback_items: List[Dict[str, Any]], current_model: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Update model weights based on user feedback.

        Args:
            feedback_items: User feedback items
            current_model: Current model state

        Returns:
            Updated feature weights
        """
        # Calculate reward signals
        rewards = self._calculate_rewards(feedback_items)

        # Apply temporal decay
        weighted_rewards = self._apply_temporal_decay(rewards)

        # Get current feature importance
        current_importance = current_model.get("feature_importance", {})

        # Update weights
        updated_weights = {}
        total_weight = sum(abs(r) for r in weighted_rewards.values())

        for feature, current_weight in current_importance.items():
            reward = weighted_rewards.get(feature, 0)
            # Blend: 80% old, 20% new
            updated_weights[feature] = 0.8 * current_weight + 0.2 * (reward / total_weight if total_weight > 0 else 0)

        logger.info(f"Updated weights for {len(updated_weights)} features")

        return updated_weights

    def _calculate_rewards(self, feedback_items: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Convert user feedback to reward signals.

        Args:
            feedback_items: User feedback items

        Returns:
            Dict mapping features to reward signals
        """
        feature_rewards = {}

        for feedback in feedback_items:
            action = feedback.get("action", "neutral")  # accept/reject/rate
            recommendation_type = feedback.get("recommendation_type", "unknown")
            rating = feedback.get("rating", 3) if action == "rate" else None

            # Reward signal: +1 for accept, -1 for reject, 0 for neutral
            if action == "accept":
                reward = 1.0
            elif action == "reject":
                reward = -1.0
            elif action == "rate" and rating:
                reward = (rating - 3) / 2  # Normalize 1-5 to -1 to 1
            else:
                reward = 0.0

            # Accumulate rewards by recommendation type/feature
            if recommendation_type not in feature_rewards:
                feature_rewards[recommendation_type] = []
            feature_rewards[recommendation_type].append(reward)

        # Average rewards per feature
        averaged_rewards = {}
        for feature, reward_list in feature_rewards.items():
            averaged_rewards[feature] = float(np.mean(reward_list))

        logger.info(f"Calculated rewards for {len(averaged_rewards)} features")

        return averaged_rewards

    def _apply_temporal_decay(self, rewards: Dict[str, float]) -> Dict[str, float]:
        """
        Apply temporal decay to rewards (recent feedback = higher weight).

        Uses decay formula: weight = decay_rate ^ days_ago

        Args:
            rewards: Reward signals with timestamps

        Returns:
            Temporally weighted reward signals
        """
        # Simplified: assume all current feedback is recent (day 0)
        # In production, would use actual timestamps
        decayed_rewards = {}

        for feature, reward in rewards.items():
            # Day 0: weight = 1.0
            # Day 1: weight = 0.99
            # Day 7: weight = 0.93
            # Day 30: weight = 0.74
            days_old = 0  # Assuming current feedback
            temporal_weight = self.temporal_decay_rate ** days_old
            decayed_rewards[feature] = reward * temporal_weight

        return decayed_rewards

    def _monitor_performance(
        self, model_id: str, feedback_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Monitor model performance based on feedback.

        Args:
            model_id: Model identifier
            feedback_items: User feedback items

        Returns:
            Performance tracking data
        """
        acceptance_rate = self._calculate_acceptance_rate(feedback_items)
        completion_rate = self._calculate_completion_rate(feedback_items)

        # Track performance over time
        timestamp = datetime.now().isoformat()

        if model_id not in self.performance_tracking:
            self.performance_tracking[model_id] = []

        self.performance_tracking[model_id].append(
            {
                "timestamp": timestamp,
                "acceptance_rate": acceptance_rate,
                "completion_rate": completion_rate,
                "feedback_count": len(feedback_items),
            }
        )

        # Detect performance degradation
        performance_trend = self._analyze_performance_trend(model_id)

        return {
            "acceptance_rate": acceptance_rate,
            "completion_rate": completion_rate,
            "trend": performance_trend,
        }

    def _calculate_acceptance_rate(self, feedback_items: List[Dict[str, Any]]) -> float:
        """Calculate percentage of accepted recommendations."""
        if not feedback_items:
            return 0.0

        accepted = sum(1 for f in feedback_items if f.get("action") == "accept")
        return accepted / len(feedback_items)

    def _calculate_completion_rate(self, feedback_items: List[Dict[str, Any]]) -> float:
        """Calculate percentage of completed recommendations."""
        if not feedback_items:
            return 0.0

        completed = sum(1 for f in feedback_items if f.get("completed", False))
        return completed / len(feedback_items)

    def _analyze_performance_trend(self, model_id: str) -> str:
        """
        Analyze performance trend for a model.

        Returns: "improving", "stable", "degrading"
        """
        if model_id not in self.performance_tracking or len(self.performance_tracking[model_id]) < 2:
            return "unknown"

        recent = self.performance_tracking[model_id][-10:]  # Last 10 records

        if len(recent) < 2:
            return "unknown"

        acceptance_rates = [r["acceptance_rate"] for r in recent]
        first_half_avg = np.mean(acceptance_rates[: len(acceptance_rates) // 2])
        second_half_avg = np.mean(acceptance_rates[len(acceptance_rates) // 2 :])

        difference = second_half_avg - first_half_avg
        threshold = 0.05  # 5% change threshold

        if difference > threshold:
            return "improving"
        elif difference < -threshold:
            return "degrading"
        else:
            return "stable"

    def compare_models(
        self, new_model: Dict[str, Any], old_model: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare new vs old model performance.

        Args:
            new_model: New model metrics
            old_model: Old model metrics

        Returns:
            Comparison results and recommendation
        """
        new_score = new_model.get("personalization_score", 0)
        old_score = old_model.get("personalization_score", 0)
        improvement = new_score - old_score
        improvement_pct = (improvement / old_score * 100) if old_score > 0 else 0

        threshold = 2  # 2% improvement required
        should_deploy = improvement_pct >= threshold

        logger.info(
            f"Model comparison - New: {new_score:.2f}, Old: {old_score:.2f}, "
            f"Improvement: {improvement_pct:.2f}%, Deploy: {should_deploy}"
        )

        return {
            "new_score": new_score,
            "old_score": old_score,
            "improvement": improvement,
            "improvement_percentage": improvement_pct,
            "threshold": threshold,
            "should_deploy": should_deploy,
            "recommendation": "deploy" if should_deploy else "rollback",
        }

    def rollback_model(
        self, current_model_id: str, previous_model_id: str
    ) -> Dict[str, Any]:
        """
        Rollback to previous model version.

        Args:
            current_model_id: Current model to rollback from
            previous_model_id: Previous model to restore

        Returns:
            Rollback confirmation
        """
        logger.warning(
            f"Rolling back model from {current_model_id} to {previous_model_id}"
        )

        return {
            "status": "rollback_completed",
            "rolled_back_from": current_model_id,
            "rolled_back_to": previous_model_id,
            "timestamp": datetime.now().isoformat(),
        }

    def get_model_update_status(self, model_id: str) -> Dict[str, Any]:
        """
        Get current update status for a model.

        Args:
            model_id: Model identifier

        Returns:
            Update status and next recommended action
        """
        if model_id not in self.performance_tracking:
            return {"status": "unknown", "history": []}

        history = self.performance_tracking[model_id]

        if not history:
            return {"status": "no_data", "history": []}

        latest = history[-1]
        trend = self._analyze_performance_trend(model_id)

        return {
            "model_id": model_id,
            "latest_metrics": latest,
            "trend": trend,
            "total_records": len(history),
            "recommendation": self._get_recommendation(trend, latest),
        }

    def _get_recommendation(self, trend: str, latest_metrics: Dict[str, Any]) -> str:
        """Get recommendation based on performance trend."""
        acceptance = latest_metrics.get("acceptance_rate", 0.5)

        if trend == "degrading" or acceptance < 0.5:
            return "retrain_model"
        elif trend == "improving":
            return "continue_current_model"
        else:
            return "monitor"
