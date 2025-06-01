class AchievementService {
    constructor() {
      this.achievementDefinitions = [
        {
          id: 'first_workout',
          title: 'İlk Adım',
          description: 'İlk antrenmanını tamamladın',
          iconType: 'Medal',
          iconColor: 'yellow',
          condition: (userData) => userData.completedWorkouts >= 1
        },
        {
          id: 'regular_athlete',
          title: 'Düzenli Sporcu',
          description: 'Bir haftada 3 antrenman tamamladın',
          iconType: 'Trophy',
          iconColor: 'blue',
          condition: (userData) => this.hasCompletedWorkoutsInTimeframe(userData, 7, 3)
        },
        {
          id: 'marathon_runner',
          title: 'Maraton Koşucusu',
          description: '50 km koştun',
          iconType: 'Award',
          iconColor: 'purple',
          condition: (userData) => userData.totalRunningDistance >= 50,
          progress: (userData) => Math.min(100, (userData.totalRunningDistance / 50) * 100)
        },
        {
          id: 'iron_body',
          title: 'Demir Vücut',
          description: '1000 kg toplam ağırlık kaldırdın',
          iconType: 'Crown',
          iconColor: 'red',
          condition: (userData) => userData.totalWeightLifted >= 1000,
          progress: (userData) => Math.min(100, (userData.totalWeightLifted / 1000) * 100)
        },
        {
          id: 'nutrition_expert',
          title: 'Beslenme Uzmanı',
          description: '30 gün boyunca beslenme planına uydun',
          iconType: 'Star',
          iconColor: 'green',
          condition: (userData) => this.hasFollowedNutritionPlan(userData, 30),
          progress: (userData) => {
            const daysFollowed = this.getConsecutiveDaysFollowingNutritionPlan(userData);
            return Math.min(100, (daysFollowed / 30) * 100);
          }
        },
        {
          id: 'hot_streak',
          title: 'Ateşli Seri',
          description: '10 gün üst üste antrenman yaptın',
          iconType: 'Flame',
          iconColor: 'orange',
          condition: (userData) => this.hasConsecutiveWorkoutDays(userData, 10),
          progress: (userData) => {
            const consecutiveDays = this.getConsecutiveWorkoutDays(userData);
            return Math.min(100, (consecutiveDays / 10) * 100);
          }
        },
        {
          id: 'weight_goal',
          title: 'Hedef Ağırlık',
          description: 'Hedef kilona ulaştın',
          iconType: 'Target',
          iconColor: 'green',
          condition: (userData) => userData.hasReachedWeightGoal,
          progress: (userData) => {
            if (!userData.weightGoal || !userData.currentWeight || !userData.startWeight) {
              return 0;
            }
            
            const totalLossNeeded = userData.startWeight - userData.weightGoal;
            const currentLoss = userData.startWeight - userData.currentWeight;
            
            if (totalLossNeeded < 0) {
              const totalGainNeeded = userData.weightGoal - userData.startWeight;
              const currentGain = userData.currentWeight - userData.startWeight;
              return Math.min(100, Math.max(0, (currentGain / totalGainNeeded) * 100));
            }
            
            return Math.min(100, Math.max(0, (currentLoss / totalLossNeeded) * 100));
          }
        },
        {
          id: 'water_master',
          title: 'Su Ustası',
          description: '30 gün boyunca günlük su hedefini karşıladın',
          iconType: 'Droplets',
          iconColor: 'blue',
          condition: (userData) => this.hasMaintainedWaterIntake(userData, 30),
          progress: (userData) => {
            const daysWithTargetWater = this.getConsecutiveDaysWithTargetWaterIntake(userData);
            return Math.min(100, (daysWithTargetWater / 30) * 100);
          }
        }
      ];
    }
  
    checkAndUpdateAchievements(userData) {
      const userAchievements = userData.achievements || [];
      const updatedAchievements = [...userAchievements];
      const newlyEarnedAchievements = [];
  
      this.achievementDefinitions.forEach(achievementDef => {
        const existingAchievement = updatedAchievements.find(a => a.id === achievementDef.id);
        
        if (existingAchievement && existingAchievement.earned) {
          return;
        }
        
        const isEarned = achievementDef.condition(userData);
        
        if (isEarned) {
          const newAchievement = {
            id: achievementDef.id,
            title: achievementDef.title,
            description: achievementDef.description,
            iconType: achievementDef.iconType,
            iconColor: achievementDef.iconColor,
            earned: true,
            earnedDate: new Date().toISOString()
          };
          
          if (existingAchievement) {
            const index = updatedAchievements.findIndex(a => a.id === achievementDef.id);
            updatedAchievements[index] = newAchievement;
          } else {
            updatedAchievements.push(newAchievement);
          }
          
          newlyEarnedAchievements.push(newAchievement);
        } else if (achievementDef.progress) {
          const progress = achievementDef.progress(userData);
          
          if (existingAchievement) {
            const index = updatedAchievements.findIndex(a => a.id === achievementDef.id);
            updatedAchievements[index] = {
              ...existingAchievement,
              progress
            };
          } else {
            updatedAchievements.push({
              id: achievementDef.id,
              title: achievementDef.title,
              description: achievementDef.description,
              iconType: achievementDef.iconType,
              iconColor: achievementDef.iconColor,
              earned: false,
              progress
            });
          }
        }
      });
  
      return {
        updatedAchievements,
        newlyEarnedAchievements
      };
    }
  
    hasCompletedWorkoutsInTimeframe(userData, days, targetCount) {
      if (!userData.workoutHistory || userData.workoutHistory.length === 0) {
        return false;
      }
  
      const now = new Date();
      const timeframeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const workoutsInTimeframe = userData.workoutHistory.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= timeframeStart && workoutDate <= now;
      });
      
      return workoutsInTimeframe.length >= targetCount;
    }
  
    hasConsecutiveWorkoutDays(userData, targetDays) {
      return this.getConsecutiveWorkoutDays(userData) >= targetDays;
    }
  
    getConsecutiveWorkoutDays(userData) {
      if (!userData.workoutHistory || userData.workoutHistory.length === 0) {
        return 0;
      }
  
      const workoutDates = userData.workoutHistory.map(w => {
        const date = new Date(w.date);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      });
      
      const uniqueDates = [...new Set(workoutDates)].sort();
      
      let maxConsecutive = 1;
      let currentConsecutive = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentConsecutive++;
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
          currentConsecutive = 1;
        }
      }
      
      return maxConsecutive;
    }
  
    hasFollowedNutritionPlan(userData, targetDays) {
      return this.getConsecutiveDaysFollowingNutritionPlan(userData) >= targetDays;
    }
  
    getConsecutiveDaysFollowingNutritionPlan(userData) {
      if (!userData.nutritionLogs || userData.nutritionLogs.length === 0) {
        return 0;
      }
  
      const nutritionByDate = {};
      userData.nutritionLogs.forEach(log => {
        const date = new Date(log.date);
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        
        if (!nutritionByDate[dateStr]) {
          nutritionByDate[dateStr] = [];
        }
        
        nutritionByDate[dateStr].push(log);
      });
      
      const followedDates = Object.keys(nutritionByDate).filter(dateStr => {
        const logs = nutritionByDate[dateStr];
        return logs.length >= 3 && logs.reduce((sum, log) => sum + log.calories, 0) >= userData.targetCalories * 0.8;
      }).sort();
      
      let maxConsecutive = 1;
      let currentConsecutive = 1;
      
      for (let i = 1; i < followedDates.length; i++) {
        const prevDate = new Date(followedDates[i - 1]);
        const currDate = new Date(followedDates[i]);
        
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentConsecutive++;
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
          currentConsecutive = 1;
        }
      }
      
      return followedDates.length > 0 ? maxConsecutive : 0;
    }
    
    hasMaintainedWaterIntake(userData, targetDays) {
      return this.getConsecutiveDaysWithTargetWaterIntake(userData) >= targetDays;
    }
    
    getConsecutiveDaysWithTargetWaterIntake(userData) {
      if (!userData.waterIntakeLogs || userData.waterIntakeLogs.length === 0) {
        return 0;
      }
      
      const waterByDate = {};
      userData.waterIntakeLogs.forEach(log => {
        const date = new Date(log.date);
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        
        if (!waterByDate[dateStr]) {
          waterByDate[dateStr] = 0;
        }
        
        waterByDate[dateStr] += log.amount;
      });
      
      const targetMet = Object.keys(waterByDate).filter(dateStr => {
        return waterByDate[dateStr] >= userData.waterIntakeTarget;
      }).sort();
      
      let maxConsecutive = 1;
      let currentConsecutive = 1;
      
      for (let i = 1; i < targetMet.length; i++) {
        const prevDate = new Date(targetMet[i - 1]);
        const currDate = new Date(targetMet[i]);
        
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentConsecutive++;
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
          currentConsecutive = 1;
        }
      }
      
      return targetMet.length > 0 ? maxConsecutive : 0;
    }
    
    sendAchievementNotification(user, achievement) {
      console.log(`Bildirim: ${user.name}, '${achievement.title}' rozetini kazandı!`);
      
      return {
        userId: user.id,
        type: 'achievement_earned',
        title: 'Yeni Rozet Kazandın!',
        message: `Tebrikler! '${achievement.title}' rozetini kazandın.`,
        achievementId: achievement.id,
        timestamp: new Date().toISOString()
      };
    }
    
    getAllUserAchievements(userData) {
      const userAchievements = userData.achievements || [];
      
      const allAchievements = this.achievementDefinitions.map(achievementDef => {
        const existingAchievement = userAchievements.find(a => a.id === achievementDef.id);
        
        if (existingAchievement) {
          return existingAchievement;
        }
        
        const isEarned = achievementDef.condition(userData);
        
        const progress = achievementDef.progress ? achievementDef.progress(userData) : 0;
        
        return {
          id: achievementDef.id,
          title: achievementDef.title,
          description: achievementDef.description,
          iconType: achievementDef.iconType,
          iconColor: achievementDef.iconColor,
          earned: isEarned,
          progress: isEarned ? 100 : progress,
          earnedDate: isEarned ? new Date().toISOString() : null
        };
      });
      
      return allAchievements;
    }
  }
  
  export default AchievementService;