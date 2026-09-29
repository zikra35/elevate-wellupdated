"""Training Data Repository for persistence."""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from pymongo import ASCENDING, DESCENDING
from config.settings import Settings
from utils.db_connection import MongoDBConnection

logger = logging.getLogger(__name__)


class TrainingDataRepository:
    """Repository for training data persistence."""

    def __init__(self):
        """Initialize repository."""
        self.db = MongoDBConnection.get_database()
        self.collection = self.db[Settings.TRAINING_DATA_COLLECTION]

    def save(self, data: Dict[str, Any]) -> Optional[str]:
        """
        Save training data.
        
        Args:
            data: Training data dictionary
            
        Returns:
            Inserted document ID, or None if failed
        """
        try:
            result = self.collection.insert_one(data)
            logger.info(f"Saved training data: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving training data: {e}")
            return None

    def find_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Find all training data for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of training data documents
        """
        try:
            query = {"userId": user_id}
            data_list = list(self.collection.find(query).sort("timestamp", DESCENDING))
            logger.info(f"Found {len(data_list)} training data points for user {user_id}")
            return data_list
        except Exception as e:
            logger.error(f"Error finding training data for user {user_id}: {e}")
            return []

    def find_by_date_range(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Find training data within a date range.
        
        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date
            
        Returns:
            List of training data documents
        """
        try:
            query = {
                "userId": user_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }
            data_list = list(self.collection.find(query).sort("timestamp", DESCENDING))
            logger.info(f"Found {len(data_list)} training data points for user {user_id} in date range")
            return data_list
        except Exception as e:
            logger.error(f"Error finding training data by date range: {e}")
            return []

    def find_by_type(self, user_id: str, data_type: str) -> List[Dict[str, Any]]:
        """
        Find training data of a specific type.
        
        Args:
            user_id: User ID
            data_type: Type of data
            
        Returns:
            List of training data documents
        """
        try:
            query = {"userId": user_id, "dataType": data_type}
            data_list = list(self.collection.find(query).sort("timestamp", DESCENDING))
            logger.info(f"Found {len(data_list)} {data_type} data points for user {user_id}")
            return data_list
        except Exception as e:
            logger.error(f"Error finding training data by type: {e}")
            return []

    def delete_by_user(self, user_id: str) -> int:
        """
        Delete all training data for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of documents deleted
        """
        try:
            result = self.collection.delete_many({"userId": user_id})
            logger.info(f"Deleted {result.deleted_count} training data documents for user {user_id}")
            return result.deleted_count
        except Exception as e:
            logger.error(f"Error deleting training data for user {user_id}: {e}")
            return 0

    def count_by_user(self, user_id: str) -> int:
        """
        Count training data points for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of training data points
        """
        try:
            count = self.collection.count_documents({"userId": user_id})
            return count
        except Exception as e:
            logger.error(f"Error counting training data for user {user_id}: {e}")
            return 0

    def get_date_range(self, user_id: str) -> Optional[Dict[str, datetime]]:
        """
        Get date range of training data for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with first_date and last_date, or None
        """
        try:
            first_doc = self.collection.find_one(
                {"userId": user_id},
                sort=[("timestamp", ASCENDING)]
            )
            last_doc = self.collection.find_one(
                {"userId": user_id},
                sort=[("timestamp", DESCENDING)]
            )
            
            if not first_doc or not last_doc:
                return None
            
            return {
                "first_date": first_doc.get("timestamp"),
                "last_date": last_doc.get("timestamp"),
            }
        except Exception as e:
            logger.error(f"Error getting date range for user {user_id}: {e}")
            return None
