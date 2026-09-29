"""Script to generate test training data and train a model for testing."""

import requests
import json
from datetime import datetime, timedelta
import random

# Configuration
ML_SERVICE_URL = "http://localhost:5001"
TEST_USER_ID = "test-user-123"

def generate_training_data(num_days=35):
    """Generate realistic training data for testing."""
    training_data = []
    base_date = datetime.now() - timedelta(days=num_days)
    
    workout_types = ["cardio", "strength", "yoga", "pilates", "swimming", "cycling"]
    meal_types = ["breakfast", "lunch", "dinner", "snack"]
    moods = [1, 2, 3, 4, 5]
    
    for day in range(num_days):
        current_date = base_date + timedelta(days=day)
        
        # Workout data (3-4 times per week)
        if random.random() > 0.4:
            training_data.append({
                "type": "workout",
                "timestamp": current_date.isoformat(),
                "duration": random.randint(20, 60),
                "intensity": random.choice(["low", "moderate", "high"]),
                "workout_type": random.choice(workout_types),
                "label": random.choice([0, 1])  # 0 = not accepted, 1 = accepted
            })
        
        # Meal data (3 times per day)
        for _ in range(3):
            training_data.append({
                "type": "meal",
                "timestamp": current_date.isoformat(),
                "meal_type": random.choice(meal_types),
                "calories": random.randint(300, 800),
                "label": random.choice([0, 1])
            })
        
        # Sleep data (daily)
        training_data.append({
            "type": "sleep",
            "timestamp": current_date.isoformat(),
            "duration": random.randint(5, 10),
            "quality": random.choice(["poor", "fair", "good", "excellent"]),
            "label": random.choice([0, 1])
        })
        
        # Mood data (daily)
        training_data.append({
            "type": "mood",
            "timestamp": current_date.isoformat(),
            "mood_level": random.choice(moods),
            "label": random.choice([0, 1])
        })
    
    return training_data

def train_model():
    """Train a model using the ML service."""
    print(f"Generating training data for user {TEST_USER_ID}...")
    training_data = generate_training_data(num_days=35)
    print(f"Generated {len(training_data)} training data points")
    
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
    print(f"\nGetting recommendations for user {TEST_USER_ID}...")
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
    print(f"\nTesting chatbot service...")
    
    # Start conversation
    print("Starting conversation...")
    try:
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
        print("Sending message to chatbot...")
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
    print("Self-Trained AI System - Test Model Training")
    print("=" * 60)
    
    # Train model
    if train_model():
        # Get recommendations
        get_recommendations()
        
        # Test chatbot
        test_chatbot()
    
    print("\n" + "=" * 60)
    print("Testing complete!")
    print("=" * 60)
