"""Simple training script that bypasses feature extraction issues."""

import csv
import requests
import json
import numpy as np
from pathlib import Path

# Configuration
ML_SERVICE_URL = "http://localhost:5001"
TEST_USER_ID = "test-user-123"
CSV_FILE = "fitness-training-data.csv"

def load_csv_data(csv_path):
    """Load training data from CSV file and convert to numeric features."""
    training_data = []
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get('type'):
                continue
            
            entry = {
                "type": row['type'],
                "timestamp": row['timestamp'],
                "label": int(row['label']) if row['label'] else 0
            }
            
            # Convert all numeric fields to float
            if row['type'] == 'workout':
                entry['duration'] = float(row['duration']) if row['duration'] else 0.0
                entry['intensity'] = row['intensity'] if row['intensity'] else 'moderate'
                entry['workout_type'] = row['workout_type'] if row['workout_type'] else 'cardio'
            
            elif row['type'] == 'meal':
                entry['calories'] = float(row['calories']) if row['calories'] else 0.0
                entry['meal_type'] = row['meal_type'] if row['meal_type'] else 'lunch'
            
            elif row['type'] == 'sleep':
                entry['duration'] = float(row['sleep_duration']) if row['sleep_duration'] else 0.0
                entry['quality'] = row['sleep_quality'] if row['sleep_quality'] else 'fair'
            
            elif row['type'] == 'mood':
                entry['mood_level'] = float(row['mood_level']) if row['mood_level'] else 3.0
            
            elif row['type'] == 'cycle':
                entry['phase'] = row['cycle_phase'] if row['cycle_phase'] else 'menstrual'
            
            training_data.append(entry)
    
    return training_data

def create_numeric_features(training_data):
    """Create numeric feature vectors from training data."""
    features = []
    labels = []
    
    # Map categorical values to numbers
    intensity_map = {"low": 1, "moderate": 2, "high": 3}
    quality_map = {"poor": 1, "fair": 2, "good": 3, "excellent": 4}
    phase_map = {"menstrual": 1, "follicular": 2, "ovulation": 3, "luteal": 4}
    workout_map = {"cardio": 1, "strength": 2, "yoga": 3, "pilates": 4, "swimming": 5, "cycling": 6}
    meal_map = {"breakfast": 1, "lunch": 2, "dinner": 3, "snack": 4}
    
    for data in training_data:
        feature_vector = []
        
        if data['type'] == 'workout':
            feature_vector = [
                1.0,  # is_workout
                data.get('duration', 0.0) / 120.0,  # normalize duration
                intensity_map.get(data.get('intensity', 'moderate'), 2) / 3.0,
                workout_map.get(data.get('workout_type', 'cardio'), 1) / 6.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
            ]
        elif data['type'] == 'meal':
            feature_vector = [
                0.0,  # not_workout
                0.0,
                0.0,
                0.0,
                data.get('calories', 0.0) / 1000.0,  # normalize calories
                meal_map.get(data.get('meal_type', 'lunch'), 2) / 4.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
            ]
        elif data['type'] == 'sleep':
            feature_vector = [
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                data.get('duration', 0.0) / 12.0,  # normalize sleep duration
                quality_map.get(data.get('quality', 'fair'), 2) / 4.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
            ]
        elif data['type'] == 'mood':
            feature_vector = [
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                data.get('mood_level', 3.0) / 5.0,  # normalize mood
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
            ]
        elif data['type'] == 'cycle':
            feature_vector = [
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                phase_map.get(data.get('phase', 'menstrual'), 1) / 4.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0
            ]
        
        if feature_vector:
            features.append(feature_vector)
            labels.append(data['label'])
    
    return np.array(features), np.array(labels)

def train_model(training_data):
    """Train a model using the ML service."""
    print(f"Training model for user {TEST_USER_ID}...")
    print(f"Total training data points: {len(training_data)}")
    
    payload = {
        "user_id": TEST_USER_ID,
        "training_data": training_data
    }
    
    print(f"\nSending training request to {ML_SERVICE_URL}/api/ml/train...")
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/api/ml/train",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Model trained successfully!")
            print(f"Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"\n❌ Training failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def get_recommendations():
    """Get recommendations for the trained model."""
    print(f"\n{'='*60}")
    print(f"Getting recommendations for user {TEST_USER_ID}...")
    try:
        response = requests.get(
            f"{ML_SERVICE_URL}/api/ml/recommendations/{TEST_USER_ID}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Recommendations retrieved!")
            print(f"Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"\n❌ Failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def test_chatbot():
    """Test the chatbot service."""
    print(f"\n{'='*60}")
    print(f"Testing chatbot service...")
    
    try:
        # Start conversation
        print("Starting conversation...")
        response = requests.post(
            f"{ML_SERVICE_URL}/api/chat/start",
            json={"user_id": TEST_USER_ID, "mode": "free_form"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to start conversation: {response.text}")
            return False
        
        conv_data = response.json()
        conversation_id = conv_data.get("conversation_id")
        print(f"✅ Conversation started: {conversation_id}")
        
        # Send message
        print("\nSending message to chatbot...")
        response = requests.post(
            f"{ML_SERVICE_URL}/api/chat/message/{conversation_id}",
            json={
                "user_id": TEST_USER_ID,
                "message": "I'm feeling stressed about work and need some calming advice"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Chatbot response received!")
            print(f"Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Failed to get response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Self-Trained AI System - Train Model from CSV (Simple)")
    print("=" * 60)
    
    # Check if CSV file exists
    if not Path(CSV_FILE).exists():
        print(f"❌ CSV file not found: {CSV_FILE}")
        exit(1)
    
    # Load data from CSV
    print(f"\nLoading data from {CSV_FILE}...")
    training_data = load_csv_data(CSV_FILE)
    print(f"✅ Loaded {len(training_data)} data points")
    
    # Train model
    if train_model(training_data):
        # Get recommendations
        get_recommendations()
        
        # Test chatbot
        test_chatbot()
    
    print("\n" + "=" * 60)
    print("Testing complete!")
    print("=" * 60)
