import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AchievementBadgeGroup, AchievementDetail } from '../components/achievement/AchievementBadge';
import { Trophy } from 'lucide-react';
import allBadges from '../data/achievements.json';

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const UserProfileView = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [isFriend, setIsFriend] = useState(false);
    const [friendRequestSent, setFriendRequestSent] = useState(false);
    const [friendRequestReceived, setFriendRequestReceived] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
                if (!token) {
                    navigate('/');
                    return;
                }

                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                const response = await axios.get(`${API_URL}/users/profile/${userId}`, config);
                console.log("Profile data received:", response.data);
                
                // Backend'den gelen achievement ID'lerini, tüm rozet detaylarıyla birleştir
                const earnedAchievementIds = response.data.achievements ? response.data.achievements.map(a => a.id) : [];
                const detailedEarnedAchievements = allBadges.filter(badge => earnedAchievementIds.includes(badge.id));

                setUserData({
                    ...response.data,
                    achievements: detailedEarnedAchievements // Detaylı rozet verisi ile güncelle
                });

                // Arkadaşlık durumunu kontrol et
                if (response.data.friendshipStatus) {
                    setIsFriend(response.data.friendshipStatus === 'friends');
                    setFriendRequestSent(response.data.friendshipStatus === 'request_sent');
                    setFriendRequestReceived(response.data.friendshipStatus === 'request_received');
                }
            } catch (error) {
                console.error('User profile fetch error:', error);
                setError('Kullanıcı profili yüklenemedi');
                if (error.response?.status === 401) {
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('userInfo');
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId, navigate]);

    const handleSendRequest = async () => {
        try {
            const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
    
            const response = await axios.post(`${API_URL}/friends/request/${userId}`, {}, config);
            console.log("Arkadaşlık isteği cevabı:", response.data);
            setFriendRequestSent(true);
            setSuccess('Arkadaşlık isteği gönderildi');
    
            // 3 saniye sonra başarı mesajını kaldır
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Arkadaşlık isteği gönderme hatası:', error);
            console.error('Hata detayları:', error.response?.data);
            setError(error.response?.data?.message || 'Arkadaşlık isteği gönderilemedi');
        }
    };

    // Arkadaşlık isteğini kabul etme
    const handleAcceptRequest = async () => {
        try {
            const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.post(`${API_URL}/friends/accept/${userId}`, {}, config);
            setIsFriend(true);
            setFriendRequestReceived(false);
            setSuccess('Arkadaşlık isteği kabul edildi');

            // 3 saniye sonra başarı mesajını kaldır
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Arkadaşlık isteği kabul hatası:', error);
            setError('Arkadaşlık isteği kabul edilemedi');
        }
    };

    // Arkadaşlık isteğini reddetme
    const handleRejectRequest = async () => {
        try {
            const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.delete(`${API_URL}/friends/reject/${userId}`, config);
            setFriendRequestReceived(false);
            setSuccess('Arkadaşlık isteği reddedildi');

            // 3 saniye sonra başarı mesajını kaldır
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Arkadaşlık isteği reddetme hatası:', error);
            setError('Arkadaşlık isteği reddedilemedi');
        }
    };

    // Arkadaşlıktan çıkarma
    const handleRemoveFriend = async () => {
        try {
            const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.delete(`${API_URL}/friends/${userId}`, config);
            setIsFriend(false);
            setSuccess('Arkadaşlıktan çıkarıldı');

            // 3 saniye sonra başarı mesajını kaldır
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Arkadaşlıktan çıkarma hatası:', error);
            setError('Arkadaşlıktan çıkarılamadı');
        }
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

    const getActivityLevelText = (level) => {
        const levels = {
            sedentary: 'Hareketsiz (Masa başı iş, egzersiz yok)',
            light: 'Hafif (Haftada 1-3 gün egzersiz)',
            moderate: 'Orta (Haftada 3-5 gün egzersiz)',
            active: 'Aktif (Haftada 6-7 gün egzersiz)',
            very_active: 'Çok Aktif (Günde 2 kez antrenman)'
        };
        return levels[level] || 'Belirlenmemiş';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-yellow-500 text-xl">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="pt-4 pb-20 md:pb-6 px-4">
            <Link to="/dashboard" className="mb-6 flex items-center text-yellow-500 hover:text-yellow-400 transition duration-200">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Panele Dön
            </Link>

            <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800 mb-6">
                <h2 className="text-2xl font-bold mb-6 text-yellow-500">
                    {userData?.profile?.fullName || 'Kullanıcı'} Profili
                </h2>

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

                {/* Gizli profil kontrolü */}
                {userData?.isPrivate ? (
                    <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                        <div className="flex flex-col items-center mb-3">
                            <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3a3 3 0 100-6 3 3 0 000 6zm0-9a9 9 0 00-9 9v7h6v-7a3 3 0 016 0v7h6v-7a9 9 0 00-9-9z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-300">Gizli Profil</h3>
                            <p className="text-gray-400 mt-2">
                                Bu kullanıcı profilini gizli tutmayı tercih etmiştir.
                            </p>

                            {/* Sadece arkadaş ekle butonu gösterilsin */}
                            <div className="mt-4 w-full">
                                {isFriend ? (
                                    <button
                                        className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-300"
                                        onClick={handleRemoveFriend}
                                    >
                                        Arkadaşlıktan Çıkar
                                    </button>
                                ) : friendRequestSent ? (
                                    <button
                                        className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg cursor-not-allowed"
                                        disabled
                                    >
                                        İstek Gönderildi
                                    </button>
                                ) : friendRequestReceived ? (
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition duration-300"
                                            onClick={handleAcceptRequest}
                                        >
                                            İsteği Kabul Et
                                        </button>
                                        <button
                                            className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition duration-300"
                                            onClick={handleRejectRequest}
                                        >
                                            İsteği Reddet
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="w-full px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                                        onClick={handleSendRequest}
                                    >
                                        Arkadaş Ekle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : userData?.friendsOnly && !isFriend ? (
                    // Sadece arkadaşlara açık ve kullanıcı arkadaş değilse
                    <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg text-center">
                        <div className="flex flex-col items-center mb-3">
                            <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-300">Sadece Arkadaşlara Açık Profil</h3>
                            <p className="text-gray-400 mt-2">
                                Bu kullanıcının profil bilgileri sadece arkadaşlarına açıktır. Profil bilgilerini görüntülemek için arkadaşlık isteği gönderebilirsiniz.
                            </p>

                            {/* Arkadaşlık işlemleri */}
                            <div className="mt-4 w-full">
                                {friendRequestSent ? (
                                    <button
                                        className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg cursor-not-allowed"
                                        disabled
                                    >
                                        İstek Gönderildi
                                    </button>
                                ) : friendRequestReceived ? (
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition duration-300"
                                            onClick={handleAcceptRequest}
                                        >
                                            İsteği Kabul Et
                                        </button>
                                        <button
                                            className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition duration-300"
                                            onClick={handleRejectRequest}
                                        >
                                            İsteği Reddet
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="w-full px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                                        onClick={handleSendRequest}
                                    >
                                        Arkadaş Ekle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Profil herkese açık veya kullanıcı arkadaş ise normal profil bilgilerini göster
                    <div className="flex flex-col md:flex-row">
                        {/* Mevcut profil bilgileri kısmı */}
                        <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full bg-gray-800 border-2 border-yellow-500 mb-4 flex items-center justify-center overflow-hidden">
                                {userData?.profile?.photoUrl ? (
                                    <img 
                                        src={userData.profile.photoUrl.startsWith('http') ? userData.profile.photoUrl : `${API_URL.replace('/api', '')}${userData.profile.photoUrl}`} 
                                        alt={userData.profile.fullName} 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>

                            {/* Arkadaşlık İşlemleri */}
                            <div className="mt-2 w-full">
                                {isFriend ? (
                                    <button
                                        className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-300"
                                        onClick={handleRemoveFriend}
                                    >
                                        Arkadaşlıktan Çıkar
                                    </button>
                                ) : friendRequestSent ? (
                                    <button
                                        className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg cursor-not-allowed"
                                        disabled
                                    >
                                        İstek Gönderildi
                                    </button>
                                ) : friendRequestReceived ? (
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition duration-300"
                                            onClick={handleAcceptRequest}
                                        >
                                            İsteği Kabul Et
                                        </button>
                                        <button
                                            className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition duration-300"
                                            onClick={handleRejectRequest}
                                        >
                                            İsteği Reddet
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="w-full px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                                        onClick={handleSendRequest}
                                    >
                                        Arkadaş Ekle
                                    </button>
                                )}
                            </div>

                            {/* Fitness Amacı Bilgi Kartı */}
                            <div className="mt-6 w-full bg-gray-800 bg-opacity-40 p-4 rounded-lg">
                                <h4 className="text-yellow-500 font-medium mb-2">Fitness Amacı</h4>
                                <p className="text-gray-300">{getGoalTypeText(userData?.profile?.goalType)}</p>

                                <h4 className="text-yellow-500 font-medium mt-4 mb-2">Aktivite Seviyesi</h4>
                                <p className="text-gray-300">{getActivityLevelText(userData?.profile?.activityLevel)}</p>
                            </div>
                        </div>

                        <div className="md:w-2/3 md:pl-6">
                            <div className="space-y-6">
                                <div className="bg-gray-800 bg-opacity-40 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-yellow-500 mb-4">Kişisel Bilgiler</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-gray-300 font-medium mb-1">Ad Soyad</h4>
                                            <p className="text-gray-400">{userData?.profile?.fullName || '--'}</p>
                                        </div>

                                        <div>
                                            <h4 className="text-gray-300 font-medium mb-1">Yaş</h4>
                                            <p className="text-gray-400">{userData?.profile?.age || '--'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <h4 className="text-gray-300 font-medium mb-1">Cinsiyet</h4>
                                            <p className="text-gray-400">
                                                {userData?.profile?.gender === 'male' ? 'Erkek' :
                                                    userData?.profile?.gender === 'female' ? 'Kadın' :
                                                        userData?.profile?.gender === 'other' ? 'Diğer' : '--'}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-gray-300 font-medium mb-1">Boy</h4>
                                            <p className="text-gray-400">{userData?.profile?.height || '--'} cm</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <h4 className="text-gray-300 font-medium mb-1">Kilo</h4>
                                            <p className="text-gray-400">{userData?.profile?.weight || '--'} kg</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vücut Ölçüleri Bölümü */}
                                {userData?.physicalData && (
                                  <div className="bg-gray-800 bg-opacity-40 p-4 rounded-lg mt-6">
                                    <h3 className="text-lg font-semibold text-yellow-500 mb-4">Vücut Ölçüleri</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Vücut Yağ Oranı</h4>
                                        <p className="text-gray-400">{userData.physicalData.bodyFat || '--'} %</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Bel Çevresi</h4>
                                        <p className="text-gray-400">{userData.physicalData.waistCircumference || '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Boyun Çevresi</h4>
                                        <p className="text-gray-400">{userData.physicalData.neckCircumference || '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Kalça Çevresi</h4>
                                        <p className="text-gray-400">{userData.physicalData.hipCircumference || '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Göğüs Çevresi</h4>
                                        <p className="text-gray-400">{userData.physicalData.chestCircumference || '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Kol Çevresi</h4>
                                        <p className="text-gray-400">{userData.physicalData.armCircumference !== undefined ? userData.physicalData.armCircumference : '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Bacak Çevresi</h4>
                                        <p className="text-gray-400">{userData.physicalData.legCircumference !== undefined ? userData.physicalData.legCircumference : '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Baldır Çevresi</h4>
                                        <p className="text-gray-400">{userData.physicalData.calfCircumference !== undefined ? userData.physicalData.calfCircumference : '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">Omuz Genişliği</h4>
                                        <p className="text-gray-400">{userData.physicalData.shoulderWidth || '--'} cm</p>
                                      </div>
                                      <div>
                                        <h4 className="text-gray-300 font-medium mb-1">BMI</h4>
                                        <p className="text-gray-400">{userData.physicalData.bmi || '--'}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Rozetler Bölümü */}
                                <div className="bg-gray-800 bg-opacity-40 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-yellow-500 mb-4">Rozetler</h3>

                                    {userData?.achievements && userData.achievements.length > 0 ? (
                                        <div>
                                            <div className="flex items-center mb-3">
                                                <Trophy className="text-yellow-500 mr-2" size={20} />
                                                <span className="text-gray-300">Kazanılan Rozetler: {userData.achievements.filter(a => a.earned).length}</span>
                                            </div>

                                            {/* Kazanılan rozetleri listele */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {userData.achievements.filter(a => a.earned).map(badge => (
                                                    <div key={badge.id} className="flex flex-col items-center text-center">
                                                        <span className="text-2xl">{badge.icon}</span>
                                                        <span className="text-xs text-gray-300 mt-1">{badge.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-center py-3">Bu kullanıcı henüz rozet kazanmamış.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rozet detay modalı */}
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
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-gray-400">Panel</span>
                    </Link>

                    <Link to="/profile" className="flex flex-col items-center text-xs">
                        <div className="p-1 rounded-full text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span className="text-gray-400">Profil</span>
                    </Link>

                    <Link to="/friends" className="flex flex-col items-center text-xs">
                        <div className="p-1 rounded-full text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className="text-gray-400">Arkadaşlar</span>
                    </Link>

                    <Link to="/" className="flex flex-col items-center text-xs">
                        <div className="p-1 rounded-full text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <span className="text-gray-400">Çıkış</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserProfileView;