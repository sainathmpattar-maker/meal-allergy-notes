const path = require('path');
const fs = require('fs');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Fail fast if required environment variables are missing
if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI environment variable is required.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (Render, Heroku, etc.) for accurate client IP in rate limiter
app.set('trust proxy', 1);

// Security middleware with configured CSP for Google Fonts and inline styles
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.AUTH_RATE_LIMIT ? parseInt(process.env.AUTH_RATE_LIMIT) : 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/events', require('./routes/meals'));
app.use('/api/events', require('./routes/registrations'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api', require('./routes/flags'));
app.use('/api/meals', require('./routes/meals'));

// Production: serve client build with fallback for SPA routing
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Central error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  const primaryUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/meal-allergy-notes';

  try {
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully');
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    }
    console.warn(`Primary MongoDB connection failed (${err.message}). Connecting to local MongoDB...`);
    try {
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      console.log('Local MongoDB connected successfully');
    } catch (localErr) {
      console.error('All MongoDB connection attempts failed:', localErr.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();

module.exports = app;
