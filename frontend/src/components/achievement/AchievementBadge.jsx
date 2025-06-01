import React from 'react';
import { Trophy, Medal, Award, Crown, Star, Flame, Target, Droplets, TrendingUp } from 'lucide-react';

// Rozet ikonu seçici bileşen
const BadgeIcon = ({ type, color, size }) => {
  const iconSize = size || 24;
  const iconColor = `text-${color}-500`;
  
  switch (type) {
    case 'Trophy':
      return <Trophy className={iconColor} size={iconSize} />;
    case 'Medal':
      return <Medal className={iconColor} size={iconSize} />;
    case 'Award':
      return <Award className={iconColor} size={iconSize} />;
    case 'Crown':
      return <Crown className={iconColor} size={iconSize} />;
    case 'Star':
      return <Star className={iconColor} size={iconSize} />;
    case 'Flame':
      return <Flame className={iconColor} size={iconSize} />;
    case 'Target':
      return <Target className={iconColor} size={iconSize} />;
    case 'Droplets':
      return <Droplets className={iconColor} size={iconSize} />;
    case 'TrendingUp':
      return <TrendingUp className={iconColor} size={iconSize} />;
    default:
      return <Medal className={iconColor} size={iconSize} />;
  }
};

// Tek bir rozet/başarı bileşeni
const AchievementBadge = ({ achievement, size = "md", onClick }) => {
  // Rozet boyutunu belirle
  const sizeMap = {
    sm: {
      container: "w-16 h-16",
      icon: 24,
      textSize: "text-xs"
    },
    md: {
      container: "w-20 h-20",
      icon: 32,
      textSize: "text-sm"
    },
    lg: {
      container: "w-24 h-24",
      icon: 40,
      textSize: "text-base"
    }
  };
  
  const sizing = sizeMap[size] || sizeMap.md;
  
  // Rozet durumuna göre opaklık ve gölge efekti
  const opacity = achievement.earned ? "opacity-100" : "opacity-50";
  const shadow = achievement.earned ? "shadow-lg" : "shadow";
  const border = achievement.earned ? "border-2" : "border";
  const borderColor = achievement.earned ? `border-${achievement.iconColor}-400` : "border-gray-300";
  
  return (
    <div 
      className={`relative rounded-full ${sizing.container} ${opacity} ${shadow} ${border} ${borderColor} flex items-center justify-center bg-white cursor-pointer transition-all hover:scale-105`}
      onClick={() => onClick && onClick(achievement)}
      title={achievement.title}
    >
      <div className="absolute inset-0 rounded-full flex items-center justify-center">
        <BadgeIcon 
          type={achievement.iconType} 
          color={achievement.iconColor} 
          size={sizing.icon} 
        />
      </div>
      
      {/* Eğer rozet kazanılmamışsa ve ilerleme durumu varsa ilerleme göstergesi */}
      {!achievement.earned && achievement.progress > 0 && (
        <div className="absolute bottom-0 w-full px-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`bg-${achievement.iconColor}-500 h-1.5 rounded-full`}
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Yeni rozet kazanıldığında gösterilecek "Yeni" etiketi */}
      {achievement.earned && achievement.isNew && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          <span>!</span>
        </div>
      )}
    </div>
  );
};

// Rozet grup bileşeni - birden fazla rozeti yan yana gösterir
const AchievementBadgeGroup = ({ achievements, size = "md", onBadgeClick }) => {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="flex justify-center items-center p-4 text-gray-500">
        Henüz rozet kazanılmadı
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {achievements.map(achievement => (
        <AchievementBadge 
          key={achievement.id}
          achievement={achievement}
          size={size}
          onClick={() => onBadgeClick && onBadgeClick(achievement)}
        />
      ))}
    </div>
  );
};

// Rozet detay bileşeni - tıklandığında rozet detaylarını gösterir
const AchievementDetail = ({ achievement, onClose }) => {
  if (!achievement) return null;
  
  const earnedClass = achievement.earned ? "border-green-500" : "border-yellow-500";
  const earnedText = achievement.earned 
    ? `${new Date(achievement.earnedDate).toLocaleDateString()} tarihinde kazanıldı` 
    : `İlerleme: %${Math.round(achievement.progress)}`;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 max-w-md w-full border-l-4 ${earnedClass} shadow-xl`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="mr-4">
              <BadgeIcon 
                type={achievement.iconType} 
                color={achievement.iconColor} 
                size={48} 
              />
            </div>
            <div>
              <h3 className="text-xl font-bold">{achievement.title}</h3>
              <p className="text-sm text-gray-600">{achievement.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-700">{earnedText}</p>
          
          {!achievement.earned && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`bg-${achievement.iconColor}-500 h-2.5 rounded-full`}
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

// Dışa aktarılan bileşenler
export { AchievementBadge, AchievementBadgeGroup, AchievementDetail, BadgeIcon };