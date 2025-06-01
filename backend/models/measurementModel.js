const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Diğer alanlar eklenebilir
});

module.exports = mongoose.model('Measurement', measurementSchema); 