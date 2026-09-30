require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const sleepRoutes = require('./routes/sleep');
const mentalHealthRoutes = require('./routes/mentalHealth');
const cycleRoutes = require('./routes/cycle');
const goalRoutes = require('./routes/goals');
const reminderRoutes = require('./routes/reminders');
const dietRoutes = require('./routes/diet');
const gameRoutes = require('./routes/games');
const healthyLivingRoutes = require('./routes/healthyLiving');
const aiRoutes = require('./routes/ai');
const aiTrainingRoutes = require('./routes/ai-training');
const supplementRoutes = require('./routes/supplements');
const routinesRoutes = require('./routes/routines');
const plansRoutes = require('./routes/plans');
const seedHealthyLiving = require('./seeds/healthyLiving');
const seedMentalHealth = require('./seeds/mentalHealth');
const { createOriginChecker } = require('./utils/cors');

const app = express();

// CORS policy lives in utils/cors.js
const isAllowedOrigin = createOriginChecker();

// Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
let mongoConnected = false;

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI is not set - set it in Railway Variables (or backend/.env locally)');
}
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set - login and signup will fail until it is set');
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  mongoConnected = true;
  console.log('MongoDB connected');
  
  // Run seed scripts if collections are empty
  try {
    const Article = require('./models/Article');
    const Recipe = require('./models/Recipe');
    const Video = require('./models/Video');
    const MusicEntry = require('./models/MusicEntry');
    
    const articleCount = await Article.countDocuments();
    const recipeCount = await Recipe.countDocuments();
    const videoCount = await Video.countDocuments();
    const musicCount = await MusicEntry.countDocuments();
    
    // Only seed if all collections are empty
    if (articleCount === 0 && recipeCount === 0 && videoCount === 0) {
      console.log('Healthy Living collections are empty, running seed script...');
      await seedHealthyLiving();
    } else {
      console.log('Healthy Living collections already populated, skipping seed');
    }
    
    // Seed mental health music if collection is empty
    if (musicCount === 0) {
      console.log('Music collection is empty, running seed script...');
      await seedMentalHealth();
    } else {
      console.log('Music collection already populated, skipping seed');
    }
  } catch (seedError) {
    console.error('Error during seeding:', seedError.message);
    // Don't fail the server startup if seeding fails
  }
})
.catch(err => {
  console.log('MongoDB connection error:', err.message);
  console.log('Continuing without database - API will be in offline mode');
});

// Middleware to check MongoDB connection status
app.use((req, res, next) => {
  // Allow auth routes and health check even without database
  if (!mongoConnected && !req.path.startsWith('/health') && !req.path.startsWith('/api/auth')) {
    // For non-auth routes, allow them to proceed but they may return mock data
    console.log(`[OFFLINE MODE] ${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/cycle', cycleRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/routines', routinesRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/healthy-living', healthyLivingRoutes);
// app.use('/api/ai', aiTrainingRoutes); // Auto-train middleware - disabled, using pre-trained Flask ML API
app.use('/api/ai', aiRoutes); // AI endpoints
app.use('/api/supplements', supplementRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/wellness', require('./routes/wellness'));
app.use('/api/search', require('./routes/search'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', database: mongoConnected ? 'connected' : 'disconnected' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
// Bind to 0.0.0.0 so Railway (and other hosts) can reach the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
