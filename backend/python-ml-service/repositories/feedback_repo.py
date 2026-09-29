"""Feedback Repository for persistence."""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from pymongo import ASCENDING, DESCENDING
from config.settings import Settings
from utils.db_connection import MongoDBConnection

logger = logging.getLogger(__name__)


class FeedbackRepository:
    """Repository for feedback persistence."""

    def __init__(self):
        """Initialize repository."""
        self.db = MongoDBConnection.get_database()
        self.collection = self.db[Settings.FEEDBACK_COLLECTION]

    def save(self, feedback: Dict[str, Any]) -> Optional[str]:
        """
        Save feedback.
        
        Args:
            feedback: Feedback dictionary
            
        Returns:
            Inserted document ID, or None if failed
        """
        try:
            result = self.collection.insert_one(feedback)
            logger.info(f"Saved feedback: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving feedback: {e}")
            return None

    def find_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Find all feedback for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of feedback documents
        """
        try:
            query = {"user_id": user_id}
            feedback_list = list(self.collection.find(query).sort("created_at", DESCENDING))
            logger.info(f"Found {len(feedback_list)} feedback items for user {user_id}")
            return feedback_list
        except Exception as e:
            logger.error(f"Error finding feedback for user {user_id}: {e}")
            return []

    def find_by_recommendation(self, recommendation_id: str) -> List[Dict[str, Any]]:
        """
        Find all feedback for a recommendation.
        
        Args:
            recommendation_id: Recommendation ID
            
        Returns:
            List of feedback documents
        """
        try:
            query = {"recommendation_id": recommendation_id}
            feedback_list = list(self.collection.find(query).sort("created_at", DESCENDING))
            logger.info(f"Found {len(feedback_list)} feedback items for recommendation {recommendation_id}")
            return feedback_list
        except Exception as e:
            logger.error(f"Error finding feedback for recommendation {recommendation_id}: {e}")
            return []

    def find_by_type(self, user_id: str, feedback_type: str) -> List[Dict[str, Any]]:
        """
        Find feedback of a specific type for a user.
        
        Args:
            user_id: User ID
            feedback_type: Type of feedback
            
        Returns:
            List of feedback documents
        """
        try:
            query = {"user_id": user_id, "feedback_type": feedback_type}
            feedback_list = list(self.collection.find(query).sort("created_at", DESCENDING))
            logger.info(f"Found {len(feedback_list)} {feedback_type} feedback items for user {user_id}")
            return feedback_list
        except Exception as e:
            logger.error(f"Error finding feedback by type: {e}")
            return []

    def find_by_date_range(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Find feedback within a date range.
        
        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date
            
        Returns:
            List of feedback documents
        """
        try:
            query = {
                "user_id": user_id,
                "created_at": {"$gte": start_date, "$lte": end_date}
            }
            feedback_list = list(self.collection.find(query).sort("created_at", DESCENDING))
            logger.info(f"Found {len(feedback_list)} feedback items for user {user_id} in date range")
            return feedback_list
        except Exception as e:
            logger.error(f"Error finding feedback by date range: {e}")
            return []

    def count_by_user(self, user_id: str) -> int:
        """
        Count feedback items for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of feedback items
        """
        try:
            count = self.collection.count_documents({"user_id": user_id})
            return count
        except Exception as e:
            logger.error(f"Error counting feedback for user {user_id}: {e}")
            return 0

    def count_by_type(self, user_id: str, feedback_type: str) -> int:
        """
        Count feedback items of a specific type for a user.
        
        Args:
            user_id: User ID
            feedback_type: Type of feedback
            
        Returns:
            Number of feedback items
        """
        try:
            count = self.collection.count_documents({
                "user_id": user_id,
                "feedback_type": feedback_type
            })
            return count
        except Exception as e:
            logger.error(f"Error counting feedback by type: {e}")
            return 0

    def get_acceptance_rate(self, user_id: str) -> float:
        """
        Calculate acceptance rate for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Acceptance rate (0-1)
        """
        try:
            total = self.count_by_user(user_id)
            if total == 0:
                return 0.5
            
            positive = self.count_by_type(user_id, "positive")
            acceptance_rate = positive / total
            
            logger.info(f"Acceptance rate for user {user_id}: {acceptance_rate}")
            return acceptance_rate
        except Exception as e:
            logger.error(f"Error calculating acceptance rate for user {user_id}: {e}")
            return 0.5

    def delete_by_user(self, user_id: str) -> int:
        """
        Delete all feedback for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of documents deleted
        """
        try:
            result = self.collection.delete_many({"user_id": user_id})
            logger.info(f"Deleted {result.deleted_count} feedback documents for user {user_id}")
            return result.deleted_count
        except Exception as e:
            logger.error(f"Error deleting feedback for user {user_id}: {e}")
            return 0

    def get_recent_feedback(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get recent feedback for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of items to return
            
        Returns:
            List of feedback documents
        """
        try:
            query = {"user_id": user_id}
            feedback_list = list(
                self.collection.find(query)
                .sort("created_at", DESCENDING)
                .limit(limit)
            )
            logger.info(f"Found {len(feedback_list)} recent feedback items for user {user_id}")
            return feedback_list
        except Exception as e:
            logger.error(f"Error getting recent feedback for user {user_id}: {e}")
            return []
