const User = require('../models/userModel');
const PhysicalData = require('../models/physicalDataModel');
const TrainingProgram = require('../models/trainingProgramModel');
const CoachAthleteRelationship = require('../models/coachAthleteRelationshipModel');
const CoachAthleteRequest = require('../models/coachAthleteRequestModel');
const { addPoints } = require('../utils/points');
const PointHistory = require('../models/pointHistoryModel');
const Goal = require('../models/goalModel');
const PhysicalDataHistory = require('../models/physicalDataHistoryModel');

// @desc    Fiziksel verileri kaydetme/güncelleme
// @route   POST /api/athletes/physical-data
// @access  Private
// controllers/athleteController.js - güncellenmiş fonksiyon
const savePhysicalData = async (req, res) => {
  try {
    const { height, weight, bodyFat, neckCircumference, waistCircumference, hipCircumference } = req.body;

    // Sporcu kullanıcı kontrolü
    const user = await User.findById(req.user._id);
    if (user.userType !== 'athlete') {
      return res.status(403).json({ message: 'Bu işlem sadece sporcular için geçerlidir' });
    }

    // Bugün girilmiş veri var mı kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingRecord = await PhysicalData.findOne({
      user: req.user._id,
      createdAt: { $gte: today }
    });

    let physicalData;
    let isFirstRecordToday = false;

    if (existingRecord) {
      // Bugüne ait kayıt varsa güncelle
      existingRecord.height = height || existingRecord.height;
      existingRecord.weight = weight || existingRecord.weight;
      existingRecord.bodyFat = bodyFat || existingRecord.bodyFat;
      existingRecord.neckCircumference = neckCircumference || existingRecord.neckCircumference;
      existingRecord.waistCircumference = waistCircumference || existingRecord.waistCircumference;
      existingRecord.hipCircumference = hipCircumference || existingRecord.hipCircumference;
      
      physicalData = await existingRecord.save();
    } else {
      // Yeni kayıt oluştur
      physicalData = await PhysicalData.create({
        user: req.user._id,
        height,
        weight,
        bodyFat,
        neckCircumference,
        waistCircumference,
        hipCircumference
      });
      isFirstRecordToday = true;
    }

    // --- YENİ: Her güncellemede PhysicalDataHistory'ye de ekle ---
    await PhysicalDataHistory.create({
      user: req.user._id,
      height,
      weight,
      bodyFat,
      neckCircumference,
      waistCircumference,
      hipCircumference
    });
    // --- ---

    // Eğer bugün ilk kez kayıt ekleniyorsa 5 puan ver
    if (isFirstRecordToday) {
      await addPoints(req.user._id, 5, 'nutrition', 'Günlük beslenme/fiziksel veri kaydı');
    }

    res.status(201).json({
      physicalData,
      message: 'Fiziksel veriler başarıyla kaydedildi',
    });
  } catch (error) {
    console.error('Save physical data error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Yeni eklenen fonksiyon - bugün veri kaydı var mı kontrolü
const checkTodaysRecord = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingRecord = await PhysicalData.findOne({
      user: req.user._id,
      createdAt: { $gte: today }
    });

    res.json({
      hasTodaysRecord: !!existingRecord,
      lastRecord: await PhysicalData.findOne({ user: req.user._id })
        .sort({ createdAt: -1 })
    });
  } catch (error) {
    console.error('Check today\'s record error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};



// @desc    Fiziksel verileri alma
// @route   GET /api/athletes/physical-data
// @access  Private
const getPhysicalData = async (req, res) => {
  try {
    // Sporcu kullanıcı kontrolü
    const user = await User.findById(req.user._id);
    if (user.userType !== 'athlete') {
      return res.status(403).json({ message: 'Bu işlem sadece sporcular için geçerlidir' });
    }

    // Tüm fiziksel veri kayıtlarını tarih sırasına göre getir
    const physicalDataHistory = await PhysicalData.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(physicalDataHistory);
  } catch (error) {
    console.error('Get physical data error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Sporcunun mevcut antrenman programını alma
// @route   GET /api/athletes/training-program
// @access  Private
const getTrainingProgram = async (req, res) => {
  try {
    // Sporcu kullanıcı kontrolü
    const user = await User.findById(req.user._id);
    if (user.userType !== 'athlete') {
      return res.status(403).json({ message: 'Bu işlem sadece sporcular için geçerlidir' });
    }

    // Sporcuya atanmış antrenman programını bul
    const trainingProgram = await TrainingProgram.findOne({ athlete: req.user._id })
      .populate('createdBy', 'email');

    if (!trainingProgram) {
      return res.status(404).json({ message: 'Atanmış bir antrenman programı bulunamadı' });
    }

    res.json(trainingProgram);
  } catch (error) {
    console.error('Get training program error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Fiziksel verilerin tarihsel kaydını alma
// @route   GET /api/athletes/physical-data/history
// @access  Private
const getPhysicalDataHistory = async (req, res) => {
  try {
    // İsteğe bağlı filtreleme için
    const { startDate, endDate } = req.query;
    
    let query = { user: req.user._id };
    
    // Tarih filtresi ekle
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Tüm fiziksel veri kayıtlarını tarih sırasına göre getir
    const physicalDataHistory = await PhysicalDataHistory.find(query)
      .sort({ createdAt: 1 }); // Eskiden yeniye sıralama
    
    res.json(physicalDataHistory);
  } catch (error) {
    console.error('Get physical data history error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};


// @desc    Antrenör seçme (sporcu tarafından)
// @route   POST /api/athletes/select-coach
// @access  Private
const selectCoach = async (req, res) => {
  try {
    const { coachId, message } = req.body;

    // Kullanıcı kontrol
    const user = await User.findById(req.user._id);
    if (user.userType !== 'athlete') {
      return res.status(403).json({ message: 'Bu işlem sadece sporcular için geçerlidir' });
    }

    // Antrenör kontrol
    const coach = await User.findOne({ _id: coachId, userType: 'coach' });
    if (!coach) {
      return res.status(404).json({ message: 'Antrenör bulunamadı' });
    }

    // Aynı isteği tekrar göndermesin
    const existingRequest = await CoachAthleteRequest.findOne({
      athlete: req.user._id,
      coach: coachId,
      status: { $in: ['pending', 'accepted'] }
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Zaten bir isteğiniz var veya bu antrenörünüz.' });
    }

    // Yeni istek oluştur
    const request = new CoachAthleteRequest({
      athlete: req.user._id,
      coach: coachId,
      status: 'pending',
      message: message || ''
    });

    await request.save();

    res.status(201).json({
      request,
      message: 'Antrenör talebi gönderildi'
    });
  } catch (error) {
    console.error('Select coach error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Aktif programı döndür
const getActiveProgram = async (req, res) => {
  try {
    // Doğrudan programı bul
    const program = await TrainingProgram.findOne({
      athlete: req.user._id,
      isTemplate: false
    });
    if (!program) {
      return res.status(404).json({ message: 'Aktif program yok' });
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Günlük girişte puan ekle
// @route   POST /api/athletes/daily-login
// @access  Private
const dailyLogin = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Bugün girişten puan almış mı kontrol et
    const alreadyLogged = await PointHistory.findOne({
      user: req.user._id,
      type: 'login',
      date: { $gte: today }
    });
    if (!alreadyLogged) {
      await addPoints(req.user._id, 2, 'login', 'Günlük giriş');
      return res.json({ message: 'Günlük giriş puanı eklendi', points: 2 });
    } else {
      return res.json({ message: 'Bugün zaten giriş puanı aldınız', points: 0 });
    }
  } catch (error) {
    console.error('Daily login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kullanıcının güncel workout streak sayısını döndür
// @route   GET /api/athletes/streak
// @access  Private
const getStreak = async (req, res) => {
  try {
    let streak = 0;
    let day = new Date();
    day.setHours(0, 0, 0, 0);

    while (true) {
      const hasWorkout = await PointHistory.findOne({
        user: req.user._id,
        type: 'workout',
        date: {
          $gte: new Date(day),
          $lt: new Date(day.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      if (hasWorkout) {
        streak++;
        day.setDate(day.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (error) {
    res.status(500).json({ message: 'Streak hesaplanamadı' });
  }
};

// @desc    Hedefi tamamla ve puan ekle
// @route   POST /api/athletes/goals/:goalId/complete
// @access  Private
const completeGoal = async (req, res) => {
  try {
    const goalId = req.params.goalId;
    const goal = await Goal.findOne({ _id: goalId, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Hedef bulunamadı' });
    }
    if (goal.isCompleted) {
      return res.status(400).json({ message: 'Bu hedef zaten tamamlanmış' });
    }
    goal.isCompleted = true;
    goal.completedAt = new Date();
    await goal.save();

    // Hedef büyüklüğüne göre puan (ör: 50, 75, 100)
    let points = 50;
    if (goal.targetValue >= 100) points = 100;
    else if (goal.targetValue >= 50) points = 75;
    await addPoints(req.user._id, points, 'goal', `Hedef tamamlandı: ${goal.title}`);

    res.json({ message: 'Hedef tamamlandı', points });
  } catch (error) {
    res.status(500).json({ message: 'Hedef tamamlanamadı', error });
  }
};

// Güncellenen modül dışa aktarımları
module.exports = {
  savePhysicalData,
  getPhysicalData,
  getTrainingProgram,
  checkTodaysRecord,
  getPhysicalDataHistory,
  selectCoach,
  getActiveProgram,
  dailyLogin,
  getStreak,
  completeGoal,
};