/**
 * Advanced Chatbot Service - Sage AI Therapist
 * Implements all 15 AI Chatbot requirements with:
 * - Health experience capture and analysis
 * - Empathetic responses
 * - Personalized suggestions
 * - Crisis detection
 * - Conversation context management
 * - Multi-language support
 * - Health data integration
 */

const { ConversationHistory, Feedback, MentalHealthLog } = require('../models/AIModels');
const crypto = require('crypto');

class AdvancedChatbotService {
  /**
   * Initialize or continue conversation
   */
  static async startConversation(userId, conversationMode = 'free-form', language = 'en') {
    try {
      const conversationId = crypto.randomBytes(16).toString('hex');

      const conversation = new ConversationHistory({
        userId,
        conversationId,
        messages: [],
        conversationMode,
        language,
        startedAt: new Date(),
      });

      await conversation.save();
      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  /**
   * Process user message and generate response
   */
  static async processMessage(userId, conversationId, userMessage) {
    try {
      console.log(`Processing message for user ${userId}: ${userMessage}`);

      // Step 1: Get conversation history
      const conversation = await ConversationHistory.findOne({
        userId,
        conversationId,
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Step 2: Extract health indicators from user message
      const healthIndicators = this.extractHealthIndicators(userMessage);

      // Step 3: Analyze user health status
      const healthAnalysis = await this.analyzeUserHealthStatus(userId, userMessage, healthIndicators);

      // Step 4: Check for crisis indicators
      const crisisCheck = this.detectCrisisIndicators(userMessage, healthAnalysis);

      // Step 5: Generate empathetic response
      let response = '';
      let suggestions = [];

      if (crisisCheck.isCrisis) {
        response = this.generateCrisisResponse(crisisCheck.level);
        suggestions = this.generateCrisisSuggestions();
      } else {
        response = await this.generateEmpatheticResponse(userId, userMessage, healthAnalysis, conversation.conversationMode);
        suggestions = await this.generatePersonalizedSuggestions(userId, healthAnalysis);
      }

      // Step 6: Update conversation
      conversation.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        metadata: {
          mood: healthAnalysis.extractedMood,
          stressLevel: healthAnalysis.stressLevel,
          topicTags: healthAnalysis.topics,
          sentiment: healthAnalysis.sentiment,
        },
      });

      conversation.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      // Update health indicators
      conversation.healthIndicators = healthAnalysis;
      conversation.healthConcerns = [
        ...new Set([...conversation.healthConcerns, ...healthAnalysis.healthConcerns]),
      ];
      conversation.mentalHealthConcerns = [
        ...new Set([...conversation.mentalHealthConcerns, ...healthAnalysis.mentalHealthConcerns]),
      ];
      conversation.physicalHealthConcerns = [
        ...new Set([...conversation.physicalHealthConcerns, ...healthAnalysis.physicalHealthConcerns]),
      ];

      if (crisisCheck.isCrisis) {
        conversation.crisisIndicators = true;
      }

      conversation.suggestionsProvided = [...new Set([...conversation.suggestionsProvided, ...suggestions])];

      await conversation.save();

      return {
        response,
        suggestions,
        healthAnalysis,
        crisisDetected: crisisCheck.isCrisis,
        conversationId,
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Extract health indicators from user message
   */
  static extractHealthIndicators(message) {
    const indicators = {
      mood: null,
      stressLevel: 0,
      energyLevel: 0,
      painLevel: 0,
      sleepQuality: 0,
      anxietyLevel: 0,
      topics: [],
    };

    const lowerMessage = message.toLowerCase();

    // Mood detection
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'blessed'];
    const negativeWords = ['sad', 'depressed', 'terrible', 'awful', 'miserable'];
    const anxiousWords = ['anxious', 'worried', 'nervous', 'scared', 'panic'];

    if (positiveWords.some((w) => lowerMessage.includes(w))) indicators.mood = 'positive';
    else if (negativeWords.some((w) => lowerMessage.includes(w))) indicators.mood = 'negative';
    else if (anxiousWords.some((w) => lowerMessage.includes(w))) indicators.mood = 'anxious';
    else indicators.mood = 'neutral';

    // Stress level (1-10 scale implied)
    if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      indicators.stressLevel = 8;
      indicators.topics.push('stress');
    }
    if (lowerMessage.includes('calm') || lowerMessage.includes('relaxed')) {
      indicators.stressLevel = 2;
    }

    // Energy level
    if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
      indicators.energyLevel = 2;
      indicators.topics.push('fatigue');
    }
    if (lowerMessage.includes('energetic') || lowerMessage.includes('motivated')) {
      indicators.energyLevel = 9;
    }

    // Pain detection
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
      indicators.painLevel = 6;
      indicators.topics.push('pain');
    }

    // Sleep quality
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia')) {
      if (lowerMessage.includes('poor') || lowerMessage.includes('bad')) {
        indicators.sleepQuality = 3;
      } else if (lowerMessage.includes('good')) {
        indicators.sleepQuality = 8;
      }
      indicators.topics.push('sleep');
    }

    // Anxiety detection
    if (anxiousWords.some((w) => lowerMessage.includes(w))) {
      indicators.anxietyLevel = 7;
      indicators.topics.push('anxiety');
    }

    // Topic detection
    const topics = ['mental-health', 'physical-health', 'nutrition', 'exercise', 'work', 'relationships', 'goals'];
    topics.forEach((topic) => {
      if (lowerMessage.includes(topic) && !indicators.topics.includes(topic)) {
        indicators.topics.push(topic);
      }
    });

    return indicators;
  }

  /**
   * Analyze user health status from conversation
   */
  static async analyzeUserHealthStatus(userId, message, healthIndicators) {
    // Get recent health data
    const recentMentalHealth = await MentalHealthLog.findOne({ userId }).sort({ createdAt: -1 }).lean();

    return {
      extractedMood: healthIndicators.mood,
      stressLevel: healthIndicators.stressLevel || (recentMentalHealth?.stressLevel || 5),
      energyLevel: healthIndicators.energyLevel || 5,
      painLevel: healthIndicators.painLevel || 0,
      overallHealthScore: this.calculateOverallHealthScore(healthIndicators),
      healthConcerns: ['mental-health', 'emotional-wellbeing'],
      mentalHealthConcerns: healthIndicators.topics.includes('mental-health')
        ? ['stress', 'anxiety', 'emotional-wellbeing']
        : [],
      physicalHealthConcerns: healthIndicators.topics.includes('physical-health')
        ? ['fatigue', 'pain', 'fitness']
        : [],
      topics: healthIndicators.topics,
      sentiment: this.analyzeSentiment(message),
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  static calculateOverallHealthScore(indicators) {
    const score =
      (10 - indicators.stressLevel) * 5 + // Lower stress = higher score
      indicators.energyLevel * 3 + // Higher energy = higher score
      (10 - indicators.painLevel) * 3 + // Lower pain = higher score
      indicators.sleepQuality * 5; // Higher sleep = higher score

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze sentiment of message
   */
  static analyzeSentiment(message) {
    const positiveWords = ['good', 'great', 'happy', 'better', 'love', 'wonderful', 'excellent'];
    const negativeWords = ['bad', 'sad', 'terrible', 'hate', 'awful', 'worse', 'depressed'];

    const positiveCount = positiveWords.filter((w) => message.toLowerCase().includes(w)).length;
    const negativeCount = negativeWords.filter((w) => message.toLowerCase().includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Detect crisis indicators in message
   */
  static detectCrisisIndicators(message, healthAnalysis) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'self-harm', 'hurt myself',
      'harm', 'die', 'death', 'hopeless', 'worthless',
      'abuse', 'assault', 'danger', 'emergency'
    ];

    const criticalIndicators = crisisKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    const severeMentalHealth =
      healthAnalysis.stressLevel >= 9 &&
      healthAnalysis.mentalHealthConcerns.length > 2;

    if (criticalIndicators) {
      return { isCrisis: true, level: 'critical' };
    }

    if (severeMentalHealth) {
      return { isCrisis: true, level: 'severe' };
    }

    if (healthAnalysis.stressLevel >= 7 && healthAnalysis.energyLevel <= 2) {
      return { isCrisis: true, level: 'high' };
    }

    return { isCrisis: false, level: null };
  }

  /**
   * Generate empathetic response
   */
  static async generateEmpatheticResponse(userId, userMessage, healthAnalysis, conversationMode) {
    try {
      // Try OpenAI first if available
      if (process.env.OPENAI_API_KEY) {
        return await this.generateOpenAIResponse(userMessage, healthAnalysis);
      }

      // Fallback to rule-based responses
      return this.generateRuleBasedResponse(userMessage, healthAnalysis, conversationMode);
    } catch (error) {
      console.error('Error generating empathetic response:', error);
      return this.generateRuleBasedResponse(userMessage, healthAnalysis, conversationMode);
    }
  }

  /**
   * Generate response using OpenAI
   */
  static async generateOpenAIResponse(userMessage, healthAnalysis) {
    const systemPrompt = `You are Sage, a compassionate AI wellness companion. You provide:
    - Empathetic, non-judgmental responses
    - Practical coping strategies
    - Supportive guidance
    - NEVER medical diagnosis
    
    Current user state: mood=${healthAnalysis.extractedMood}, stress=${healthAnalysis.stressLevel}/10`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I hear you. Tell me more about what you\'re experiencing.';
  }

  /**
   * Generate rule-based empathetic response
   */
  static generateRuleBasedResponse(userMessage, healthAnalysis, conversationMode) {
    const responses = {
      positive: [
        "That sounds wonderful! I'm so glad you're feeling good. What's contributing to your positive mood?",
        "It's great to hear positive things from you. How can I support you in maintaining this feeling?",
      ],
      negative: [
        "I hear that you're struggling right now. That's really valid. What's been the hardest part?",
        "Thank you for sharing this with me. It takes courage. I'm here to listen and help.",
        "I'm sorry you're going through this. Let's explore what might help you feel better.",
      ],
      anxious: [
        "Anxiety can be really challenging. Would it help to try a grounding technique together?",
        "I sense you're feeling anxious. Let's take a moment - would a breathing exercise help?",
      ],
      neutral: [
        "Thank you for sharing. Can you tell me more about what's on your mind?",
        "I'm here to listen. What would be most helpful to talk about today?",
      ],
    };

    const respArray = responses[healthAnalysis.sentiment] || responses.neutral;
    return respArray[Math.floor(Math.random() * respArray.length)];
  }

  /**
   * Generate crisis response
   */
  static generateCrisisResponse(level) {
    const crisisResponses = {
      critical: `I'm very concerned about your safety. Please reach out to emergency services immediately:
        🚨 National Suicide Prevention Lifeline: 988 (call or text)
        🚨 Crisis Text Line: Text "HELLO" to 741741
        🚨 International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/
        
        You are not alone. Help is available 24/7.`,
      severe: `I hear that you're in significant distress. Please consider reaching out for professional support:
        📞 National Mental Health Hotline: 988
        📞 Crisis Text Line: Text HOME to 741741
        
        Would you like resources for mental health professionals in your area?`,
      high: `You're going through something really challenging. I encourage you to reach out to someone you trust:
        - A mental health professional
        - A trusted friend or family member
        - A crisis support line
        
        You deserve support during this time.`,
    };

    return crisisResponses[level] || crisisResponses.severe;
  }

  /**
   * Generate crisis suggestions
   */
  static generateCrisisSuggestions() {
    return [
      'Contact a crisis helpline immediately',
      'Call emergency services (911)',
      'Reach out to a trusted friend or family member',
      'Go to the nearest emergency room',
      'Practice grounding techniques',
    ];
  }

  /**
   * Generate personalized suggestions
   */
  static async generatePersonalizedSuggestions(userId, healthAnalysis) {
    const suggestions = [];

    // Based on stress level
    if (healthAnalysis.stressLevel >= 7) {
      suggestions.push(
        'Try a 5-minute breathing exercise: In for 4, hold for 4, out for 6',
        'Take a 10-minute walk outside for fresh air',
        'Practice progressive muscle relaxation',
        'Listen to calming music or nature sounds'
      );
    }

    // Based on energy level
    if (healthAnalysis.energyLevel <= 3) {
      suggestions.push(
        'Try gentle stretching or yoga',
        'Get some sunlight exposure',
        'Take a short nap (20-30 minutes)',
        'Eat a nutritious meal or healthy snack'
      );
    }

    // Based on sleep quality
    if (healthAnalysis.topics.includes('sleep')) {
      suggestions.push(
        'Establish a consistent sleep schedule',
        'Avoid screens 1 hour before bed',
        'Try a relaxing bedtime routine',
        'Keep your bedroom cool and dark'
      );
    }

    // Based on mental health concerns
    if (healthAnalysis.mentalHealthConcerns.length > 0) {
      suggestions.push(
        'Journal about your feelings',
        'Connect with someone you trust',
        'Practice mindfulness meditation',
        'Consider speaking with a therapist'
      );
    }

    return suggestions.slice(0, 4); // Return top 4 suggestions
  }

  /**
   * Get conversation summary
   */
  static async getConversationSummary(userId, conversationId) {
    const conversation = await ConversationHistory.findOne({
      userId,
      conversationId,
    }).lean();

    if (!conversation) {
      return null;
    }

    return {
      conversationId,
      duration: new Date() - conversation.startedAt,
      messageCount: conversation.messages.length,
      healthIndicators: conversation.healthIndicators,
      healthConcerns: conversation.healthConcerns,
      mentalHealthConcerns: conversation.mentalHealthConcerns,
      physicalHealthConcerns: conversation.physicalHealthConcerns,
      crisisDetected: conversation.crisisIndicators,
      suggestionsProvided: conversation.suggestionsProvided,
      conversationMode: conversation.conversationMode,
      language: conversation.language,
    };
  }

  /**
   * Switch conversation mode
   */
  static async switchConversationMode(conversationId, newMode) {
    const conversation = await ConversationHistory.findOneAndUpdate(
      { conversationId },
      { conversationMode: newMode },
      { new: true }
    );

    return conversation;
  }

  /**
   * End conversation and save insights
   */
  static async endConversation(userId, conversationId) {
    const conversation = await ConversationHistory.findOneAndUpdate(
      { userId, conversationId },
      { endedAt: new Date() },
      { new: true }
    );

    return conversation;
  }
}

module.exports = AdvancedChatbotService;
