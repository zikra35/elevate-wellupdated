"""Sample training data generator for testing the AI system."""

import json
import random
from datetime import datetime, timedelta
import numpy as np


def generate_sample_training_data(days=60, user_id="test_user_001"):
    """
    Generate realistic training data across 16 personalization dimensions.

    Args:
        days: Number of days of data to generate (30-90)
        user_id: User identifier

    Returns:
        List of training data points
    """
    training_data = []
    now = datetime.now()

    # User profile to maintain consistency
    user_profile = {
        "age": random.randint(25, 45),
        "gender": random.choice(["M", "F"]),
        "favorite_workout": random.choice(["running", "yoga", "gym", "cycling", "swimming"]),
        "dietary_pref": random.choice(["omnivore", "vegetarian", "vegan", "keto"]),
        "is_morning_person": random.choice([True, False]),
        "stress_baseline": random.uniform(3, 6),
    }

    print(f"Generating {days} days of training data for {user_id}")
    print(f"User profile: {user_profile}\n")

    for day in range(days):
        timestamp = int((now - timedelta(days=days - day)).timestamp())

        # ==================== WORKOUT DATA ====================
        if random.random() > 0.3:  # 70% workout frequency
            workouts_per_day = random.randint(0, 2)
            for _ in range(workouts_per_day):
                workout_time = timestamp + random.randint(0, 86400)
                intensity = random.gauss(
                    6, 2
                )  # Mean 6, std 2 (Range 0-10)
                intensity = max(0, min(10, intensity))

                training_data.append(
                    {
                        "type": "workout",
                        "user_id": user_id,
                        "timestamp": workout_time,
                        "workout_type": random.choice(
                            [
                                "running",
                                "gym",
                                "yoga",
                                "cycling",
                                "swimming",
                                "walking",
                            ]
                        ),
                        "duration_minutes": random.randint(20, 90),
                        "intensity": intensity,
                        "is_group": random.choice([True, False]),
                        "completed": random.choice([True, True, True, False]),
                    }
                )

        # ==================== MEAL DATA ====================
        meals_per_day = random.randint(2, 4)
        for meal_num in range(meals_per_day):
            meal_hour = [7, 12, 19, 21][meal_num] if meal_num < 4 else random.randint(6, 22)
            meal_timestamp = timestamp + (meal_hour * 3600)

            meal_type_map = {
                "breakfast": ["oatmeal", "eggs", "smoothie", "toast"],
                "lunch": ["salad", "sandwich", "pasta", "rice_bowl"],
                "dinner": ["chicken", "fish", "vegetable", "steak"],
                "snack": ["fruit", "nuts", "yogurt", "chips"],
            }

            meal_times = ["breakfast", "lunch", "dinner", "snack"]
            meal_time = meal_times[min(meal_num, 3)]

            training_data.append(
                {
                    "type": "meal",
                    "user_id": user_id,
                    "timestamp": meal_timestamp,
                    "meal_time": meal_time,
                    "meal_type": random.choice(meal_type_map[meal_time]),
                    "is_vegetarian": user_profile["dietary_pref"]
                    in ["vegetarian", "vegan"],
                    "is_vegan": user_profile["dietary_pref"] == "vegan",
                    "is_gluten_free": random.choice([True, False]),
                    "is_keto": user_profile["dietary_pref"] == "keto",
                    "calories": random.randint(400, 900),
                }
            )

        # ==================== SLEEP DATA ====================
        sleep_timestamp = timestamp + (22 * 3600)
        sleep_duration = random.gauss(7.5, 0.8)  # Mean 7.5 hours, std 0.8
        sleep_duration = max(4, min(10, sleep_duration))

        training_data.append(
            {
                "type": "sleep",
                "user_id": user_id,
                "timestamp": sleep_timestamp,
                "duration_hours": sleep_duration,
                "quality": random.randint(4, 9),
                "fell_asleep_time": random.randint(22, 24),
                "woke_up_time": random.randint(6, 8),
            }
        )

        # ==================== MENTAL HEALTH DATA ====================
        mood_distribution = {
            "happy": 0.4,
            "neutral": 0.35,
            "anxious": 0.15,
            "sad": 0.07,
            "angry": 0.03,
        }
        mood = np.random.choice(
            list(mood_distribution.keys()),
            p=list(mood_distribution.values()),
        )

        stress_level = user_profile["stress_baseline"] + random.gauss(0, 1.5)
        stress_level = max(0, min(10, stress_level))

        training_data.append(
            {
                "type": "mental_health",
                "user_id": user_id,
                "timestamp": timestamp + random.randint(0, 86400),
                "mood": mood,
                "stress_level": stress_level,
                "anxiety_level": random.randint(0, 8),
                "energy_level": random.randint(3, 9),
            }
        )

        # ==================== CYCLE DATA (if applicable) ====================
        if user_profile["gender"] == "F" and random.random() > 0.3:
            cycle_day = (day % 28) + 1
            phase = "menstruation" if cycle_day <= 5 else (
                "follicular"
                if cycle_day <= 13
                else ("ovulation" if cycle_day <= 17 else "luteal")
            )

            training_data.append(
                {
                    "type": "cycle",
                    "user_id": user_id,
                    "timestamp": timestamp,
                    "cycle_day": cycle_day,
                    "phase": phase,
                    "flow_intensity": random.randint(0, 3) if phase == "menstruation" else 0,
                }
            )

        # ==================== GOAL DATA ====================
        if day % 7 == 0:  # Weekly goals
            training_data.append(
                {
                    "type": "goal",
                    "user_id": user_id,
                    "timestamp": timestamp,
                    "goal_type": random.choice(
                        ["weight_loss", "fitness", "mental_health", "nutrition"]
                    ),
                    "target": random.randint(1, 10),
                    "progress": random.randint(0, 10),
                    "completed": random.choice([True, True, False]),
                }
            )

    # ==================== FEEDBACK DATA ====================
    num_feedback_items = random.randint(20, 50)
    for _ in range(num_feedback_items):
        training_data.append(
            {
                "type": "feedback",
                "user_id": user_id,
                "timestamp": int(datetime.now().timestamp()),
                "action": random.choice(["accept", "accept", "accept", "reject", "rate"]),
                "rating": random.randint(1, 5),
                "recommendation_type": random.choice(
                    [
                        "workout_frequency",
                        "workout_intensity",
                        "sleep_duration",
                        "meal_types",
                        "stress_level",
                    ]
                ),
                "completed": random.choice([True, True, True, False]),
            }
        )

    print(f"✅ Generated {len(training_data)} data points\n")
    print("Data distribution:")
    type_counts = {}
    for item in training_data:
        dtype = item.get("type", "unknown")
        type_counts[dtype] = type_counts.get(dtype, 0) + 1

    for dtype, count in sorted(type_counts.items()):
        print(f"  {dtype}: {count} points")

    return training_data


def save_training_data(training_data, filename="sample_training_data.json"):
    """Save training data to JSON file."""
    with open(filename, "w") as f:
        json.dump(training_data, f, indent=2)
    print(f"\n✅ Saved to {filename}")
    return filename


def generate_test_payloads():
    """Generate test payloads for API endpoints."""
    training_data = generate_sample_training_data(days=60)

    payloads = {
        "train_model": {
            "user_id": "test_user_001",
            "training_data": training_data,
        },
        "extract_features": {"training_data": training_data},
        "process_feedback": {
            "user_id": "test_user_001",
            "feedback": [d for d in training_data if d["type"] == "feedback"][:20],
        },
        "start_conversation": {
            "user_id": "test_user_001",
            "mode": "free_form",
        },
        "send_message": {
            "user_id": "test_user_001",
            "message": "I've been feeling really stressed lately and haven't been sleeping well. My mood has been pretty down too.",
        },
        "get_recommendations": {"user_id": "test_user_001"},
    }

    # Save all payloads
    with open("test_payloads.json", "w") as f:
        json.dump(payloads, f, indent=2)

    print("\n✅ Generated test payloads in test_payloads.json")

    return payloads


if __name__ == "__main__":
    print("=" * 60)
    print("AI TRAINING DATA GENERATOR")
    print("=" * 60 + "\n")

    # Generate training data
    training_data = generate_sample_training_data(days=60, user_id="test_user_001")

    # Save to file
    save_training_data(training_data)

    # Generate test API payloads
    generate_test_payloads()

    print("\n" + "=" * 60)
    print("📊 SAMPLE DATA READY FOR TESTING")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start the Flask app: python app.py")
    print("2. Test API endpoints with test_payloads.json")
    print("3. Example curl commands:")
    print()
    print("  # Train model")
    print(
        '  curl -X POST http://localhost:5000/api/ml/train -H "Content-Type: application/json" -d @test_payloads.json'
    )
    print()
    print("  # Get recommendations")
    print("  curl http://localhost:5000/api/ml/recommendations/test_user_001")
    print()
    print("  # Start chat")
    print(
        '  curl -X POST http://localhost:5000/api/chat/start -H "Content-Type: application/json" -d \'{"user_id": "test_user_001", "mode": "free_form"}\''
    )
