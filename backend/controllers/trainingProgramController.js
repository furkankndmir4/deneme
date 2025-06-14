// controllers/trainingProgramController.js
const TrainingProgram = require('../models/trainingProgramModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const { addPoints } = require('../utils/points');
const rabbitmqService = require('../services/rabbitmq.service');

// @desc    Sporcunun mevcut antrenman programını getir
// @route   GET /api/training-programs/current
// @access  Private
const getCurrentProgram = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  if (user.userType !== 'athlete') {
    res.status(403);
    throw new Error('Bu işlem sadece sporcular için geçerlidir');
  }

  const program = await TrainingProgram.findOne({
    athlete: req.user._id,
    isTemplate: false
  })
  .populate('createdBy', 'email')
  .populate('athlete', 'email userType')
  .populate({
    path: 'workouts',
    populate: {
      path: 'exercises'
    }
  });

  if (!program) {
    return res.json(null);
  }

  // Süresi dolmuşsa programı otomatik sil
  const now = new Date();
  if (program.duration && program.startDate) {
    let totalDays = 0;
    if (program.duration.type === "day") totalDays = program.duration.value;
    if (program.duration.type === "week") totalDays = program.duration.value * 7;
    if (program.duration.type === "month") totalDays = program.duration.value * 30;
    const start = new Date(program.startDate);
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    if (diffDays >= totalDays) {
      await TrainingProgram.deleteOne({ _id: program._id });
      await User.findByIdAndUpdate(req.user._id, { $unset: { trainingProgram: "" } });
      return res.json(null);
    }
  }

  res.json(program);
});

// @desc    Hazır antrenman programlarını listeleme
// @route   GET /api/training-programs/templates
// @access  Private
const getTrainingTemplates = asyncHandler(async (req, res) => {
  const templates = await TrainingProgram.find({ 
    isTemplate: true 
  })
  .populate('createdBy', 'email')
  .sort({ name: 1 });
  
  res.json(templates);
});

// @desc    Antrenman programı seçme/atama
// @route   POST /api/training-programs/select
// @access  Private
const selectTrainingProgram = asyncHandler(async (req, res) => {
  const { programId } = req.body;
  
  const user = await User.findById(req.user._id);
  if (user.userType !== 'athlete') {
    res.status(403);
    throw new Error('Bu işlem sadece sporcular için geçerlidir');
  }

  // Hibrit model: Eğer kullanıcının antrenörü varsa, program seçemez
  if (user.coach) {
    res.status(403);
    throw new Error('Bir antrenörünüz olduğu için program seçemezsiniz. Lütfen antrenörünüzden program atamasını isteyin.');
  }
  
  const templateProgram = await TrainingProgram.findById(programId);
  if (!templateProgram) {
    res.status(404);
    throw new Error('Antrenman programı bulunamadı');
  }
  
  await TrainingProgram.deleteOne({ 
    athlete: req.user._id,
    isTemplate: false
  });
  
  const newProgram = new TrainingProgram({
    name: templateProgram.name,
    description: templateProgram.description,
    isTemplate: false,
    createdBy: templateProgram.createdBy,
    difficultyLevel: templateProgram.difficultyLevel,
    athlete: req.user._id,
    workouts: templateProgram.workouts
  });
  
  await newProgram.save();
  user.trainingProgram = newProgram._id;
  await user.save();
  
  const populatedProgram = await TrainingProgram.findById(newProgram._id)
    .populate('createdBy', 'email')
    .populate('athlete', 'email userType')
    .populate({
      path: 'workouts',
      populate: {
        path: 'exercises'
      }
    });

  // Puan ekle
  await addPoints(req.user._id, 20, "Antrenman programı seçildi");
  
  res.status(201).json({ 
    program: populatedProgram,
    message: 'Antrenman programı başarıyla atandı'
  });
});

// @desc    Antrenör tarafından yeni program oluşturma
// @route   POST /api/training-programs
// @access  Private (Coach only)
const createProgram = asyncHandler(async (req, res) => {
  console.log('createProgram fonksiyonu çağrıldı.');
  const { 
    name, 
    description,
    athleteId, 
    exercises, 
    difficultyLevel,
    duration,
    programDays 
  } = req.body;

  // Sporcunun varlığını kontrol et
  const athlete = await User.findOne({ _id: athleteId, userType: 'athlete' });
  if (!athlete) {
    res.status(404);
    throw new Error('Sporcu bulunamadı');
  }

  // Sporcunun mevcut programını sil
  await TrainingProgram.deleteOne({ 
    athlete: athleteId,
    isTemplate: false
  });

  // Her seçili gün için ayrı workout oluştur
  const workouts = programDays.map((day, idx) => ({
    day,
    title: `Antrenman ${idx + 1}`,
    exercises
  }));

  const program = await TrainingProgram.create({
    name,
    description,
    createdBy: req.user._id,
    athlete: athleteId,
    workouts,
    isTemplate: false,
    difficultyLevel: difficultyLevel || 'intermediate',
    duration: duration,
    programDays: programDays,
    startDate: Date.now()
  });

  if (program) {
    athlete.trainingProgram = program._id;
    await athlete.save();

    console.log('RabbitMQ: Antrenman programı yayınlama başlatılıyor...');
    // RabbitMQ'ya antrenman programı oluşturuldu mesajı gönder
    await rabbitmqService.publishTrainingProgramCreated({
      programId: program._id,
      programName: program.name,
      athleteId: athlete._id,
      athleteEmail: athlete.email,
      createdBy: program.createdBy,
      difficultyLevel: program.difficultyLevel,
      duration: program.duration,
      programDays: program.programDays,
      startDate: program.startDate,
      timestamp: new Date().toISOString()
    });
    console.log('RabbitMQ: Antrenman programı yayınlama tamamlandı.');

    const populatedProgram = await TrainingProgram.findById(program._id)
      .populate('createdBy', 'email')
      .populate('athlete', 'email userType')
      .populate({
        path: 'workouts',
        populate: {
          path: 'exercises'
        }
      });

    res.status(201).json({
      program: populatedProgram,
      message: 'Program başarıyla oluşturuldu'
    });
  } else {
    res.status(400);
    throw new Error('Program oluşturulamadı');
  }
});

// @desc    Antrenörün oluşturduğu programları listele
// @route   GET /api/training-programs/coach
// @access  Private (Coach only)
const getCoachPrograms = asyncHandler(async (req, res) => {
  const programs = await TrainingProgram.find({
    createdBy: req.user._id,
    isTemplate: false
  })
  .populate('athlete', 'email profile')
  .sort({ createdAt: -1 });

  res.json(programs);
});

// @desc    Antrenörün oluşturduğu programı güncelle
// @route   PUT /api/training-programs/:id
// @access  Private (Coach only)
const updateProgram = asyncHandler(async (req, res) => {
  const programId = req.params.id;
  const { name, description, difficultyLevel, workouts, duration, programDays } = req.body;

  // Sadece programı oluşturan antrenör güncelleyebilsin
  const program = await TrainingProgram.findById(programId);
  if (!program) {
    return res.status(404).json({ message: 'Program bulunamadı' });
  }
  if (program.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Bu programı güncelleme yetkiniz yok' });
  }

  if (name !== undefined) program.name = name;
  if (description !== undefined) program.description = description;
  if (difficultyLevel !== undefined) program.difficultyLevel = difficultyLevel;
  if (workouts !== undefined) program.workouts = workouts;
  if (duration !== undefined) program.duration = duration;
  if (programDays !== undefined) program.programDays = programDays;
  else program.programDays = program.programDays;

  await program.save();
  const populatedProgram = await TrainingProgram.findById(program._id)
    .populate('createdBy', 'email')
    .populate('athlete', 'email userType')
    .populate({
      path: 'workouts',
      populate: { path: 'exercises' }
    });

  res.json({
    program: populatedProgram,
    message: 'Program başarıyla güncellendi'
  });
});

// @desc    Get a single training program by ID
// @route   GET /api/training-programs/:id
// @access  Private
const getProgramById = asyncHandler(async (req, res) => {
  const program = await TrainingProgram.findById(req.params.id)
    .populate('createdBy', 'email profile')
    .populate({
      path: 'athlete',
      select: 'email profile',
      populate: { path: 'profile' }
    })
    .populate({
      path: 'workouts',
      populate: {
        path: 'exercises'
      }
    });

  if (!program) {
    res.status(404);
    throw new Error('Antrenman programı bulunamadı');
  }

  // Check if the user has access to this program
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  // Allow access if:
  // 1. User is the athlete assigned to this program
  // 2. User is the coach who created this program
  // 3. Program is a template
  if (program.athlete && program.athlete._id.toString() !== req.user._id.toString() &&
      program.createdBy._id.toString() !== req.user._id.toString() &&
      !program.isTemplate) {
    res.status(403);
    throw new Error('Bu programa erişim yetkiniz yok');
  }

  res.json(program);
});

// @desc    Antrenörün oluşturduğu programı sil
// @route   DELETE /api/training-programs/:id
// @access  Private (Coach only)
const deleteProgram = asyncHandler(async (req, res) => {
  const programId = req.params.id;
  const program = await TrainingProgram.findById(programId);
  if (!program) {
    return res.status(404).json({ message: 'Program bulunamadı' });
  }
  if (program.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Bu programı silme yetkiniz yok' });
  }
  // Sporcunun trainingProgram alanını temizle
  if (program.athlete) {
    await User.findByIdAndUpdate(program.athlete, { $unset: { trainingProgram: "" } });
  }
  await program.deleteOne();
  res.json({ message: 'Program başarıyla silindi' });
});

module.exports = {
  getTrainingTemplates,
  selectTrainingProgram,
  getCurrentProgram,
  createProgram,
  getCoachPrograms,
  updateProgram,
  getProgramById,
  deleteProgram
};