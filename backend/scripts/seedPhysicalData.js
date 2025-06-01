// backend/scripts/seedPhysicalData.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PhysicalData = require('../models/physicalDataModel');
const User = require('../models/userModel');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB bağlantısı kuruldu'))
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  });

async function seedPhysicalData() {
  try {
    const user = await User.findOne({ userType: 'athlete' });
    
    if (!user) {
      console.error('Atlet tipi kullanıcı bulunamadı');
      process.exit(1);
    }
    
    await PhysicalData.deleteMany({ user: user._id });
    
    const now = new Date();
    const records = [];
    
    for (let i = 90; i >= 0; i -= 7) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      let startWeight = 80;
      let startBodyFat = 22;
      
      const weightChange = Math.random() * 0.5 - 0.3;
      const bodyFatChange = Math.random() * 0.4 - 0.3;
      
      const weight = startWeight - (i / 90) * 5 + weightChange;
      const bodyFat = startBodyFat - (i / 90) * 4 + bodyFatChange;
      
      const height = 175;
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      
      records.push({
        user: user._id,
        height,
        weight: weight.toFixed(1),
        bodyFat: bodyFat.toFixed(1),
        bmi: bmi.toFixed(1),
        createdAt: date
      });
    }
    
    await PhysicalData.insertMany(records);
    
    console.log(`${records.length} test verisi eklendi!`);
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

seedPhysicalData();