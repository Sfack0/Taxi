# Comfort Transfer Services - Taxi Booking Platform

**Tagline:** "Your Ride, Your Way"

A modern, professional taxi booking web application built with React, TypeScript, Express, and MongoDB.

## Features

- User authentication and authorization
- Real-time ride booking
- Multiple vehicle types (Sedan, SUV, Luxury, Electric)
- Dynamic pricing based on distance and duration
- Live ride tracking
- Ride history and ratings
- Responsive, minimalistic design

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- Axios (API client)

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- RESTful API

### Architecture
- Monorepo structure with npm workspaces
- Shared TypeScript types package
- Separate frontend and backend packages

## Project Structure

```
TAXI/
├── packages/
│   ├── frontend/    # React application
│   ├── backend/     # Express API server
│   └── shared/      # Shared TypeScript types
├── package.json     # Root package.json with workspaces
└── tsconfig.base.json
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB running locally on `mongodb://localhost:27017`
  - Install MongoDB: https://www.mongodb.com/try/download/community
  - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### Quick Start

1. **Install dependencies** (already done if you ran `npm install`):
```bash
cd TAXI
npm install
```

2. **Start MongoDB** (if using local):
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

3. **Start the application**:
```bash
# From the TAXI directory, run both frontend and backend:
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

### Testing the Application

1. **Open your browser** to http://localhost:5173
2. **Create an account** by clicking "Sign Up"
3. **Fill in your details** and register
4. **Login** with your credentials
5. **You're in!** The authentication system is fully functional

### API Endpoints

All endpoints are prefixed with `/api/v1`:

**Authentication**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user

**Users**
- `GET /api/v1/users/profile` - Get current user profile (requires auth)
- `PUT /api/v1/users/profile` - Update user profile (requires auth)

**Rides**
- `POST /api/v1/rides` - Create new ride (requires auth)
- `GET /api/v1/rides` - Get user's rides (requires auth)
- `GET /api/v1/rides/:id` - Get specific ride (requires auth)
- `POST /api/v1/rides/estimate` - Get price estimate (public)
- `PATCH /api/v1/rides/:id/cancel` - Cancel ride (requires auth)
- `POST /api/v1/rides/:id/rate` - Rate completed ride (requires auth)

### Testing with curl

```bash
# Health check
curl http://localhost:5000/health

# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'

# Get price estimate
curl -X POST http://localhost:5000/api/v1/rides/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {"lat": 40.7128, "lng": -74.0060},
    "dropoff": {"lat": 40.7589, "lng": -73.9851}
  }'
```

### Development Scripts

```bash
# Run both frontend and backend concurrently
npm run dev

# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend

# Build all packages
npm run build

# Type check all packages
npm run type-check
```

## Branding

**Colors:**
- Primary: Sky Blue (#0ea5e9) - Trust, reliability
- Secondary: Amber (#f59e0b) - Energy, movement
- Accent: Emerald (#10b981) - Success, confirmation

## License

Private
