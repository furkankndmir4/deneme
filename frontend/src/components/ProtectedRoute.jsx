import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Kullanıcı oturum kontrolü
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  
  if (!token) {
    // Oturum yoksa giriş sayfasına yönlendirme yerine hata mesajı göster
    return (
      <div style={{
        color: "red",
        textAlign: "center",
        marginTop: "40px",
        fontSize: "1.2rem"
      }}>
        Oturum bulunamadı. Lütfen giriş yapın.
      </div>
    );
  }
  
  return children;
};

export default ProtectedRoute;