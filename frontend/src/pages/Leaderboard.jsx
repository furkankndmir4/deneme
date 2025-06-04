import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(`${API_URL}/leaderboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setLeaderboard(response.data.leaderboard || []);
        setCurrentUserRank(response.data.currentUserRank);
        setCurrentUserId(response.data.currentUserId);
      } catch (err) {
        console.error("Leaderboard error:", err);
        setError("Liderlik tablosu yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filtered = leaderboard.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#111] text-white p-0 m-0">
      <div className="pt-4 px-4">
        <Link to="/dashboard" className="mb-6 flex items-center text-yellow-500 hover:text-yellow-400 transition duration-200">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Panele Dön
        </Link>
      </div>
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">Liderlik Tablosu</h2>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#1a2236] border border-gray-700 text-white focus:outline-none focus:border-yellow-400 w-full md:w-72"
          />
          {currentUserRank && (
            <div className="bg-yellow-500 text-black rounded-full px-4 py-2 font-bold text-lg shadow">
              Sıralamanız: {currentUserRank}
            </div>
          )}
        </div>
        {loading ? (
          <div className="text-yellow-400 text-lg">Yükleniyor...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <div className="bg-[#1a2236] rounded-xl shadow-lg p-4">
            <div className="grid grid-cols-12 py-2 border-b border-gray-700 mb-2">
              <div className="col-span-1 text-xs text-gray-400 text-center">#</div>
              <div className="col-span-7 text-xs text-gray-400">Kullanıcı</div>
              <div className="col-span-4 text-xs text-gray-400 text-right">Puan</div>
            </div>
            {filtered.map((user, idx) => (
              <div
                key={user.id}
                className={`grid grid-cols-12 items-center py-2 px-1 rounded-lg mb-1 ${
                  user.id === currentUserId
                    ? "bg-yellow-900 bg-opacity-20 border border-yellow-700"
                    : idx === 0
                    ? "bg-yellow-900 bg-opacity-20 border border-yellow-800"
                    : idx === 1
                    ? "bg-gray-600 bg-opacity-20 border border-gray-700"
                    : idx === 2
                    ? "bg-yellow-800 bg-opacity-10 border border-yellow-900"
                    : "hover:bg-gray-700 hover:bg-opacity-30 border border-transparent"
                }`}
              >
                <div className="col-span-1 font-bold text-center">
                  {idx === 0 && <span className="text-yellow-400">🏆</span>}
                  {idx === 1 && <span className="text-gray-400">🥈</span>}
                  {idx === 2 && <span className="text-yellow-700">🥉</span>}
                  {idx > 2 && idx + 1}
                </div>
                <div className="col-span-7 flex items-center">
                  <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 flex items-center justify-center text-xs border-2 border-gray-600 overflow-hidden">
                    {user.photoUrl ? (
                      <img 
                        src={user.photoUrl} 
                        alt={user.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <span className={`truncate ${user.id === currentUserId ? "text-yellow-300 font-medium" : "text-gray-200"}`}>
                    {user.name} {user.id === currentUserId && "(Siz)"}
                  </span>
                </div>
                <div className={`col-span-4 text-right font-semibold ${user.id === currentUserId ? "text-yellow-400" : "text-gray-300"}`}>
                  {user.points.toLocaleString()} puan
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-gray-400 text-center py-8">Sonuç bulunamadı.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard; 