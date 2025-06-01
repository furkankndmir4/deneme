const mongoose = require('mongoose');

const physicalDataHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  bodyFat: {
    type: Number
  },
  waistCircumference: {
    type: Number
  },
  neckCircumference: {
    type: Number
  },
  hipCircumference: {
    type: Number
  },
  chestCircumference: {
    type: Number
  },
  bicepCircumference: {
    type: Number
  },
  thighCircumference: {
    type: Number
  },
  calfCircumference: {
    type: Number
  },
  shoulderWidth: {
    type: Number
  },
  weightChange: {
    type: Number,
    default: 0
  },
  bodyFatChange: {
    type: Number,
    default: 0
  },
  height: {
    type: Number
  },
  bmi: {
    type: Number
  },
  heightChange: {
    type: Number,
    default: 0
  },
  bmiChange: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('PhysicalDataHistory', physicalDataHistorySchema); 