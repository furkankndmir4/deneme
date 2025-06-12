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
const rabbitmqService = require('./services/rabbitmq.service');
const redisService = require('./services/redis.service');

dotenv.config();

// JWT Secret kontrolü
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Veritabanı bağlantısı
connectDB();

// Redis bağlantısını başlat
(async () => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      await redisService.connect();
      console.log('Redis bağlantısı başarılı');
      break;
    } catch (error) {
      retryCount++;
      console.error(`Redis bağlantı hatası (Deneme ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount === maxRetries) {
        console.log('Redis bağlantısı olmadan devam ediliyor...');
      } else {
        // 5 saniye bekle ve tekrar dene
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
})();

// Rate limiting middleware
const rateLimiter = async (req, res, next) => {
  try {
    const ip = req.ip;
    const key = `rate_limit:${ip}`;
    const limit = 100; // 1 dakikada maksimum istek sayısı
    const window = 60; // 60 saniye

    const current = await redisService.increment(key);
    if (current === 1) {
      await redisService.set(key, 1, window);
    }

    if (current > limit) {
      return res.status(429).json({
        message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.'
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiting hatası:', error);
    next();
  }
};

// RabbitMQ bağlantısını başlat
(async () => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      await rabbitmqService.connect();
      console.log('RabbitMQ bağlantısı başarılı');

      // RabbitMQ mesaj dinleyicilerini başlat
      await rabbitmqService.consume(rabbitmqService.queues.userRegistered, async (message) => {
        console.log('Yeni kullanıcı kaydı:', message);
      });

      await rabbitmqService.consume(rabbitmqService.queues.exerciseCompleted, async (message) => {
        console.log('Egzersiz tamamlandı:', message);
      });

      await rabbitmqService.consume(rabbitmqService.queues.workoutCreated, async (message) => {
        console.log('Yeni antrenman planı oluşturuldu:', message);
      });
      
      break;
    } catch (error) {
      retryCount++;
      console.error(`RabbitMQ bağlantı hatası (Deneme ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount === maxRetries) {
        console.log('RabbitMQ bağlantısı olmadan devam ediliyor...');
      } else {
        // 5 saniye bekle ve tekrar dene
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
})();

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
  'http://localhost:3000',
  'http://localhost:5001'
];

// Yeni CORS yapılandırması
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware'i uygula
app.use(rateLimiter);

// Static dosyalar
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Test endpointi
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    message: 'FitWeb API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/healthcheck', (req, res) => {
  console.log('Healthcheck endpoint called');
  res.status(200).json({
    status: 'active',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
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

const PORT = process.env.PORT || 5001;

// Sunucuyu başlat
const server = app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
});

// Vercel için export
module.exports = app;