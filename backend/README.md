# EngageAI Backend

A robust, scalable, and secure backend API for EngageAI, a MERN stack application designed for real-time event engagement tracking.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Real-time Communication**: Socket.IO integration for live event interactions
- **Engagement Tracking**: Comprehensive scoring system for user participation
- **Admin Analytics**: Detailed analytics and reporting for administrators
- **Input Validation**: Robust validation using express-validator
- **Security**: Helmet.js for security headers, CORS protection
- **Scalable Architecture**: Modular design with clear separation of concerns

## 🛠 Tech Stack

- **Node.js** (v18+)
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js v18 or higher
- MongoDB instance (local or cloud)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/engageai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000

# CORS Configuration (for Vercel frontend)
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 3. Start Development Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📊 Database Models

### User
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['student', 'admin'], default: 'student')
}
```

### Event
```javascript
{
  name: String (required),
  description: String (required),
  startTime: Date (required),
  endTime: Date (required),
  createdBy: ObjectId (ref: 'User', required)
}
```

### Participation
```javascript
{
  userId: ObjectId (ref: 'User', required),
  eventId: ObjectId (ref: 'Event', required),
  joinTime: Date (default: Date.now),
  lastSeen: Date (default: Date.now)
}
```

### Engagement
```javascript
{
  userId: ObjectId (ref: 'User', required),
  eventId: ObjectId (ref: 'Event', required),
  action: String (enum: ['poll', 'qa', 'download'], required),
  metadata: Object,
  timestamp: Date (default: Date.now)
}
```

## 🔌 API Endpoints

### Authentication

#### POST `/api/v1/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### POST `/api/v1/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Events

#### GET `/api/v1/events`
Get all events.

#### GET `/api/v1/events/:id`
Get specific event details.

#### POST `/api/v1/events/:id/join`
Join an event (requires authentication).

### Engagement

#### POST `/api/v1/engage/download`
Record a download engagement (requires authentication).

**Request Body:**
```json
{
  "eventId": "event_id",
  "metadata": {
    "fileName": "document.pdf"
  }
}
```

### Scores

#### GET `/api/v1/scores/:userId/:eventId`
Get user engagement scores for an event (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalScore": 85.5,
    "breakdown": {
      "pollScore": 30,
      "qaScore": 45,
      "downloadScore": 10,
      "timeScore": 0.5
    }
  }
}
```

### Admin

#### GET `/api/v1/admin/analytics/:eventId`
Get event analytics (requires admin role).

## 🔌 Socket.IO Events

### Client to Server

#### `session:join`
Join an event session.

**Data:**
```json
{
  "eventId": "event_id"
}
```

#### `poll:submit`
Submit a poll response.

**Data:**
```json
{
  "eventId": "event_id",
  "pollId": "poll_id",
  "question": "What's your favorite color?",
  "answer": "Blue"
}
```

#### `qa:submit`
Submit a Q&A.

**Data:**
```json
{
  "eventId": "event_id",
  "question": "How does this work?",
  "answer": "It works by..."
}
```

### Server to Client

#### `session:update`
Update session with participant list.

#### `poll:update`
Update poll results.

#### `qa:new`
New Q&A submission.

#### `error`
Error message.

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 🎯 Scoring System

- **Poll Score**: 10 points per poll participation
- **QA Score**: 15 points per Q&A participation
- **Download Score**: 5 points per download
- **Time Score**: 0.2 points per minute of participation

## 🛡 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation with express-validator
- Security headers with helmet
- CORS protection
- Role-based access control

## 🚀 Deployment

### Environment Variables for Production

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/engageai
JWT_SECRET=your-very-secure-jwt-secret-key
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Deployment Platforms

- **Heroku**: Add MongoDB addon and set environment variables
- **Railway**: Connect GitHub repo and set environment variables
- **Render**: Deploy from GitHub with environment variables
- **Vercel**: Use Vercel CLI for serverless deployment

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "message": "string",
  "data": object | array,
  "errors": array (optional)
}
```

## 🔧 Development

### Project Structure

```
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   ├── admin.js
│   └── validation.js
├── models/
│   ├── User.js
│   ├── Event.js
│   ├── Participation.js
│   └── Engagement.js
├── routes/
│   ├── auth.js
│   ├── events.js
│   ├── engagement.js
│   ├── scores.js
│   └── admin.js
├── socket/
│   └── socketHandler.js
├── server.js
├── package.json
└── README.md
```

### Adding New Features

1. Create model in `models/` directory
2. Add routes in `routes/` directory
3. Update validation in `middleware/validation.js`
4. Add Socket.IO handlers if needed
5. Update documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the Socket.IO events documentation

---

**EngageAI Backend** - Built with ❤️ for real-time event engagement 