const { createClient } = require('redis');

// Redis client oluştur
const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false
    }
});

// Redis event listeners
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('ready', () => console.log('Redis Client Ready'));

// Redis bağlantısını başlat
const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis Cloud bağlantısı başarılı');
        
        // Test verisi yaz
        await redisClient.set('test', 'Redis bağlantısı çalışıyor');
        const testValue = await redisClient.get('test');
        console.log('Redis test değeri:', testValue);
    } catch (error) {
        console.error('Redis Cloud bağlantı hatası:', error);
        process.exit(1);
    }
};

// Redis client'ı dışa aktar
module.exports = {
    redisClient,
    connectRedis
}; 