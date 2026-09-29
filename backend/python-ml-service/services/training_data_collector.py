"""Training Data Collector service for Self-Trained AI System."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import pandas as pd
from pymongo import MongoClient
from config.settings import Settings
from config.constants import VALID_DATA_TYPES
from models.training_data import TrainingData
from utils.db_connection import MongoDBConnection

logger = logging.getLogger(__name__)


class TrainingDataCollector:
    """Collects and preprocesses user health data from MongoDB."""

    def __init__(self):
        """Initialize the collector."""
        self.db = MongoDBConnection.get_database()
        self.collection = self.db[Settings.TRAINING_DATA_COLLECTION]
        self.min_data_days = Settings.MIN_TRAINING_DATA_DAYS

    def collect_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Collect all training data for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with aggregated data by period
        """
        try:
            logger.info(f"Collecting training data for user {user_id}")
            
            # Query all data for user
            query = {"userId": user_id}
            data_list = list(self.collection.find(query).sort("timestamp", 1))
            
            if not data_list:
                logger.warning(f"No training data found for user {user_id}")
                return {}
            
            logger.info(f"Found {len(data_list)} data points for user {user_id}")
            
            # Convert to DataFrame for aggregation
            df = pd.DataFrame(data_list)
            
            # Aggregate by period
            aggregated = self._aggregate_by_period(df)
            
            logger.info(f"Successfully collected and aggregated data for user {user_id}")
            return aggregated
            
        except Exception as e:
            logger.error(f"Error collecting training data for user {user_id}: {e}")
            raise

    def has_sufficient_data(self, user_id: str) -> bool:
        """
        Check if user has 30+ days of data.
        
        Args:
            user_id: User ID
            
        Returns:
            True if user has sufficient data, False otherwise
        """
        try:
            # Get date range of data
            thirty_days_ago = datetime.utcnow() - timedelta(days=self.min_data_days)
            
            count = self.collection.count_documents({
                "userId": user_id,
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            has_sufficient = count >= self.min_data_days
            logger.info(f"User {user_id} has_sufficient_data: {has_sufficient} ({count} points in last {self.min_data_days} days)")
            
            return has_sufficient
            
        except Exception as e:
            logger.error(f"Error checking data sufficiency for user {user_id}: {e}")
            return False

    def get_data_date_range(self, user_id: str) -> Optional[Dict[str, datetime]]:
        """
        Get the date range of training data for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with first_date and last_date, or None if no data
        """
        try:
            # Get first data point
            first_doc = self.collection.find_one(
                {"userId": user_id},
                sort=[("timestamp", 1)]
            )
            
            # Get last data point
            last_doc = self.collection.find_one(
                {"userId": user_id},
                sort=[("timestamp", -1)]
            )
            
            if not first_doc or not last_doc:
                return None
            
            return {
                "first_date": first_doc.get("timestamp"),
                "last_date": last_doc.get("timestamp"),
                "days_of_data": (last_doc.get("timestamp") - first_doc.get("timestamp")).days,
            }
            
        except Exception as e:
            logger.error(f"Error getting data date range for user {user_id}: {e}")
            return None

    def _aggregate_by_period(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Aggregate data by time periods (daily, weekly, monthly).
        
        Args:
            df: DataFrame with training data
            
        Returns:
            Dictionary with aggregated data
        """
        try:
            if df.empty:
                return {}
            
            # Ensure timestamp is datetime
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            
            aggregated = {}
            
            # Daily aggregation
            daily_agg = df.groupby(df["timestamp"].dt.date).agg(self._aggregate_stats)
            aggregated["daily"] = daily_agg.to_dict("index") if not daily_agg.empty else {}
            
            # Weekly aggregation
            weekly_agg = df.groupby(df["timestamp"].dt.isocalendar().week).agg(self._aggregate_stats)
            aggregated["weekly"] = weekly_agg.to_dict("index") if not weekly_agg.empty else {}
            
            # Monthly aggregation
            monthly_agg = df.groupby(df["timestamp"].dt.to_period("M")).agg(self._aggregate_stats)
            aggregated["monthly"] = monthly_agg.to_dict("index") if not monthly_agg.empty else {}
            
            # Overall statistics
            aggregated["overall"] = self._aggregate_stats(df)
            
            logger.info(f"Aggregated data: {len(aggregated['daily'])} days, {len(aggregated['weekly'])} weeks, {len(aggregated['monthly'])} months")
            
            return aggregated
            
        except Exception as e:
            logger.error(f"Error aggregating data by period: {e}")
            return {}

    def _aggregate_stats(self, group: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate aggregate statistics for a group of data.
        
        Args:
            group: DataFrame group
            
        Returns:
            Dictionary with statistics
        """
        stats = {
            "count": len(group),
            "data_types": group["dataType"].unique().tolist() if "dataType" in group.columns else [],
        }
        
        # Add type-specific statistics
        if "dataType" in group.columns:
            for data_type in group["dataType"].unique():
                type_data = group[group["dataType"] == data_type]
                stats[f"{data_type}_count"] = len(type_data)
        
        return stats

    def validate_training_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate training data.
        
        Args:
            data: Training data dictionary
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Check required fields
            if "userId" not in data or "dataType" not in data or "timestamp" not in data:
                logger.warning(f"Missing required fields in training data: {data}")
                return False
            
            # Check data type is valid
            if data["dataType"] not in VALID_DATA_TYPES:
                logger.warning(f"Invalid data type: {data['dataType']}")
                return False
            
            # Check value exists
            if "value" not in data or not isinstance(data["value"], dict):
                logger.warning(f"Invalid value in training data: {data}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating training data: {e}")
            return False

    def save_training_data(self, data: Dict[str, Any]) -> Optional[str]:
        """
        Save training data to database.
        
        Args:
            data: Training data dictionary
            
        Returns:
            Inserted document ID, or None if failed
        """
        try:
            # Validate data
            if not self.validate_training_data(data):
                logger.error(f"Invalid training data: {data}")
                return None
            
            # Ensure timestamp is datetime
            if isinstance(data.get("timestamp"), str):
                data["timestamp"] = datetime.fromisoformat(data["timestamp"])
            
            # Insert into database
            result = self.collection.insert_one(data)
            logger.info(f"Saved training data for user {data['userId']}: {result.inserted_id}")
            
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error saving training data: {e}")
            return None

    def get_user_data_by_type(self, user_id: str, data_type: str) -> List[Dict[str, Any]]:
        """
        Get all data of a specific type for a user.
        
        Args:
            user_id: User ID
            data_type: Type of data
            
        Returns:
            List of data documents
        """
        try:
            query = {"userId": user_id, "dataType": data_type}
            data_list = list(self.collection.find(query).sort("timestamp", -1))
            logger.info(f"Found {len(data_list)} {data_type} data points for user {user_id}")
            return data_list
            
        except Exception as e:
            logger.error(f"Error getting {data_type} data for user {user_id}: {e}")
            return []

    def get_user_data_by_date_range(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get data for a user within a date range.
        
        Args:
            user_id: User ID
            start_date: Start date
            end_date: End date
            
        Returns:
            List of data documents
        """
        try:
            query = {
                "userId": user_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }
            data_list = list(self.collection.find(query).sort("timestamp", -1))
            logger.info(f"Found {len(data_list)} data points for user {user_id} between {start_date} and {end_date}")
            return data_list
            
        except Exception as e:
            logger.error(f"Error getting data by date range for user {user_id}: {e}")
            return []

    def delete_user_data(self, user_id: str) -> int:
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

    def get_data_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Get statistics about user's training data.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with statistics
        """
        try:
            stats = {
                "user_id": user_id,
                "total_data_points": self.collection.count_documents({"userId": user_id}),
                "data_types": {},
            }
            
            # Count by data type
            for data_type in VALID_DATA_TYPES:
                count = self.collection.count_documents({"userId": user_id, "dataType": data_type})
                if count > 0:
                    stats["data_types"][data_type] = count
            
            # Get date range
            date_range = self.get_data_date_range(user_id)
            if date_range:
                stats.update(date_range)
            
            logger.info(f"Data statistics for user {user_id}: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error getting data statistics for user {user_id}: {e}")
            return {}
