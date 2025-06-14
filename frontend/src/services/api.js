import axios from 'axios';

// API URL'ini environment variable'dan al, yoksa production URL'ini kullan
const API_URL = import.meta.env.VITE_API_URL;

console.log('API URL:', API_URL); // Debug için

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    console.log('Request headers:', config.headers);
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    console.log('Response headers:', response.headers);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    console.error('Error headers:', error.response?.headers);
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userInfo');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    const tokenFromStorage = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    if (tokenFromStorage) {
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, { email, password });
    
    if (response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setAuthToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const logoutUser = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userInfo');
  setAuthToken(null);
};

export const getUserProfile = async () => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.get(`${API_URL}/users/profile`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.put(`${API_URL}/users/profile`, profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const updatePhysicalData = async (physicalData) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.put(`${API_URL}/users/physical-data`, physicalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const uploadProfilePhoto = async (formData) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.post(`${API_URL}/users/profile/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const checkTodaysPhysicalRecord = async () => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.get(`${API_URL}/athletes/physical-data/today-check`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};
// services/api.js - Yeni fonksiyonlar ekleyin
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/users/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const deleteAccount = async () => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.delete(`${API_URL}/users/account`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const getPhysicalDataHistory = async (startDate, endDate) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    let url = `${API_URL}/athletes/physical-data/history`;
    
    // Tarih filtresi ekle
    if (startDate || endDate) {
      url += '?';
      if (startDate) url += `startDate=${startDate.toISOString()}`;
      if (startDate && endDate) url += '&';
      if (endDate) url += `endDate=${endDate.toISOString()}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const getTrainingTemplates = async () => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.get(`${API_URL}/training-programs/templates`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const selectTrainingProgram = async (programId) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.post(`${API_URL}/athletes/training-program/select`, { programId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const getCoaches = async () => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.get(`${API_URL}/coaches`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const selectCoach = async (coachId, message) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.post(`${API_URL}/athletes/select-coach`, { coachId, message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const updateUserPrivacySettings = async (privacySettings) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await axios.put(`${API_URL}/users/privacy-settings`, { privacy: privacySettings });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Bir hata oluştu' };
  }
};

export const getMessages = async () => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await api.get('/messages');
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Mesajlar alınamadı' };
  }
};

export const sendMessage = async (receiver, content) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await api.post('/messages', { receiver, content });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Mesaj gönderilemedi' };
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    setAuthToken(localStorage.getItem('userToken') || sessionStorage.getItem('userToken'));
    const response = await api.put(`/messages/${messageId}/read`);
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Mesaj okundu olarak işaretlenemedi' };
  }
};

export { api };