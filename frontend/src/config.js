const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

export default {
  API_URL,
  getApiUrl: (path) => `${API_URL}${path}`,
  getPhotoUrl: (photoUrl) => {
    if (!photoUrl) return '';
    return photoUrl.startsWith('http') ? photoUrl : `${API_URL.replace('/api', '')}${photoUrl}`;
  }
}; 