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
const { connectRedis } = require('./utils/redis');

dotenv.config();

// JWT Secret kontrolü
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Express uygulamasını oluştur
const app = express();

// CORS yapılandırması
const allowedOrigins = [
  'https://denemefrontend-indol.vercel.app',
  'https://denemebackend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5001'
];

app.set('trust proxy', 1);

// Yeni CORS yapılandırması
app.use(cors({
  origin: function(origin, callback) {
    // origin undefined olabilir (örn. Postman gibi araçlardan gelen istekler)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 saat
}));

// MongoDB bağlantısını başlat
connectDB();

// Redis bağlantısı
let redisClient = null;

// Rate limiter yapılandırması
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına limit
  message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  keyGenerator: (req) => {
    // X-Forwarded-For header'ını kontrol et
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // İlk IP adresini al (proxy zincirindeki orijinal client IP)
      const clientIp = forwardedFor.split(',')[0].trim();
      return clientIp;
    }
    // X-Forwarded-For yoksa normal IP'yi kullan
    return req.ip;
  }
});

const connectRedis = async () => {
  try {
    // Docker veya Vercel ortamına göre Redis URL'ini belirle
    const redisUrl = process.env.NODE_ENV === 'production' 
      ? process.env.REDIS_URL 
      : 'redis://redis:6379';

    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on('error', (err) => {
      console.warn('Redis bağlantı hatası:', err.message);
    });

    await redisClient.connect();
    console.log('Redis bağlantısı başarılı');
  } catch (error) {
    console.warn('Redis bağlantısı kurulamadı:', error.message);
  }
};

// Redis bağlantısını başlat
connectRedis();

// Rate limiter middleware'ini ekle
app.use(rateLimiter);

// RabbitMQ bağlantısını başlat
const connectRabbitMQ = async () => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Docker veya Vercel ortamına göre RabbitMQ URL'ini belirle
      const rabbitmqUrl = process.env.NODE_ENV === 'production'
        ? process.env.RABBITMQ_URL
        : 'amqp://rabbitmq:5672';

      await rabbitmqService.connect(rabbitmqUrl);
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
};

// RabbitMQ bağlantısını başlat
connectRabbitMQ();

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// Static dosyalar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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