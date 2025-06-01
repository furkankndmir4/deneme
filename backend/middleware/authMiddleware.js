const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  // Önce Authorization header'ını kontrol et
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Eğer header'da yoksa, doğrudan token olarak gönderilmiş olabilir
  else if (req.headers.authorization) {
    token = req.headers.authorization;
  }

  // Gelen token'ı konsola yazdır
  console.log('Gelen Authorization header:', req.headers.authorization);
  console.log('Çözümlenen token:', token);

  if (!token) {
    return res.status(401).json({ 
      message: 'Yetkilendirme başarısız, token bulunamadı',
      details: 'Authorization header is missing or invalid'
    });
  }

  try {
    // JWT_SECRET kontrolü
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'Sunucu yapılandırma hatası',
        details: 'JWT_SECRET is not configured'
      });
    }

    console.log('Attempting to verify token...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        message: 'Kullanıcı bulunamadı',
        details: 'User associated with token does not exist'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Oturumunuz sonlanmış, lütfen tekrar giriş yapın',
        details: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Geçersiz token',
        details: 'Token is invalid or malformed'
      });
    }

    res.status(401).json({ 
      message: 'Yetkilendirme hatası',
      details: error.message
    });
  }
};

const coach = (req, res, next) => {
  if (req.user && req.user.userType === 'coach') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem sadece antrenörler için geçerlidir' });
  }
};

module.exports = { protect, coach };