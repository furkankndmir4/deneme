const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TrainingProgram = require('../models/trainingProgramModel');
const User = require('../models/userModel');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB bağlantısı kuruldu'))
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  });

const trainingPrograms = [
  {
    name: 'Başlangıç Seviyesi - Tam Vücut Antrenmanı',
    description: 'Fitness yolculuğuna yeni başlayanlar için ideal, haftada 3 gün tam vücut çalışması.',
    isTemplate: true,
    difficultyLevel: 'beginner',
    workouts: [
      {
        day: 1,
        title: 'Tam Vücut - A',
        exercises: [
          { name: 'Squat (Çömelme)', sets: 3, reps: '10-12', notes: 'Vücut ağırlığı ile başlayın' },
          { name: 'Push-up (Şınav)', sets: 3, reps: '8-10', notes: 'Dizler üzerinde yapılabilir' },
          { name: 'Dumbbell Row (Dambıl Çekiş)', sets: 3, reps: '10-12', notes: 'Her kol için' },
          { name: 'Plank', sets: 3, reps: '30 saniye', notes: 'Düz bir sırt ile' },
          { name: 'Walking Lunges (Yürüyüş Lunges)', sets: 2, reps: '10 adım', notes: 'Her bacak için' }
        ]
      },
      {
        day: 3,
        title: 'Tam Vücut - B',
        exercises: [
          { name: 'Glute Bridge (Kalça Köprüsü)', sets: 3, reps: '12-15', notes: 'Kalçalarınızı sıkın' },
          { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', notes: 'Omuzları zorlamayın' },
          { name: 'Superman Hold', sets: 3, reps: '30 saniye', notes: 'Sırt kaslarını çalıştırır' },
          { name: 'Bicycle Crunches', sets: 3, reps: '12-15', notes: 'Her taraf için' },
          { name: 'Calf Raises', sets: 3, reps: '15-20', notes: 'Ayak parmak uçlarında yükselin' }
        ]
      },
      {
        day: 5,
        title: 'Tam Vücut - C',
        exercises: [
          { name: 'Dumbbell Romanian Deadlift', sets: 3, reps: '10-12', notes: 'Sırtınızı düz tutun' },
          { name: 'Incline Push-up', sets: 3, reps: '10-12', notes: 'Yükseltilmiş yüzey kullanın' },
          { name: 'Lateral Raises', sets: 3, reps: '12-15', notes: 'Hafif ağırlıkla başlayın' },
          { name: 'Russian Twists', sets: 3, reps: '10-12', notes: 'Her tarafa' },
          { name: 'Bodyweight Squats', sets: 3, reps: '15-20', notes: 'Form önemli' }
        ]
      }
    ]
  },
  {
    name: 'Yağ Yakma Programı',
    description: 'Hızlı yağ yakımı için yüksek yoğunluklu interval antrenmanları ve güç egzersizleri kombinasyonu.',
    isTemplate: true,
    difficultyLevel: 'intermediate',
    workouts: [
      {
        day: 1,
        title: 'HIIT Kardiyo',
        exercises: [
          { name: 'Isınma', sets: 1, reps: '5 dakika', notes: 'Hafif tempo koşu veya ip atlama' },
          { name: 'Sprint Interval', sets: 8, reps: '30s sprint / 30s dinlenme', notes: 'Maksimum efor' },
          { name: 'Mountain Climbers', sets: 3, reps: '45 saniye', notes: '15 saniye dinlenme' },
          { name: 'Burpees', sets: 3, reps: '45 saniye', notes: '15 saniye dinlenme' },
          { name: 'Jumping Jacks', sets: 3, reps: '45 saniye', notes: '15 saniye dinlenme' },
          { name: 'Soğuma', sets: 1, reps: '5 dakika', notes: 'Hafif aerobik aktivite ve esneme' }
        ]
      },
      {
        day: 2,
        title: 'Tam Vücut Direnç',
        exercises: [
          { name: 'Circuit: Squat', sets: 3, reps: '15', notes: 'Minimal dinlenme ile devam' },
          { name: 'Circuit: Push-up', sets: 3, reps: '12', notes: 'Minimal dinlenme ile devam' },
          { name: 'Circuit: Kettlebell Swing', sets: 3, reps: '15', notes: 'Minimal dinlenme ile devam' },
          { name: 'Circuit: Plank', sets: 3, reps: '45 saniye', notes: 'Minimal dinlenme ile devam' },
          { name: 'Circuit: Lunges', sets: 3, reps: '12 (her bacak)', notes: 'Setler arası 2 dk dinlenme' }
        ]
      },
      {
        day: 3,
        title: 'Aktif Dinlenme',
        exercises: [
          { name: 'Yürüyüş', sets: 1, reps: '30-40 dakika', notes: 'Orta tempo' },
          { name: 'Esneme', sets: 1, reps: '15-20 dakika', notes: 'Tüm vücut için' }
        ]
      },
      {
        day: 4,
        title: 'Tabata Kardiyo',
        exercises: [
          { name: 'Isınma', sets: 1, reps: '5 dakika', notes: 'Dinamik hareketler' },
          { name: 'Tabata: Squat Jumps', sets: 4, reps: '20s çalışma / 10s dinlenme', notes: 'Maksimum efor' },
          { name: 'Dinlenme', sets: 1, reps: '1 dakika', notes: 'Su için' },
          { name: 'Tabata: High Knees', sets: 4, reps: '20s çalışma / 10s dinlenme', notes: 'Maksimum efor' },
          { name: 'Dinlenme', sets: 1, reps: '1 dakika', notes: 'Su için' },
          { name: 'Tabata: Mountain Climbers', sets: 4, reps: '20s çalışma / 10s dinlenme', notes: 'Maksimum efor' },
          { name: 'Dinlenme', sets: 1, reps: '1 dakika', notes: 'Su için' },
          { name: 'Tabata: Burpees', sets: 4, reps: '20s çalışma / 10s dinlenme', notes: 'Maksimum efor' },
          { name: 'Soğuma', sets: 1, reps: '5 dakika', notes: 'Esneme hareketleri' }
        ]
      },
      {
        day: 5,
        title: 'Alt Vücut & Core',
        exercises: [
          { name: 'Squat Variations', sets: 4, reps: '15,12,10,8', notes: 'Her set daha ağır' },
          { name: 'Romanian Deadlift', sets: 4, reps: '12,10,8,8', notes: 'Sırt düz' },
          { name: 'Walking Lunges', sets: 3, reps: '12 adım', notes: 'Her bacak' },
          { name: 'Superset: Leg Raise', sets: 3, reps: '15', notes: 'Hemen plank ile devam' },
          { name: 'Superset: Plank', sets: 3, reps: '45 saniye', notes: '30 saniye dinlenme' }
        ]
      },
      {
        day: 6,
        title: 'Üst Vücut & HIIT',
        exercises: [
          { name: 'Push-up Variations', sets: 3, reps: '12-15', notes: 'Farklı el pozisyonları' },
          { name: 'Dumbbell Row', sets: 3, reps: '12 her taraf', notes: 'Kontrollü hareket' },
          { name: 'Shoulder Press', sets: 3, reps: '12', notes: 'Orta ağırlık' },
          { name: 'HIIT Finisher: Burpee', sets: 1, reps: '45 saniye', notes: '15 saniye dinlenme' },
          { name: 'HIIT Finisher: Jumping Jacks', sets: 1, reps: '45 saniye', notes: '15 saniye dinlenme' },
          { name: 'HIIT Finisher: High Knees', sets: 1, reps: '45 saniye', notes: '15 saniye dinlenme' },
          { name: 'HIIT Finisher: Mountain Climbers', sets: 1, reps: '45 saniye', notes: 'Tamamlandı' }
        ]
      },
      {
        day: 7,
        title: 'Tam Dinlenme',
        exercises: [
          { name: 'Aktif Toparlanma', sets: 1, reps: 'İsteğe bağlı', notes: 'Hafif yürüyüş veya yüzme' },
          { name: 'Esneme', sets: 1, reps: '15-20 dakika', notes: 'Derin nefes alarak' }
        ]
      }
    ]
  },
  {
    name: 'Kas Kütlesi Kazanımı Programı',
    description: 'Kas kütlesi geliştirmek isteyenler için 4 günlük bölgesel antrenman programı.',
    isTemplate: true,
    difficultyLevel: 'intermediate',
    workouts: [
      {
        day: 1,
        title: 'Göğüs & Triceps',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '8-10', notes: 'Ağırlığı kademeli artırın' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', notes: 'Kontrollü iniş' },
          { name: 'Chest Fly', sets: 3, reps: '12-15', notes: 'İyi bir gerilme hissedin' },
          { name: 'Tricep Pushdown', sets: 3, reps: '12-15', notes: 'Dirsekleri sabit tutun' },
          { name: 'Overhead Tricep Extension', sets: 3, reps: '10-12', notes: 'Omuzları koruyun' },
          { name: 'Dips', sets: 3, reps: 'Maksimum', notes: 'Yardımlı yapılabilir' }
        ]
      },
      {
        day: 2,
        title: 'Sırt & Biceps',
        exercises: [
          { name: 'Pull-ups or Lat Pulldown', sets: 4, reps: '8-10', notes: 'İyi form' },
          { name: 'Bent Over Row', sets: 3, reps: '10-12', notes: 'Sırt düz' },
          { name: 'Seated Cable Row', sets: 3, reps: '12', notes: 'Omuzları geri çekin' },
          { name: 'Bicep Curl (Barbell)', sets: 3, reps: '10-12', notes: 'Kontrollü hareket' },
          { name: 'Hammer Curl', sets: 3, reps: '12-15', notes: 'Ön kolları çalıştırır' },
          { name: 'Reverse Fly', sets: 3, reps: '15', notes: 'Hafif ağırlık' }
        ]
      },
      {
        day: 3,
        title: 'Dinlenme veya Hafif Kardiyo',
        exercises: [
          { name: 'Yürüyüş veya Hafif Koşu', sets: 1, reps: '20-30 dakika', notes: 'İsteğe bağlı' },
          { name: 'Esneme', sets: 1, reps: '10-15 dakika', notes: 'Tüm vücut' }
        ]
      },
      {
        day: 4,
        title: 'Bacak & Omuz',
        exercises: [
          { name: 'Squat', sets: 4, reps: '8-10', notes: 'Tam derinlik' },
          { name: 'Romanian Deadlift', sets: 3, reps: '10-12', notes: 'Kalçadan hareket' },
          { name: 'Leg Press', sets: 3, reps: '12-15', notes: 'Farklı ayak pozisyonları' },
          { name: 'Shoulder Press', sets: 4, reps: '8-10', notes: 'Oturarak veya ayakta' },
          { name: 'Lateral Raise', sets: 3, reps: '12-15', notes: 'Hafif ağırlık' },
          { name: 'Front Raise', sets: 3, reps: '12', notes: 'Kontrollü' }
        ]
      },
      {
        day: 5,
        title: 'Kollar & Core',
        exercises: [
          { name: 'Close Grip Bench Press', sets: 3, reps: '8-10', notes: 'Triceps için' },
          { name: 'Dumbbell Curl', sets: 3, reps: '10-12', notes: 'Alternatif' },
          { name: 'Tricep Dips', sets: 3, reps: '10-12', notes: 'Vücut ağırlığı' },
          { name: 'Ab Crunches', sets: 3, reps: '15-20', notes: 'Karın sıkılı' },
          { name: 'Plank Variations', sets: 3, reps: '45 saniye', notes: 'Yan plank dahil' },
          { name: 'Russian Twist', sets: 3, reps: '20', notes: 'Her iki tarafa' }
        ]
      },
      {
        day: 6,
        title: 'Tam Vücut (Hafif-Orta)',
        exercises: [
          { name: 'Push-up', sets: 3, reps: '12-15', notes: 'Farklı el pozisyonları' },
          { name: 'Pull-up', sets: 3, reps: '6-8', notes: 'Yardımlı yapılabilir' },
          { name: 'Bodyweight Squat', sets: 3, reps: '15-20', notes: 'Dinamik' },
          { name: 'Dumbbell Row', sets: 3, reps: '12', notes: 'Her kol için' },
          { name: 'Glute Bridge', sets: 3, reps: '15', notes: 'Kalça sıkma' }
        ]
      },
      {
        day: 7,
        title: 'Tam Dinlenme',
        exercises: [
          { name: 'Dinlenme', sets: 1, reps: 'Tam gün', notes: 'Toparlanma için önemli' }
        ]
      }
    ]
  }
];

async function findCoachUser() {
  try {
    let coach = await User.findOne({ userType: 'coach' });
    
    if (!coach) {
      coach = await User.findOne();
    }
    
    if (!coach) {
      throw new Error('Sistemde hiç kullanıcı bulunamadı. Önce bir kullanıcı oluşturun.');
    }
    
    return coach._id;
  } catch (error) {
    console.error('Coach user search error:', error);
    throw error;
  }
}

async function seedPrograms() {
  try {
    const coachId = await findCoachUser();
    
    await TrainingProgram.deleteMany({ isTemplate: true });
    
    for (const program of trainingPrograms) {
      program.createdBy = coachId;
      await TrainingProgram.create(program);
      console.log(`"${program.name}" programı eklendi.`);
    }
    
    console.log('Tüm antrenman programları başarıyla eklendi!');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

seedPrograms();