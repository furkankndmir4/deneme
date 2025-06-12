const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            USER_REGISTERED: 'user_registered',
            EXERCISE_COMPLETED: 'exercise_completed',
            WORKOUT_CREATED: 'workout_created'
        };
    }

    async connect() {
        try {
            this.connection = await amqp.connect('amqp://admin:admin123@localhost:5672');
            this.channel = await this.connection.createChannel();
            
            // Kuyrukları oluştur
            await this.channel.assertQueue(this.queues.USER_REGISTERED);
            await this.channel.assertQueue(this.queues.EXERCISE_COMPLETED);
            await this.channel.assertQueue(this.queues.WORKOUT_CREATED);

            console.log('RabbitMQ bağlantısı başarılı');
        } catch (error) {
            console.error('RabbitMQ bağlantı hatası:', error);
            throw error;
        }
    }

    async publishMessage(queue, message) {
        try {
            if (!this.channel) {
                await this.connect();
            }
            await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
            console.log(`Mesaj gönderildi: ${queue}`, message);
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            throw error;
        }
    }

    async consumeMessages(queue, callback) {
        try {
            if (!this.channel) {
                await this.connect();
            }
            await this.channel.consume(queue, (msg) => {
                if (msg !== null) {
                    const content = JSON.parse(msg.content.toString());
                    callback(content);
                    this.channel.ack(msg);
                }
            });
            console.log(`${queue} kuyruğu dinleniyor`);
        } catch (error) {
            console.error('Mesaj dinleme hatası:', error);
            throw error;
        }
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log('RabbitMQ bağlantısı kapatıldı');
        } catch (error) {
            console.error('Bağlantı kapatma hatası:', error);
            throw error;
        }
    }
}

module.exports = new RabbitMQService(); 