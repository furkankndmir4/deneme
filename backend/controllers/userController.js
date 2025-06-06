const User = require('../models/userModel');
const Profile = require('../models/profileModel');
const PhysicalData = require('../models/physicalDataModel');
const generateToken = require('../utils/generateToken');
const Friend = require('../models/friendModel');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const TrainingProgram = require('../models/trainingProgramModel');
const asyncHandler = require('express-async-handler');
const PhysicalDataHistory = require('../models/physicalDataHistoryModel');
const Login = require('../models/loginModel');
const Streak = require('../models/streakModel');
const Measurement = require('../models/measurementModel');

// NaN değerleri undefined olarak kaydetmek için yardımcı fonksiyon
const safeNumber = (val) => (isNaN(val) ? undefined : val);

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  try {
  const { email, password, userType } = req.body;

    console.log('Register attempt:', { email, userType }); // Debug log

    if (!email || !password || !userType) {
      console.log('Missing required fields'); // Debug log
      res.status(400);
      throw new Error('Tüm alanlar gereklidir');
    }

  const userExists = await User.findOne({ email });

  if (userExists) {
      console.log('User already exists:', email); // Debug log
    res.status(400);
    throw new Error('Bu e-posta adresi zaten kullanılıyor');
  }

    console.log('Creating new user...'); // Debug log
  const user = await User.create({
    email,
    password,
    userType,
    verified: true
  });

  if (user) {
      console.log('User created successfully:', { userId: user._id }); // Debug log
    res.status(201).json({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      token: generateToken(user._id),
    });
  } else {
      console.log('User creation failed'); // Debug log
    res.status(400);
    throw new Error('Geçersiz kullanıcı bilgileri');
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
  const { email, password } = req.body;

    console.log('Login attempt:', { email }); // Debug log

    if (!email || !password) {
      return res.status(400).json({
        message: 'E-posta ve şifre gereklidir'
      });
    }

    // E-posta adresini küçük harfe çevir ve boşlukları temizle
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail); // Debug log

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('User not found:', normalizedEmail); // Debug log
      return res.status(401).json({
        message: 'Geçersiz e-posta veya şifre'
      });
    }

    console.log('User found:', { userId: user._id, email: user.email }); // Debug log

    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch); // Debug log

    if (!isMatch) {
      return res.status(401).json({
        message: 'Geçersiz e-posta veya şifre'
      });
    }

    await Login.create({ user: user._id, date: new Date() });

    // --- STREAK GÜNCELLEME ---
    function toUTCDateOnly(date) {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    let streakDoc = await Streak.findOne({ user: user._id });
    const now = new Date();
    const todayUTC = toUTCDateOnly(now);

    if (!streakDoc) {
      streakDoc = await Streak.create({ user: user._id, currentStreak: 1, lastLogin: todayUTC });
    } else {
      const last = streakDoc.lastLogin ? toUTCDateOnly(new Date(streakDoc.lastLogin)) : null;
      const daysDiff = last ? Math.floor((todayUTC - last) / (1000 * 60 * 60 * 24)) : null;

      if (!last || daysDiff > 1) {
        streakDoc.currentStreak = 1;
      } else if (daysDiff === 1) {
        streakDoc.currentStreak += 1;
      }
      streakDoc.lastLogin = todayUTC;
      await streakDoc.save();
    }
    // --- STREAK GÜNCELLEME SONU ---

    const profile = await Profile.findOne({ user: user._id });
    const hasPhysicalData = await PhysicalData.exists({ user: user._id });

    const token = generateToken(user._id);
    console.log('Generated token:', token); // Debug log

    return res.status(200).json({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      hasProfile: !!profile,
      hasPhysicalData: !!hasPhysicalData,
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate({ path: "profile" });
  if (!user) {
    res.status(404);
    throw new Error("Kullanıcı bulunamadı");
  }

  let coach = null;
  let athletes = [];
  let trainingProgram = null;

  if (user.userType === "athlete") {
    // Sporcu için antrenör bilgilerini getir
    coach = await User.findOne({ _id: user.coach })
      .select("_id email profile")
      .populate({
        path: "profile",
        select: "fullName photoUrl specialization coachNote",
      });

    // Sporcu için antrenman programını getir
    trainingProgram = await TrainingProgram.findOne({ athlete: user._id })
      .populate("createdBy", "profile")
      .populate("athlete", "profile")
      .populate({
        path: "workouts",
        populate: {
          path: "exercises",
        },
      });
  } else if (user.userType === "coach") {
    // Antrenör için sporcularını getir
    athletes = await User.find({ coach: user._id })
      .select("_id email profile physicalData")
      .populate({
        path: "profile",
        select: "fullName photoUrl age goalType",
      })
      .populate({
        path: "physicalData",
        select: "goalCalories proteinGrams carbGrams fatGrams bodyFat bmi",
      });
  }

  // En güncel physicalData kaydını bul
  const latestPhysicalData = await PhysicalData.findOne({ user: user._id }).sort({ createdAt: -1 });

  // Kullanıcının fiziksel veri geçmişinden son 2 kaydı çek
  const physicalDataHistory = await PhysicalDataHistory.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(2);

  res.json({
    _id: user._id,
    email: user.email,
    userType: user.userType,
    profile: user.profile,
    physicalData: latestPhysicalData,
    coach: coach,
    athletes: athletes,
    trainingProgram: trainingProgram,
    physicalDataHistory: physicalDataHistory, // Fiziksel veri geçmişini yanıtına ekle
  });
});

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:userId
// @access  Private
const getUserProfileById = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      const user = await User.findById(req.user._id)
        .populate('profile')
        .populate({
          path: 'coach',
          populate: {
            path: 'profile',
            select: 'fullName photoUrl specialization'
          }
        })
        .populate('physicalData');

      if (user) {
        return res.json({
          _id: user._id,
          email: user.email,
          userType: user.userType,
          profile: user.profile,
          physicalData: user.physicalData,
          coach: user.coach,
          createdAt: user.createdAt
        });
      } else {
        res.status(404);
        throw new Error('User not found');
      }
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      res.status(404);
      throw new Error('Bu kullanıcının profili bulunmuyor');
    }

    // Antrenör kontrolü: profiline bakan kişi, bu kullanıcının antrenörü mü?
    const isCoach = user.coach && String(user.coach) === String(currentUserId);
    const friendship = await Friend.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId }
      ]
    });
    let friendshipStatus = null;
    let isFriend = false;
    if (friendship) {
      if (friendship.status === 'accepted') {
        friendshipStatus = 'friends';
        isFriend = true;
      } else if (friendship.status === 'pending') {
        if (friendship.requester.toString() === currentUserId.toString()) {
          friendshipStatus = 'request_sent';
        } else {
          friendshipStatus = 'request_received';
        }
      }
    }

    let filteredProfile;
    let physicalDataResponse = null;
    const latestPhysicalData = await PhysicalData.findOne({ user: userId }).sort({ createdAt: -1 });
    if (isCoach) {
      // Antrenör ise tüm bilgileri göster
      filteredProfile = {
        fullName: profile.fullName,
        photoUrl: profile.photoUrl,
        gender: profile.gender,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goalType: profile.goalType,
        activityLevel: profile.activityLevel
      };
      if (latestPhysicalData) {
        physicalDataResponse = {
          ...latestPhysicalData.toObject(),
          legCircumference: latestPhysicalData.thighCircumference !== undefined ? latestPhysicalData.thighCircumference : '--',
          armCircumference: latestPhysicalData.bicepCircumference !== undefined ? latestPhysicalData.bicepCircumference : '--'
        };
      }
    } else {
      // Arkadaş veya diğer kullanıcılar için gizlilik kuralları
      filteredProfile = {
        fullName: profile.fullName,
        photoUrl: profile.photoUrl,
        gender: profile.gender
      };
      if (!profile.privacy || profile.privacy.showAge) filteredProfile.age = profile.age;
      if (!profile.privacy || profile.privacy.showWeight) filteredProfile.weight = profile.weight;
      if (!profile.privacy || profile.privacy.showHeight) filteredProfile.height = profile.height;
      if (!profile.privacy || profile.privacy.showGoals) {
        filteredProfile.goalType = profile.goalType;
        filteredProfile.activityLevel = profile.activityLevel;
      }
      if (latestPhysicalData) {
        if (!profile.privacy || profile.privacy.showBodyMeasurements) {
          physicalDataResponse = {
            ...latestPhysicalData.toObject(),
            legCircumference: latestPhysicalData.thighCircumference !== undefined ? latestPhysicalData.thighCircumference : '--',
            armCircumference: latestPhysicalData.bicepCircumference !== undefined ? latestPhysicalData.bicepCircumference : '--'
          };
        } else {
          physicalDataResponse = {
            bodyFat: null,
            waistCircumference: null,
            neckCircumference: null,
            hipCircumference: null,
            chestCircumference: null,
            armCircumference: null,
            legCircumference: null,
            calfCircumference: null,
            shoulderWidth: null,
            bmi: null
          };
        }
      }
    }

    // Rozet ilerlemesi ve kazanılan rozetler
    let achievementsList = []; // Tüm rozetler, kazanma durumu dahil
    try {
      // Kullanıcının mevcut rozetlerini al (kazanma durumu dahil)
      achievementsList = user.achievements || [];
    } catch (e) {
      console.error('Rozetler alınırken hata:', e);
    }

    const responseData = {
      _id: user._id,
      email: user.email,
      userType: user.userType,
      profile: filteredProfile,
      friendshipStatus,
      physicalData: physicalDataResponse,
      achievements: achievementsList, // Tüm rozet listesini gönder
      progress: achievementsList // İlerleme için de aynı listeyi kullanabiliriz
    };
    res.json(responseData);
  } catch (error) {
    console.error('getUserProfileById error:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  const { fullName, age, gender, height, weight, goalType, activityLevel, privacy, goals, specialization, coachNote } = req.body;
  const bodyFat = req.body.bodyFat;

  let profile = await Profile.findOne({ user: req.user._id });

  if (profile) {
    profile.fullName = fullName || profile.fullName;
    profile.age = age || profile.age;
    profile.gender = gender || profile.gender;
    profile.height = height || profile.height;
    profile.weight = weight || profile.weight;
    profile.goalType = goalType || profile.goalType;
    profile.activityLevel = activityLevel || profile.activityLevel;
    if (goals !== undefined) profile.goals = goals;
    if (specialization !== undefined) profile.specialization = specialization;
    if (coachNote !== undefined) profile.coachNote = coachNote;

    if (privacy) {
      profile.privacy = privacy;
    }

    await profile.save();
  } else {
    const newProfileData = {
      user: req.user._id,
      fullName,
      age,
      gender,
      height,
      weight,
      goalType,
      activityLevel,
      goals,
      specialization,
      coachNote
    };

    if (goals !== undefined) newProfileData.goals = goals;
    if (specialization !== undefined) newProfileData.specialization = specialization;

    if (privacy) {
      newProfileData.privacy = privacy;
    }

    profile = await Profile.create(newProfileData);
    user.profile = profile._id;
    await user.save();
  }

  // Profil kaydında physicalData da otomatik oluşturulsun/güncellensin
  if (height && weight) {
    let physicalData = await PhysicalData.findOne({ user: req.user._id });
    // Son fiziksel veri geçmişini bul
    const lastEntry = await PhysicalDataHistory.findOne({ user: req.user._id }).sort({ date: -1 });

    const weightChange =
      lastEntry && typeof lastEntry.weight === "number" && typeof weight === "number"
        ? weight - lastEntry.weight
        : physicalData ? physicalData.weightChange : 0;
    const bodyFatChange =
      // Sadece bodyFat değeri açıkça gönderildiğinde farkı hesapla
      (bodyFat !== undefined && lastEntry && typeof lastEntry.bodyFat === "number" && typeof bodyFat === "number")
        ? bodyFat - lastEntry.bodyFat
        : physicalData ? physicalData.bodyFatChange : 0;
    const heightChange =
      lastEntry && typeof lastEntry.height === "number" && typeof height === "number"
        ? height - lastEntry.height
        : physicalData ? physicalData.heightChange : 0;

    let currentBMI = null;
    let bmiChange = 0;
    if (typeof height === "number" && typeof weight === "number" && height > 0) {
      currentBMI = weight / ((height / 100) * (height / 100));
      if (lastEntry && typeof lastEntry.bmi === "number") {
        bmiChange = currentBMI - lastEntry.bmi;
      }
    }

    if (physicalData) {
      physicalData.height = height;
      physicalData.weight = weight;
      physicalData.weightChange = safeNumber(weightChange);
      physicalData.bodyFatChange = safeNumber(bodyFatChange);
      physicalData.heightChange = safeNumber(heightChange);
      physicalData.bmiChange = safeNumber(bmiChange);
      if (currentBMI) physicalData.bmi = safeNumber(currentBMI);
      // Eğer bodyFat değeri gönderildiyse güncelle
      if (bodyFat !== undefined) {
        physicalData.bodyFat = bodyFat;
      }
      await physicalData.save();
    } else {
      physicalData = await PhysicalData.create({
        user: req.user._id,
        height,
        weight,
        weightChange: safeNumber(weightChange),
        bodyFatChange: safeNumber(bodyFatChange),
        heightChange: safeNumber(heightChange),
        bmiChange: safeNumber(bmiChange),
        bmi: safeNumber(currentBMI),
        bodyFat: bodyFat
      });
      user.physicalData = physicalData._id;
      await user.save();
    }

    // Ayrıca PhysicalDataHistory'ye de ekle
    const newHistoryEntry = new PhysicalDataHistory({
      user: req.user._id,
      height,
      weight,
      bodyFat: bodyFat,
      waistCircumference: req.body.waistCircumference,
      neckCircumference: req.body.neckCircumference,
      hipCircumference: req.body.hipCircumference,
      chestCircumference: req.body.chestCircumference,
      bicepCircumference: req.body.bicepCircumference,
      thighCircumference: req.body.thighCircumference,
      calfCircumference: req.body.calfCircumference,
      shoulderWidth: req.body.shoulderWidth,
      weightChange: safeNumber(weightChange),
      bodyFatChange: safeNumber(bodyFatChange),
      heightChange: safeNumber(heightChange),
      bmiChange: safeNumber(bmiChange),
      bmi: safeNumber(currentBMI)
    });
    await newHistoryEntry.save();
  }

  // Güncellenmiş user'ı populate ederek çek
  const updatedUser = await User.findById(req.user._id)
    .select("-password")
    .populate({ path: "profile" })
    .populate({ path: "physicalData" });

  // Debug log: Check updatedUser data before sending
  console.log("updateUserProfile response data:", { physicalData: updatedUser.physicalData, physicalDataHistory: updatedUser.physicalDataHistory });

  res.json(updatedUser);
});

// @desc    Upload profile photo
// @route   POST /api/users/profile/photo
// @access  Private
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      res.status(404);
      throw new Error('Önce profil oluşturmalısınız');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Lütfen bir dosya yükleyin');
    }

    // Vercel'de dosya yolu
    const filePath = `/tmp/${req.file.filename}`;
    console.log('Uploaded file path:', filePath); // Debug log

    // Dosyayı base64'e çevir
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;

    // Profili güncelle
    profile.photoUrl = base64Image;
    await profile.save();

    // Geçici dosyayı sil
    fs.unlinkSync(filePath);

    res.json({
      photoUrl: profile.photoUrl,
      message: 'Profil fotoğrafı başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  await Profile.findOneAndDelete({ user: req.user._id });
  await PhysicalData.deleteMany({ user: req.user._id });
  await Friend.deleteMany({
    $or: [{ requester: req.user._id }, { recipient: req.user._id }]
  });

  try {
    if (typeof CoachAthleteRelationship !== 'undefined') {
      await CoachAthleteRelationship.deleteMany({
        $or: [{ coach: req.user._id }, { athlete: req.user._id }]
      });
    }

    if (typeof TrainingProgram !== 'undefined') {
      await TrainingProgram.deleteMany({
        $or: [{ createdBy: req.user._id }, { athlete: req.user._id }]
      });
    }
  } catch (modelError) {
    console.error('Model error during account deletion:', modelError);
  }

  await User.findByIdAndDelete(req.user._id);

  res.json({ message: 'Hesabınız başarıyla silindi' });
});

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  try {
  const { email } = req.body;
    console.log('Forgot password request for:', email); // Debug log

  const user = await User.findOne({ email });

  if (!user) {
      console.log('User not found:', email); // Debug log
    res.status(404);
    throw new Error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı');
  }

    console.log('User found, generating reset token'); // Debug log
  const resetToken = crypto.randomBytes(20).toString('hex');

  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 dakika

  await user.save();
    console.log('Reset token generated and saved:', resetToken); // Debug log

  res.json({
    message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
    resetToken: resetToken
  });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
});

// @desc    Reset password
// @route   POST /api/users/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  try {
    console.log('Reset password request with token:', req.params.resetToken); // Debug log

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

    console.log('Hashed token:', resetPasswordToken); // Debug log

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
      console.log('Invalid or expired token'); // Debug log
    res.status(400);
    throw new Error('Geçersiz veya süresi dolmuş token');
  }

    console.log('User found, resetting password'); // Debug log
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
    console.log('Password reset successful'); // Debug log

  res.json({ message: 'Şifreniz başarıyla sıfırlandı' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const searchTerm = req.query.q;
  const currentUserId = req.user._id;

  if (!searchTerm || searchTerm.trim() === '') {
    res.status(400);
    throw new Error("Arama terimi gerekli");
  }

  const allUsers = await User.find({
    _id: { $ne: currentUserId }
  }).select('_id email');

  const friendships = await Friend.find({
    $or: [
      { requester: currentUserId, recipient: { $in: allUsers.map(u => u._id) }, status: 'accepted' },
      { recipient: currentUserId, requester: { $in: allUsers.map(u => u._id) }, status: 'accepted' }
    ]
  });

  const pendingRequests = await Friend.find({
    $or: [
      { requester: currentUserId, recipient: { $in: allUsers.map(u => u._id) }, status: 'pending' },
      { recipient: currentUserId, requester: { $in: allUsers.map(u => u._id) }, status: 'pending' }
    ]
  });

  const friendIds = friendships.map(f =>
    f.requester.toString() === currentUserId.toString() ? f.recipient.toString() : f.requester.toString()
  );

  const sentRequestIds = pendingRequests
    .filter(r => r.requester.toString() === currentUserId.toString())
    .map(r => r.recipient.toString());

  const receivedRequestIds = pendingRequests
    .filter(r => r.recipient.toString() === currentUserId.toString())
    .map(r => r.requester.toString());

  const matchingUsers = [];

  for (const user of allUsers) {
    const profile = await Profile.findOne({ user: user._id });

    if (!profile) {
      continue;
    }

    const fullNameMatch = profile.fullName &&
      profile.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = user.email &&
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const isFriend = friendIds.includes(user._id.toString());
    const requestSent = sentRequestIds.includes(user._id.toString());
    const requestReceived = receivedRequestIds.includes(user._id.toString());

    if (fullNameMatch || emailMatch) {
      matchingUsers.push({
        _id: user._id,
        email: user.email,
        profile: {
          fullName: profile.fullName,
          photoUrl: profile.photoUrl,
          goalType: profile.goalType,
          activityLevel: profile.activityLevel
        },
        isFriend,
        requestSent,
        requestReceived
      });
    }
  }

  res.json(matchingUsers);
});

// @desc    Update privacy settings
// @route   PUT /api/users/privacy-settings
// @access  Private
const updatePrivacySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  let profile = await Profile.findOne({ user: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error('Önce profil oluşturmalısınız');
  }

  profile.privacy = req.body.privacy;
  const updatedProfile = await profile.save();

  res.json({
    message: 'Gizlilik ayarları başarıyla güncellendi',
    privacy: updatedProfile.privacy
  });
});

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Delete user
// @route   DELETE /api/users/profile
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ message: 'User deleted successfully' });
});

// @desc    Save or update physical data for any user (athlete or coach)
// @route   POST /api/users/physical-data
// @access  Private
const savePhysicalData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('Kullanıcı bulunamadı');
  }

  const { height, weight, bodyFat, waistCircumference, neckCircumference, hipCircumference } = req.body;

  let physicalData = await PhysicalData.findOne({ user: req.user._id });

  // Yardımcı fonksiyon: Pozitif ve anlamlı değer kontrolü
  function isValid(val) {
    return val !== undefined && val !== null && val !== '' && Number(val) > 0;
  }

  if (physicalData) {
    // Her alanı güncellerken, undefined ise ve yeni değer geliyorsa ekle
    if (isValid(height)) physicalData.height = height;
    if (isValid(weight)) physicalData.weight = weight;
    if (isValid(bodyFat)) physicalData.bodyFat = bodyFat;
    if (isValid(waistCircumference) || physicalData.waistCircumference === undefined) physicalData.waistCircumference = isValid(waistCircumference) ? waistCircumference : physicalData.waistCircumference;
    if (isValid(neckCircumference) || physicalData.neckCircumference === undefined) physicalData.neckCircumference = isValid(neckCircumference) ? neckCircumference : physicalData.neckCircumference;
    if (isValid(hipCircumference) || physicalData.hipCircumference === undefined) physicalData.hipCircumference = isValid(hipCircumference) ? hipCircumference : physicalData.hipCircumference;
    await physicalData.save();
  } else {
    physicalData = await PhysicalData.create({
      user: req.user._id,
      height: isValid(height) ? height : undefined,
      weight: isValid(weight) ? weight : undefined,
      bodyFat: isValid(bodyFat) ? bodyFat : undefined,
      waistCircumference: isValid(waistCircumference) ? waistCircumference : undefined,
      neckCircumference: isValid(neckCircumference) ? neckCircumference : undefined,
      hipCircumference: isValid(hipCircumference) ? hipCircumference : undefined
    });
    user.physicalData = physicalData._id;
    await user.save();
  }

  res.json(physicalData);
});

const updatePhysicalData = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    height,
    weight,
    bodyFat,
    waistCircumference,
    neckCircumference,
    hipCircumference,
    chestCircumference,
    bicepCircumference,
    thighCircumference,
    calfCircumference,
    shoulderWidth
  } = req.body;

  let physicalData = await PhysicalData.findOne({ user: userId });
  if (!physicalData) {
    physicalData = new PhysicalData({ user: userId });
  }

  const lastEntry = await PhysicalDataHistory.findOne({
    user: userId,
    bodyFat: { $ne: null, $exists: true }
  }).sort({ date: -1, createdAt: -1 });

  const weightChange =
    lastEntry && typeof lastEntry.weight === "number" && typeof weight === "number"
      ? weight - lastEntry.weight
      : physicalData.weightChange || 0;

  const bodyFatChange =
    bodyFat !== undefined && lastEntry && typeof lastEntry.bodyFat === "number" && typeof bodyFat === "number"
      ? bodyFat - lastEntry.bodyFat
      : physicalData.bodyFatChange || 0;

  const heightChange =
    lastEntry && typeof lastEntry.height === "number" && typeof height === "number"
      ? height - lastEntry.height
      : physicalData.heightChange || 0;

  let currentBMI = null;
  let bmiChange = undefined;
  if (typeof height === "number" && height > 0 && typeof weight === "number" && weight > 0) {
    currentBMI = weight / ((height / 100) * (height / 100));
    if (lastEntry && typeof lastEntry.bmi === "number") {
      bmiChange = currentBMI - lastEntry.bmi;
    }
  }

  const currentPhysicalData = await PhysicalData.findOne({ user: userId });

  const dataForHistory = {
    user: userId,
    height: height !== undefined ? height : currentPhysicalData?.height,
    weight: weight !== undefined ? weight : currentPhysicalData?.weight,
    bodyFat: bodyFat !== undefined ? bodyFat : currentPhysicalData?.bodyFat,
    waistCircumference: waistCircumference !== undefined ? waistCircumference : currentPhysicalData?.waistCircumference,
    neckCircumference: neckCircumference !== undefined ? neckCircumference : currentPhysicalData?.neckCircumference,
    hipCircumference: hipCircumference !== undefined ? hipCircumference : currentPhysicalData?.hipCircumference,
    chestCircumference: chestCircumference !== undefined ? chestCircumference : currentPhysicalData?.chestCircumference,
    bicepCircumference: bicepCircumference !== undefined ? bicepCircumference : currentPhysicalData?.bicepCircumference,
    thighCircumference: thighCircumference !== undefined ? thighCircumference : currentPhysicalData?.thighCircumference,
    calfCircumference: calfCircumference !== undefined ? calfCircumference : currentPhysicalData?.calfCircumference,
    shoulderWidth: shoulderWidth !== undefined ? shoulderWidth : currentPhysicalData?.shoulderWidth,
    date: new Date(),
    weightChange,
    bodyFatChange,
    heightChange,
    bmiChange,
    bmi: currentBMI
  };

  const newHistoryEntry = new PhysicalDataHistory(
    Object.fromEntries(Object.entries(dataForHistory).filter(([_, v]) => v !== undefined))
  );
  await newHistoryEntry.save();

  // Güncelleme - artık 0 gibi değerler de güncellenebilecek:
  if (height !== undefined) physicalData.height = height;
  if (weight !== undefined) physicalData.weight = weight;
  if (bodyFat !== undefined) physicalData.bodyFat = bodyFat;
  if (waistCircumference !== undefined) physicalData.waistCircumference = waistCircumference;
  if (neckCircumference !== undefined) physicalData.neckCircumference = neckCircumference;
  if (hipCircumference !== undefined) physicalData.hipCircumference = hipCircumference;
  if (chestCircumference !== undefined) physicalData.chestCircumference = chestCircumference;
  if (bicepCircumference !== undefined) physicalData.bicepCircumference = bicepCircumference;
  if (thighCircumference !== undefined) physicalData.thighCircumference = thighCircumference;
  if (calfCircumference !== undefined) physicalData.calfCircumference = calfCircumference;
  if (shoulderWidth !== undefined) physicalData.shoulderWidth = shoulderWidth;

  physicalData.weightChange = weightChange;
  physicalData.bodyFatChange = bodyFatChange;
  physicalData.heightChange = heightChange;
  physicalData.bmiChange = bmiChange;
  if (currentBMI !== null) physicalData.bmi = currentBMI;

  await physicalData.save();

  await Measurement.create({ user: userId, date: new Date() });

  const user = await User.findById(userId);
  if (!user.physicalData) {
    user.physicalData = physicalData._id;
    await user.save();
  }

  res.json({
    message: 'Physical data updated successfully',
    physicalData
  });
});

// Get physical data history
const getPhysicalDataHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await PhysicalDataHistory.find({ user: userId })
      .sort({ date: -1 })
      .limit(10); // Son 10 kayıt

    res.json(history);
  } catch (error) {
    console.error('Error fetching physical data history:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin password reset
// @route   POST /api/users/admin-reset-password
// @access  Public
const adminResetPassword = asyncHandler(async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log('Admin reset password request for:', email); // Debug log

    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found:', email); // Debug log
      res.status(404);
      throw new Error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı');
    }

    console.log('User found, resetting password'); // Debug log
    user.password = newPassword;
    await user.save();
    console.log('Password reset successful'); // Debug log

    res.json({ message: 'Şifre başarıyla sıfırlandı' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
});

// @desc    Check user accounts
// @route   GET /api/users/check-accounts
// @access  Public
const checkUserAccounts = asyncHandler(async (req, res) => {
  try {
    const { email } = req.query;
    console.log('Checking accounts for email:', email); // Debug log

    const users = await User.find({
      email: { $in: [email, email.replace('@gmail.com', '@outlook.com'), email.replace('@outlook.com', '@gmail.com')] }
    }).select('-password');

    console.log('Found users:', users); // Debug log

    res.json({
      message: 'Kullanıcı hesapları kontrol edildi',
      users: users
    });
  } catch (error) {
    console.error('Check accounts error:', error);
    res.status(500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
});

// @desc    Delete duplicate account
// @route   DELETE /api/users/delete-duplicate
// @access  Public
const deleteDuplicateAccount = asyncHandler(async (req, res) => {
  try {
    const { email } = req.query;
    console.log('Deleting duplicate account for:', email); // Debug log

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }

    // İlişkili verileri sil
    await Profile.findOneAndDelete({ user: user._id });
    await PhysicalData.deleteMany({ user: user._id });
    await Friend.deleteMany({
      $or: [{ requester: user._id }, { recipient: user._id }]
    });
    await Login.deleteMany({ user: user._id });
    await Streak.deleteMany({ user: user._id });
    await Measurement.deleteMany({ user: user._id });
    await PhysicalDataHistory.deleteMany({ user: user._id });

    // Kullanıcıyı sil
    await User.findByIdAndDelete(user._id);

    console.log('Duplicate account deleted successfully'); // Debug log
    res.json({ message: 'Yinelenen hesap başarıyla silindi' });
  } catch (error) {
    console.error('Delete duplicate account error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Sunucu hatası',
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  getUserProfileById,
  updateUserProfile,
  uploadProfilePhoto,
  deleteAccount,
  forgotPassword,
  deleteUser,
  resetPassword,
  searchUsers,
  updatePrivacySettings,
  savePhysicalData,
  updatePhysicalData,
  getPhysicalDataHistory,
  adminResetPassword,
  checkUserAccounts,
  deleteDuplicateAccount
};