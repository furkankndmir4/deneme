const Achievement = require('../models/achievementModel');
const { addPoints } = require('../utils/points');
const Friend = require('../models/friendModel');
const { checkAndAwardBadges } = require('../utils/achievementUtils');
const Goal = require('../models/goalModel');
const Measurement = require('../models/measurementModel');
const Login = require('../models/loginModel');
const Streak = require('../models/streakModel');
const mongoose = require('mongoose');

// Kullanıcının başarımlarını getir
exports.getUserAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.findOne({ user: req.user._id });
    res.json(achievements || { achievements: [] });
  } catch (error) {
    res.status(500).json({ message: 'Başarımlar alınamadı', error });
  }
};

// Kullanıcıya başarımları kaydet/güncelle
exports.saveUserAchievements = async (req, res) => {
  try {
    const { achievements } = req.body;
    let userAchievements = await Achievement.findOne({ user: req.user._id });
    let newlyEarned = [];
    if (userAchievements) {
      // Önceki başarımlar ile yeni gelenleri karşılaştır
      const prev = userAchievements.achievements || [];
      newlyEarned = achievements.filter(a => !prev.includes(a));
      userAchievements.achievements = achievements;
      await userAchievements.save();
    } else {
      newlyEarned = achievements;
      userAchievements = await Achievement.create({ user: req.user._id, achievements });
    }
    // Yeni kazanılan her rozet için 100 puan ekle
    for (const ach of newlyEarned) {
      await addPoints(req.user._id, 100, 'achievement', `Rozet kazanıldı: ${ach}`);
    }
    res.json(userAchievements);
  } catch (error) {
    res.status(500).json({ message: 'Başarımlar kaydedilemedi', error });
  }
};

exports.getAchievementsProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    // Gerçek arkadaş sayısını Friend tablosundan bul
    const friendCount = await Friend.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    // Hedef tamamlama
    const goalsCompleted = await Goal.countDocuments({ user: userId, status: 'completed' });
    // Ölçüm sayısı
    const measurements = await Measurement.countDocuments({ user: userId });
    // Giriş sayısı
    const logins = await Login.countDocuments({ user: userId });
    // Streak
    const id = typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId;
    const streakDoc = await Streak.findOne({ user: id });
    const streak = streakDoc?.currentStreak || 0;

    // Kullanıcı puanı
    const user = await require('../models/userModel').findById(userId);
    const points = user?.points || 0;

    // Paylaşım sayısı (örnek: yoksa 0)
    let shares = 0;
    // Eğer bir paylaşım modeli eklenirse burada sayılabilir

    // Antrenman sayısı (PointHistory'de type: 'workout')
    const PointHistory = require('../models/pointHistoryModel');
    const workouts = await PointHistory.countDocuments({ user: userId, type: 'workout' });

    // Kilo kaybı (ilk ve son ölçüm farkı, pozitifse)
    const PhysicalDataHistory = require('../models/physicalDataHistoryModel');
    const weightHistory = await PhysicalDataHistory.find({ user: userId }).sort({ createdAt: 1 });
    let weightLoss = 0;
    if (weightHistory.length >= 2) {
      const first = weightHistory[0].weight;
      const last = weightHistory[weightHistory.length - 1].weight;
      if (first && last && last < first) {
        weightLoss = Math.round(first - last);
      }
    }

    // Kas kazancı (biceps, chest veya thigh artışı)
    let muscleGain = 0;
    if (weightHistory.length >= 1) { // En az 1 kayıt olsun
      // Biceps
      const lastBicep = weightHistory[weightHistory.length - 1].bicepCircumference;
      // Chest
      const lastChest = weightHistory[weightHistory.length - 1].chestCircumference;
      // Thigh
      const lastThigh = weightHistory[weightHistory.length - 1].thighCircumference;

      // Eğer herhangi bir ölçüm varsa ve 0'dan büyükse rozet kazanılsın
      if ((lastBicep && lastBicep > 0) || 
          (lastChest && lastChest > 0) || 
          (lastThigh && lastThigh > 0)) {
        muscleGain = 1;
      }
    }

    // En uzun streak (şimdilik mevcut streak ile aynı, ileride güncellenebilir)
    const recordStreak = streak;

    // Bugünün MM-DD formatı (özel gün rozetleri için)
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${mm}-${dd}`;

    // Kullanıcı tipini al
    const userType = user?.userType || '';

    // Antrenör istatistikleri
    let athletes = 0;
    let programs = 0;
    if (userType === 'coach') {
      const CoachAthleteRelationship = require('../models/coachAthleteRelationshipModel');
      athletes = await CoachAthleteRelationship.countDocuments({ coach: userId, status: 'accepted' });
      const TrainingProgram = require('../models/trainingProgramModel');
      programs = await TrainingProgram.countDocuments({ createdBy: userId });
    }

    const userStats = {
      friends: friendCount,
      goalsCompleted,
      measurements,
      logins,
      streak,
      points,
      shares,
      workouts,
      weightLoss,
      muscleGain,
      recordStreak,
      date,
      athletes,
      programs,
      userType
    };

    console.log('userStats:', userStats);
    const result = await checkAndAwardBadges(userId, userStats);
    res.json(result);
  } catch (error) {
    console.error('Error in getAchievementsProgress:', error);
    res.status(500).json({ error: error.message });
  }
}; 