const mongoose = require('mongoose');

const physicalDataSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    height: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    bodyFat: {
      type: Number,
    },
    bmi: {
      type: Number,
    },
    bmr: {
      type: Number, // Bazal Metabolizma Hızı
    },
    tdee: {
      type: Number, // Toplam Günlük Enerji Harcaması
    },
    goalCalories: {
      type: Number, // Hedefe göre kalori hedefi
    },
    proteinGrams: {
      type: Number, // Günlük protein gram hedefi
    },
    carbGrams: {
      type: Number, // Günlük karbonhidrat gram hedefi
    },
    fatGrams: {
      type: Number, // Günlük yağ gram hedefi
    },
    neckCircumference: { 
      type: Number,
    },
    waistCircumference: { 
      type: Number,
    },
    hipCircumference: { 
      type: Number,
    },
    chestCircumference: {
      type: Number,
    },
    bicepCircumference: {
      type: Number,
    },
    thighCircumference: {
      type: Number,
    },
    calfCircumference: {
      type: Number,
    },
    shoulderWidth: {
      type: Number,
    },
    weightChange: {
      type: Number,
      default: 0
    },
    bodyFatChange: {
      type: Number,
      default: 0
    },
    heightChange: {
      type: Number,
      default: 0
    },
    bmiChange: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// BMI hesaplama
physicalDataSchema.pre('save', function (next) {
  if (this.height && this.weight) {
    // BMI = kg / m^2
    const heightInMeters = this.height / 100;
    this.bmi = this.weight / (heightInMeters * heightInMeters);
  }
  next();
});

const PhysicalData = mongoose.model('PhysicalData', physicalDataSchema);

module.exports = PhysicalData;