const mongoose = require('mongoose');

const coachRatingSchema = mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per athlete-coach pair
coachRatingSchema.index({ coach: 1, athlete: 1 }, { unique: true });

const CoachRating = mongoose.model('CoachRating', coachRatingSchema);

module.exports = CoachRating; 