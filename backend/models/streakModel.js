const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentStreak: { type: Number, default: 0 },
  lastLogin: { type: Date },
  // Diğer alanlar eklenebilir
});

module.exports = mongoose.model('Streak', streakSchema); 