"""Script to train model from CSV data."""

import csv
import requests
import json
from pathlib import Path

# Configuration
ML_SERVICE_URL = "http://localhost:5001"
TEST_USER_ID = "test-user-123"
CSV_FILE = "fitness-training-data.csv"

def load_csv_data(csv_path):
    """Load training data from CSV file."""
    training_data = []
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip empty rows
            if not row.get('type'):
                continue
            
            # Build data entry based on type
            entry = {
                "type": row['type'],
                "timestamp": row['timestamp'],
                "label": int(row['label']) if row['label'] else 0
            }
            
            # Add type-specific fields
            if row['type'] == 'workout':
                entry['duration'] = int(row['duration']) if row['duration'] else 0
                entry['intensity'] = row['intensity'] if row['intensity'] else 'moderate'
                entry['workout_type'] = row['workout_type'] if row['workout_type'] else 'cardio'
            
            elif row['type'] == 'meal':
                entry['calories'] = int(row['calories']) if row['calories'] else 0
                entry['meal_type'] = row['meal_type'] if row['meal_type'] else 'lunch'
            
            elif row['type'] == 'sleep':
                entry['duration'] = float(row['sleep_duration']) if row['sleep_duration'] else 0
                entry['quality'] = row['sleep_quality'] if row['sleep_quality'] else 'fair'
            
            elif row['type'] == 'mood':
                entry['mood_level'] = int(row['mood_level']) if row['mood_level'] else 3
            
            elif row['type'] == 'cycle':
                entry['phase'] = row['cycle_phase'] if row['cycle_phase'] else 'menstrual'
            
            training_data.append(entry)
    
    return training_data

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
    print("Self-Trained AI System - Train Model from CSV")
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
