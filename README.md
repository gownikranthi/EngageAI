# EngageAI - Complete MERN Stack Application

A comprehensive real-time event engagement platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.IO for live interactions.

## 🏗 Project Structure

```
EngageAI/
├── backend/          # Node.js + Express API server
│   ├── config/       # Database configuration
│   ├── middleware/   # Authentication & validation
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API endpoints
│   ├── socket/       # Socket.IO handlers
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend documentation
└── frontend/         # React.js frontend (coming soon)
```

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your configuration
   MONGO_URI=mongodb://localhost:27017/engageai
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the backend server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The backend will be running on `http://localhost:5000`

### Frontend Setup (Coming Soon)

The frontend will be added to the `frontend/` directory and will include:
- React.js with modern hooks
- Real-time Socket.IO integration
- Beautiful UI with Tailwind CSS
- Event management interface
- Live engagement tracking
- Admin dashboard

## 🔧 Features

### Backend Features ✅
- **Authentication**: JWT-based auth with role-based access
- **Real-time Communication**: Socket.IO for live interactions
- **Engagement Tracking**: Comprehensive scoring system
- **Admin Analytics**: Detailed reporting and metrics
- **Input Validation**: Robust validation with express-validator
- **Security**: Helmet.js, CORS, password hashing
- **Scalable Architecture**: Modular design with clear separation

### Frontend Features (Coming Soon)
- **User Authentication**: Login/Register with JWT
- **Event Management**: Create, join, and manage events
- **Real-time Engagement**: Live polls, Q&A, downloads
- **Live Dashboard**: Real-time participant tracking
- **Admin Panel**: Analytics and event management
- **Responsive Design**: Mobile-first approach

## 📊 API Documentation

The backend provides a comprehensive REST API with the following endpoints:

- **Authentication**: `/api/v1/auth/register`, `/api/v1/auth/login`
- **Events**: `/api/v1/events`, `/api/v1/events/:id`, `/api/v1/events/:id/join`
- **Engagement**: `/api/v1/engage/download`
- **Scores**: `/api/v1/scores/:userId/:eventId`
- **Admin**: `/api/v1/admin/analytics/:eventId`

### Socket.IO Events

- **Client → Server**: `session:join`, `poll:submit`, `qa:submit`
- **Server → Client**: `session:update`, `poll:update`, `qa:new`

## 🎯 Scoring System

- **Poll Score**: 10 points per poll participation
- **QA Score**: 15 points per Q&A participation  
- **Download Score**: 5 points per download
- **Time Score**: 0.2 points per minute of participation

## 🛠 Tech Stack

### Backend
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend (Coming Soon)
- **React.js** - UI library
- **Socket.IO Client** - Real-time communication
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

## 🚀 Deployment

### Backend Deployment
The backend is ready for deployment on:
- **Heroku** - Add MongoDB addon
- **Railway** - Connect GitHub repo
- **Render** - Deploy from GitHub
- **Vercel** - Serverless deployment

### Frontend Deployment (Coming Soon)
The frontend will be deployable on:
- **Vercel** - Recommended for React apps
- **Netlify** - Static site hosting
- **GitHub Pages** - Free hosting

## 📝 Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development (Coming Soon)
```bash
cd frontend
npm start    # Start React development server
```

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
- Check the backend documentation in `backend/README.md`
- Review the API documentation
- Create an issue in the repository

---

**EngageAI** - Building engaging real-time experiences with the MERN stack! 🚀 