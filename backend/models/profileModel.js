const mongoose = require('mongoose');

const profileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    fullName: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    photoUrl: {
      type: String,
    },
    goalType: {
      type: String,
      enum: ['fat_loss', 'muscle_gain', 'maintenance', 'endurance'],
      default: 'maintenance'
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      default: 'moderate'
    },
    goals: {
      type: String,
      default: ''
    },
    coachNote: {
      type: String,
      default: ''
    },
    specialization: {
      type: String,
      default: ''
    },
    // Privacy alanını ekleyin
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends_only', 'private'],
        default: 'public'
      },
      showAge: {
        type: Boolean,
        default: true
      },
      showWeight: {
        type: Boolean,
        default: true
      },
      showHeight: {
        type: Boolean,
        default: true
      },
      showBodyMeasurements: {
        type: Boolean,
        default: true
      },
      showAchievements: {
        type: Boolean, 
        default: true
      },
      showGoals: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;