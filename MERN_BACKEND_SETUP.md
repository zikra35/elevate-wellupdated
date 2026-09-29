# MERN Backend Setup Guide

## Project Structure

```
backend/
├── config/
│   └── db.js          # MongoDB connection
├── models/
│   ├── User.js
│   ├── Workout.js
│   ├── Meal.js
│   ├── Sleep.js
│   ├── MentalHealth.js
│   └── ...
├── routes/
│   ├── auth.js        # Login, signup, refresh
│   ├── workouts.js
│   ├── meals.js
│   ├── sleep.js
│   ├── mental-health.js
│   └── ...
├── middleware/
│   ├── auth.js        # JWT verification
│   └── errorHandler.js
├── controllers/
│   ├── authController.js
│   ├── workoutController.js
│   └── ...
├── .env
├── package.json
└── server.js
```

## Installation

### 1. Create Backend Directory

```bash
mkdir backend
cd backend
npm init -y
```

### 2. Install Dependencies

```bash
npm install express mongoose dotenv cors jsonwebtoken bcryptjs
npm install --save-dev nodemon
```

### 3. Create `.env` file

```env
MONGODB_URI=mongodb://localhost:27017/radiant-health-companion
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=development
```

### 4. Create Core Files

#### `server.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/sleep', require('./routes/sleep'));
app.use('/api/mental-health', require('./routes/mental-health'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 5. Create Middleware - `middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

### 6. Create Models - `models/User.js`

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String,
  avatar_seed: String,
  avatar_config: mongoose.Schema.Types.Mixed,
  gender: String,
  onboarding_completed: { type: Boolean, default: false },
  tdee: Number,
  dietary_preferences: [String],
  created_at: { type: Date, default: Date.now },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### 7. Create Auth Routes - `routes/auth.js`

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User exists' });

    user = new User({ email, password, name });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar_seed: user.avatar_seed,
        avatar_config: user.avatar_config,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar_seed: user.avatar_seed,
        avatar_config: user.avatar_config,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
```

### 8. Update Frontend `.env`

Add to your frontend `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Backend

```bash
npm start
# or with nodemon:
npm run dev
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Workouts
- `POST /api/workouts` - Save workout
- `GET /api/workouts?userId=...&days=30` - Get workouts
- `DELETE /api/workouts/:id` - Delete workout

### Meals
- `POST /api/meals` - Save meal
- `GET /api/meals?userId=...&date=YYYY-MM-DD` - Get meals
- `DELETE /api/meals/:id` - Delete meal
- `POST /api/meals/generate` - Generate AI meal plan
- `POST /api/meals/swap` - Swap meal in plan

### Sleep
- `POST /api/sleep` - Save sleep log
- `GET /api/sleep?userId=...&days=30` - Get sleep logs

### Mental Health
- `POST /api/mental-health` - Save mental health log
- `GET /api/mental-health?userId=...&days=30` - Get logs

### Additional Endpoints
Implement similar patterns for:
- `/api/cycle` - Cycle tracking
- `/api/goals` - Wellness goals
- `/api/reminders` - Reminders
- `/api/profile` - User profile

## Notes

- Use MongoDB Atlas for cloud database or local MongoDB
- Ensure JWT_SECRET is strong and secure
- Implement rate limiting for production
- Add input validation and sanitization
- Consider adding request logging middleware
- Deploy backend to platforms like Heroku, Railway, or Render
