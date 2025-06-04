import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get(`${API_URL}/friends`, config);
        setFriends(response.data);
      } catch (error) {
        console.error('Arkadaş listesi alınamadı:', error);
        setError('Arkadaş listesi yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const removeFriend = async (friendId) => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`${API_URL}/friends/${friendId}`, config);

      setFriends(friends.filter(friend => friend._id !== friendId));
    } catch (error) {
      console.error('Arkadaş silinemedi:', error);
      setError('Arkadaş silme işlemi başarısız oldu');
    }
  };

  if (loading) {
    return <div className="text-yellow-500 text-center my-10">Arkadaşlar yükleniyor...</div>;
  }

  return (
    <div className="pt-4 pb-20 md:pb-6 px-4">
      <Link to="/dashboard" className="mb-6 flex items-center text-yellow-500 hover:text-yellow-400 transition duration-200">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Panele Dön
      </Link>

      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-yellow-500">Arkadaşlarım</h2>

        {error && (
          <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {friends.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <p>Henüz arkadaşınız bulunmuyor.</p>
            <Link to="/find-friends" className="mt-3 px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300 inline-block">
              Arkadaş Bul
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map(friend => (
              <div key={friend._id} className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
                    {friend.profile?.photoUrl ? (
                      <img 
                        src={friend.profile.photoUrl} 
                        alt={friend.profile?.fullName || friend.fullName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-gray-200 font-medium">{friend.profile?.fullName || friend.fullName}</h3>
                    <p className="text-gray-400 text-sm">{friend.profile?.goalType ? getGoalTypeText(friend.profile.goalType) : "Hedef belirtilmemiş"}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to={`/profile/${friend._id}`} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => removeFriend(friend._id)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default FriendsList;