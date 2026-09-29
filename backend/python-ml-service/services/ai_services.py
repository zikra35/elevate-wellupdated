"""AI recommendation and chatbot services."""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import random

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Generate personalized health recommendations using trained ML models."""

    def __init__(self):
        """Initialize recommendation engine."""
        self.recommendation_templates = self._load_recommendation_templates()

    def generate_recommendations(
        self,
        user_id: str,
        model: Dict[str, Any],
        user_profile: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate personalized recommendations.

        Args:
            user_id: User identifier
            model: Trained ML model
            user_profile: User's health profile
            context: Optional context (time, mood, etc)

        Returns:
            Dict with ranked recommendations
        """
        if not model:
            logger.warning(f"No model for user {user_id}, using cold start")
            return self._generate_cold_start_recommendations(user_profile)

        model_confidence = model.get("personalization_score", 0) / 100

        if model_confidence < 0.7:
            # Low confidence: blend with fallback
            recommendations = self._blend_recommendations(user_profile, model, model_confidence)
        else:
            # High confidence: use model
            recommendations = self._generate_model_based_recommendations(user_profile, model)

        return {
            "recommendations": recommendations,
            "model_confidence": model_confidence,
            "generated_at": datetime.now().isoformat(),
            "user_id": user_id,
        }

    def _generate_model_based_recommendations(
        self, user_profile: Dict[str, Any], model: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations using trained model."""
        feature_importance = model.get("feature_importance", {})
        recommendations = []

        # Get top personalization dimensions
        top_dimensions = sorted(
            feature_importance.items(), key=lambda x: x[1], reverse=True
        )[:5]

        for dimension, importance in top_dimensions:
            rec = self._generate_recommendation_for_dimension(
                dimension, user_profile, importance
            )
            if rec:
                recommendations.append(rec)

        # Rank by confidence
        recommendations.sort(key=lambda x: x.get("confidence", 0), reverse=True)

        return recommendations[:5]  # Return top 5

    def _blend_recommendations(
        self, user_profile: Dict[str, Any], model: Dict[str, Any], model_confidence: float
    ) -> List[Dict[str, Any]]:
        """Blend model-based and template-based recommendations."""
        recommendations = []

        # Get model recommendations (confidence-weighted)
        model_recs = self._generate_model_based_recommendations(user_profile, model)
        for rec in model_recs:
            rec["confidence"] *= model_confidence
            recommendations.append(rec)

        # Add template recommendations (inverse confidence)
        template_confidence = 1 - model_confidence
        template_recs = self._generate_template_recommendations(user_profile)
        for rec in template_recs:
            rec["confidence"] *= template_confidence
            recommendations.append(rec)

        # Rank and deduplicate
        recommendations = self._deduplicate_recommendations(recommendations)
        recommendations.sort(key=lambda x: x.get("confidence", 0), reverse=True)

        return recommendations[:5]

    def _generate_recommendation_for_dimension(
        self, dimension: str, user_profile: Dict[str, Any], importance: float
    ) -> Optional[Dict[str, Any]]:
        """Generate recommendation for specific dimension."""
        # Get templates for dimension
        templates = self.recommendation_templates.get(dimension, [])
        if not templates:
            return None

        # Select based on user profile
        selected = random.choice(templates)

        return {
            "dimension": dimension,
            "text": selected,
            "confidence": min(1.0, importance),
            "source": "model",
            "explanation": f"Based on your {dimension} preferences",
        }

    def _generate_cold_start_recommendations(
        self, user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate demographic-based recommendations for new users."""
        age = user_profile.get("age", 30)
        gender = user_profile.get("gender", "unknown")
        goals = user_profile.get("goals", [])

        recommendations = []

        # Age-based recommendations
        if age < 25:
            recommendations.append(
                {
                    "text": "Try high-intensity interval training to boost energy",
                    "dimension": "workout_type_preference",
                    "confidence": 0.6,
                    "source": "demographic",
                }
            )
        else:
            recommendations.append(
                {
                    "text": "Consider low-impact exercises like yoga or swimming",
                    "dimension": "workout_type_preference",
                    "confidence": 0.6,
                    "source": "demographic",
                }
            )

        # Goal-based recommendations
        if "weight_loss" in goals:
            recommendations.append(
                {
                    "text": "Track your calories - aim for 500 cal deficit daily",
                    "dimension": "meal_types",
                    "confidence": 0.7,
                    "source": "demographic",
                }
            )

        if "better_sleep" in goals:
            recommendations.append(
                {
                    "text": "Try going to bed 30 minutes earlier this week",
                    "dimension": "sleep_duration",
                    "confidence": 0.7,
                    "source": "demographic",
                }
            )

        return recommendations

    def _generate_template_recommendations(
        self, user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate template-based recommendations."""
        templates = [
            {
                "text": "Increase water intake to 8 glasses daily",
                "dimension": "hydration",
                "confidence": 0.5,
            },
            {
                "text": "Try a 10-minute meditation session today",
                "dimension": "stress_level",
                "confidence": 0.5,
            },
            {
                "text": "Take a 20-minute walk outside",
                "dimension": "workout_frequency",
                "confidence": 0.5,
            },
        ]

        return random.sample(templates, min(3, len(templates)))

    def _deduplicate_recommendations(
        self, recommendations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Remove duplicate recommendations."""
        seen = set()
        deduped = []

        for rec in recommendations:
            text = rec.get("text", "")
            if text not in seen:
                seen.add(text)
                deduped.append(rec)

        return deduped

    def _load_recommendation_templates(self) -> Dict[str, List[str]]:
        """Load recommendation templates by dimension."""
        return {
            "workout_frequency": [
                "Try to exercise at least 3 times per week",
                "Add a 30-minute walk to your daily routine",
                "Sign up for a fitness class you enjoy",
            ],
            "workout_intensity": [
                "Increase your workout intensity gradually",
                "Try pushups or resistance training",
                "Add intervals to your cardio workout",
            ],
            "sleep_duration": [
                "Aim for 7-9 hours of sleep nightly",
                "Establish a consistent sleep schedule",
                "Go to bed 30 minutes earlier this week",
            ],
            "sleep_quality": [
                "Avoid screens 1 hour before bed",
                "Keep your bedroom cool and dark",
                "Try a relaxation technique before sleep",
            ],
            "stress_level": [
                "Practice deep breathing exercises",
                "Try a 10-minute meditation session",
                "Take a relaxing bath",
            ],
            "meal_types": [
                "Add more vegetables to your meals",
                "Try a new healthy recipe this week",
                "Eat more protein-rich foods",
            ],
        }


class AdvancedChatbotService:
    """Advanced AI chatbot for health conversations (Sage)."""

    def __init__(self):
        """Initialize chatbot service."""
        self.calming_techniques = self._load_calming_techniques()
        self.crisis_keywords = self._load_crisis_keywords()

    def process_message(
        self, user_id: str, message: str, conversation_mode: str = "free_form"
    ) -> Dict[str, Any]:
        """
        Process user message and generate response.

        Args:
            user_id: User identifier
            message: User message text
            conversation_mode: Conversation mode

        Returns:
            Dict with response and analysis
        """
        # Extract health indicators
        health_indicators = self._extract_health_indicators(message)

        # Analyze sentiment
        sentiment = self._analyze_sentiment(message)

        # Detect crisis
        crisis_level = self._detect_crisis_indicators(message)

        if crisis_level:
            response = self._generate_crisis_response(crisis_level)
        else:
            # Generate empathetic response
            response = self._generate_empathetic_response(message, health_indicators)

        return {
            "response": response,
            "health_indicators": health_indicators,
            "sentiment": sentiment,
            "crisis_level": crisis_level,
            "suggestions": self._generate_suggestions(health_indicators, sentiment)
            if not crisis_level
            else [],
        }

    def _extract_health_indicators(self, message: str) -> Dict[str, Any]:
        """Extract health indicators from message."""
        message_lower = message.lower()

        indicators = {
            "mood": self._detect_mood(message_lower),
            "stress": self._detect_stress(message_lower),
            "energy": self._detect_energy(message_lower),
            "sleep": self._detect_sleep(message_lower),
            "pain": self._detect_pain(message_lower),
        }

        return indicators

    def _detect_mood(self, message: str) -> Optional[str]:
        """Detect mood from message."""
        mood_keywords = {
            "happy": ["happy", "great", "awesome", "wonderful", "excellent"],
            "sad": ["sad", "depressed", "down", "unhappy", "miserable"],
            "anxious": ["anxious", "nervous", "worried", "stressed", "tense"],
            "calm": ["calm", "peaceful", "relaxed", "serene"],
            "angry": ["angry", "frustrated", "furious", "mad"],
        }

        for mood, keywords in mood_keywords.items():
            if any(k in message for k in keywords):
                return mood

        return None

    def _detect_stress(self, message: str) -> int:
        """Detect stress level (0-10)."""
        stress_keywords = {
            1: ["relaxed", "calm"],
            5: ["stressed", "worried", "pressure"],
            8: ["overwhelmed", "anxious", "panic"],
            10: ["crisis", "emergency"],
        }

        for level, keywords in stress_keywords.items():
            if any(k in message for k in keywords):
                return level

        return 5  # Default neutral

    def _detect_energy(self, message: str) -> str:
        """Detect energy level."""
        if any(k in message for k in ["tired", "exhausted", "fatigued"]):
            return "low"
        elif any(k in message for k in ["energetic", "motivated", "active"]):
            return "high"
        return "moderate"

    def _detect_sleep(self, message: str) -> bool:
        """Detect if sleep is mentioned."""
        return any(k in message for k in ["sleep", "tired", "exhausted", "insomnia"])

    def _detect_pain(self, message: str) -> Optional[str]:
        """Detect pain mentions."""
        if any(k in message for k in ["pain", "hurt", "ache"]):
            return "mentioned"
        return None

    def _analyze_sentiment(self, message: str) -> str:
        """Analyze sentiment: positive, negative, neutral."""
        positive_words = ["good", "great", "happy", "love", "awesome", "excellent"]
        negative_words = ["bad", "sad", "hate", "terrible", "awful", "awful"]

        message_lower = message.lower()

        positive_count = sum(1 for w in positive_words if w in message_lower)
        negative_count = sum(1 for w in negative_words if w in message_lower)

        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        return "neutral"

    def _detect_crisis_indicators(self, message: str) -> Optional[str]:
        """
        Detect crisis indicators.

        Returns: None, "severe", "critical"
        """
        message_lower = message.lower()

        critical_keywords = ["suicide", "kill myself", "want to die", "harm myself"]
        severe_keywords = ["depressed", "hopeless", "worthless", "abuse"]

        if any(k in message_lower for k in critical_keywords):
            return "critical"

        if any(k in message_lower for k in severe_keywords):
            return "severe"

        return None

    def _generate_crisis_response(self, crisis_level: str) -> str:
        """Generate crisis response with resources."""
        if crisis_level == "critical":
            return (
                "I'm very concerned about what you've shared. Please reach out for immediate help:\n"
                "🚑 National Suicide Prevention Lifeline: 988 (US)\n"
                "🚑 Crisis Text Line: Text HOME to 741741\n"
                "🚑 International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/\n\n"
                "You matter. Help is available 24/7."
            )

        return (
            "Thank you for trusting me with this. Your wellbeing is important.\n"
            "Please consider speaking with a mental health professional:\n"
            "📞 Find a therapist: Psychology Today directory\n"
            "📞 Talkspace or BetterHelp for online therapy\n\n"
            "How can I support you right now?"
        )

    def _generate_empathetic_response(
        self, message: str, health_indicators: Dict[str, Any]
    ) -> str:
        """Generate empathetic response."""
        mood = health_indicators.get("mood")
        stress = health_indicators.get("stress", 5)

        responses = {
            "happy": "That's wonderful to hear! I'm glad you're feeling good.",
            "sad": "I hear you. It's okay to feel sad sometimes. What's been troubling you?",
            "anxious": "Anxiety can be overwhelming. Let's work through this together.",
            "calm": "It sounds like you're in a good place. How can I help you today?",
            "angry": "I can sense your frustration. Tell me more about what's bothering you.",
        }

        if mood in responses:
            base_response = responses[mood]
        else:
            base_response = "Thank you for sharing. I'm here to listen."

        if stress > 7:
            base_response += " Would you like to try a calming technique?"

        return base_response

    def _generate_suggestions(
        self, health_indicators: Dict[str, Any], sentiment: str
    ) -> List[Dict[str, str]]:
        """Generate personalized suggestions."""
        suggestions = []

        stress = health_indicators.get("stress", 5)
        energy = health_indicators.get("energy", "moderate")

        if stress > 7:
            suggestions.append(
                {
                    "type": "calming",
                    "text": "Try the 4-7-8 breathing exercise",
                    "technique": "breathing",
                }
            )

        if energy == "low":
            suggestions.append(
                {
                    "type": "energy",
                    "text": "A 15-minute walk might help boost your energy",
                    "technique": "activity",
                }
            )

        if sentiment == "negative":
            suggestions.append(
                {
                    "type": "mood",
                    "text": "Try journaling about your feelings",
                    "technique": "journaling",
                }
            )

        return suggestions

    def _load_calming_techniques(self) -> Dict[str, str]:
        """Load calming techniques."""
        return {
            "breathing": "4-7-8 Breathing: Inhale for 4, hold for 7, exhale for 8",
            "grounding": "5-4-3-2-1 Grounding: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste",
            "meditation": "Try a 5-minute body scan meditation",
            "affirmation": "You are strong and capable of handling this",
        }

    def _load_crisis_keywords(self) -> Dict[str, List[str]]:
        """Load crisis keywords for detection."""
        return {
            "critical": ["suicide", "kill myself", "want to die"],
            "severe": ["depressed", "hopeless", "abuse"],
        }

    def get_conversation_summary(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Generate conversation summary and insights."""
        if not conversation_history:
            return {"message": "No conversation history"}

        messages = conversation_history
        mood_distribution = {}
        stress_levels = []

        for msg in messages:
            indicators = msg.get("health_indicators", {})
            mood = indicators.get("mood")
            stress = indicators.get("stress", 5)

            if mood:
                mood_distribution[mood] = mood_distribution.get(mood, 0) + 1
            stress_levels.append(stress)

        avg_stress = sum(stress_levels) / len(stress_levels) if stress_levels else 5

        return {
            "total_messages": len(messages),
            "mood_distribution": mood_distribution,
            "average_stress": avg_stress,
            "key_insights": self._generate_insights(messages),
        }

    def _generate_insights(self, messages: List[Dict]) -> List[str]:
        """Generate insights from conversation."""
        insights = []

        # Check for patterns
        if len(messages) > 5:
            insights.append("You've been quite engaged in conversations lately")

        # Check mood patterns
        moods = [m.get("health_indicators", {}).get("mood") for m in messages]
        if moods.count("anxious") > len(messages) * 0.3:
            insights.append("Anxiety has been a recurring theme - consider stress management")

        return insights or ["Keep prioritizing your wellbeing"]
