const mongoose = require('mongoose');

const trainingProgramSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    duration: {
      value: { type: Number },
      type: { type: String, enum: ['day', 'week', 'month'] }
    },
    programDays: [{ type: Number }],
    // Program sahibi - sporcu
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    workouts: [
      {
        day: {
          type: Number, // Haftanın günü (1: Pazartesi, ... 7: Pazar)
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        exercises: [
          {
            name: {
              type: String,
              required: true,
            },
            sets: {
              type: Number,
              required: true,
            },
            reps: {
              type: String,
              required: true,
            },
            notes: {
              type: String,
            },
            optType: {
              type: String,
            }
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const TrainingProgram = mongoose.model('TrainingProgram', trainingProgramSchema);

module.exports = TrainingProgram;