import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FriendRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get('http://localhost:5000/api/friends/requests', config);
        setRequests(response.data);
        console.log('Gelen istekler:', response.data);
        response.data.forEach((req, idx) => {
          console.log(`İstek #${idx}:`, req);
        });
      } catch (error) {
        console.error('Arkadaşlık istekleri alınamadı:', error);
        setError('Arkadaşlık istekleri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(`http://localhost:5000/api/friends/accept/${requestId}`, {}, config);
      
      setRequests(requests.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('İstek kabul edilemedi:', error);
      setError('İstek kabul etme işlemi başarısız oldu');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`http://localhost:5000/api/friends/reject/${requestId}`, config);
      
      setRequests(requests.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('İstek reddedilemedi:', error);
      setError('İstek reddetme işlemi başarısız oldu');
    }
  };

  if (loading) {
    return <div className="text-yellow-500 text-center my-5">İstekler yükleniyor...</div>;
  }

  return (
    <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800 mb-6">
      <h2 className="text-xl font-bold mb-4 text-yellow-500">Arkadaşlık İstekleri</h2>
      
      {error && (
        <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {requests.length === 0 ? (
        <div className="text-gray-400 text-center py-4">
          <p>Bekleyen arkadaşlık isteği bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(request => (
            <div key={request._id} className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
                  {request.from.profileImage ? (
                    <img src={request.from.profileImage} alt={request.from.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-gray-200 font-medium">{request.from.fullName}</h3>
                  <p className="text-gray-500 text-xs">{new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleAccept(request._id)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                >
                  Kabul Et
                </button>
                <button 
                  onClick={() => handleReject(request._id)}
                  className="px-3 py-1 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition"
                >
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;