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
const { createClient } = require('redis');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

dotenv.config();

// JWT Secret kontrolü
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Veritabanı bağlantısı
connectDB();

// Redis bağlantısı
let redisClient = null;
let rateLimiter = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.warn('Redis bağlantı hatası:', err.message);
    });

    await redisClient.connect();
    console.log('Redis bağlantısı başarılı');

    // Rate limiter'ı Redis ile yapılandır
    rateLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      }),
      windowMs: 15 * 60 * 1000, // 15 dakika
      max: 100, // IP başına limit
      message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.'
    });
  } catch (error) {
    console.warn('Redis bağlantısı kurulamadı, memory store kullanılacak:', error.message);
    // Redis bağlantısı başarısız olursa memory store kullan
    rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.'
    });
  }
};

// Redis bağlantısını başlat
connectRedis();

// Rate limiter middleware'ini ekle
app.use(rateLimiter);

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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept,Authorization'
  );
  next();
});

// JSON body parser
app.use(express.json({ limit: '10mb' }));

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