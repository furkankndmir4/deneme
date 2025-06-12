import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (token && user && window.location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        email,
        password,
      });

      console.log("Login response:", response.data);

      if (response.data.token) {
        // Önce eski verileri temizle
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
        sessionStorage.removeItem("userToken");
        sessionStorage.removeItem("user");
        localStorage.removeItem("profileSetupDone");
        sessionStorage.removeItem("profileSetupDone");

        // Beni hatırla seçeneğine göre token'ı sakla
        if (rememberMe) {
          localStorage.setItem("userToken", response.data.token);
          localStorage.setItem("user", JSON.stringify({
            _id: response.data._id,
            email: response.data.email,
            userType: response.data.userType,
            hasProfile: response.data.hasProfile,
            hasPhysicalData: response.data.hasPhysicalData
          }));
        } else {
          sessionStorage.setItem("userToken", response.data.token);
          sessionStorage.setItem("user", JSON.stringify({
            _id: response.data._id,
            email: response.data.email,
            userType: response.data.userType,
            hasProfile: response.data.hasProfile,
            hasPhysicalData: response.data.hasPhysicalData
          }));
        }

        // Profil kurulumu kontrolü
        const profileSetupDone = response.data.hasProfile;
        if (rememberMe) {
          localStorage.setItem("profileSetupDone", profileSetupDone ? "true" : "false");
        } else {
          sessionStorage.setItem("profileSetupDone", profileSetupDone ? "true" : "false");
        }

        // Kullanıcı tipine göre yönlendirme
        navigate("/dashboard");
      } else {
        setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Giriş yapılırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">FitWeb</h1>
          <p className="text-gray-400">
            Fitness yolculuğunuzu birlikte takip edelim
          </p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-200">
            Giriş Yapın
          </h2>

          {error && (
            <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-gray-300 mb-2 text-sm"
                htmlFor="email"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                className="glass-input w-full p-3"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                className="block text-gray-300 mb-2 text-sm"
                htmlFor="password"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                className="glass-input w-full p-3"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 bg-dark-light border-gray-700 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                Beni Hatırla
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={loading}
            >
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>

            <div className="mt-2 text-center">
              <Link
                to="/forgot-password"
                className="text-yellow-400 text-sm hover:underline"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>
          </form>
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-primary text-sm hover:underline"
            >
              Hesabınız yok mu? Kaydolun
            </Link>
          </div>
        </div>
      </div>

      {/* Dekoratif elementler */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
    </div>
  );
};

export default Login;
