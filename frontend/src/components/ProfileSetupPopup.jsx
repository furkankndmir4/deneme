// components/ProfileSetupPopup.jsx
import { useState } from 'react';
import { updateUserProfile } from '../services/api';
import axios from 'axios';

const ProfileSetupPopup = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    fullName: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    goalType: 'fat_loss', // fat_loss, muscle_gain, maintenance, endurance
    activityLevel: 'moderate' // sedentary, light, moderate, active, very_active
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Token kontrolü
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (!token) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        return;
      }

      // Veri doğrulama
      if (!profileData.fullName || !profileData.age || !profileData.gender || !profileData.height || !profileData.weight) {
        setError("Lütfen tüm alanları doldurun");
        return;
      }

      // Profil verilerini hazırla
      const profileDataToSave = {
        fullName: profileData.fullName.trim(),
        age: parseInt(profileData.age),
        gender: profileData.gender,
        height: parseFloat(profileData.height),
        weight: parseFloat(profileData.weight),
        goalType: profileData.goalType || "maintenance",
        activityLevel: profileData.activityLevel || "moderate",
      };

      console.log("Saving profile data:", profileDataToSave);

      // API çağrısı
      const response = await axios.put(
        "http://localhost:5000/api/users/profile",
        profileDataToSave,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Profile save response:", response.data);

      if (response.data) {
        // Profil kurulumunu tamamlandı olarak işaretle
        localStorage.setItem("profileSetupDone", "true");
        
        // Kullanıcı verilerini güncelle
        const updatedUserData = {
          ...JSON.parse(localStorage.getItem("user") || "{}"),
          profile: profileDataToSave,
        };
        
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        sessionStorage.setItem("user", JSON.stringify(updatedUserData));

        onSave(profileDataToSave);
        onClose();
      }
    } catch (error) {
      console.error("Profile save error:", error);
      if (error.response?.status === 401) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
      } else {
        setError(error.response?.data?.message || "Profil kaydedilirken bir hata oluştu");
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-yellow-500">Profilinizi Oluşturun</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-200 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Kişisel Bilgiler */}
          {step === 1 && (
            <>
              <p className="text-gray-300 mb-4">
                FitWeb'e hoş geldiniz! Daha iyi bir deneyim için temel bilgilerinizi paylaşır mısınız?
              </p>
              
              <div>
                <label className="block text-gray-300 mb-2 text-sm" htmlFor="fullName">Ad Soyad</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                  placeholder="Ad Soyad"
                  value={profileData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2 text-sm" htmlFor="age">Yaş</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                  placeholder="Yaşınız"
                  value={profileData.age}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2 text-sm" htmlFor="gender">Cinsiyet</label>
                <select
                  id="gender"
                  name="gender"
                  className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                  value={profileData.gender}
                  onChange={handleChange}
                >
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-yellow-500 text-black font-medium py-2 px-4 rounded-lg hover:bg-yellow-400 transition duration-300"
                >
                  İleri
                </button>
              </div>
            </>
          )}
          
          {/* Step 2: Fiziksel Bilgiler ve Hedefler */}
          {step === 2 && (
            <>
              <p className="text-gray-300 mb-4">
                Şimdi birkaç temel fiziksel bilginizi ve fitness hedeflerinizi öğrenelim.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm" htmlFor="height">Boy (cm)</label>
                  <input
                    id="height"
                    name="height"
                    type="number"
                    className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                    placeholder="175"
                    value={profileData.height}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 text-sm" htmlFor="weight">Kilo (kg)</label>
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                    placeholder="70"
                    value={profileData.weight}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm" htmlFor="goalType">Fitness Amacınız</label>
                <select
                  id="goalType"
                  name="goalType"
                  className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                  value={profileData.goalType}
                  onChange={handleChange}
                >
                  <option value="fat_loss">Yağ Yakma</option>
                  <option value="muscle_gain">Kas Kütlesi Kazanma</option>
                  <option value="maintenance">Formumu Koruma</option>
                  <option value="endurance">Dayanıklılık Artırma</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2 text-sm" htmlFor="activityLevel">Aktivite Seviyeniz</label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                  value={profileData.activityLevel}
                  onChange={handleChange}
                >
                  <option value="sedentary">Hareketsiz (Masa başı iş, egzersiz yok)</option>
                  <option value="light">Hafif (Haftada 1-3 gün egzersiz)</option>
                  <option value="moderate">Orta (Haftada 3-5 gün egzersiz)</option>
                  <option value="active">Aktif (Haftada 6-7 gün egzersiz)</option>
                  <option value="very_active">Çok Aktif (Günde 2 kez antrenman)</option>
                </select>
              </div>
              
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-700 text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 text-black font-medium py-2 px-4 rounded-lg hover:bg-yellow-400 transition duration-300"
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : 'Profili Oluştur'}
                </button>
              </div>
            </>
          )}
          
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              <div className={`h-2 w-8 rounded-full ${step === 1 ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
              <div className={`h-2 w-8 rounded-full ${step === 2 ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPopup;