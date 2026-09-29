"""Supervised learning model trainer for self-trained AI system."""

import numpy as np
import pickle
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import cross_val_score, train_test_split, cross_validate
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

logger = logging.getLogger(__name__)


class SupervisedLearningEngine:
    """Train and evaluate supervised learning models using Random Forest."""

    def __init__(self, n_trees: int = 100, max_depth: int = 10):
        """
        Initialize supervised learning engine.

        Args:
            n_trees: Number of trees in Random Forest
            max_depth: Maximum depth of trees
        """
        self.n_trees = n_trees
        self.max_depth = max_depth
        self.model = None
        self.feature_names = []
        self.metrics = {}

    def train_model(
        self,
        feature_vectors: np.ndarray,
        labels: np.ndarray,
        feature_names: List[str],
        model_id: str = None,
    ) -> Dict[str, Any]:
        """
        Train Random Forest model with cross-validation.

        Args:
            feature_vectors: Shape (n_samples, n_features)
            labels: Shape (n_samples,) - target labels
            feature_names: List of feature dimension names
            model_id: Model identifier for tracking

        Returns:
            Dict with training results and metrics
        """
        if len(feature_vectors) < 30:
            logger.warning(f"Insufficient training data: {len(feature_vectors)} samples (need 30+)")
            return {"error": "insufficient_data", "samples": len(feature_vectors)}

        self.feature_names = feature_names

        # Split data: 70% train, 15% validation, 15% test
        X_temp, X_test, y_temp, y_test = train_test_split(
            feature_vectors, labels, test_size=0.15, random_state=42
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=15 / 85, random_state=42
        )

        logger.info(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

        # Determine if classification or regression
        unique_labels = len(np.unique(labels))
        is_classification = unique_labels <= 10

        # Train Random Forest
        if is_classification:
            self.model = RandomForestClassifier(
                n_estimators=self.n_trees,
                max_depth=self.max_depth,
                random_state=42,
                n_jobs=-1,
            )
        else:
            self.model = RandomForestRegressor(
                n_estimators=self.n_trees,
                max_depth=self.max_depth,
                random_state=42,
                n_jobs=-1,
            )

        # Train model
        self.model.fit(X_train, y_train)
        logger.info("Model training completed")

        # Evaluate on all sets
        train_metrics = self._evaluate_predictions(
            self.model.predict(X_train), y_train, "train", is_classification
        )
        val_metrics = self._evaluate_predictions(
            self.model.predict(X_val), y_val, "validation", is_classification
        )
        test_metrics = self._evaluate_predictions(
            self.model.predict(X_test), y_test, "test", is_classification
        )

        # 5-fold cross-validation
        cv_metrics = self._perform_cross_validation(X_train, y_train, is_classification)

        # Calculate personalization score
        personalization_score = self._calculate_personalization_score(
            test_metrics, cv_metrics, is_classification
        )

        # Feature importance
        feature_importance = self._get_feature_importance()

        # Compile results
        self.metrics = {
            "model_id": model_id or f"model_{datetime.now().timestamp()}",
            "timestamp": datetime.now().isoformat(),
            "is_classification": is_classification,
            "train_metrics": train_metrics,
            "val_metrics": val_metrics,
            "test_metrics": test_metrics,
            "cv_metrics": cv_metrics,
            "personalization_score": personalization_score,
            "feature_importance": feature_importance,
            "data_split": {"train": len(X_train), "val": len(X_val), "test": len(X_test)},
        }

        logger.info(f"Personalization Score: {personalization_score:.2f}")

        return self.metrics

    def _evaluate_predictions(
        self, predictions: np.ndarray, actuals: np.ndarray, set_name: str, is_classification: bool
    ) -> Dict[str, float]:
        """
        Evaluate model predictions.

        Args:
            predictions: Model predictions
            actuals: True labels
            set_name: Name of dataset (train/val/test)
            is_classification: Whether it's classification task

        Returns:
            Dict with evaluation metrics
        """
        metrics = {}

        if is_classification:
            metrics["accuracy"] = accuracy_score(actuals, predictions)
            metrics["precision"] = precision_score(actuals, predictions, average="weighted", zero_division=0)
            metrics["recall"] = recall_score(actuals, predictions, average="weighted", zero_division=0)
            metrics["f1_score"] = f1_score(actuals, predictions, average="weighted", zero_division=0)

            # AUC-ROC for binary classification
            if len(np.unique(actuals)) == 2:
                try:
                    metrics["auc_roc"] = roc_auc_score(actuals, predictions)
                except Exception as e:
                    logger.warning(f"Could not calculate AUC-ROC: {e}")
                    metrics["auc_roc"] = 0.5
        else:
            # Regression metrics
            mse = np.mean((predictions - actuals) ** 2)
            rmse = np.sqrt(mse)
            mae = np.mean(np.abs(predictions - actuals))
            r2 = 1 - (np.sum((actuals - predictions) ** 2) / np.sum((actuals - np.mean(actuals)) ** 2))

            metrics["mse"] = mse
            metrics["rmse"] = rmse
            metrics["mae"] = mae
            metrics["r2_score"] = r2

        logger.info(f"{set_name.upper()} Metrics: {metrics}")

        return metrics

    def _perform_cross_validation(self, X: np.ndarray, y: np.ndarray, is_classification: bool) -> Dict[str, Any]:
        """
        Perform 5-fold cross-validation.

        Args:
            X: Feature matrix
            y: Target labels
            is_classification: Whether it's classification task

        Returns:
            Dict with cross-validation results
        """
        scoring = ["accuracy", "precision_weighted", "recall_weighted", "f1_weighted"]

        if not is_classification:
            scoring = ["r2", "neg_mean_squared_error"]

        try:
            cv_results = cross_validate(self.model, X, y, cv=5, scoring=scoring, n_jobs=-1)

            # Average scores
            avg_scores = {}
            for key, values in cv_results.items():
                if key.startswith("test_"):
                    metric_name = key.replace("test_", "")
                    avg_scores[metric_name] = {
                        "mean": float(np.mean(values)),
                        "std": float(np.std(values)),
                    }

            logger.info(f"Cross-validation results: {avg_scores}")
            return avg_scores

        except Exception as e:
            logger.error(f"Cross-validation failed: {e}")
            return {}

    def _calculate_personalization_score(
        self, test_metrics: Dict[str, float], cv_metrics: Dict[str, Any], is_classification: bool
    ) -> float:
        """
        Calculate overall personalization score (0-100).

        Combines F1-score, AUC-ROC, and model stability.

        Args:
            test_metrics: Test set metrics
            cv_metrics: Cross-validation metrics
            is_classification: Whether it's classification task

        Returns:
            Personalization score 0-100
        """
        scores = []

        if is_classification:
            # F1-score (0-1 -> 0-33 points)
            f1 = test_metrics.get("f1_score", 0)
            scores.append(f1 * 33)

            # AUC-ROC (0-1 -> 0-33 points)
            auc = test_metrics.get("auc_roc", 0.5)
            scores.append(auc * 33)

            # Accuracy (0-1 -> 0-34 points)
            acc = test_metrics.get("accuracy", 0)
            scores.append(acc * 34)
        else:
            # R2 score for regression
            r2 = max(0, test_metrics.get("r2_score", 0))
            scores.append(r2 * 50)

            # Inverse of RMSE error
            rmse = test_metrics.get("rmse", 0)
            error_score = max(0, (1 - rmse / 10) * 50)
            scores.append(error_score)

        # Add stability bonus from CV consistency
        if cv_metrics:
            for metric_name, metric_data in cv_metrics.items():
                if isinstance(metric_data, dict) and "std" in metric_data:
                    stability = 1 - min(1, metric_data["std"])
                    scores.append(stability * 5)

        final_score = min(100, np.mean(scores)) if scores else 0
        return float(final_score)

    def _get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance from trained model.

        Returns:
            Dict mapping feature names to importance scores
        """
        if not self.model or not hasattr(self.model, "feature_importances_"):
            return {}

        importances = self.model.feature_importances_
        importance_dict = {}

        for name, importance in zip(self.feature_names, importances):
            importance_dict[name] = float(importance)

        # Sort by importance
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))

    def save_model(self, filepath: str) -> bool:
        """
        Save trained model to disk.

        Args:
            filepath: Path to save model

        Returns:
            True if successful
        """
        try:
            with open(filepath, "wb") as f:
                pickle.dump(
                    {
                        "model": self.model,
                        "feature_names": self.feature_names,
                        "metrics": self.metrics,
                        "n_trees": self.n_trees,
                        "max_depth": self.max_depth,
                    },
                    f,
                )
            logger.info(f"Model saved to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            return False

    def load_model(self, filepath: str) -> bool:
        """
        Load trained model from disk.

        Args:
            filepath: Path to model file

        Returns:
            True if successful
        """
        try:
            with open(filepath, "rb") as f:
                data = pickle.load(f)
                self.model = data["model"]
                self.feature_names = data["feature_names"]
                self.metrics = data["metrics"]
                self.n_trees = data["n_trees"]
                self.max_depth = data["max_depth"]
            logger.info(f"Model loaded from {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False

    def predict(self, feature_vector: np.ndarray) -> Dict[str, Any]:
        """
        Make predictions on new data.

        Args:
            feature_vector: Single feature vector or batch

        Returns:
            Dict with predictions and confidence
        """
        if self.model is None:
            return {"error": "model_not_trained"}

        try:
            if len(feature_vector.shape) == 1:
                feature_vector = feature_vector.reshape(1, -1)

            predictions = self.model.predict(feature_vector)

            # Get prediction probabilities if available
            confidence = None
            if hasattr(self.model, "predict_proba"):
                proba = self.model.predict_proba(feature_vector)
                confidence = float(np.max(proba))

            return {
                "predictions": predictions.tolist(),
                "confidence": confidence,
                "feature_names": self.feature_names,
            }
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return {"error": str(e)}
