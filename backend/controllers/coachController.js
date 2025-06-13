const User = require('../models/userModel');
const Profile = require('../models/profileModel');
const TrainingProgram = require('../models/trainingProgramModel');
const CoachAthleteRequest = require('../models/coachAthleteRequestModel');
const CoachAthleteRelationship = require('../models/coachAthleteRelationshipModel');
const asyncHandler = require('express-async-handler');
const redisService = require('../services/redis.service');

// @desc    Antrenör atletlerini listeleme
// @route   GET /api/coaches/athletes
// @access  Private
const getCoachAthletes = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.userType !== 'coach') {
      res.status(403);
      throw new Error('Bu işlem sadece antrenörler için geçerlidir');
    }

    // Sadece coach alanı bu antrenör olan sporcuları getir
    const athletes = await User.find({ coach: req.user._id, userType: 'athlete' }).select('-password');
    console.log('getCoachAthletes - Found athletes:', athletes.map(a => a._id.toString()));

    const athletesWithProfiles = await Promise.all(
      athletes.map(async (athlete) => {
        const profile = await Profile.findOne({ user: athlete._id }).select('fullName photoUrl age goalType');
        // O sporcuya atanmış programı bul
        const trainingProgram = await TrainingProgram.findOne({ athlete: athlete._id, isTemplate: false })
          .select('_id name difficultyLevel');
        return {
          _id: athlete._id,
          email: athlete.email,
          profile: profile || null,
          trainingProgram: trainingProgram || null,
        };
      })
    );

    res.json(athletesWithProfiles);
  } catch (err) {
    console.error('getCoachAthletes error:', err);
    res.status(500).json({ message: 'getCoachAthletes error', error: err.message });
  }
});

// @desc    Antrenman programı oluşturma
// @route   POST /api/coaches/training-programs
// @access  Private
const createTrainingProgram = asyncHandler(async (req, res) => {
    const { 
      name, 
      description, 
      difficultyLevel, 
      workouts, 
      isTemplate, 
      athleteId,
      duration,
      programDays 
    } = req.body;

    // Antrenör kullanıcı kontrolü
    const user = await User.findById(req.user._id);
    if (user.userType !== 'coach') {
      res.status(403);
      throw new Error('Bu işlem sadece antrenörler için geçerlidir');
    }

    // Eğer atlet ID'si verildiyse, atlet varlığını kontrol et
    if (athleteId) {
      const athlete = await User.findById(athleteId);
      if (!athlete || athlete.userType !== 'athlete') {
        res.status(404);
        throw new Error('Geçerli bir sporcu bulunamadı');
      }

      // Sporcunun mevcut programını sil
      await TrainingProgram.deleteOne({ 
        athlete: athleteId,
        isTemplate: false
      });
    }

    // Yeni antrenman programı oluştur
    const trainingProgram = await TrainingProgram.create({
      name,
      description,
      isTemplate: isTemplate || false,
      createdBy: req.user._id,
      difficultyLevel: difficultyLevel || 'intermediate',
      athlete: athleteId || null,
      workouts: workouts || [],
      duration: duration ? {
        value: duration.value,
        type: duration.type
      } : undefined,
      programDays: programDays || []
    });

    // Eğer sporcuya atandıysa, sporcunun trainingProgram alanını güncelle
    if (athleteId) {
      await User.findByIdAndUpdate(athleteId, {
        trainingProgram: trainingProgram._id
      });
    }

    res.status(201).json({
      trainingProgram,
      message: 'Antrenman programı başarıyla oluşturuldu',
    });
});

// @desc    Antrenman programlarını listeleme
// @route   GET /api/coaches/training-programs
// @access  Private
const getTrainingPrograms = asyncHandler(async (req, res) => {
    // Antrenör kullanıcı kontrolü
    const user = await User.findById(req.user._id);
    if (user.userType !== 'coach') {
    res.status(403);
    throw new Error('Bu işlem sadece antrenörler için geçerlidir');
    }

    // Antrenörün oluşturduğu programları getir
    const trainingPrograms = await TrainingProgram.find({ createdBy: req.user._id })
      .populate('athlete', 'email')
      .sort({ createdAt: -1 });

    res.json(trainingPrograms);
});

// @desc    Antrenörleri listeleme
// @route   GET /api/coaches
// @access  Private
const listCoaches = asyncHandler(async (req, res) => {
    try {
        const CACHE_KEY = 'coaches';
        const CACHE_DURATION = 3600; // 1 saat

        console.log('Antrenör listesi isteği alındı');
        
        // Redis'ten önbelleğe alınmış veriyi kontrol et
        console.log('Redis\'ten veri kontrol ediliyor...');
        let cachedCoaches = null;
        try {
            cachedCoaches = await redisService.get(CACHE_KEY);
            if (cachedCoaches) {
                console.log('Veriler Redis önbelleğinden alındı');
                console.log('Önbellekten alınan antrenör sayısı:', cachedCoaches.length);
                return res.json(cachedCoaches);
            }
        } catch (error) {
            console.error('Redis\'ten veri alınamadı:', error);
        }

        console.log('Veriler veritabanından alınıyor...');
        // Veritabanından antrenörleri getir
        const coaches = await User.find({ userType: 'coach' })
            .select('-password')
            .populate('profile');

        console.log('Veritabanından alınan antrenör sayısı:', coaches.length);

        // Verileri Redis'e kaydet
        console.log('Veriler Redis\'e kaydediliyor...');
        try {
            await redisService.set(CACHE_KEY, coaches, CACHE_DURATION);

            // Redis'ten tekrar okuyarak kontrol et
            const verifyCache = await redisService.get(CACHE_KEY);
            console.log('Redis\'e kayıt başarılı mı:', !!verifyCache);
            if (verifyCache) {
                console.log('Redis\'e kaydedilen antrenör sayısı:', verifyCache.length);
            }
        } catch (error) {
            console.error('Redis\'e veri kaydedilemedi:', error);
        }

        console.log('Veriler veritabanından alındı ve Redis\'e kaydedildi');
        res.json(coaches);
    } catch (err) {
        console.error('Antrenör listesi hatası:', err);
        res.status(500).json({ message: 'Antrenörler alınamadı', error: err.message });
    }
});
    
// @desc    Bekleyen sporcu isteklerini getir
// @route   GET /api/coaches/athlete-requests
// @access  Private
const getPendingAthleteRequests = asyncHandler(async (req, res) => {
  const requests = await CoachAthleteRelationship.find({
    coach: req.user._id,
    status: 'pending'
  }).populate({
    path: 'athlete',
    select: 'email',
    populate: {
      path: 'profile',
      select: 'fullName photoUrl age goalType'
    }
  });
  
  console.log('getPendingAthleteRequests - Found pending requests:', requests);
  res.json(requests);
});
        
// @desc    Sporcu isteğini kabul et
// @route   POST /api/coaches/athlete-requests/:requestId/accept
// @access  Private
const acceptAthleteRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.requestId;

  const request = await CoachAthleteRequest.findById(requestId);

  if (!request) {
    res.status(404);
    throw new Error('İstek bulunamadı');
  }

  if (request.coach.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bu işlem için yetkiniz yok');
  }

  request.status = 'accepted';
  await request.save();

  // Update athlete's coach field in User model
  await User.findByIdAndUpdate(request.athlete, {
    coach: req.user._id
  });

  // Debugging: Check if the athlete's coach field is updated
  const updatedAthlete = await User.findById(request.athlete);
  console.log('Updated athlete coach field:', updatedAthlete.coach);

  // Create or update CoachAthleteRelationship
  let relationship = await CoachAthleteRelationship.findOne({
    coach: req.user._id,
    athlete: request.athlete
  });

  if (!relationship) {
    relationship = new CoachAthleteRelationship({
      coach: req.user._id,
      athlete: request.athlete,
      status: 'accepted'
    });
  } else {
    relationship.status = 'accepted';
  }
  await relationship.save();

  res.json({ message: 'İstek kabul edildi' });
});

// @desc    Sporcu isteğini reddet
// @route   POST /api/coaches/athlete-requests/:requestId/reject
// @access  Private
const rejectAthleteRequest = asyncHandler(async (req, res) => {
  const request = await CoachAthleteRequest.findById(req.params.requestId);
  
  if (!request) {
    res.status(404);
    throw new Error('İstek bulunamadı');
  }

  if (request.coach.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bu işlem için yetkiniz yok');
  }

  request.status = 'rejected';
  await request.save();

  // İlişkiyi de sil (CoachAthleteRelationship)
  await CoachAthleteRelationship.deleteOne({ coach: req.user._id, athlete: request.athlete });

  // O sporcu için oluşturulan programları da sil
  await TrainingProgram.deleteMany({ createdBy: req.user._id, athlete: request.athlete });

  // Kullanıcının coach alanını da temizle
  await User.findByIdAndUpdate(request.athlete, { coach: null });

  res.json({ message: 'İstek reddedildi ve ilişkili programlar silindi' });
});

module.exports = {
  getCoachAthletes,
  createTrainingProgram,
  getTrainingPrograms,
  listCoaches,
  getPendingAthleteRequests,
  acceptAthleteRequest,
  rejectAthleteRequest
};