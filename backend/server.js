#!/usr/bin/env node
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const athleteRoutes = require('./routes/athleteRoutes');
const coachRoutes = require('./routes/coachRoutes');
const friendRoutes = require('./routes/friendRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');
const trainingProgramRoutes = require('./routes/trainingProgramRoutes');
const eventRoutes = require('./routes/eventRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const messageRoutes = require('./routes/messageRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const goalController = require('./controllers/goalController');
const goalRoutes = require('./routes/goalRoutes');
const User = require('./models/userModel');

dotenv.config();

// Veritabanı bağlantısı
connectDB();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// CORS yapılandırması
const allowedOrigins = [
  'https://denemefrontend-indol.vercel.app',
  'https://denemebackend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('Request Origin:', origin);
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 saat
  } else {
    console.log('Blocked origin:', origin);
  }

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  next();
});

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// Static dosyalar
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Test endpointi
app.get('/api/healthcheck', (req, res) => {
  console.log('Healthcheck endpoint called');
  res.status(200).json({
    status: 'active',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/training-programs', trainingProgramRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/goals', goalRoutes);

// Hata yönetimi middleware'leri
app.use(notFound);
app.use(errorHandler);

// Periyodik görevler
setInterval(async () => {
  try {
    const users = await User.find({});
    for (const user of users) {
      await goalController.validateGoals({ user: { _id: user._id } });
    }
  } catch (error) {
    console.error('Hedef doğrulama hatası:', error);
  }
}, 3600000);

const PORT = process.env.PORT || 5000;

// Sunucuyu başlat
const server = app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log('CORS Origins:', cors.origin);
});

// Vercel için export
module.exports = app;