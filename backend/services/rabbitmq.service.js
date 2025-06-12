const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            userRegistered: 'user_registered',
            exerciseCompleted: 'exercise_completed',
            workoutCreated: 'workout_created'
        };
        this.exchanges = {
            userEvents: 'user_events',
            exerciseEvents: 'exercise_events',
            workoutEvents: 'workout_events'
        };
    }

    async connect(url) {
        try {
            this.connection = await amqp.connect(url);
            this.channel = await this.connection.createChannel();

            // Exchange'leri oluştur
            await this.channel.assertExchange(this.exchanges.userEvents, 'direct', { durable: true });
            await this.channel.assertExchange(this.exchanges.exerciseEvents, 'direct', { durable: true });
            await this.channel.assertExchange(this.exchanges.workoutEvents, 'direct', { durable: true });

            // Kuyrukları oluştur
            await this.channel.assertQueue(this.queues.userRegistered, { durable: true });
            await this.channel.assertQueue(this.queues.exerciseCompleted, { durable: true });
            await this.channel.assertQueue(this.queues.workoutCreated, { durable: true });

            // Binding'leri oluştur
            await this.channel.bindQueue(this.queues.userRegistered, this.exchanges.userEvents, 'user.registered');
            await this.channel.bindQueue(this.queues.exerciseCompleted, this.exchanges.exerciseEvents, 'exercise.completed');
            await this.channel.bindQueue(this.queues.workoutCreated, this.exchanges.workoutEvents, 'workout.created');

            console.log('RabbitMQ bağlantısı başarılı');
        } catch (error) {
            console.error('RabbitMQ bağlantı hatası:', error);
            throw error;
        }
    }

    async publish(exchange, routingKey, message) {
        try {
            if (!this.channel) {
                throw new Error('RabbitMQ kanalı oluşturulmamış');
            }
            await this.channel.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );
        } catch (error) {
            console.error('Mesaj yayınlama hatası:', error);
            throw error;
        }
    }

    async consume(queue, callback) {
        try {
            if (!this.channel) {
                throw new Error('RabbitMQ kanalı oluşturulmamış');
            }
            await this.channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        this.channel.ack(msg);
                    } catch (error) {
                        console.error('Mesaj işleme hatası:', error);
                        this.channel.nack(msg, false, true);
                    }
                }
            });
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
            console.error('RabbitMQ bağlantısını kapatma hatası:', error);
            throw error;
        }
    }
}

module.exports = new RabbitMQService(); 