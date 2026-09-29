"""User Profile Repository for persistence."""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from pymongo import ASCENDING, DESCENDING
from config.settings import Settings
from utils.db_connection import MongoDBConnection

logger = logging.getLogger(__name__)


class UserProfileRepository:
    """Repository for user profile persistence."""

    def __init__(self):
        """Initialize repository."""
        self.db = MongoDBConnection.get_database()
        self.collection = self.db[Settings.USER_PROFILE_COLLECTION]

    def save(self, profile: Dict[str, Any]) -> Optional[str]:
        """
        Save user profile.
        
        Args:
            profile: User profile dictionary
            
        Returns:
            Inserted/updated document ID, or None if failed
        """
        try:
            user_id = profile.get("user_id")
            if not user_id:
                logger.error("User ID is required")
                return None
            
            # Use replace_one with upsert to save or update
            result = self.collection.replace_one(
                {"user_id": user_id},
                profile,
                upsert=True
            )
            
            logger.info(f"Saved user profile for user {user_id}")
            return user_id
        except Exception as e:
            logger.error(f"Error saving user profile: {e}")
            return None

    def find_by_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Find user profile by user ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User profile document, or None if not found
        """
        try:
            profile = self.collection.find_one({"user_id": user_id})
            if profile:
                logger.info(f"Found user profile for user {user_id}")
            else:
                logger.info(f"User profile not found for user {user_id}")
            return profile
        except Exception as e:
            logger.error(f"Error finding user profile for user {user_id}: {e}")
            return None

    def update(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update user profile.
        
        Args:
            user_id: User ID
            updates: Dictionary of fields to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Add updated_at timestamp
            updates["updated_at"] = datetime.utcnow()
            
            result = self.collection.update_one(
                {"user_id": user_id},
                {"$set": updates}
            )
            
            if result.matched_count > 0:
                logger.info(f"Updated user profile for user {user_id}")
                return True
            else:
                logger.warning(f"User profile not found for user {user_id}")
                return False
        except Exception as e:
            logger.error(f"Error updating user profile for user {user_id}: {e}")
            return False

    def delete_by_user(self, user_id: str) -> bool:
        """
        Delete user profile.
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.collection.delete_one({"user_id": user_id})
            if result.deleted_count > 0:
                logger.info(f"Deleted user profile for user {user_id}")
                return True
            else:
                logger.warning(f"User profile not found for user {user_id}")
                return False
        except Exception as e:
            logger.error(f"Error deleting user profile for user {user_id}: {e}")
            return False

    def find_trained_models(self) -> List[Dict[str, Any]]:
        """
        Find all users with trained models.
        
        Returns:
            List of user profiles with trained models
        """
        try:
            profiles = list(self.collection.find({"model_status": "trained"}))
            logger.info(f"Found {len(profiles)} users with trained models")
            return profiles
        except Exception as e:
            logger.error(f"Error finding trained models: {e}")
            return []

    def find_by_cold_start_phase(self, phase: str) -> List[Dict[str, Any]]:
        """
        Find users in a specific cold start phase.
        
        Args:
            phase: Cold start phase (new, early, warm, mature)
            
        Returns:
            List of user profiles
        """
        try:
            profiles = list(self.collection.find({"cold_start_phase": phase}))
            logger.info(f"Found {len(profiles)} users in {phase} cold start phase")
            return profiles
        except Exception as e:
            logger.error(f"Error finding users by cold start phase: {e}")
            return []

    def find_needing_retraining(self, accuracy_threshold: float = 0.6) -> List[Dict[str, Any]]:
        """
        Find users whose models need retraining.
        
        Args:
            accuracy_threshold: Accuracy threshold for retraining
            
        Returns:
            List of user profiles needing retraining
        """
        try:
            profiles = list(self.collection.find({
                "$or": [
                    {"model_accuracy": {"$lt": accuracy_threshold}},
                    {"total_feedback_count": {"$gt": 50}}
                ]
            }))
            logger.info(f"Found {len(profiles)} users needing retraining")
            return profiles
        except Exception as e:
            logger.error(f"Error finding users needing retraining: {e}")
            return []

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about all user profiles.
        
        Returns:
            Dictionary with statistics
        """
        try:
            total_users = self.collection.count_documents({})
            trained_users = self.collection.count_documents({"model_status": "trained"})
            
            stats = {
                "total_users": total_users,
                "trained_users": trained_users,
                "untrained_users": total_users - trained_users,
            }
            
            logger.info(f"User profile statistics: {stats}")
            return stats
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}
