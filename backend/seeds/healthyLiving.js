const mongoose = require('mongoose');
const Article = require('../models/Article');
const Recipe = require('../models/Recipe');
const Video = require('../models/Video');

/**
 * Seed data for Healthy Living module
 * Inserts articles, recipes, and videos idempotently using upsert operations
 */

const seedHealthyLiving = async () => {
  try {
    console.log('Starting Healthy Living seed...');

    // Get or create a system admin user for createdBy reference
    const User = require('../models/User');
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      // Create a system admin user if none exists
      adminUser = await User.create({
        email: 'system@healthycompanion.local',
        password: 'system-seed-user',
        name: 'System',
        role: 'admin',
      });
    }

    // ===== ARTICLES (5 total, covering 5 categories) =====
    const articles = [
      {
        title: 'The Complete Guide to Balanced Nutrition',
        author: 'Dr. Sarah Mitchell',
        readTimeMinutes: 8,
        category: 'Nutrition',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        content: `# The Complete Guide to Balanced Nutrition

Balanced nutrition is the foundation of good health. A well-rounded diet includes:

## Macronutrients
- **Proteins**: Essential for muscle repair and growth. Aim for 0.8-1g per kg of body weight daily.
- **Carbohydrates**: Your body's primary energy source. Choose complex carbs like whole grains.
- **Fats**: Important for hormone production and nutrient absorption. Focus on unsaturated fats.

## Micronutrients
Vitamins and minerals support immune function, bone health, and energy production. Eat a variety of colorful fruits and vegetables to ensure adequate intake.

## Hydration
Drink at least 8 glasses of water daily. More if you exercise regularly or live in a hot climate.

## Meal Timing
Eat regular meals to maintain stable blood sugar and energy levels throughout the day.`,
        createdBy: adminUser._id,
      },
      {
        title: 'Building Strength: A Beginner\'s Fitness Journey',
        author: 'Coach James Rodriguez',
        readTimeMinutes: 10,
        category: 'Fitness',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        content: `# Building Strength: A Beginner's Fitness Journey

Starting a fitness journey can feel overwhelming, but with the right approach, anyone can build strength.

## Progressive Overload
The key to building strength is gradually increasing the demands on your muscles. This can be done by:
- Increasing weight
- Adding more repetitions
- Reducing rest periods
- Improving exercise form

## Consistency Over Intensity
Working out 3-4 times per week consistently will yield better results than sporadic intense sessions.

## Recovery Matters
Muscles grow during rest, not during the workout. Aim for 7-9 hours of sleep and include rest days in your routine.

## Nutrition for Strength
Consume adequate protein (1.6-2.2g per kg of body weight) to support muscle growth.`,
        createdBy: adminUser._id,
      },
      {
        title: 'Mindfulness and Mental Wellness in Daily Life',
        author: 'Dr. Emma Chen',
        readTimeMinutes: 7,
        category: 'Mental Health',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        content: `# Mindfulness and Mental Wellness in Daily Life

Mental health is just as important as physical health. Mindfulness practices can significantly improve your wellbeing.

## What is Mindfulness?
Mindfulness is the practice of being fully present and engaged in the moment, without judgment.

## Benefits of Mindfulness
- Reduces stress and anxiety
- Improves focus and concentration
- Enhances emotional regulation
- Promotes better sleep

## Simple Mindfulness Practices
1. **Breathing Exercises**: Spend 5 minutes focusing on your breath
2. **Body Scan**: Progressively relax each part of your body
3. **Mindful Walking**: Pay attention to each step and sensation
4. **Meditation**: Start with just 10 minutes daily

## Integration into Daily Life
Practice mindfulness during routine activities like eating, showering, or commuting.`,
        createdBy: adminUser._id,
      },
      {
        title: 'The Science of Quality Sleep and Recovery',
        author: 'Dr. Michael Thompson',
        readTimeMinutes: 9,
        category: 'Sleep',
        thumbnailUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop',
        content: `# The Science of Quality Sleep and Recovery

Quality sleep is essential for physical recovery, mental health, and cognitive function.

## Sleep Stages
Sleep consists of two main types: REM (Rapid Eye Movement) and NREM (Non-REM).
- **NREM Stage 1-2**: Light sleep, easy to wake
- **NREM Stage 3**: Deep sleep, essential for physical recovery
- **REM Sleep**: Important for memory consolidation and emotional processing

## Sleep Duration
Most adults need 7-9 hours of sleep per night. Consistency is key—try to sleep and wake at the same time daily.

## Sleep Hygiene Tips
- Keep your bedroom cool, dark, and quiet
- Avoid screens 1 hour before bed
- Limit caffeine after 2 PM
- Exercise regularly, but not close to bedtime
- Establish a relaxing bedtime routine

## When to Seek Help
If you consistently struggle with sleep despite good sleep hygiene, consult a healthcare provider.`,
        createdBy: adminUser._id,
      },
      {
        title: 'Holistic Wellness: Integrating Mind, Body, and Spirit',
        author: 'Wellness Coach Lisa Anderson',
        readTimeMinutes: 11,
        category: 'Nutrition',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        content: `# Holistic Wellness: Integrating Mind, Body, and Spirit

True wellness encompasses physical health, mental wellbeing, and spiritual fulfillment.

## The Three Pillars of Wellness

### Physical Wellness
- Regular exercise
- Balanced nutrition
- Adequate sleep
- Preventive healthcare

### Mental Wellness
- Stress management
- Mindfulness practices
- Social connections
- Continuous learning

### Spiritual Wellness
- Purpose and meaning
- Connection to nature
- Gratitude practice
- Community involvement

## Creating Your Wellness Plan
1. Assess your current state in each pillar
2. Set realistic goals
3. Create actionable steps
4. Track progress
5. Adjust as needed

## Remember
Wellness is a journey, not a destination. Small, consistent steps lead to lasting change.`,
        createdBy: adminUser._id,
      },
    ];

    // Upsert articles
    for (const article of articles) {
      await Article.updateOne(
        { title: article.title },
        { $set: article },
        { upsert: true }
      );
    }
    console.log(`✓ Seeded ${articles.length} articles`);

    // ===== RECIPES (10 total, covering all 5 meal types and dietary tags) =====
    const recipes = [
      {
        name: 'Protein-Packed Breakfast Smoothie Bowl',
        imageUrl: 'https://images.unsplash.com/photo-1590080876-a371a6b6d7c5?w=400&h=300&fit=crop',
        prepTimeMin: 5,
        cookTimeMin: 0,
        servings: 1,
        caloriesPerServing: 320,
        ingredients: [
          '1 cup Greek yogurt',
          '1 banana',
          '1/2 cup mixed berries',
          '1/4 cup granola',
          '1 tbsp honey',
          '1/4 cup almond milk',
        ],
        steps: [
          'Blend Greek yogurt, banana, and almond milk until smooth',
          'Pour into a bowl',
          'Top with berries and granola',
          'Drizzle with honey',
          'Serve immediately',
        ],
        dietaryTags: ['Vegetarian', 'High-Protein'],
        mealType: 'Breakfast',
      },
      {
        name: 'Vegan Buddha Bowl',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        prepTimeMin: 15,
        cookTimeMin: 20,
        servings: 2,
        caloriesPerServing: 420,
        ingredients: [
          '1 cup quinoa',
          '1 can chickpeas',
          '2 cups kale',
          '1 sweet potato',
          '1 avocado',
          '2 tbsp tahini',
          'Lemon juice',
          'Salt and pepper',
        ],
        steps: [
          'Cook quinoa according to package directions',
          'Roast sweet potato cubes at 400°F for 20 minutes',
          'Massage kale with lemon juice',
          'Roast chickpeas with spices for 15 minutes',
          'Assemble bowl with all ingredients',
          'Drizzle with tahini dressing',
        ],
        dietaryTags: ['Vegan', 'Gluten-Free'],
        mealType: 'Lunch',
      },
      {
        name: 'Mediterranean Grilled Salmon',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        prepTimeMin: 10,
        cookTimeMin: 15,
        servings: 2,
        caloriesPerServing: 380,
        ingredients: [
          '2 salmon fillets',
          '2 tbsp olive oil',
          '1 lemon',
          'Fresh herbs (dill, parsley)',
          'Cherry tomatoes',
          'Olives',
          'Salt and pepper',
        ],
        steps: [
          'Preheat grill to medium-high',
          'Season salmon with salt, pepper, and herbs',
          'Grill for 6-7 minutes per side',
          'Serve with lemon, tomatoes, and olives',
        ],
        dietaryTags: ['Pescatarian', 'Mediterranean'],
        mealType: 'Dinner',
      },
      {
        name: 'Keto Cauliflower Mac and Cheese',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
        prepTimeMin: 10,
        cookTimeMin: 20,
        servings: 3,
        caloriesPerServing: 280,
        ingredients: [
          '1 head cauliflower',
          '1 cup cheddar cheese',
          '1/2 cup heavy cream',
          '2 tbsp butter',
          'Salt and pepper',
          'Nutmeg',
        ],
        steps: [
          'Cut cauliflower into florets and steam for 8 minutes',
          'Melt butter and add cream',
          'Stir in cheese until melted',
          'Toss cauliflower in cheese sauce',
          'Season with salt, pepper, and nutmeg',
          'Serve hot',
        ],
        dietaryTags: ['Keto', 'Gluten-Free', 'Vegetarian'],
        mealType: 'Dinner',
      },
      {
        name: 'Paleo Energy Balls',
        imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=300&fit=crop',
        prepTimeMin: 15,
        cookTimeMin: 0,
        servings: 12,
        caloriesPerServing: 95,
        ingredients: [
          '1 cup almond butter',
          '1/2 cup coconut oil',
          '1/2 cup raw cacao powder',
          '1/4 cup honey',
          'Pinch of sea salt',
        ],
        steps: [
          'Mix almond butter and coconut oil',
          'Add cacao powder and honey',
          'Roll into balls',
          'Refrigerate for 30 minutes',
          'Store in fridge',
        ],
        dietaryTags: ['Paleo', 'Vegan'],
        mealType: 'Snack',
      },
      {
        name: 'Gluten-Free Quinoa Salad',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        prepTimeMin: 15,
        cookTimeMin: 15,
        servings: 2,
        caloriesPerServing: 310,
        ingredients: [
          '1 cup cooked quinoa',
          '1 cucumber',
          '1 bell pepper',
          '1/2 red onion',
          '1/4 cup feta cheese',
          '2 tbsp olive oil',
          '1 tbsp lemon juice',
        ],
        steps: [
          'Cook quinoa and let cool',
          'Dice vegetables',
          'Combine quinoa and vegetables',
          'Whisk olive oil and lemon juice',
          'Toss salad with dressing',
          'Top with feta cheese',
        ],
        dietaryTags: ['Gluten-Free', 'Vegetarian'],
        mealType: 'Lunch',
      },
      {
        name: 'High-Protein Chicken Stir-Fry',
        imageUrl: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b8?w=400&h=300&fit=crop',
        prepTimeMin: 15,
        cookTimeMin: 15,
        servings: 2,
        caloriesPerServing: 350,
        ingredients: [
          '2 chicken breasts',
          '2 cups broccoli',
          '1 bell pepper',
          '2 tbsp soy sauce',
          '1 tbsp sesame oil',
          'Garlic and ginger',
        ],
        steps: [
          'Cut chicken into bite-sized pieces',
          'Heat sesame oil in a wok',
          'Cook chicken until golden',
          'Add vegetables and stir-fry',
          'Add soy sauce and seasonings',
          'Serve over brown rice',
        ],
        dietaryTags: ['High-Protein', 'Dairy-Free'],
        mealType: 'Dinner',
      },
      {
        name: 'Dairy-Free Coconut Chia Pudding',
        imageUrl: 'https://images.unsplash.com/photo-1590080876-a371a6b6d7c5?w=400&h=300&fit=crop',
        prepTimeMin: 5,
        cookTimeMin: 0,
        servings: 1,
        caloriesPerServing: 280,
        ingredients: [
          '1/2 cup coconut milk',
          '1/4 cup chia seeds',
          '1 tbsp maple syrup',
          '1/2 tsp vanilla extract',
          'Fresh berries',
        ],
        steps: [
          'Mix coconut milk, chia seeds, maple syrup, and vanilla',
          'Stir well to prevent clumping',
          'Refrigerate overnight',
          'Top with fresh berries',
          'Serve cold',
        ],
        dietaryTags: ['Vegan', 'Dairy-Free', 'Gluten-Free'],
        mealType: 'Breakfast',
      },
      {
        name: 'Mediterranean Hummus Wrap',
        imageUrl: 'https://images.unsplash.com/photo-1585238341710-4b4e6ceaf1b8?w=400&h=300&fit=crop',
        prepTimeMin: 10,
        cookTimeMin: 0,
        servings: 1,
        caloriesPerServing: 320,
        ingredients: [
          '1 whole wheat tortilla',
          '1/4 cup hummus',
          '1 cup spinach',
          '1/2 cucumber',
          '1/4 red onion',
          'Feta cheese',
          'Olives',
        ],
        steps: [
          'Spread hummus on tortilla',
          'Layer spinach and vegetables',
          'Add feta and olives',
          'Roll tightly',
          'Slice and serve',
        ],
        dietaryTags: ['Vegetarian', 'Mediterranean'],
        mealType: 'Lunch',
      },
      {
        name: 'Dark Chocolate Avocado Mousse',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
        prepTimeMin: 10,
        cookTimeMin: 0,
        servings: 2,
        caloriesPerServing: 210,
        ingredients: [
          '1 ripe avocado',
          '1/4 cup cacao powder',
          '1/4 cup almond milk',
          '2 tbsp maple syrup',
          'Pinch of sea salt',
        ],
        steps: [
          'Blend avocado and almond milk',
          'Add cacao powder and maple syrup',
          'Blend until smooth',
          'Divide into serving bowls',
          'Top with berries if desired',
        ],
        dietaryTags: ['Vegan', 'Gluten-Free'],
        mealType: 'Dessert',
      },
    ];

    // Upsert recipes
    for (const recipe of recipes) {
      await Recipe.updateOne(
        { name: recipe.name },
        { $set: recipe },
        { upsert: true }
      );
    }
    console.log(`✓ Seeded ${recipes.length} recipes`);

    // ===== VIDEOS (8 total, covering all 4 categories) =====
    const videos = [
      {
        title: 'Guided Morning Meditation',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        durationSeconds: 600,
        category: 'Meditation',
        description: 'Start your day with a calming 10-minute guided meditation to set a positive intention.',
        videoUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
      },
      {
        title: 'Evening Relaxation Meditation',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        durationSeconds: 900,
        category: 'Meditation',
        description: 'Unwind before bed with this 15-minute relaxation meditation to improve sleep quality.',
        videoUrl: 'https://www.youtube.com/watch?v=rm2uS0Eo0Ow',
      },
      {
        title: 'Beginner Yoga Flow',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        durationSeconds: 1200,
        category: 'Yoga',
        description: 'A gentle 20-minute yoga flow perfect for beginners to build flexibility and strength.',
        videoUrl: 'https://www.youtube.com/watch?v=9mPlis7JQPU',
      },
      {
        title: 'Advanced Vinyasa Yoga',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        durationSeconds: 1800,
        category: 'Yoga',
        description: 'Challenge yourself with this 30-minute advanced vinyasa flow for experienced practitioners.',
        videoUrl: 'https://www.youtube.com/watch?v=ZXsQAXx_ao0',
      },
      {
        title: 'Nutrition Basics: Building a Balanced Plate',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        durationSeconds: 720,
        category: 'Nutrition',
        description: 'Learn how to build nutritionally balanced meals with the right proportions of macronutrients.',
        videoUrl: 'https://www.youtube.com/watch?v=Yd-Yd-Yd-Yd',
      },
      {
        title: 'Healthy Meal Prep for the Week',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        durationSeconds: 1500,
        category: 'Nutrition',
        description: 'Master meal prep techniques to save time and stay on track with your nutrition goals.',
        videoUrl: 'https://www.youtube.com/watch?v=Yd-Yd-Yd-Yd',
      },
      {
        title: 'Full Body Fitness Workout',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        durationSeconds: 1800,
        category: 'Fitness',
        description: 'A comprehensive 30-minute full-body workout requiring no equipment, perfect for home training.',
        videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      },
      {
        title: 'Core Strengthening Routine',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        durationSeconds: 900,
        category: 'Fitness',
        description: 'Target your core with this 15-minute routine to build strength and improve posture.',
        videoUrl: 'https://www.youtube.com/watch?v=I1UUwXoKfS8',
      },
    ];

    // Upsert videos
    for (const video of videos) {
      await Video.updateOne(
        { title: video.title },
        { $set: video },
        { upsert: true }
      );
    }
    console.log(`✓ Seeded ${videos.length} videos`);

    console.log('✓ Healthy Living seed completed successfully');
  } catch (error) {
    console.error('Error seeding Healthy Living data:', error);
    throw error;
  }
};

module.exports = seedHealthyLiving;
