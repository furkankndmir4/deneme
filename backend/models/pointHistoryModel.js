const mongoose = require('mongoose');

const pointHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // ör: 'workout', 'nutrition', 'login', 'friend', 'message', 'streak', 'achievement', 'goal'
  reason: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PointHistory', pointHistorySchema); 