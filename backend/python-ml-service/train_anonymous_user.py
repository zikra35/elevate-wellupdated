"""Train model for anonymous user to test frontend."""

import csv
import requests
import json
from pathlib import Path

# Configuration
ML_SERVICE_URL = "http://localhost:5001"
TEST_USER_ID = "anonymous"  # Default user ID when not authenticated
CSV_FILE = "fitness-training-data.csv"

def load_csv_data(csv_path):
    """Load training data from CSV file."""
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

def train_model(user_id, training_data):
    """Train a model using the ML service."""
    print(f"\n{'='*60}")
    print(f"Training model for user: {user_id}")
    print(f"Total training data points: {len(training_data)}")
    print(f"{'='*60}")
    
    payload = {
        "user_id": user_id,
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
            print(f"User ID: {user_id}")
            print(f"Status: {result.get('status')}")
            return True
        else:
            print(f"\n❌ Training failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def get_recommendations(user_id):
    """Get recommendations for the trained model."""
    print(f"\nGetting recommendations for user {user_id}...")
    try:
        response = requests.get(
            f"{ML_SERVICE_URL}/api/ml/recommendations/{user_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Recommendations retrieved!")
            print(f"Number of recommendations: {len(result.get('recommendations', []))}")
            for rec in result.get('recommendations', [])[:3]:
                print(f"  - {rec.get('text')} (confidence: {rec.get('confidence')})")
            return True
        else:
            print(f"\n❌ Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Train Model for Anonymous User (Frontend Testing)")
    print("=" * 60)
    
    # Check if CSV file exists
    if not Path(CSV_FILE).exists():
        print(f"❌ CSV file not found: {CSV_FILE}")
        exit(1)
    
    # Load data from CSV
    print(f"\nLoading data from {CSV_FILE}...")
    training_data = load_csv_data(CSV_FILE)
    print(f"✅ Loaded {len(training_data)} data points")
    
    # Train model for anonymous user
    if train_model(TEST_USER_ID, training_data):
        # Get recommendations
        get_recommendations(TEST_USER_ID)
        
        print(f"\n{'='*60}")
        print("✅ Ready! Refresh the frontend to see personalized suggestions")
        print(f"{'='*60}")
    else:
        print(f"\n{'='*60}")
        print("❌ Training failed")
        print(f"{'='*60}")
