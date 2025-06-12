const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rabbitmqService = require('../services/rabbitmq.service');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Kullanıcı zaten var mı kontrol et
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
        }

        // Yeni kullanıcı oluştur
        const user = new User({
            username,
            email,
            password: await bcrypt.hash(password, 10)
        });

        await user.save();

        // RabbitMQ'ya bildirim mesajı gönder
        await rabbitmqService.publishMessage('user_registered', {
            userId: user._id,
            email: user.email,
            username: user.username,
            timestamp: new Date()
        });

        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 