# Running Radiant Health Companion

## Prerequisites

- **Node.js** v16+ and **npm** (download from [nodejs.org](https://nodejs.org))
- **MongoDB** (either local or Atlas cloud - see MongoDB Setup below)

## MongoDB Setup

### Option 1: Local MongoDB
1. Download and install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service (it should run on `mongodb://localhost:27017` by default)
3. In `backend/.env`, the MONGODB_URI is already set to `mongodb://localhost:27017/radiant-health`

### Option 2: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Get your connection string
4. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/radiant-health
   ```

## Step-by-Step Setup

### Terminal 1: Backend Setup & Run

```powershell
# Navigate to backend folder
cd backend

# Install dependencies (run this once)
npm install

# Start the backend server
npm start
```

You should see:
```
MongoDB connected
Server running on http://localhost:5000
```

### Terminal 2: Frontend Setup & Run

```powershell
# From the root directory (not in backend folder)
npm install

# Start the frontend dev server
npm run dev
```

You should see:
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
```

## Access the App

Open your browser and go to: **http://localhost:5173**

You should see the landing page. Click "Sign Up" to create an account.

## File Structure

```
radiant-health-companion-main/
├── backend/                 # Node.js/Express server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth middleware
│   ├── package.json
│   ├── server.js          # Main server file
│   └── .env               # Backend config
│
├── src/                    # React frontend
│   ├── routes/            # Page components
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks (auth, profile, etc)
│   ├── lib/               # API helpers
│   └── styles.css         # Global styles
│
├── .env.local            # Frontend config (VITE_API_URL)
├── package.json
└── vite.config.ts
```

## Environment Variables

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb://localhost:27017/radiant-health
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=development
```

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:5000/api
```

## Stopping the Servers

- **Backend**: Press `Ctrl+C` in Terminal 1
- **Frontend**: Press `Ctrl+C` in Terminal 2

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check connection string in `backend/.env`
- For local MongoDB: `mongod` command starts the server

### Port Already in Use
- Backend (5000): `netstat -ano | findstr :5000` then kill the process
- Frontend (5173): Vite will automatically use next available port

### Dependencies Installation Issues
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

## Features Available

✅ **Authentication**: Sign up, login, logout
✅ **Workouts**: Log and track workouts
✅ **Meals**: Log meals, generate meal plans, swap meals
✅ **Sleep**: Track sleep duration and quality
✅ **Mental Health**: Log mood and stress levels
✅ **Cycle Tracking**: For female users (if gender set to 'female')
✅ **Goals**: Set and track wellness goals
✅ **Reminders**: Create wellness reminders
✅ **Responsive UI**: Works on desktop and mobile

## Next Steps

1. Sign up with email and password
2. Complete onboarding (set gender, TDEE, dietary preferences)
3. Start logging workouts, meals, sleep, etc.
4. View dashboards and analytics

## Development Notes

- Frontend uses Vite with React Router
- Backend uses Express with MongoDB
- Authentication: JWT tokens stored in localStorage
- API requests automatically include JWT token in Authorization header

## Production Deployment

Before deploying:

1. Change `JWT_SECRET` in `backend/.env` to a strong random string
2. Update `MONGODB_URI` to production MongoDB instance
3. Set `NODE_ENV=production` in backend
4. Update `VITE_API_URL` to production backend URL
5. Run `npm run build` in frontend for optimized build
