import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

function PendingAthleteRequests() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_URL}/coaches/athlete-requests`, config);
        setPendingRequests(res.data);
      } catch (err) {
        setError('Bekleyen istekler alınamadı');
      } finally {
        setLoading(false);
      }
    };
    fetchPendingRequests();
  }, []);

  if (loading) return <div>Bekleyen istekler yükleniyor...</div>;
  if (error) return <div>{error}</div>;
  if (pendingRequests.length === 0) return <div>Bekleyen istek yok.</div>;

  return (
    <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-yellow-500">
      <h3 className="text-lg font-bold text-yellow-500 mb-4">Bekleyen Sporcu İstekleri</h3>
      {pendingRequests.map(req => (
        <div key={req._id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3 mb-2">
          <div>
            <div className="font-semibold text-gray-100">{req.athlete?.profile?.fullName || req.athlete?.email}</div>
            <div className="text-gray-400 text-sm">{req.athlete?.email}</div>
          </div>
          <div className="flex gap-2">
            {/* Kabul ve Reddet butonları ekleyebilirsin */}
            {/* <button onClick={() => handleAccept(req._id)} className="bg-green-600 text-white px-3 py-1 rounded">Kabul Et</button>
            <button onClick={() => handleReject(req._id)} className="bg-red-600 text-white px-3 py-1 rounded">Reddet</button> */}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PendingAthleteRequests; 