// components/DeleteAccountModal.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SİL') {
      setError('Onaylamak için "SİL" yazmanız gerekiyor');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

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

      await axios.delete('http://localhost:5000/api/users/account', config);
      
      // Çıkış yap ve ana sayfaya yönlendir
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Account deletion error:', error);
      setError(error.response?.data?.message || 'Hesap silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-500">Hesabı Sil</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-200 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-lg font-medium text-red-500">Uyarı</h4>
            </div>
            <p className="text-gray-300 mt-2">
              Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinir.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm" htmlFor="confirmDelete">Onaylamak için "SİL" yazın</label>
              <input
                id="confirmDelete"
                type="text"
                className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-200"
                placeholder="SİL"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={loading || confirmText !== 'SİL'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : 'Hesabımı Kalıcı Olarak Sil'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;