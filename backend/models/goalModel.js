const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['weight', 'workout_streak', 'distance', 'strength']
  },
  title: { type: String, required: true },
  description: { type: String },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  unit: { type: String }, // kg, km, days, kg
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  validationData: {
    startDate: { type: Date },
    startValue: { type: Number },
    lastChecked: { type: Date }
  }
});

module.exports = mongoose.model('Goal', goalSchema); 