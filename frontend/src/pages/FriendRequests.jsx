import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get(`${API_URL}/friends/requests`, config);
        setRequests(response.data);
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

      await axios.post(`${API_URL}/friends/accept/${requestId}`, {}, config);
      
      setRequests(requests.filter(req => req._id !== requestId));
      setSuccess('Arkadaşlık isteği kabul edildi');
      
      setTimeout(() => setSuccess(null), 3000);
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

      await axios.delete(`${API_URL}/friends/reject/${requestId}`, config);
      
      setRequests(requests.filter(req => req._id !== requestId));
      setSuccess('Arkadaşlık isteği reddedildi');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('İstek reddedilemedi:', error);
      setError('İstek reddetme işlemi başarısız oldu');
    }
  };

  return (
    <div className="pt-4 pb-20 md:pb-6 px-4">
      <Link to="/dashboard" className="fixed top-6 left-6 z-50 inline-flex items-center text-yellow-400 hover:text-yellow-300 font-semibold transition text-lg bg-[#181818] bg-opacity-80 px-4 py-2 rounded-full shadow-lg">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Panele Dön
      </Link>
      
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-yellow-500">Arkadaşlık İstekleri</h2>
        
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
        
        {loading ? (
          <div className="text-yellow-500 text-center my-10">İstekler yükleniyor...</div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request._id} className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
                    {request.from.photoUrl ? (
                      <img 
                        src={request.from.photoUrl} 
                        alt={request.from.fullName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                    className="px-3 py-1 bg-yellow-500 text-black text-sm rounded-lg hover:bg-yellow-400 transition"
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
        ) : (
          <div className="text-gray-400 text-center py-10">
            <p>Bekleyen arkadaşlık isteği bulunmuyor.</p>
            <Link to="/find-friends" className="mt-3 text-yellow-500 hover:text-yellow-400 transition inline-block">
              Arkadaş aramak için tıklayın
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequestsPage;