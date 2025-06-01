const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['workout', 'cardio', 'meeting', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// İndex oluşturarak userId ve date üzerinden hızlı sorgulama yapılabilir
eventSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);