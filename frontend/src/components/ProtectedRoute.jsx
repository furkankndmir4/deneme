import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Kullanıcı oturum kontrolü
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  
  if (!token) {
    // Oturum yoksa giriş sayfasına yönlendir
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute;