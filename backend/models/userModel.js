const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Profile = require('./profileModel');
const PhysicalData = require('./physicalDataModel');
const Friend = require('./friendModel');
const Message = require('./messageModel');
const TrainingProgram = require('./trainingProgramModel');
const CoachAthleteRelationship = require('./coachAthleteRelationshipModel');
const Achievement = require('./achievementModel');
const Event = require('./Event');

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ['athlete', 'coach'],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    },
    physicalData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhysicalData',
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    achievements: [
      {
        id: { type: String, required: true },
        earned: { type: Boolean, default: false },
        earnedDate: Date
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Şifre karşılaştırma metodu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Kaydetmeden önce şifreyi hash'leme
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Cascade delete profile and physical data when a user is removed
userSchema.pre('remove', async function(next) {
  try {
    if (this.profile) {
      await Profile.deleteOne({ _id: this.profile });
    }
    await PhysicalData.deleteMany({ user: this._id });
    await Friend.deleteMany({ $or: [{ requester: this._id }, { recipient: this._id }] });
    await Message.deleteMany({ $or: [{ sender: this._id }, { receiver: this._id }] });
    await TrainingProgram.deleteMany({ $or: [{ createdBy: this._id }, { athlete: this._id }] });
    await CoachAthleteRelationship.deleteMany({ $or: [{ coach: this._id }, { athlete: this._id }] });
    await Achievement.deleteMany({ user: this._id });
    await Event.deleteMany({ userId: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;