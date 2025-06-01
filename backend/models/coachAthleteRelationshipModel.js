const mongoose = require('mongoose');

const coachAthleteRelationshipSchema = mongoose.Schema(
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    initialMessage: {
      type: String,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingProgram',
    },
  },
  {
    timestamps: true,
  }
);

const CoachAthleteRelationship = mongoose.model('CoachAthleteRelationship', coachAthleteRelationshipSchema);

module.exports = CoachAthleteRelationship;