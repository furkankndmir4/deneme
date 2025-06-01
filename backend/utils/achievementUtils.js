const allBadges = require('../data/achievements.json');
const User = require('../models/userModel');

/**
 * Rozet için ilerleme yüzdesi hesapla (progress)
 */
function calculateProgress(badge, userStats) {
  let progress = 0;
  let earned = false;

  try {
    if (badge.condition.goalsCompleted) {
      const current = userStats.goalsCompleted || 0;
      progress = Math.min(100, (current / badge.condition.goalsCompleted) * 100);
      earned = current >= badge.condition.goalsCompleted;
    } else if (badge.condition.points) {
      const current = userStats.points || 0;
      progress = Math.min(100, (current / badge.condition.points) * 100);
      earned = current >= badge.condition.points;
    } else if (badge.condition.friends) {
      const required = badge.condition.friends;
      const current = userStats.friends || 0;
      progress = Math.min(100, Math.round((current / required) * 100));
      earned = current >= required;
    } else if (badge.condition.measurements) {
      const current = userStats.measurements || 0;
      progress = Math.min(100, (current / badge.condition.measurements) * 100);
      earned = current >= badge.condition.measurements;
    } else if (badge.condition.logins) {
      const current = userStats.logins || 0;
      progress = Math.min(100, (current / badge.condition.logins) * 100);
      earned = current >= badge.condition.logins;
    } else if (badge.condition.streak) {
      const current = userStats.streak || 0;
      progress = Math.min(100, (current / badge.condition.streak) * 100);
      earned = current >= badge.condition.streak;
    } else if (badge.condition.shares) {
      const current = userStats.shares || 0;
      progress = Math.min(100, (current / badge.condition.shares) * 100);
      earned = current >= badge.condition.shares;
    } else if (badge.condition.workouts) {
      const current = userStats.workouts || 0;
      progress = Math.min(100, (current / badge.condition.workouts) * 100);
      earned = current >= badge.condition.workouts;
    } else if (badge.condition.weightLoss) {
      const current = userStats.weightLoss || 0;
      progress = Math.min(100, (current / badge.condition.weightLoss) * 100);
      earned = current >= badge.condition.weightLoss;
    } else if (badge.condition.muscleGain) {
      const current = userStats.muscleGain || 0;
      progress = Math.min(100, (current / badge.condition.muscleGain) * 100);
      earned = current >= badge.condition.muscleGain;
    } else if (badge.condition.recordStreak) {
      progress = userStats.recordStreak ? 100 : 0;
      earned = userStats.recordStreak || false;
    } else if (badge.condition.secret || badge.condition.nightLogin) {
      progress = 0;
      earned = false;
    } else if (badge.condition.date) {
      progress = userStats.date === badge.condition.date ? 100 : 0;
      earned = userStats.date === badge.condition.date;
    }
  } catch (error) {
    console.error('Error calculating progress:', error);
    progress = 0;
    earned = false;
  }

  return {
    progress: Math.round(progress),
    earned
  };
}

/**
 * Kullanıcıya uygun rozetleri kontrol eder, yeni kazandıklarını ekler ve progress ile döner.
 * @param {string} userId
 * @param {object} userStats - Kullanıcının güncel istatistikleri
 * @returns {Promise<{earned: string[], progress: object[]}>}
 */
async function checkAndAwardBadges(userId, userStats) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { earned: [], progress: [] };
    }

    // Her zaman dizi olarak başlat
    user.achievements = Array.isArray(user.achievements) ? user.achievements : [];

    // Eksik veya bozuk nesneleri filtrele
    user.achievements = user.achievements.filter(a => a && typeof a === 'object' && typeof a.id === 'string' && a.id.trim() !== '');

    // Eski başarılar sadece ID ise, nesneye dönüştür (güvenli kontrol)
    if (
      user.achievements.length > 0 &&
      user.achievements.some(a => typeof a === 'string')
    ) {
      user.achievements = user.achievements.map(a => {
        if (typeof a === 'string') {
          return {
            id: a,
            earned: true,
            earnedDate: new Date().toISOString()
          };
        }
        return a;
      });
      await user.save();
    }

    const newlyEarned = [];
    const progressArr = [];

    for (const badge of allBadges) {
      try {
        // Eğer rozet sadece antrenörlere özelse ve kullanıcı coach değilse, atla
        if ((badge.userType === 'coach' || badge.type === 'coach') && userStats.userType !== 'coach') {
          continue;
        }
        // Eğer rozet sadece sporculara özelse ve kullanıcı coach ise, atla (isteğe bağlı)
        if ((badge.userType === 'athlete' || badge.type === 'athlete') && userStats.userType === 'coach') {
          continue;
        }
        const existingAchievement = user.achievements.find(a => a.id === badge.id);
        const { progress, earned } = calculateProgress(badge, userStats);

        if (earned && !existingAchievement) {
          const newAchievement = {
            id: badge.id,
            earned: true,
            earnedDate: new Date().toISOString()
          };
          user.achievements.push(newAchievement);
          newlyEarned.push(badge.id);
        }

        progressArr.push({ 
          id: badge.id, 
          progress, 
          earned: existingAchievement ? existingAchievement.earned : earned,
          earnedDate: existingAchievement ? existingAchievement.earnedDate : (earned ? new Date().toISOString() : null)
        });
      } catch (error) {
        progressArr.push({ 
          id: badge.id, 
          progress: 0, 
          earned: false,
          earnedDate: null
        });
      }
    }

    await user.save();
    return { earned: newlyEarned, progress: progressArr };
  } catch (error) {
    throw error;
  }
}

module.exports = { checkAndAwardBadges, calculateProgress }; 