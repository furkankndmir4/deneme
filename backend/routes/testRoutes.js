const express = require('express');
const router = express.Router();
const redisService = require('../services/redis.service');
const rabbitmqService = require('../services/rabbitmq.service');
const User = require('../models/userModel');

// Redis test endpoint'i
router.get('/redis-test', async (req, res) => {
    try {
        // Test verisi oluştur
        const testData = {
            timestamp: new Date().toISOString(),
            message: 'Redis test başarılı!',
            randomNumber: Math.random()
        };

        // Redis'e yaz
        await redisService.set('test:data', testData, 60); // 60 saniye TTL
        console.log('Test verisi Redis\'e yazıldı');

        // Redis'ten oku
        const cachedData = await redisService.get('test:data');
        console.log('Redis\'ten okunan veri:', cachedData);

        // Redis bağlantı durumunu kontrol et
        const isConnected = redisService.isConnected;

        res.json({
            success: true,
            message: 'Redis test tamamlandı',
            redisConnection: isConnected ? 'Bağlı' : 'Bağlı değil',
            testData: cachedData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Redis test hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Redis test hatası',
            error: error.message
        });
    }
});

// Önbellekleme testi için yeni endpoint
router.get('/cache-test', async (req, res) => {
    try {
        const CACHE_KEY = 'users:list';
        const CACHE_DURATION = 60; // 60 saniye

        console.log('Kullanıcı listesi isteği alındı');
        
        // Önce Redis'ten veriyi kontrol et
        console.log('Redis\'ten veri kontrol ediliyor...');
        const cachedUsers = await redisService.get(CACHE_KEY);
        
        if (cachedUsers) {
            console.log('Veriler Redis önbelleğinden alındı');
            return res.json({
                success: true,
                message: 'Veriler Redis önbelleğinden alındı',
                source: 'cache',
                data: cachedUsers,
                timestamp: new Date().toISOString()
            });
        }

        console.log('Veriler veritabanından alınıyor...');
        // Veritabanından kullanıcıları getir
        const users = await User.find().select('-password').limit(5);
        
        // Verileri Redis'e kaydet
        console.log('Veriler Redis\'e kaydediliyor...');
        await redisService.set(CACHE_KEY, users, CACHE_DURATION);
        
        res.json({
            success: true,
            message: 'Veriler veritabanından alındı ve Redis\'e kaydedildi',
            source: 'database',
            data: users,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Önbellekleme testi hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Önbellekleme testi hatası',
            error: error.message
        });
    }
});

// RabbitMQ test endpoint'i
router.post('/rabbitmq-test', async (req, res) => {
    try {
        // Test verisi oluştur
        const testProgram = {
            name: 'Test Antrenman Programı',
            description: 'Bu bir test programıdır',
            difficultyLevel: 'Orta',
            duration: '4 hafta',
            exercises: [
                { name: 'Bench Press', sets: 3, reps: 10 },
                { name: 'Squat', sets: 4, reps: 8 }
            ],
            createdAt: new Date().toISOString()
        };

        // RabbitMQ'ya mesaj gönder
        await rabbitmqService.publishTrainingProgramCreated(testProgram);

        res.json({
            success: true,
            message: 'Test mesajı RabbitMQ\'ya gönderildi',
            data: testProgram,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('RabbitMQ test hatası:', error);
        res.status(500).json({
            success: false,
            message: 'RabbitMQ test hatası',
            error: error.message
        });
    }
});

module.exports = router; 