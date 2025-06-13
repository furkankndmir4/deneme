const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('Redis bağlantısı başlatılıyor...');
      const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
      console.log('Redis URL:', redisUrl);

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log('Redis bağlantı denemesi başarısız oldu');
              return new Error('Redis bağlantısı kurulamadı');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
      });

      this.client.on('ready', () => {
        console.log('Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis Client Connection Ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis Client Reconnecting...');
      });

      await this.client.connect();
      console.log('Redis bağlantısı başarılı');
    } catch (error) {
      console.error('Redis bağlantı hatası:', error);
      throw error;
    }
  }

  async set(key, value, expireTime = null) {
    try {
      console.log(`Redis set işlemi başlatıldı - Key: ${key}`);
      if (!this.isConnected) {
        console.log('Redis bağlantısı yok, yeniden bağlanılıyor...');
        await this.connect();
      }
      const stringValue = JSON.stringify(value);
      if (expireTime) {
        console.log(`Redis set işlemi - Key: ${key}, Expire: ${expireTime}s`);
        await this.client.set(key, stringValue, { EX: expireTime });
      } else {
        console.log(`Redis set işlemi - Key: ${key}`);
        await this.client.set(key, stringValue);
      }
      console.log(`Redis set işlemi başarılı - Key: ${key}`);
    } catch (error) {
      console.error('Redis set hatası:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      console.log(`Redis get işlemi başlatıldı - Key: ${key}`);
      if (!this.isConnected) {
        console.log('Redis bağlantısı yok, yeniden bağlanılıyor...');
        await this.connect();
      }
      const value = await this.client.get(key);
      console.log(`Redis get işlemi tamamlandı - Key: ${key}, Value: ${value ? 'Var' : 'Yok'}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get hatası:', error);
      throw error;
    }
  }

  async delete(key) {
    try {
      console.log(`Redis delete işlemi başlatıldı - Key: ${key}`);
      if (!this.isConnected) {
        console.log('Redis bağlantısı yok, yeniden bağlanılıyor...');
        await this.connect();
      }
      await this.client.del(key);
      console.log(`Redis delete işlemi başarılı - Key: ${key}`);
    } catch (error) {
      console.error('Redis delete hatası:', error);
      throw error;
    }
  }

  async increment(key) {
    try {
      console.log(`Redis increment işlemi başlatıldı - Key: ${key}`);
      if (!this.isConnected) {
        console.log('Redis bağlantısı yok, yeniden bağlanılıyor...');
        await this.connect();
      }
      const result = await this.client.incr(key);
      console.log(`Redis increment işlemi başarılı - Key: ${key}, Result: ${result}`);
      return result;
    } catch (error) {
      console.error('Redis increment hatası:', error);
      throw error;
    }
  }

  async decrement(key) {
    try {
      console.log(`Redis decrement işlemi başlatıldı - Key: ${key}`);
      if (!this.isConnected) {
        console.log('Redis bağlantısı yok, yeniden bağlanılıyor...');
        await this.connect();
      }
      const result = await this.client.decr(key);
      console.log(`Redis decrement işlemi başarılı - Key: ${key}, Result: ${result}`);
      return result;
    } catch (error) {
      console.error('Redis decrement hatası:', error);
      throw error;
    }
  }

  async close() {
    try {
      console.log('Redis bağlantısı kapatılıyor...');
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('Redis bağlantısı kapatıldı');
      }
    } catch (error) {
      console.error('Redis bağlantı kapatma hatası:', error);
      throw error;
    }
  }
}

module.exports = new RedisService(); 