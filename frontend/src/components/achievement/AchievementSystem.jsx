// src/components/achievement/AchievementSystem.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Medal,
  Award,
  Star,
  Flame,
  Target,
  Filter,
  Search,
} from "lucide-react";
import { AchievementBadgeGroup, AchievementDetail } from "./AchievementBadge";
import AchievementService from "../../services/AchievementService";
import allBadges from "../../data/achievements.json";
import axios from "axios";

const BadgeCategories = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: "all", name: "Tüm Rozetler", icon: "🏆" },
    { id: "goal", name: "Hedef Rozetleri", icon: "🎯" },
    { id: "activity", name: "Aktivite Rozetleri", icon: "🏃" },
    { id: "social", name: "Sosyal Rozetler", icon: "👥" },
    { id: "special", name: "Özel Rozetler", icon: "⭐" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`flex items-center px-4 py-2 rounded-lg transition-all
            ${
              activeCategory === category.id
                ? "bg-yellow-500 text-black"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
        >
          <span className="mr-2">{category.icon}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
};

const BadgeStats = ({ achievements }) => {
  const total = achievements.length;
  const earned = achievements.filter((a) => a.earned).length;
  const progress = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{total}</div>
          <div className="text-sm text-gray-400">Toplam Rozet</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{earned}</div>
          <div className="text-sm text-gray-400">Kazanılan</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">%{progress}</div>
          <div className="text-sm text-gray-400">Tamamlanma</div>
        </div>
      </div>
    </div>
  );
};

const BadgeGallery = ({ achievements, onBadgeClick }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {achievements.map(badge => {
        // Eğer progress 100 veya üstü ise earned true olsun (güvenlik için)
        const isEarned = badge.earned || badge.progress >= 100;
        const progressValue = typeof badge.progress === 'number' ? badge.progress : 0;
        return (
          <div
            key={badge.id}
            className={`relative group cursor-pointer transition-all duration-300 
              ${isEarned ? 'transform hover:scale-105' : 'opacity-60'}`}
            onClick={() => onBadgeClick(badge)}
          >
            <div className={`p-4 rounded-lg shadow-lg border-2 
              ${isEarned ? 'border-yellow-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
              <div className="text-4xl mb-2 text-center">
                {badge.type === 'secret' && !isEarned ? '❓' : badge.icon}
              </div>
              <div className="text-center">
                <h3 className={`font-bold ${isEarned ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {badge.type === 'secret' && !isEarned ? '???' : badge.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {badge.type === 'secret' && !isEarned ? 'Gizli bir başarı!' : badge.description}
                </p>
              </div>
              {!isEarned && (
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-1 block text-center">
                    %{Math.round(progressValue)}
                  </span>
                </div>
              )}
              {isEarned && (
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Kazanıldı
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AchievementSystem = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [apiProgress, setApiProgress] = useState([]);
  const [newlyEarned, setNewlyEarned] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const achievementService = new AchievementService();
  const [userData, setUserData] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Kullanıcı bilgilerini al
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        if (!token) {
          setError("Oturum bulunamadı");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/users/profile', config);
        
        // Sadece userType değiştiyse state'i güncelle
        if (userData?.userType !== response.data.userType) {
          setUserData(response.data);
        }
      } catch (err) {
        console.error('Kullanıcı bilgileri alınamadı:', err);
        setError('Kullanıcı bilgileri alınamadı');
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      fetchUserData();
    }
  }, [isInitialLoad]); // Sadece isInitialLoad değiştiğinde çalış

  // Başarıları yenile
  useEffect(() => {
    const fetchProgress = async () => {
      if (!userData) return;
      
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        if (!token) {
          throw new Error("Oturum bulunamadı");
        }
        
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/achievements/progress', config);
        
        if (!response.data || !Array.isArray(response.data.progress)) {
          throw new Error("Geçersiz API yanıtı");
        }
        
        setApiProgress(response.data.progress);
        setNewlyEarned(response.data.earned || []);
    
        // Kullanıcı tipine göre rozetleri filtrele
        const filteredBadges = allBadges.filter(badge => {
          if (badge.type === 'coach' || badge.userType === 'coach') {
            return userData.userType === 'coach';
          }
          if (badge.type === 'athlete' || badge.userType === 'athlete') {
            return userData.userType === 'athlete';
          }
          return true;
        });
        
        // Başarıları birleştir
        const mergedAchievements = filteredBadges.map(badge => {
          const progressData = response.data.progress.find(p => p.id === badge.id) || {};
          return {
            ...badge,
            progress: progressData.progress || 0,
            earned: progressData.earned || false,
            earnedDate: progressData.earnedDate || null
          };
        });
        
        setAchievements(mergedAchievements);
      } catch (err) {
        console.error('Başarılar yüklenirken hata:', err);
        setError(err.message || 'Başarılar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userData?.userType]); // Sadece userType değiştiğinde çalış

  // Filtreleme fonksiyonu
  const filteredAchievements = achievements.filter((badge) => {
    const matchesCategory = activeCategory === "all" || badge.type === activeCategory;
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-yellow-500 text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">
          {error}
          <button 
            onClick={() => {
              setIsInitialLoad(true);
              setError(null);
            }}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!achievements.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-xl">Henüz başarı bulunmuyor</div>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-20 md:pb-6 px-4">
      <Link
        to="/dashboard"
        className="mb-6 flex items-center text-yellow-500 hover:text-yellow-400 transition duration-200"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Panele Dön
      </Link>
      
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-500">
            Başarılarım ve Rozetlerim
          </h1>
        </div>

        {/* İstatistikler */}
        <BadgeStats achievements={filteredAchievements} />

        {/* Kategoriler */}
        <BadgeCategories
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Arama */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rozet ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Rozet Galerisi */}
        <BadgeGallery
          achievements={filteredAchievements}
          onBadgeClick={setSelectedAchievement}
        />

        {/* Yeni rozet kutlaması */}
        {newlyEarned.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center border-2 border-yellow-500">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2 text-yellow-500">
                Tebrikler!
              </h3>
              <p className="text-gray-300">Yeni rozet(ler) kazandın:</p>
              <div className="mt-4 space-y-2">
                {newlyEarned.map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center justify-center space-x-2"
                  >
                    <span className="text-2xl">
                      {allBadges.find((b) => b.id === badge)?.icon}
                    </span>
                    <span className="text-gray-300">
                      {allBadges.find((b) => b.id === badge)?.name}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="mt-6 px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition duration-200"
                onClick={() => setNewlyEarned([])}
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Rozet detayı modalı */}
      {selectedAchievement && (
        <AchievementDetail 
          achievement={selectedAchievement} 
          onClose={() => setSelectedAchievement(null)}
        />
      )}
      
      {/* Fixed Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-80 backdrop-blur-md border-t border-gray-800 shadow-lg md:hidden">
        <div className="flex justify-around py-3">
          <Link to="/dashboard" className="flex flex-col items-center text-xs">
            <div className="p-1 rounded-full text-gray-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <span className="text-gray-400">Panel</span>
          </Link>
          
          <Link to="/profile" className="flex flex-col items-center text-xs">
            <div className="p-1 rounded-full text-gray-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="text-gray-400">Profil</span>
          </Link>
          
          <div className="flex flex-col items-center text-xs">
            <div className="p-1 rounded-full bg-yellow-500 text-black">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <span className="text-yellow-500">Rozetler</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementSystem;
