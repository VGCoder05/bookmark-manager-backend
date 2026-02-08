const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for all origins (configure for production)
app.use(cors({
  // for vercel (serverless)
    origin: process.env.FRONTEND_URL 

  // for Render or other 
  // origin: process.env.NODE_ENV === 'production' 
  //   ? process.env.FRONTEND_URL 
  //   : '*',
  // credentials: true,
}));

console.log("Entered sever.js");

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Bookmark Manager API is running!',
    version: '1.0.0',
    endpoints: {
      bookmarks: '/bookmarks',
      tags: '/tags',
    },
  });
});

// API Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.use('/bookmarks', require('./routes/bookmarkRoutes'));
app.use('/tags', require('./routes/tagRoutes'));

app.get('/tags-test', (req, res) => {
  res.json({ ok: true });
});

// ============================================
// ERROR HANDLING
// ============================================

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;