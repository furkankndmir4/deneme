// pages/ProgressHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Goals from '../components/Goals';
import { Link } from 'react-router-dom';

const ProgressHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('3m'); // 1m, 3m, 6m, 1y, all

  const fetchHistoryData = async (range = timeRange) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (!token) {
        setError('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Tarih aralığı hesaplama
      let startDate;
      const now = new Date();
      switch (range) {
        case '1m': startDate = subMonths(now, 1); break;
        case '3m': startDate = subMonths(now, 3); break;
        case '6m': startDate = subMonths(now, 6); break;
        case '1y': startDate = subMonths(now, 12); break;
        default: startDate = null;
      }
      let apiUrl = '/api/athletes/physical-data/history';
      if (startDate) {
        apiUrl += `?startDate=${startDate.toISOString()}`;
      }
      const response = await axios.get(apiUrl, config);
      // Grafikler için veri formatı
      const formattedData = response.data.map(item => ({
        date: format(new Date(item.createdAt), 'd MMM', { locale: tr }),
        weight: item.weight,
        bodyFat: item.bodyFat,
        bmi: item.bmi,
      }));
      setHistoryData(formattedData);
    } catch (err) {
      setError('Veri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData(timeRange);
  }, [timeRange]);

  // Sayfa her açıldığında flag'i kontrol et ve sıfırla
  useEffect(() => {
    if (localStorage.getItem('progressNeedsRefresh') === '1') {
      fetchHistoryData();
      localStorage.setItem('progressNeedsRefresh', '0');
    }
  }, []);

  // Profil başka sekmede güncellenirse de dinle
  useEffect(() => {
    const handleStorage = () => {
      if (localStorage.getItem('progressNeedsRefresh') === '1') {
        fetchHistoryData();
        localStorage.setItem('progressNeedsRefresh', '0');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="pt-4 pb-20 md:pb-6 px-4">
      <div className="flex items-center mb-6">
        <Link
          to="/dashboard"
          className="flex items-center text-yellow-500 hover:text-yellow-400 transition duration-200 font-semibold text-base"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Panele Dön
        </Link>
      </div>
      <h2 className="text-2xl font-bold text-yellow-500 mb-6">İlerleme Takibi</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Fiziksel veri grafiği alanı */}
        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-800 shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-200">Gelişim Grafiği</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden p-1 flex">
              {['1m','3m','6m','1y','all'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-lg ${timeRange === range ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                  {range === '1m' ? '1 Ay' : range === '3m' ? '3 Ay' : range === '6m' ? '6 Ay' : range === '1y' ? '1 Yıl' : 'Tümü'}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-yellow-500">Veriler yükleniyor...</div>
            </div>
          ) : error ? (
            <div className="bg-red-900 bg-opacity-60 text-red-200 p-4 rounded-lg">{error}</div>
          ) : historyData.length === 0 ? (
            <div className="bg-gray-800 bg-opacity-60 text-gray-300 p-4 rounded-lg text-center">
              <p>Henüz yeterli ilerleme verisi bulunmuyor.</p>
              <p className="mt-2 text-sm text-gray-400">Düzenli olarak vücut ölçümlerinizi güncelleyin.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Kilo Grafiği */}
              <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-200 mb-4">Kilo Takibi</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }} labelStyle={{ color: '#e5e7eb' }} />
                      <Legend />
                      <Line type="monotone" dataKey="weight" name="Kilo (kg)" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Vücut Yağ Oranı Grafiği */}
              <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-200 mb-4">Vücut Yağ Oranı</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }} labelStyle={{ color: '#e5e7eb' }} />
                      <Legend />
                      <Line type="monotone" dataKey="bodyFat" name="Vücut Yağ Oranı (%)" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* BMI Grafiği */}
              <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-200 mb-4">Vücut Kitle İndeksi (BMI)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }} labelStyle={{ color: '#e5e7eb' }} />
                      <Legend />
                      <Line type="monotone" dataKey="bmi" name="BMI" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {/* Veri Tablosu */}
          <div className="mt-8 bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
            <h3 className="text-xl font-medium text-gray-200 mb-4">Kayıtlı Ölçümler</h3>
            {historyData.length === 0 ? (
              <p className="text-gray-400">Henüz kayıtlı ölçüm bulunmuyor.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kilo (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Yağ Oranı (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">BMI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 bg-opacity-30 divide-y divide-gray-700">
                    {historyData.slice().reverse().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-700 hover:bg-opacity-40 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.weight}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.bodyFat}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.bmi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* Hedefler alanı */}
        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-800 shadow-lg p-6 mb-6">
          <Goals />
        </div>
      </div>
    </div>
  );
};

export default ProgressHistory;