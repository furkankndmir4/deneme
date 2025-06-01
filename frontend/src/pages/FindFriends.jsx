import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const FindFriends = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`http://localhost:5000/api/users/search?q=${searchTerm}`, config);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Kullanıcı araması başarısız:', error);
      setError('Kullanıcı araması yapılamadı');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(`http://localhost:5000/api/friends/request/${userId}`, {}, config);
      if (window.refetchAchievementsProgress) window.refetchAchievementsProgress();
      setSearchResults(prevResults => 
        prevResults.map(user => 
          user._id === userId ? { ...user, requestSent: true } : user
        )
      );
      setSuccess('Arkadaşlık isteği gönderildi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);  // Burada API'den gelen mesajı direkt gösteriyoruz
      } else {
        setError('Arkadaşlık isteği gönderme işlemi başarısız oldu');
      }
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="pt-4 pb-20 md:pb-6 px-4">
      <Link to="/dashboard" className="mb-6 flex items-center text-yellow-500 hover:text-yellow-400 transition duration-200">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Panele Dön
      </Link>
      
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-yellow-500">Arkadaş Bul</h2>
        
        {error && (
          <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900 bg-opacity-60 text-green-200 p-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="İsim veya e-posta ile ara..."
              className="flex-1 p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-3 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
              disabled={loading}
            >
              {loading ? 'Aranıyor...' : 'Ara'}
            </button>
          </div>
        </form>
        
        {loading ? (
          <div className="text-yellow-500 text-center my-10">Arama yapılıyor...</div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map(user => (
              <div key={user._id} className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
                    {user.profile.photoUrl ? (
                      <img 
                        src={user.profile.photoUrl.startsWith('http') ? user.profile.photoUrl : `http://localhost:5000${user.profile.photoUrl}`} 
                        alt={user.profile.fullName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                  <h3 className="text-gray-200 font-medium">{user.profile.fullName || 'İsimsiz Kullanıcı'}</h3>
                  <p className="text-gray-400 text-sm">{getGoalTypeText(user.profile.goalType)}</p>
                </div>
              </div>
                
                <div>
                  {user.isFriend ? (
                    <span className="px-3 py-1 bg-green-800 text-green-200 text-sm rounded-lg">
                      Bu kişi zaten arkadaşınız
                    </span>
                  ) : user.requestSent ? (
                    <span className="px-3 py-1 bg-blue-800 text-blue-200 text-sm rounded-lg">
                      İstek Gönderildi
                    </span>
                  ) : user.requestReceived ? (
                    <span className="px-3 py-1 bg-purple-800 text-purple-200 text-sm rounded-lg">
                      İstek Alındı
                    </span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(user._id)}
                      className="px-3 py-1 bg-yellow-500 text-black text-sm rounded-lg hover:bg-yellow-400 transition"
                    >
                      Arkadaş Ekle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-gray-400 text-center py-8">
            <p>Aramanıza uygun sonuç bulunamadı.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const getGoalTypeText = (goalType) => {
  const goals = {
    fat_loss: 'Yağ Yakma',
    muscle_gain: 'Kas Kütlesi Kazanma',
    maintenance: 'Mevcut Formu Koruma',
    endurance: 'Dayanıklılık Artırma'
  };
  return goals[goalType] || 'Belirlenmemiş';
};

export default FindFriends;