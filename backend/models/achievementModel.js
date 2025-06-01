const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievements: [
    {
      id: { type: String, required: true },
      title: String,
      description: String,
      iconType: String,
      iconColor: String,
      earned: { type: Boolean, default: false },
      earnedDate: Date,
      progress: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema); 