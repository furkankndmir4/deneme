const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://redis:6379'
      });

      this.client.on('error', (err) => console.error('Redis Client Error:', err));
      this.client.on('connect', () => {
        console.log('Redis bağlantısı başarılı');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis bağlantı hatası:', error);
      throw error;
    }
  }

  async set(key, value, expireTime = null) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      const stringValue = JSON.stringify(value);
      if (expireTime) {
        await this.client.set(key, stringValue, { EX: expireTime });
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      console.error('Redis set hatası:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get hatası:', error);
      throw error;
    }
  }

  async delete(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete hatası:', error);
      throw error;
    }
  }

  async increment(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis increment hatası:', error);
      throw error;
    }
  }

  async decrement(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.decr(key);
    } catch (error) {
      console.error('Redis decrement hatası:', error);
      throw error;
    }
  }

  async close() {
    try {
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