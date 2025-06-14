const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.connectionPromise = null;
    }

    async connect() {
        if (this.isConnected) return;

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise(async (resolve, reject) => {
            try {
                // RabbitMQ bağlantı URL'si
                const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
                
                console.log('RabbitMQ bağlantısı başlatılıyor...');
                this.connection = await amqp.connect(url);
                console.log('RabbitMQ bağlantısı başarılı');

                this.connection.on('error', (err) => {
                    console.error('RabbitMQ bağlantı hatası:', err);
                    this.isConnected = false;
                    this.connection = null;
                    this.channel = null;
                });

                this.connection.on('close', () => {
                    console.log('RabbitMQ bağlantısı kapandı');
                    this.isConnected = false;
                    this.connection = null;
                    this.channel = null;
                });

                this.channel = await this.connection.createChannel();
                console.log('RabbitMQ kanalı oluşturuldu');

                // Exchange'leri tanımla
                await this.channel.assertExchange('training_programs', 'topic', {
                    durable: true
                });

                // Kuyruğu tanımla
                await this.channel.assertQueue('training_program_events', { durable: true });
                console.log('Kuyruk oluşturuldu: training_program_events');

                // Kuyruğu exchange'e bağla
                await this.channel.bindQueue('training_program_events', 'training_programs', 'program.created');
                console.log('Kuyruk exchange bağlandı');

                this.isConnected = true;
                resolve();
            } catch (error) {
                console.error('RabbitMQ bağlantı hatası:', error);
                this.isConnected = false;
                this.connection = null;
                this.channel = null;
                reject(error);
            } finally {
                this.connectionPromise = null;
            }
        });

        return this.connectionPromise;
    }

    async ensureConnection() {
        if (!this.isConnected) {
            await this.connect();
        }
    }

    async publishTrainingProgramCreated(program) {
        try {
            await this.ensureConnection();
            
            const message = Buffer.from(JSON.stringify(program));
            await this.channel.publish(
                'training_programs',
                'program.created',
                message,
                {
                    persistent: true,
                    contentType: 'application/json',
                    timestamp: Date.now()
                }
            );

            console.log('Antrenman programı RabbitMQ\'ya gönderildi:', program.name);
        } catch (error) {
            console.error('RabbitMQ mesaj gönderme hatası:', error);
            throw error;
        }
    }

    async close() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
        this.isConnected = false;
        this.connection = null;
        this.channel = null;
    }
}

// Singleton instance
const rabbitmqService = new RabbitMQService();

module.exports = rabbitmqService; 