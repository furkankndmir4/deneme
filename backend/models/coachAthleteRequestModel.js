const mongoose = require('mongoose');

const coachAthleteRequestSchema = mongoose.Schema({
  athlete: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CoachAthleteRequest', coachAthleteRequestSchema); 