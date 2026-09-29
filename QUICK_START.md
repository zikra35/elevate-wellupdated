# Quick Start Guide - Radiant Health Platform

## 🚀 Start the Application

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Step 1: Start Backend Server
```bash
cd radiant-health-companion-main/backend
npm run dev
```
✅ Backend running on: **http://localhost:5000**

### Step 2: Start Frontend Server (in new terminal)
```bash
cd radiant-health-companion-main
npm run dev
```
✅ Frontend running on: **http://localhost:8080**

### Step 3: Open in Browser
Navigate to: **http://localhost:8080**

---

## 🔐 Login Credentials

### Offline Mode (No Database Required)
- **Email**: `demo@example.com`
- **Password**: Any value (e.g., `password`, `123456`, etc.)

The app will automatically log you in with mock data.

---

## 🎨 New Color Palette

### Primary Colors
- **Soft Teal/Mint**: `#6ECFCF` - Secondary accents, badges
- **Coral/Salmon**: `#F07A5A` - Primary buttons, highlights

### Background
- **Main**: Off-white/light beige `#F5F0EB`
- **Cards**: Pure white `#FFFFFF`

### Text
- **Headings**: Dark charcoal `#2C2C2C`
- **Subtext**: Medium grey `#9A9A9A`

---

## 📱 Features to Explore

### 1. Dashboard
- Health overview
- Progress tracking
- Daily stats

### 2. Workouts
- Browse 20+ pre-built workouts
- **Route Tracker**: Live GPS tracking with map
- Custom workout builder
- Workout history

### 3. Meals
- 10 recipes with real images
- Meal planning
- Dietary preferences
- Nutrition tracking

### 4. Healthy Living
- 5 expert articles
- 8 instructional videos (real YouTube URLs)
- Nutrition guides
- Wellness tips

### 5. Mental Health
- 12 meditation/music tracks
- Mood tracking
- Relaxation guides
- Sleep sounds

### 6. Programs
- Structured fitness programs
- Progress tracking
- Goal management

### 7. Profile
- Personal health data
- Cycle tracking (for female users)
- Preferences
- Settings

---

## 🗺️ Route Tracker (GPS Feature)

### How to Use
1. Go to **Workouts** page
2. Scroll to **Route Tracker** section
3. Click **"Start Run"** button
4. Allow location access when prompted
5. Your route will be tracked on the map in real-time
6. View stats: Distance, Steps, Calories, Time, Pace
7. Click **"Pause"** to pause tracking
8. Click **"Resume"** to continue
9. Click **"Stop"** to end the session

### Requirements
- GPS-enabled device (phone/tablet)
- Location permission granted
- Active internet connection

---

## 📹 Real Video Content

### Mental Health Videos
- Peaceful Piano meditation
- Ocean Waves ambient
- Lo-Fi study beats
- Binaural focus frequencies
- Sleep meditation
- And more...

### Healthy Living Videos
- Morning meditation
- Evening relaxation
- Beginner yoga flow
- Advanced vinyasa
- Nutrition basics
- Meal prep guide
- Full body workout
- Core strengthening

All videos are real YouTube videos that will play directly in the app.

---

## 🍽️ Real Recipes

### Available Recipes
1. Protein-Packed Breakfast Smoothie Bowl
2. Vegan Buddha Bowl
3. Mediterranean Grilled Salmon
4. Keto Cauliflower Mac and Cheese
5. Paleo Energy Balls
6. Gluten-Free Quinoa Salad
7. High-Protein Chicken Stir-Fry
8. Dairy-Free Coconut Chia Pudding
9. Mediterranean Hummus Wrap
10. Dark Chocolate Avocado Mousse

Each recipe includes:
- Real food image
- Ingredients list
- Step-by-step instructions
- Prep/cook time
- Servings
- Calories per serving
- Dietary tags

---

## 📚 Expert Articles

### Available Articles
1. **The Complete Guide to Balanced Nutrition** - Dr. Sarah Mitchell
2. **Building Strength: A Beginner's Fitness Journey** - Coach James Rodriguez
3. **Mindfulness and Mental Wellness in Daily Life** - Dr. Emma Chen
4. **The Science of Quality Sleep and Recovery** - Dr. Michael Thompson
5. **Holistic Wellness: Integrating Mind, Body, and Spirit** - Wellness Coach Lisa Anderson

Each article includes:
- Professional author credentials
- Realistic read time
- Comprehensive content
- Real Unsplash images

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Clear node_modules and reinstall
cd backend
rm -r node_modules
npm install
npm run dev
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm run dev
```

### Port already in use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 8080 (frontend)
lsof -ti:8080 | xargs kill -9
```

### GPS not working
- Ensure location permission is granted
- Check browser console for errors
- Try in a different browser
- Ensure device has GPS capability

### Videos not loading
- Check internet connection
- Verify YouTube is accessible
- Try refreshing the page
- Check browser console for errors

---

## 📊 Offline Mode

The app runs in **offline mode** by default, which means:
- ✅ No database connection required
- ✅ All features work with mock data
- ✅ Perfect for testing and development
- ✅ No setup needed

To connect a real database later:
1. Set up MongoDB
2. Update `.env` files with connection string
3. Restart backend server

---

## 🎯 What's New

### Color Palette
- Warm, approachable wellness theme
- Soft contrast with pastel pops
- Modern health app design
- Accessible and eye-friendly

### Real Content
- Real YouTube videos (not placeholders)
- Real food images from Unsplash
- Expert-written articles
- Professional author credentials

### GPS Route Tracker
- Live location tracking
- Real-time distance calculation
- Step and calorie estimation
- Beautiful map visualization

### Offline Mode
- Full app functionality without database
- Perfect for demos and testing
- No setup required

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `IMPLEMENTATION_COMPLETE.md` for full documentation
3. Check `COLOR_PALETTE_UPDATE.md` for color details
4. Review `BACKEND_API.md` for API documentation

---

## 🎉 You're All Set!

The Radiant Health Platform is ready to use. Enjoy exploring all the features!

**Happy coding! 💪**
