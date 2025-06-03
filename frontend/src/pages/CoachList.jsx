// pages/CoachList.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const CoachList = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [userData, setUserData] = useState(null);
  const [sentCoachRequests, setSentCoachRequests] = useState([]);
  const [isEndingRelationship, setIsEndingRelationship] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ratingCoach, setRatingCoach] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsCoach, setCommentsCoach] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data);
      } catch (err) {
        console.error("User data fetch error:", err);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");

        if (!token) {
          navigate("/");
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get(`${API_URL}/coaches`, config);
        setCoaches(response.data);
      } catch (err) {
        console.error("Coaches fetch error:", err);
        setError("Antrenörler listesi yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, [navigate]);

  useEffect(() => {
    const fetchSentCoachRequests = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/athletes/my-coach-requests`, config);
        setSentCoachRequests(response.data);
      } catch (err) {
        setSentCoachRequests([]);
      }
    };
    fetchSentCoachRequests();
  }, []);

  useEffect(() => {
    // Get user id for filtering ratings
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        if (!token) return;
        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(response.data._id);
      } catch (err) {
        // ignore
      }
    };
    fetchUserId();
  }, []);

  const handleSelectCoach = async () => {
    if (!selectedCoach) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(
        `${API_URL}/athletes/select-coach`,
        {
          coachId: selectedCoach._id,
          message,
        },
        config
      );

      // İstek başarılıysa, pending/accepted istekleri tekrar çek
      const response = await axios.get(`${API_URL}/athletes/my-coach-requests`, config);
      setSentCoachRequests(response.data);

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      // Hata alsan bile, pending/accepted istekleri tekrar çek
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/athletes/my-coach-requests`, config);
        setSentCoachRequests(response.data);
      } catch (e) {
        // ignore
      }
      console.error("Coach selection error:", err);
      setError(err.response?.data?.message || "Antrenör seçimi yapılamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoachClick = (coach) => {
    if (selectedCoach && selectedCoach._id === coach._id) {
      setSelectedCoach(null);
    } else {
      setSelectedCoach(coach);
    }
  };

  const openRatingModal = async (coach) => {
    setRatingCoach(coach);
    setShowRatingModal(true);
    // Varsayılan değerler
    setRating(5);
    setRatingComment("");
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/coaches/${coach._id}/ratings`, config);
      if (response.data && Array.isArray(response.data) && userId) {
        const myRating = response.data.find(r => r.athlete && (r.athlete._id === userId || r.athlete === userId));
        if (myRating) {
          setRating(myRating.rating);
          setRatingComment(myRating.comment);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const handleRateCoach = async () => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(
        `${API_URL}/coaches/${ratingCoach._id}/rate`,
        {
          rating,
          comment: ratingComment,
        },
        config
      );

      setShowRatingModal(false);
      setRating(5);
      setRatingComment("");
      setRatingCoach(null);

      // Refresh coach data
      const response = await axios.get(`${API_URL}/coaches`, config);
      setCoaches(response.data);
    } catch (err) {
      console.error("Rating error:", err);
      setError("Puanlama yapılamadı");
    }
  };

  const handleEndRelationship = async () => {
    setShowEndModal(false);
    try {
      setIsEndingRelationship(true);
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/athletes/end-coach-relationship`, {}, config);
      
      // Refresh user data and coach list
      const userResponse = await axios.get(`${API_URL}/users/profile`, config);
      setUserData(userResponse.data);
      
      const coachesResponse = await axios.get(`${API_URL}/coaches`, config);
      setCoaches(coachesResponse.data);

      // Refresh sent coach requests
      const requestsResponse = await axios.get(`${API_URL}/athletes/my-coach-requests`, config);
      setSentCoachRequests(requestsResponse.data);

      // Show success message
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error ending relationship:", err);
      setError(err.response?.data?.message || "İlişki sonlandırılırken bir hata oluştu");
    } finally {
      setIsEndingRelationship(false);
    }
  };

  const openCommentsModal = async (coach) => {
    setCommentsCoach(coach);
    setShowCommentsModal(true);
    setComments([]);
    setCommentsLoading(true);
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/coaches/${coach._id}/ratings`, config);
      setComments(response.data || []);
    } catch (err) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-${star <= rating ? "yellow" : "gray"}-500`}
          >
            ★
          </span>
        ))}
        <span className="text-gray-400 text-sm ml-2">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  const formatMembershipDuration = (months) => {
    if (!months) return "0 ay";
    if (months < 12) {
      return `${months} aydır üye`;
    }
    const years = Math.floor(months / 12);
    return `${years} yıldır üye`;
  };

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
        <h2 className="text-2xl font-bold mb-2 text-yellow-500">
          Antrenör Seçimi
        </h2>
        <p className="text-gray-400 mb-6">
          Size uygun bir antrenör seçerek özel programlar alabilirsiniz.
        </p>

        {success && (
          <div className="bg-green-900 bg-opacity-40 text-green-400 p-4 rounded-lg mb-6">
            <p>
              Antrenör talebi başarıyla gönderildi! Panele
              yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-yellow-500">Antrenörler yükleniyor...</div>
          </div>
        ) : coaches.length === 0 ? (
          <div className="bg-gray-800 bg-opacity-40 text-gray-300 p-4 rounded-lg text-center">
            <p>Sistemde kayıtlı antrenör bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coaches.map((coach) => {
              const alreadyRequested = sentCoachRequests.some(
                req => String(req.coach) === String(coach._id) && ['pending', 'accepted'].includes(req.status)
              );
              const isActiveCoach = userData?.coach?._id === coach._id;
              return (
                <div
                  key={coach._id}
                  className={`bg-gray-800 bg-opacity-40 rounded-xl p-6 border relative ${
                    selectedCoach && selectedCoach._id === coach._id && !isActiveCoach ? 'border-yellow-500' : 'border-gray-700'
                  } ${isActiveCoach ? 'opacity-100 cursor-default' : 'hover:border-yellow-500 cursor-pointer transition-all duration-300'}`}
                  onClick={() => !alreadyRequested && !isActiveCoach && handleCoachClick(coach)}
                  style={alreadyRequested && !isActiveCoach ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                >
                  {/* Kart üst barı: arka planlı, paddingli, butonlar hizalı */}
                  <div className="flex justify-between items-center bg-gray-900 bg-opacity-60 rounded-t-lg px-4 py-4 mb-2 -mt-5 -mx-6">
                    <button
                      onClick={e => { e.stopPropagation(); openCommentsModal(coach); }}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-full text-xs font-semibold shadow z-10"
                    >
                      Yorumları Gör
                    </button>
                    <div className="flex items-center gap-2">
                      {alreadyRequested && !isActiveCoach && (
                        <div className="px-3 py-1 rounded-full text-xs font-semibold shadow bg-yellow-500 text-black">
                          İstek Gönderildi
                        </div>
                      )}
                      {isActiveCoach && (
                        <>
                          <div className="px-3 py-1 rounded-full text-xs font-semibold shadow bg-green-500 text-black">
                            Aktif Antrenörün
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              openRatingModal(coach);
                            }}
                            className="ml-2 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-semibold shadow transition-colors duration-200"
                          >
                            Puanla
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex-shrink-0 border-2 border-yellow-500 flex items-center justify-center overflow-hidden">
                      {coach.profile?.photoUrl ? (
                        <img
                          src={coach.profile.photoUrl.startsWith('http') ? coach.profile.photoUrl : `${API_URL.replace('/api', '')}${coach.profile.photoUrl}`}
                          alt={coach.profile.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-8 h-8 text-gray-500"
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
                    <div className="ml-3">
                      <h3 className="text-lg font-bold text-gray-100">
                        {coach.profile?.fullName || "İsimsiz Antrenör"}
                      </h3>
                      {renderStars(coach.stats?.averageRating || 0)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
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
                      <span className="text-gray-300">
                        {coach.stats?.activeStudents || 0} aktif öğrenci
                      </span>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-300">
                        {formatMembershipDuration(coach.stats?.membershipDuration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-gray-300">
                        {coach.stats?.programCount || 0} program oluşturdu
                      </span>
                    </div>
                  </div>

                  {coach.profile?.coachNote && (
                    <div className="bg-gray-900 bg-opacity-40 p-3 rounded-lg mb-4">
                      <p className="text-base text-gray-100 font-medium">{coach.profile.coachNote}</p>
                    </div>
                  )}

                  {/* Aktif antrenör için ilişki sonlandırma butonu alt kısımda ortalanmış şekilde */}
                  {isActiveCoach && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEndModal(true);
                        }}
                        disabled={isEndingRelationship}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 disabled:opacity-50 shadow"
                      >
                        {isEndingRelationship ? "İşleniyor..." : "Antrenörlük İlişkisini Sonlandır"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedCoach && (
          <div className="mt-8 bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              {selectedCoach.profile?.fullName || "Antrenör"} ile çalışmak
              istiyorsunuz
            </h3>
            {/* Sadece kullanıcıda hiç antrenör yoksa mesaj kutusu göster */}
            {selectedCoach && !userData?.coach && (() => {
              const alreadyRequested = sentCoachRequests.some(
                req => String(req.coach) === String(selectedCoach._id) && ['pending', 'accepted'].includes(req.status)
              );
              if (alreadyRequested) return null;
              return (
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2 text-sm">Antrenöre mesajınız (opsiyonel)</label>
                  <textarea
                    className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200 resize-none"
                    rows="3"
                    placeholder="Hedeflerinizi, beklentilerinizi veya özel durumlarınızı belirtebilirsiniz..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>
              );
            })()}
            <div className="flex gap-4">
              {userData?.coach?._id === selectedCoach._id ? (
                <div className="w-full">
                  <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 p-4 rounded-lg text-center">
                    <p className="text-yellow-500">
                      Bu antrenör zaten sizin antrenörünüz.
                    </p>
                  </div>
                </div>
              ) : userData?.coach ? (
                <div className="w-full">
                  <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 p-4 rounded-lg text-center">
                    <p className="text-yellow-500">
                      Zaten bir antrenörünüz var. Yeni bir antrenör seçmek için
                      önce mevcut antrenörünüzle olan ilişkinizi sonlandırmanız
                      gerekmektedir.
                    </p>
                  </div>
                </div>
              ) : (
                (() => {
                  const alreadyRequested = sentCoachRequests.some(
                    (req) =>
                      String(req.coach) === String(selectedCoach._id) &&
                      ["pending", "accepted"].includes(req.status)
                  );
                  return alreadyRequested ? (
                    <button
                      className="w-full bg-gray-600 text-gray-300 font-medium py-3 rounded-lg"
                      disabled
                    >
                      İstek Gönderildi
                    </button>
                  ) : (
                    <button
                      onClick={handleSelectCoach}
                      disabled={isSubmitting}
                      className="w-full bg-yellow-500 text-black font-medium py-3 rounded-lg hover:bg-yellow-400 transition duration-300 disabled:opacity-50"
                    >
                      {isSubmitting ? "İşleniyor..." : "Antrenör Talebi Gönder"}
                    </button>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && ratingCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              {ratingCoach.profile?.fullName || "Antrenör"} Puanlama
            </h3>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Puanınız</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      star <= rating ? "text-yellow-500" : "text-gray-500"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">
                Yorumunuz (opsiyonel)
              </label>
              <textarea
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200 resize-none"
                rows="3"
                placeholder="Deneyiminizi paylaşın..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              ></textarea>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleRateCoach}
                className="flex-1 bg-yellow-500 text-black font-medium py-3 rounded-lg hover:bg-yellow-400 transition duration-300"
              >
                Puanla
              </button>
              <button
                onClick={() => { setShowRatingModal(false); setRatingCoach(null); }}
                className="flex-1 bg-gray-700 text-gray-200 font-medium py-3 rounded-lg hover:bg-gray-600 transition duration-300"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for ending relationship */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-lg border border-gray-700">
            <h3 className="text-lg font-bold text-gray-100 mb-4">İlişkiyi Sonlandır</h3>
            <p className="text-gray-300 mb-6">Antrenörünüzle olan ilişkinizi sonlandırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowEndModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium"
                disabled={isEndingRelationship}
              >
                Vazgeç
              </button>
              <button
                onClick={handleEndRelationship}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                disabled={isEndingRelationship}
              >
                {isEndingRelationship ? "İşleniyor..." : "Evet, Sonlandır"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yorumlar Modalı */}
      {showCommentsModal && commentsCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full shadow-lg border border-gray-700 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-100">
                {commentsCoach.profile?.fullName || "Antrenör"} - Yorumlar
              </h3>
              <button onClick={() => setShowCommentsModal(false)} className="text-gray-400 hover:text-gray-200 text-2xl">&times;</button>
            </div>
            {commentsLoading ? (
              <div className="text-yellow-400 text-center py-8">Yorumlar yükleniyor...</div>
            ) : comments.length === 0 ? (
              <div className="text-gray-400 text-center py-8">Henüz yorum bulunmuyor.</div>
            ) : (
              <div className="space-y-4">
                {comments.map((c, idx) => (
                  <div key={idx} className="bg-gray-900 bg-opacity-60 rounded-lg p-4 flex gap-4 items-start">
                    <div className="flex-shrink-0">
                      {c.athlete?.profile?.photoUrl ? (
                        <img 
                          src={c.athlete.profile.photoUrl.startsWith('http') ? c.athlete.profile.photoUrl : `${API_URL.replace('/api', '')}${c.athlete.profile.photoUrl}`} 
                          alt={c.athlete.profile.fullName} 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-200 text-sm">{
                          c.athlete?.profile?.fullName || c.athlete?.fullName || c.athlete?.name || 'Kullanıcı'
                        }</span>
                        <span className="text-yellow-400 text-xs">{'★'.repeat(c.rating)}{'☆'.repeat(5-c.rating)}</span>
                      </div>
                      <div className="text-gray-300 text-sm whitespace-pre-line">{c.comment || <span className="italic text-gray-500">Yorum yok</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachList;
