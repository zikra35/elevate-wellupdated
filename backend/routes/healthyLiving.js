const express = require('express');
const Article = require('../models/Article');
const Recipe = require('../models/Recipe');
const Video = require('../models/Video');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ============ ARTICLES ============

// GET all articles with optional category filter
router.get('/articles', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    const articles = await Article.find(query).sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create article (admin only)
router.post('/articles', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, author, readTimeMinutes, category, thumbnailUrl, content } = req.body;

    const article = new Article({
      title,
      author,
      readTimeMinutes,
      category,
      thumbnailUrl,
      content,
      createdBy: req.userId,
    });

    await article.save();
    res.status(201).json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update article (admin only)
router.put('/articles/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, author, readTimeMinutes, category, thumbnailUrl, content } = req.body;

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      {
        title,
        author,
        readTimeMinutes,
        category,
        thumbnailUrl,
        content,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE article (admin only)
router.delete('/articles/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ RECIPES ============

// GET all recipes with optional dietary tag and meal type filters
router.get('/recipes', async (req, res) => {
  try {
    const { dietaryTag, mealType } = req.query;
    let query = {};

    if (dietaryTag) {
      query.dietaryTags = { $in: [dietaryTag] };
    }

    if (mealType) {
      query.mealType = mealType;
    }

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create recipe (admin only)
router.post('/recipes', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, imageUrl, prepTimeMin, cookTimeMin, servings, caloriesPerServing, ingredients, steps, dietaryTags, mealType } = req.body;

    const recipe = new Recipe({
      name,
      imageUrl,
      prepTimeMin,
      cookTimeMin,
      servings,
      caloriesPerServing,
      ingredients,
      steps,
      dietaryTags,
      mealType,
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE recipe (admin only)
router.delete('/recipes/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ VIDEOS ============

// GET all videos with optional category filter
router.get('/videos', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create video (admin only)
router.post('/videos', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, thumbnailUrl, durationSeconds, category, description, videoUrl } = req.body;

    const video = new Video({
      title,
      thumbnailUrl,
      durationSeconds,
      category,
      description,
      videoUrl,
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE video (admin only)
router.delete('/videos/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const video = await Video.findByIdAndDelete(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ FAVOURITES ============

// GET user's favourite recipes
router.get('/favourites/recipes', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favouriteRecipes');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.favouriteRecipes || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add recipe to favourites
router.post('/favourites/recipes', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if recipe already in favourites
    if (user.favouriteRecipes.includes(recipeId)) {
      return res.status(400).json({ message: 'Recipe already in favourites' });
    }

    user.favouriteRecipes.push(recipeId);
    await user.save();

    res.json({ message: 'Recipe added to favourites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE remove recipe from favourites
router.delete('/favourites/recipes', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favouriteRecipes = user.favouriteRecipes.filter(
      (id) => id.toString() !== recipeId
    );
    await user.save();

    res.json({ message: 'Recipe removed from favourites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
