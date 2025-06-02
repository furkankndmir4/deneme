import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DeleteAccountModal from "../components/DeleteAccountModal";
import {
  AchievementBadgeGroup,
  AchievementDetail,
} from "../components/achievement/AchievementBadge";
import AchievementService from "../services/AchievementService";
import { Trophy } from "lucide-react";
import { useRef } from "react";
import allBadges from '../data/achievements.json';

const Profile = () => {
  const fileInputRef = useRef();
  const { userId } = useParams();

  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [friendRequestReceived, setFriendRequestReceived] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [userData, setUserData] = useState({
    email: "",
    profile: {
      fullName: "",
      age: "",
      gender: "male",
      height: "",
      weight: "",
      goalType: "maintenance",
      activityLevel: "moderate",
      privacy: {
        profileVisibility: "public",
        showAge: true,
        showWeight: true,
        showHeight: true,
        showBodyMeasurements: true,
        showAchievements: true,
        showGoals: true,
      },
    },
    physicalData: {
      goalCalories: 0,
      proteinGrams: 0,
      carbGrams: 0,
      fatGrams: 0,
      bodyFat: 0,
      bmi: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState(null);
  const navigate = useNavigate();
  const achievementService = new AchievementService();

  // Sadece değişen fiziksel verileri takip etmek için state
  const [changedPhysicalData, setChangedPhysicalData] = useState({});

  // Token alma yardımcı fonksiyonu
  const getToken = () => {
    try {
      return (
        localStorage.getItem("userToken") || sessionStorage.getItem("userToken")
      );
    } catch (error) {
      console.error("Storage error:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchAchievementsProgress();
  }, [userId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [name]: value,
      },
    }));
  };

  const handlePrivacyChange = (field, value) => {
    console.log(`Privacy change: ${field} = ${value}`);
    setUserData((prevState) => ({
      ...prevState,
      profile: {
        ...prevState.profile,
        privacy: {
          ...(prevState.profile.privacy || {}),
          [field]: value,
        },
      },
    }));
  };

  const handlePhysicalDataChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      physicalData: {
        ...prev.physicalData,
        [name]: value,
      },
    }));
    // Değişen alanı kaydet
    setChangedPhysicalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    try {
      // Convert string values to appropriate types
      const profileData = {
        fullName: userData.profile.fullName,
        age: parseInt(userData.profile.age),
        gender: userData.profile.gender,
        height: parseFloat(userData.profile.height),
        weight: parseFloat(userData.profile.weight),
        goalType: userData.profile.goalType,
        activityLevel: userData.profile.activityLevel,
        privacy: userData.profile.privacy,
        goals: userData.profile.goals,
        specialization: userData.profile.specialization,
        coachNote: userData.profile.coachNote, // Bu satırı ekleyin
      };

      console.log("Sending data to API:", profileData);
      const response = await axios.put(
        "http://localhost:5000/api/users/profile",
        profileData,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("userToken") ||
              sessionStorage.getItem("userToken")
            }`,
          },
        }
      );
      console.log("API response:", response.data);

      // --- Vücut ölçülerini de güncelle ---
      // NaN değerleri undefined olarak gönder ve sadece değişenleri al
      const safeParse = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      };
      // Physical data objesini oluştururken sadece değeri undefined veya null olmayanları dahil et
      const physicalDataToSend = {};
      // Sadece değişen fiziksel veri alanlarını physicalDataToSend objesine ekle
      for (const key in changedPhysicalData) {
        if (changedPhysicalData[key] !== undefined && changedPhysicalData[key] !== null) {
          physicalDataToSend[key] = safeParse(changedPhysicalData[key]);
        }
      }

      // Sadece en az bir fiziksel veri alanı varsa gönder
      if (Object.keys(physicalDataToSend).length > 0) {
        await axios.put(
          "http://localhost:5000/api/users/physical-data",
          physicalDataToSend,
          {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("userToken") ||
                sessionStorage.getItem("userToken")
              }`,
            },
          }
        );
      }

      if (response.data.profile) {
        // Update the state with the new profile data
        setUserData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            ...response.data.profile,
            // Convert numeric values to strings for form inputs
            age: response.data.profile.age?.toString() || "",
            height: response.data.profile.height?.toString() || "",
            weight: response.data.profile.weight?.toString() || "",
            goals: response.data.profile.goals || "",
            coachNote: response.data.profile.coachNote || "",
            specialization: response.data.profile.specialization || "",
          },
          physicalData: response.data.physicalData || prev.physicalData,
        }));

        // Store the updated data in localStorage/sessionStorage
        const storedUser = JSON.parse(
          localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
        );
        const updatedUser = {
          ...storedUser,
          profile: response.data.profile,
          physicalData: response.data.physicalData || storedUser.physicalData,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        sessionStorage.setItem("user", JSON.stringify(updatedUser));

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // En güncel verileri tekrar çek ve state'i güncelle
        await fetchUserData();
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(
        err.response?.data?.message || "Profil güncellenirken bir hata oluştu"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      if (!token) {
        navigate("/");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Gizlilik verilerini gönder
      const privacyData = {
        privacy: userData.profile.privacy,
      };

      console.log("Sending privacy settings:", privacyData);

      const response = await axios.put(
        "http://localhost:5000/api/users/privacy-settings",
        privacyData,
        config
      );

      console.log("Privacy update response:", response.data);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Privacy update error:", error);
      setError(
        error.response?.data?.message || "Gizlilik ayarları güncellenemedi"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userInfo");
    } catch (error) {
      console.error("localStorage clear error:", error);
    }
    navigate("/");
  };

  const handleSendRequest = async () => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(
        `http://localhost:5000/api/friends/request/${userId}`,
        {},
        config
      );
      setFriendRequestSent(true);
    } catch (error) {
      console.error("Arkadaşlık isteği gönderme hatası:", error);
      setError("Arkadaşlık isteği gönderilemedi");
    }
  };

  // Arkadaşlık isteğini kabul etme
  const handleAcceptRequest = async () => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(
        `http://localhost:5000/api/friends/accept/${userId}`,
        {},
        config
      );
      if (window.refetchAchievementsProgress) window.refetchAchievementsProgress();
      setIsFriend(true);
      setFriendRequestReceived(false);
    } catch (error) {
      console.error("Arkadaşlık isteği kabul hatası:", error);
      setError("Arkadaşlık isteği kabul edilemedi");
    }
  };

  // Arkadaşlık isteğini reddetme
  const handleRejectRequest = async () => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(
        `http://localhost:5000/api/friends/reject/${userId}`,
        config
      );
      setFriendRequestReceived(false);
    } catch (error) {
      console.error("Arkadaşlık isteği reddetme hatası:", error);
      setError("Arkadaşlık isteği reddedilemedi");
    }
  };

  // Arkadaşlıktan çıkarma
  const handleRemoveFriend = async () => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`http://localhost:5000/api/friends/${userId}`, config);
      setIsFriend(false);
    } catch (error) {
      console.error("Arkadaşlıktan çıkarma hatası:", error);
      setError("Arkadaşlıktan çıkarılamadı");
    }
  };

  const getGoalTypeText = (goalType) => {
    const goals = {
      fat_loss: "Yağ Yakma",
      muscle_gain: "Kas Kütlesi Kazanma",
      maintenance: "Mevcut Formu Koruma",
      endurance: "Dayanıklılık Artırma",
    };
    return goals[goalType] || "Belirlenmemiş";
  };

  const getActivityLevelText = (level) => {
    const levels = {
      sedentary: "Hareketsiz (Masa başı iş, egzersiz yok)",
      light: "Hafif (Haftada 1-3 gün egzersiz)",
      moderate: "Orta (Haftada 3-5 gün egzersiz)",
      active: "Aktif (Haftada 6-7 gün egzersiz)",
      very_active: "Çok Aktif (Günde 2 kez antrenman)",
    };
    return levels[level] || "Belirlenmemiş";
  };

  // Kazanılan rozetleri filtreleme
  const earnedAchievements = achievements.filter((ach) => ach.earned);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const response = await fetch(
        "http://localhost:5000/api/users/profile/photo",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      const data = await response.json();
      if (data.photoUrl) {
        // Fotoğraf yüklendikten sonra profil verisini tekrar çek
        fetchUserData();
      }
    } catch (err) {
      alert("Fotoğraf yüklenirken hata oluştu.");
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      if (!token) {
        navigate("/");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(
        `http://localhost:5000/api/users/profile${userId ? `/${userId}` : ""}`,
        config
      );

      console.log("Profile.jsx API response:", response.data);

      if (response.data) {
        // Convert numeric values to strings for form inputs
        const safeData = {
          email: response.data.email || "",
          userType: response.data.userType || "",
          profile: {
            fullName: response.data.profile?.fullName || "",
            age: response.data.profile?.age?.toString() || "",
            gender: response.data.profile?.gender || "male",
            height: response.data.profile?.height?.toString() || "",
            weight: response.data.profile?.weight?.toString() || "",
            goalType: response.data.profile?.goalType || "maintenance",
            activityLevel: response.data.profile?.activityLevel || "moderate",
            privacy: response.data.profile?.privacy || {
              profileVisibility: "public",
              showAge: true,
              showWeight: true,
              showHeight: true,
              showBodyMeasurements: true,
              showAchievements: true,
              showGoals: true,
            },
            goals: response.data.profile?.goals || "",
            coachNote: response.data.profile?.coachNote || "",
            specialization: response.data.profile?.specialization || "",
            photoUrl: response.data.profile?.photoUrl || "",
          },
          physicalData: response.data.physicalData || {
            goalCalories: 0,
            proteinGrams: 0,
            carbGrams: 0,
            fatGrams: 0,
            bodyFat: 0,
            bmi: 0,
          },
          isPrivate: response.data.isPrivate || false,
          friendsOnly: response.data.friendsOnly || false,
        };

        setUserData(safeData);
        console.log("Profile.jsx setUserData:", safeData);

        // Store the raw data in localStorage for other components to use
        localStorage.setItem("user", JSON.stringify(response.data));
        sessionStorage.setItem("user", JSON.stringify(response.data));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Kullanıcı bilgileri alınamadı");
    } finally {
      setLoading(false);
    }
  };

  // Beslenme ve makro hesaplama fonksiyonları
  const getBMR = (weight, height, age, gender) => {
    if (!weight || !height || !age || !gender) return null;
    if (gender === "male") {
      return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else if (gender === "female") {
      return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
    } else {
      // Diğer: ortalama al
      return (88.362 + 13.397 * weight + 4.799 * height - 5.677 * age +
        447.593 + 9.247 * weight + 3.098 * height - 4.330 * age) / 2;
    }
  };

  const getActivityFactor = (level) => {
    switch (level) {
      case "sedentary": return 1.2;
      case "light": return 1.375;
      case "moderate": return 1.55;
      case "active": return 1.725;
      case "very_active": return 1.9;
      default: return 1.2;
    }
  };

  const getGoalCalories = (tdee, goalType) => {
    switch (goalType) {
      case "fat_loss": return tdee - 400;
      case "muscle_gain": return tdee + 300;
      case "maintenance": return tdee;
      case "endurance": return tdee + 100;
      default: return tdee;
    }
  };

  // Makro hesaplama (örnek oranlar)
  const getMacros = (weight, goalCalories) => {
    if (!weight || !goalCalories) return { protein: null, carb: null, fat: null };
    const protein = weight * 2; // gram
    const fat = weight * 1; // gram
    const proteinCal = protein * 4;
    const fatCal = fat * 9;
    const carbCal = goalCalories - (proteinCal + fatCal);
    const carb = carbCal > 0 ? carbCal / 4 : 0;
    return {
      protein: Math.round(protein),
      fat: Math.round(fat),
      carb: Math.round(carb),
    };
  };

  // userData'dan değerleri al
  const height = parseFloat(userData?.profile?.height);
  const weight = parseFloat(userData?.profile?.weight);
  const age = parseInt(userData?.profile?.age);
  const gender = userData?.profile?.gender;
  const activityLevel = userData?.profile?.activityLevel;
  const goalType = userData?.profile?.goalType;

  const bmr = getBMR(weight, height, age, gender);
  const tdee = bmr ? bmr * getActivityFactor(activityLevel) : null;
  const goalCalories = tdee ? Math.round(getGoalCalories(tdee, goalType)) : null;
  const macros = getMacros(weight, goalCalories);

  // Achievements progress'i çek
  const fetchAchievementsProgress = async () => {
    setAchievementsLoading(true);
    setAchievementsError(null);
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:5000/api/achievements/progress", config);
      // Progress ile badge'leri birleştir
      const progressArr = res.data.progress || [];
      const merged = allBadges.map(badge => {
        const progressObj = progressArr.find(p => (p.id || '').toLowerCase().trim() === (badge.id || '').toLowerCase().trim()) || {};
        return {
          ...badge,
          progress: typeof progressObj.progress === 'number' ? progressObj.progress : 0,
          earned: !!progressObj.earned,
        };
      });
      setAchievements(merged);
    } catch (err) {
      setAchievementsError("Rozetler yüklenemedi");
    } finally {
      setAchievementsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary text-xl">Yükleniyor...</div>
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
        <h2 className="text-2xl font-bold mb-4 text-yellow-500">
          Profil Bilgileri
        </h2>

        {/* Tab seçenekleri */}
        {isOwnProfile && (
          <div className="flex mb-6 border-b border-gray-800">
            <button
              className={`pb-2 px-4 ${
                activeTab === "general"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("general")}
            >
              Genel Bilgiler
            </button>
            <button
              className={`pb-2 px-4 ${
                activeTab === "privacy"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("privacy")}
            >
              Gizlilik Ayarları
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900 bg-opacity-60 text-green-200 p-3 rounded-lg mb-4">
            Profil başarıyla güncellendi!
          </div>
        )}

        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-800 border-2 border-yellow-500 mb-4 flex items-center justify-center overflow-hidden">
              {userData?.profile?.photoUrl ? (
                <img
                  src={
                    userData.profile.photoUrl.startsWith("http")
                      ? userData.profile.photoUrl
                      : `http://localhost:5000${userData.profile.photoUrl}`
                  }
                  alt="Profil Fotoğrafı"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-16 h-16 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                  onClick={() => fileInputRef.current.click()}
                >
                  Fotoğraf Değiştir
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
              </>
            )}

            {/* Arkadaşlık İşlemleri */}
            {!isOwnProfile && (
              <div className="mt-4">
                {isFriend ? (
                  <button
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-300"
                    onClick={handleRemoveFriend}
                  >
                    Arkadaşlıktan Çıkar
                  </button>
                ) : friendRequestSent ? (
                  <button
                    className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg cursor-not-allowed"
                    disabled
                  >
                    İstek Gönderildi
                  </button>
                ) : friendRequestReceived ? (
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition duration-300"
                      onClick={handleAcceptRequest}
                    >
                      İsteği Kabul Et
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition duration-300"
                      onClick={handleRejectRequest}
                    >
                      İsteği Reddet
                    </button>
                  </div>
                ) : (
                  <button
                    className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                    onClick={handleSendRequest}
                  >
                    Arkadaş Ekle
                  </button>
                )}
              </div>
            )}

            {/* Fitness Amacı Bilgi Kartı */}
            <div className="mt-6 w-full bg-gray-800 bg-opacity-40 p-4 rounded-lg">
              <h4 className="text-yellow-500 font-medium mb-2">
                Fitness Amacınız
              </h4>
              <p className="text-gray-300">
                {getGoalTypeText(userData?.profile?.goalType)}
              </p>

              <h4 className="text-yellow-500 font-medium mt-4 mb-2">
                Aktivite Seviyesi
              </h4>
              <p className="text-gray-300">
                {getActivityLevelText(userData?.profile?.activityLevel)}
              </p>
            </div>

            {/* Rozet Özeti Kartı */}
            <div className="mt-6 w-full bg-gray-800 bg-opacity-40 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-yellow-500 font-medium">Rozetlerim</h4>
                <Link
                  to="/achievements"
                  className="text-xs text-yellow-400 hover:text-yellow-300"
                >
                  Tümünü Gör
                </Link>
              </div>
              <div className="flex justify-center mb-2">
                <span className="flex items-center bg-gray-900 px-3 py-1 rounded-full text-sm">
                  <Trophy className="text-yellow-500 mr-1 w-4 h-4" />
                  <span className="text-gray-300">
                    {achievementsLoading ? '...' : earnedAchievements.length} rozet kazandın
                  </span>
                </span>
              </div>
              {achievementsLoading ? (
                <div className="text-center text-gray-500 text-sm py-2">Yükleniyor...</div>
              ) : achievementsError ? (
                <div className="text-center text-red-500 text-sm py-2">{achievementsError}</div>
              ) : earnedAchievements.length > 0 ? (
                <AchievementBadgeGroup
                  achievements={earnedAchievements.slice(0, 3)}
                  size="sm"
                  onBadgeClick={setSelectedAchievement}
                />
              ) : (
                <div className="text-center text-gray-500 text-sm py-2">
                  Henüz rozet kazanılmadı
                </div>
              )}
            </div>
          </div>

          <div className="md:w-2/3 md:pl-6">
            {isOwnProfile ? (
              <>
                {/* Genel Bilgiler Tab İçeriği */}
                {activeTab === "general" && (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="fullName"
                        >
                          Ad Soyad
                        </label>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                          value={userData?.profile?.fullName || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="email"
                        >
                          E-posta
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-gray-400"
                          value={userData?.email || ""}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="age"
                        >
                          Yaş
                        </label>
                        <input
                          id="age"
                          name="age"
                          type="number"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                          value={userData?.profile?.age || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="gender"
                        >
                          Cinsiyet
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                          value={userData?.profile?.gender || "male"}
                          onChange={handleChange}
                        >
                          <option value="male">Erkek</option>
                          <option value="female">Kadın</option>
                          <option value="other">Diğer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="height"
                        >
                          Boy (cm)
                        </label>
                        <input
                          id="height"
                          name="height"
                          type="number"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                          value={userData?.profile?.height || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="weight"
                        >
                          Kilo (kg)
                        </label>
                        <input
                          id="weight"
                          name="weight"
                          type="number"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                          value={userData?.profile?.weight || ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="goalType"
                        >
                          Fitness Amacı
                        </label>
                        <select
                          id="goalType"
                          name="goalType"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                          value={userData?.profile?.goalType || "maintenance"}
                          onChange={handleChange}
                        >
                          <option value="fat_loss">Yağ Yakma</option>
                          <option value="muscle_gain">
                            Kas Kütlesi Kazanma
                          </option>
                          <option value="maintenance">Formumu Koruma</option>
                          <option value="endurance">
                            Dayanıklılık Artırma
                          </option>
                        </select>
                      </div>
                      <div>
                        <label
                          className="block text-gray-300 mb-2 text-sm"
                          htmlFor="activityLevel"
                        >
                          Aktivite Seviyesi
                        </label>
                        <select
                          id="activityLevel"
                          name="activityLevel"
                          className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                          value={userData?.profile?.activityLevel || "moderate"}
                          onChange={handleChange}
                        >
                          <option value="sedentary">
                            Hareketsiz (Masa başı)
                          </option>
                          <option value="light">Hafif (Haftada 1-3 gün)</option>
                          <option value="moderate">
                            Orta (Haftada 3-5 gün)
                          </option>
                          <option value="active">
                            Aktif (Haftada 6-7 gün)
                          </option>
                          <option value="very_active">
                            Çok Aktif (Günde 2 kez)
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Vücut Ölçüleri Bölümü */}
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-200 mb-4">Vücut Ölçüleri</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="bodyFat">
                            Vücut Yağ Oranı (%)
                          </label>
                          <input
                            id="bodyFat"
                            name="bodyFat"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.bodyFat ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="waistCircumference">
                            Bel Çevresi (cm)
                          </label>
                          <input
                            id="waistCircumference"
                            name="waistCircumference"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.waistCircumference ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="neckCircumference">
                            Boyun Çevresi (cm)
                          </label>
                          <input
                            id="neckCircumference"
                            name="neckCircumference"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.neckCircumference ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="hipCircumference">
                            Kalça Çevresi (cm)
                          </label>
                          <input
                            id="hipCircumference"
                            name="hipCircumference"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.hipCircumference ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="chestCircumference">
                            Göğüs Çevresi (cm)
                          </label>
                          <input
                            id="chestCircumference"
                            name="chestCircumference"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.chestCircumference ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="bicepCircumference">
                            Kol Çevresi (cm)
                          </label>
                          <input
                            id="bicepCircumference"
                            name="bicepCircumference"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.bicepCircumference ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="thighCircumference">
                            Bacak Çevresi (cm)
                          </label>
                          <input
                            id="thighCircumference"
                            name="thighCircumference"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.thighCircumference ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="calfCircumference">
                            Baldır Çevresi (cm)
                          </label>
                          <input
                            id="calfCircumference"
                            name="calfCircumference"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.calfCircumference ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm" htmlFor="shoulderWidth">
                            Omuz Genişliği (cm)
                          </label>
                          <input
                            id="shoulderWidth"
                            name="shoulderWidth"
                            type="number"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            value={userData?.physicalData?.shoulderWidth ?? ""}
                            onChange={handlePhysicalDataChange}
                          />
                        </div>
                      </div>
                    </div>

                    {userData?.userType?.toLowerCase() === "coach" && (
                      <>
                        <div className="mt-4">
                          <label
                            className="block text-gray-300 mb-2 text-sm"
                            htmlFor="coachNote"
                          >
                            Sporcularıma Mesajım (Antrenör Açıklaması)
                          </label>
                          <textarea
                            id="coachNote"
                            name="coachNote"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            placeholder="Sporcularınıza özel bir açıklama veya motivasyon mesajı yazabilirsiniz."
                            value={userData?.profile?.coachNote || ""}
                            onChange={handleChange}
                            rows={3}
                          />
                        </div>
                        <div className="mt-4">
                          <label
                            className="block text-gray-300 mb-2 text-sm"
                            htmlFor="specialization"
                          >
                            Uzmanlık Alanı
                          </label>
                          <input
                            id="specialization"
                            name="specialization"
                            type="text"
                            className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                            placeholder="Ör: Fonksiyonel Antrenman, Kuvvet, Pilates..."
                            value={userData?.profile?.specialization || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end space-x-4">
                      <Link
                        to="/dashboard"
                        className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition duration-200 text-gray-300"
                      >
                        İptal
                      </Link>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                        disabled={updating}
                      >
                        {updating ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Gizlilik Ayarları Tab İçeriği */}
                {activeTab === "privacy" && (
                  <form className="space-y-4" onSubmit={handlePrivacySubmit}>
                    <div className="bg-gray-800 bg-opacity-40 p-4 rounded-lg mb-4">
                      <h3 className="text-lg font-semibold text-gray-200 mb-2">
                        Profil Görünürlüğü
                      </h3>
                      <p className="text-gray-400 mb-3 text-sm">
                        Profilinizin kimler tarafından görüntülenebileceğini
                        seçin.
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="visibility-public"
                            name="profileVisibility"
                            value="public"
                            checked={
                              userData.profile.privacy?.profileVisibility ===
                              "public"
                            }
                            onChange={(e) =>
                              handlePrivacyChange(
                                "profileVisibility",
                                e.target.value
                              )
                            }
                            className="mr-2"
                          />
                          <label
                            htmlFor="visibility-public"
                            className="text-gray-300"
                          >
                            <span className="font-medium">Herkese Açık</span>
                            <p className="text-xs text-gray-400">
                              Herkes profilinizi görebilir
                            </p>
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="visibility-friends"
                            name="profileVisibility"
                            value="friends_only"
                            checked={
                              userData.profile.privacy?.profileVisibility ===
                              "friends_only"
                            }
                            onChange={(e) =>
                              handlePrivacyChange(
                                "profileVisibility",
                                e.target.value
                              )
                            }
                            className="mr-2"
                          />
                          <label
                            htmlFor="visibility-friends"
                            className="text-gray-300"
                          >
                            <span className="font-medium">
                              Sadece Arkadaşlar
                            </span>
                            <p className="text-xs text-gray-400">
                              Sadece arkadaşlarınız profilinizi görebilir
                            </p>
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="visibility-private"
                            name="profileVisibility"
                            value="private"
                            checked={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                            }
                            onChange={(e) => {
                              handlePrivacyChange(
                                "profileVisibility",
                                e.target.value
                              );
                              handlePrivacyChange("showAge", false);
                              handlePrivacyChange("showWeight", false);
                              handlePrivacyChange("showHeight", false);
                              handlePrivacyChange(
                                "showBodyMeasurements",
                                false
                              );
                              handlePrivacyChange("showAchievements", false);
                              handlePrivacyChange("showGoals", false);
                            }}
                            className="mr-2"
                          />
                          <label
                            htmlFor="visibility-private"
                            className="text-gray-300"
                          >
                            <span className="font-medium">Gizli</span>
                            <p className="text-xs text-gray-400">
                              Profiliniz diğer kullanıcılara gösterilmez
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 bg-opacity-40 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-200 mb-2">
                        Bilgi Görünürlüğü
                      </h3>
                      <p className="text-gray-400 mb-3 text-sm">
                        Profilinizde hangi bilgilerin görüntüleneceğini seçin.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="show-age"
                            checked={userData.profile.privacy?.showAge}
                            onChange={(e) =>
                              handlePrivacyChange("showAge", e.target.checked)
                            }
                            className="mr-2"
                            disabled={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                            }
                          />
                          <label
                            htmlFor="show-age"
                            className={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                                ? "text-gray-500"
                                : "text-gray-300"
                            }
                          >
                            Yaşımı Göster
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="show-weight"
                            checked={userData.profile.privacy?.showWeight}
                            onChange={(e) =>
                              handlePrivacyChange(
                                "showWeight",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                            disabled={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                            }
                          />
                          <label
                            htmlFor="show-weight"
                            className={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                                ? "text-gray-500"
                                : "text-gray-300"
                            }
                          >
                            Kilomu Göster
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="show-height"
                            checked={userData.profile.privacy?.showHeight}
                            onChange={(e) =>
                              handlePrivacyChange(
                                "showHeight",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                            disabled={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                            }
                          />
                          <label
                            htmlFor="show-height"
                            className={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                                ? "text-gray-500"
                                : "text-gray-300"
                            }
                          >
                            Boyumu Göster
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="show-body-measurements"
                            checked={
                              userData.profile.privacy?.showBodyMeasurements
                            }
                            onChange={(e) =>
                              handlePrivacyChange(
                                "showBodyMeasurements",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                            disabled={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                            }
                          />
                          <label
                            htmlFor="show-body-measurements"
                            className={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                                ? "text-gray-500"
                                : "text-gray-300"
                            }
                          >
                            Vücut Ölçülerimi Göster
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="show-achievements"
                            checked={userData.profile.privacy?.showAchievements}
                            onChange={(e) =>
                              handlePrivacyChange(
                                "showAchievements",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                            disabled={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                            }
                          />
                          <label
                            htmlFor="show-achievements"
                            className={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                                ? "text-gray-500"
                                : "text-gray-300"
                            }
                          >
                            Rozetlerimi Göster
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="show-goals"
                            checked={userData.profile.privacy?.showGoals}
                            onChange={(e) =>
                              handlePrivacyChange("showGoals", e.target.checked)
                            }
                            className="mr-2"
                            disabled={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                            }
                          />
                          <label
                            htmlFor="show-goals"
                            className={
                              userData.profile.privacy?.profileVisibility ===
                              "private"
                                ? "text-gray-500"
                                : "text-gray-300"
                            }
                          >
                            Hedeflerimi Göster
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab("general")}
                        className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition duration-200 text-gray-300"
                      >
                        Geri
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                        disabled={updating}
                      >
                        {updating ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {/* Profil bilgileri - başkasının profili olduğunda göster */}
                {userData?.isPrivate && (
                  <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                    <div className="flex flex-col items-center mb-3">
                      <svg
                        className="w-12 h-12 text-gray-500 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3a3 3 0 100-6 3 3 0 000 6zm0-9a9 9 0 00-9 9v7h6v-7a3 3 0 016 0v7h6v-7a9 9 0 00-9-9z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-300">
                        Gizli Profil
                      </h3>
                      <p className="text-gray-400 mt-2">
                        Bu kullanıcı profilini gizli tutmayı tercih etmiştir.
                      </p>
                    </div>
                  </div>
                )}

                {userData?.friendsOnly && (
                  <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                    <div className="flex flex-col items-center mb-3">
                      <svg
                        className="w-12 h-12 text-gray-500 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-300">
                        Sadece Arkadaşlara Açık Profil
                      </h3>
                      <p className="text-gray-400 mt-2">
                        Bu kullanıcının profil bilgileri sadece arkadaşlarına
                        açıktır. Profil bilgilerini görüntülemek için arkadaşlık
                        isteği gönderebilirsiniz.
                      </p>
                    </div>
                  </div>
                )}

                {!userData?.isPrivate && !userData?.friendsOnly && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-gray-300 font-medium mb-1">
                          Ad Soyad
                        </h3>
                        <p className="text-gray-400">
                          {userData?.profile?.fullName || "--"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-gray-300 font-medium mb-1">Yaş</h3>
                        <p className="text-gray-400">
                          {userData?.profile?.age || "--"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-gray-300 font-medium mb-1">Boy</h3>
                        <p className="text-gray-400">
                          {userData?.profile?.height || "--"} cm
                        </p>
                      </div>
                      <div>
                        <h3 className="text-gray-300 font-medium mb-1">Kilo</h3>
                        <p className="text-gray-400">
                          {userData?.profile?.weight || "--"} kg
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-gray-300 font-medium mb-1">
                          Fitness Amacı
                        </h3>
                        <p className="text-gray-400">
                          {getGoalTypeText(userData?.profile?.goalType)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-gray-300 font-medium mb-1">
                          Aktivite Seviyesi
                        </h3>
                        <p className="text-gray-400">
                          {getActivityLevelText(
                            userData?.profile?.activityLevel
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6">
          <h3 className="text-lg font-medium text-red-500 mb-4">
            Tehlikeli Bölge
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Hesabınızı silmek tüm verilerinizi kalıcı olarak kaldırır ve bu
            işlem geri alınamaz.
          </p>
          <button
            onClick={() => setIsDeleteAccountModalOpen(true)}
            className="bg-red-900 bg-opacity-50 hover:bg-opacity-70 text-red-200 px-4 py-2 rounded-lg border border-red-800 transition duration-200"
          >
            Hesabımı Sil
          </button>
        </div>
      </div>

      {/* Beslenme ve Kalori Bilgileri Kartı */}
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800 mb-6">
        <h3 className="text-xl font-bold mb-6 text-yellow-500">
          Beslenme Önerileri
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-1 text-gray-200">
                Kalori İhtiyacı
              </h4>
              <p className="text-sm text-gray-400 mb-3">
                {userData.profile.goalType === "fat_loss"
                  ? "Yağ yakmak için kalori açığı oluşturulmuştur."
                  : userData.profile.goalType === "muscle_gain"
                  ? "Kas geliştirmek için kalori fazlası önerilmektedir."
                  : "Mevcut formunuzu korumak için ihtiyacınız olan kalori miktarı."}
              </p>

              <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-300">Günlük Kalori Hedefi:</span>
                <span className="text-2xl font-bold text-yellow-500">
                  {goalCalories || "--"} <span className="text-sm text-gray-400">kcal</span>
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-200">
                Makro Besin Dağılımı
              </h4>
              <div className="space-y-2">
                <div className="bg-gray-800 bg-opacity-30 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-yellow-500 font-medium">Protein</span>
                    <p className="text-xs text-gray-400">
                      Kas onarımı ve yapımı için
                    </p>
                  </div>
                  <span className="text-lg font-bold text-gray-200">
                    {macros.protein || "--"} <span className="text-sm text-gray-400">g</span>
                  </span>
                </div>

                <div className="bg-gray-800 bg-opacity-30 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-yellow-500 font-medium">
                      Karbonhidrat
                    </span>
                    <p className="text-xs text-gray-400">
                      Enerji kaynağı olarak
                    </p>
                  </div>
                  <span className="text-lg font-bold text-gray-200">
                    {macros.carb || "--"} <span className="text-sm text-gray">g</span>
                  </span>
                </div>

                <div className="bg-gray-800 bg-opacity-30 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-yellow-500 font-medium">Yağ</span>
                    <p className="text-xs text-gray-400">
                      Hormon üretimi ve hücre sağlığı için
                    </p>
                  </div>
                  <span className="text-lg font-bold text-gray-200">
                    {macros.fat || "--"} <span className="text-sm text-gray-400">g</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* Makro Besin Grafiği - Görsel Temsil */}
            <div className="bg-gray-800 bg-opacity-30 rounded-lg p-4 h-full">
              <h4 className="text-lg font-medium mb-3 text-gray-200">
                Besin Oranları
              </h4>

              {macros.protein && macros.carb && macros.fat && goalCalories ? (
                  <>
                    {/* Grafik Görselleştirmesi - Protein */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Protein</span>
                        <span className="text-sm text-gray-400">
                        {Math.round(((macros.protein * 4) / goalCalories) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full"
                          style={{
                          width: `${Math.round(((macros.protein * 4) / goalCalories) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    {/* Grafik Görselleştirmesi - Karbonhidrat */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">Karbonhidrat</span>
                        <span className="text-sm text-gray-400">
                        {Math.round(((macros.carb * 4) / goalCalories) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full"
                          style={{
                          width: `${Math.round(((macros.carb * 4) / goalCalories) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    {/* Grafik Görselleştirmesi - Yağ */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Yağ</span>
                        <span className="text-sm text-gray-400">
                        {Math.round(((macros.fat * 9) / goalCalories) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full"
                          style={{
                          width: `${Math.round(((macros.fat * 9) / goalCalories) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-6 p-3 bg-gray-800 rounded-lg">
                      <h5 className="text-sm font-medium text-yellow-500 mb-2">
                        Öneri
                      </h5>
                      <p className="text-sm text-gray-300">
                        {userData.profile.goalType === "fat_loss"
                          ? "Yağ yakmak için yüksek protein alımı ve düşük karbonhidrat oranı önerilmektedir. Öğünlerinizde protein kaynaklarına öncelik verin."
                          : userData.profile.goalType === "muscle_gain"
                          ? "Kas kütlesi kazanmak için yüksek karbonhidrat ve protein alımı önemlidir. Antrenman sonrası karbonhidrat ve protein açısından zengin bir öğün tüketin."
                          : userData.profile.goalType === "endurance"
                          ? "Dayanıklılık için karbonhidrat ağırlıklı beslenme önerilir. Uzun antrenmanlar öncesi kompleks karbonhidratlar tüketin."
                          : "Mevcut formunuzu korumak için dengeli bir makro besin dağılımı izlemeniz önerilir."}
                      </p>
                    </div>
                  </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  Makro besin dağılımı hesaplanırken boy, kilo ve hedef bilgileriniz kullanılır.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fiziksel Ölçümler Kartı */}
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-6 text-yellow-500">
          Fiziksel Ölçümler
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Boy</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.profile.height || "--"}{" "}
              <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Kilo</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.profile.weight || "--"}{" "}
              <span className="text-sm text-gray-500">kg</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">
              Vücut Yağ Oranı{" "}
              <span className="text-xs text-gray-500">(Tahmini)</span>
            </h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.bodyFat || "--"}%{" "}
              <span className="text-sm text-gray-500"></span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Bel Çevresi</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.waistCircumference || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Boyun Çevresi</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.neckCircumference || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Kalça Çevresi</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.hipCircumference || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Göğüs Çevresi</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.chestCircumference || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Kol Çevresi</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.bicepCircumference || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Bacak Çevresi</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.thighCircumference || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Baldır Çevresi</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.calfCircumference || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-1 text-gray-300">Omuz Genişliği</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {userData.physicalData.shoulderWidth || "--"} <span className="text-sm text-gray-500">cm</span>
            </p>
          </div>
        </div>

        {userData.physicalData?.bmi && (
          <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-medium text-gray-300">
                  Vücut Kitle İndeksi (BMI)
                </h4>
                <p className="text-sm text-gray-400">
                  Boy ve kilonuz baz alınarak hesaplanan değer
                </p>
              </div>
              <p className="text-2xl font-bold text-yellow-500">
                {userData.physicalData.bmi}
              </p>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                <div
                  className={`h-2.5 rounded-full ${
                    userData.physicalData.bmi < 18.5
                      ? "bg-blue-500"
                      : userData.physicalData.bmi < 25
                      ? "bg-green-500"
                      : userData.physicalData.bmi < 30
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, (userData.physicalData.bmi / 40) * 100)
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Zayıf</span>
                <span>Normal</span>
                <span>Fazla Kilolu</span>
                <span>Obez</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() =>
              setUserData((prevData) => ({
                ...prevData,
                needsMeasurementUpdate: true,
              }))
            }
            className="text-yellow-500 font-semibold hover:text-yellow-400 transition duration-200 flex items-center"
          >
            Ölçümleri Güncelle
            <svg
              className="w-5 h-5 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Rozet detayı modalı */}
      {selectedAchievement && (
        <AchievementDetail
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}

      {isDeleteAccountModalOpen && (
        <DeleteAccountModal
          isOpen={isDeleteAccountModalOpen}
          onClose={() => setIsDeleteAccountModalOpen(false)}
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="text-yellow-500">Profil</span>
          </div>

          <Link to="/friends" className="flex flex-col items-center text-xs">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <span className="text-gray-400">Arkadaşlar</span>
          </Link>

          <Link
            to="/achievements"
            className="flex flex-col items-center text-xs"
          >
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
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <span className="text-gray-400">Rozetler</span>
          </Link>

          <button
            className="flex flex-col items-center text-xs"
            onClick={() => {
              localStorage.removeItem("userToken");
              localStorage.removeItem("userInfo");
              navigate("/");
            }}
          >
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <span className="text-gray-400">Çıkış</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Profile;
