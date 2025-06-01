const Goal = require('../models/goalModel');
const PhysicalData = require('../models/physicalDataModel');
const PointHistory = require('../models/pointHistoryModel');
const { addPoints } = require('../utils/points');

// Önceden tanımlanmış hedefler
const PREDEFINED_GOALS = {
  weight: [
    {
      title: '5kg Kilo Verme',
      description: '5 kilogram kilo verme hedefi',
      targetValue: 5,
      unit: 'kg',
      points: 100
    },
    {
      title: '10kg Kilo Verme',
      description: '10 kilogram kilo verme hedefi',
      targetValue: 10,
      unit: 'kg',
      points: 200
    }
  ],
  workout_streak: [
    {
      title: '30 Günlük Antrenman Serisi',
      description: '30 gün üst üste antrenman yapma hedefi',
      targetValue: 30,
      unit: 'days',
      points: 300
    }
  ],
  distance: [
    {
      title: '100km Koşu',
      description: 'Toplam 100 kilometre koşma hedefi',
      targetValue: 100,
      unit: 'km',
      points: 150
    }
  ],
  strength: [
    {
      title: 'Bench Press 100kg',
      description: 'Bench press egzersizinde 100kg\'a ulaşma hedefi',
      targetValue: 100,
      unit: 'kg',
      points: 200
    }
  ]
};

// Kullanıcının mevcut hedeflerini getir
exports.getUserGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Hedefler alınamadı', error });
  }
};

// Kullanılabilir hedefleri getir
exports.getAvailableGoals = async (req, res) => {
  try {
    // Kullanıcının mevcut hedeflerini al
    const userGoals = await Goal.find({ 
      user: req.user._id,
      isCompleted: false 
    });

    // Kullanıcının mevcut hedef tiplerini filtrele
    const activeGoalTypes = userGoals.map(goal => goal.type);
    
    // Kullanıcının henüz başlamadığı hedefleri filtrele
    const availableGoals = {};
    Object.keys(PREDEFINED_GOALS).forEach(type => {
      if (!activeGoalTypes.includes(type)) {
        availableGoals[type] = PREDEFINED_GOALS[type];
      }
    });

    res.json(availableGoals);
  } catch (error) {
    res.status(500).json({ message: 'Hedefler alınamadı', error });
  }
};

// Yeni hedef oluştur
exports.createGoal = async (req, res) => {
  try {
    const { type, goalIndex } = req.body;

    // Geçerli hedef tipi kontrolü
    if (!PREDEFINED_GOALS[type]) {
      return res.status(400).json({ message: 'Geçersiz hedef tipi' });
    }

    // Hedef seçimi kontrolü
    const selectedGoal = PREDEFINED_GOALS[type][goalIndex];
    if (!selectedGoal) {
      return res.status(400).json({ message: 'Geçersiz hedef seçimi' });
    }

    // Kullanıcının aynı tipte aktif hedefi var mı kontrol et
    const existingGoal = await Goal.findOne({
      user: req.user._id,
      type,
      isCompleted: false
    });

    if (existingGoal) {
      return res.status(400).json({ message: 'Bu tipte zaten aktif bir hedefiniz var' });
    }

    // Başlangıç değerlerini al
    let startValue = 0;
    if (type === 'weight') {
      const latestPhysicalData = await PhysicalData.findOne({ user: req.user._id })
        .sort({ createdAt: -1 });
      if (latestPhysicalData) {
        startValue = latestPhysicalData.weight;
      }
    }

    // Yeni hedef oluştur
    const goal = await Goal.create({
      user: req.user._id,
      type,
      title: selectedGoal.title,
      description: selectedGoal.description,
      targetValue: selectedGoal.targetValue,
      unit: selectedGoal.unit,
      validationData: {
        startDate: new Date(),
        startValue,
        lastChecked: new Date()
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Hedef oluşturulamadı', error });
  }
};

// Hedefleri doğrula ve güncelle
exports.validateGoals = async (req, res) => {
  try {
    const goals = await Goal.find({
      user: req.user._id,
      isCompleted: false
    });

    for (const goal of goals) {
      let currentValue = goal.currentValue;
      let isCompleted = false;

      switch (goal.type) {
        case 'weight':
          const latestPhysicalData = await PhysicalData.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });
          if (latestPhysicalData) {
            const weightDiff = goal.validationData.startValue - latestPhysicalData.weight;
            currentValue = Math.abs(weightDiff);
            isCompleted = currentValue >= goal.targetValue;
          }
          break;

        case 'workout_streak':
          const streak = await PointHistory.countDocuments({
            user: req.user._id,
            type: 'workout',
            date: { $gte: goal.validationData.startDate }
          });
          currentValue = streak;
          isCompleted = currentValue >= goal.targetValue;
          break;

        // Diğer hedef tipleri için doğrulama mantığı eklenecek
      }

      // Hedef tamamlandıysa güncelle
      if (isCompleted && !goal.isCompleted) {
        goal.isCompleted = true;
        goal.completedAt = new Date();
        goal.currentValue = currentValue;
        await goal.save();

        // Puan ekle
        const selectedGoal = PREDEFINED_GOALS[goal.type].find(
          g => g.targetValue === goal.targetValue
        );
        if (selectedGoal) {
          await addPoints(
            req.user._id,
            selectedGoal.points,
            'goal',
            `Hedef tamamlandı: ${goal.title}`
          );
        }
      } else {
        goal.currentValue = currentValue;
        goal.validationData.lastChecked = new Date();
        await goal.save();
      }
    }

    res.json({ message: 'Hedefler güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Hedefler güncellenemedi', error });
  }
}; 