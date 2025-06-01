// pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await axios.post(`http://localhost:5000/api/users/reset-password/${resetToken}`, { 
        password 
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Şifre sıfırlama işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 bg-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2">FitWeb</h1>
          <p className="text-gray-400">Yeni Şifre Oluşturun</p>
        </div>
        
        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-gray-800">
          {success ? (
            <div className="text-center">
              <div className="bg-green-900 bg-opacity-40 p-4 rounded-lg mb-6">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-lg font-medium text-green-500 mb-2">Şifre Başarıyla Sıfırlandı</h3>
                <p className="text-gray-300">
                  Yeni şifreniz oluşturuldu. Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz.
                </p>
              </div>
              <Link to="/" className="text-yellow-500 hover:text-yellow-400 transition duration-200">
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-200">Şifre Sıfırlama</h2>
              
              {error && (
                <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm" htmlFor="password">Yeni Şifre</label>
                  <input
                    id="password"
                    type="password"
                    className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 text-sm" htmlFor="confirmPassword">Yeni Şifre (Tekrar)</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-black font-medium py-3 rounded-lg hover:bg-yellow-400 transition duration-300"
                  disabled={loading}
                >
                  {loading ? 'İşleniyor...' : 'Şifreyi Sıfırla'}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <Link to="/" className="text-yellow-500 text-sm hover:underline">
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Dekoratif elementler */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-500 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
    </div>
  );
};

export default ResetPassword;