const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Diğer alanlar eklenebilir
});

module.exports = mongoose.model('Login', loginSchema); 