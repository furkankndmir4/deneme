import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
        process.env.NODE_ENV === "development"
          ? "http://localhost:5000/api"
          : "https://denemebackend.vercel.app/api";
          
const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("athlete");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/users/register`,
        {
          email,
          password,
          userType,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data) {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Kayıt oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">FitWeb</h1>
          <p className="text-gray-400">Fitness yolculuğuna başlayın</p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-200">
            Hesap Oluşturun
          </h2>

          {error && (
            <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <div>
              <label
                className="block text-gray-300 mb-2 text-sm"
                htmlFor="confirmPassword"
              >
                Şifre Tekrarı
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="glass-input w-full p-3"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Kullanıcı Tipi
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    id="athlete"
                    name="userType"
                    type="radio"
                    className="h-4 w-4 bg-dark-light border-gray-700"
                    value="athlete"
                    checked={userType === "athlete"}
                    onChange={(e) => setUserType(e.target.value)}
                  />
                  <label
                    htmlFor="athlete"
                    className="ml-2 text-sm text-gray-300"
                  >
                    Sporcu
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="coach"
                    name="userType"
                    type="radio"
                    className="h-4 w-4 bg-dark-light border-gray-700"
                    value="coach"
                    checked={userType === "coach"}
                    onChange={(e) => setUserType(e.target.value)}
                  />
                  <label htmlFor="coach" className="ml-2 text-sm text-gray-300">
                    Antrenör
                  </label>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3 mt-4"
              disabled={loading}
            >
              {loading ? "Kaydediliyor..." : "Kaydol"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="text-primary text-sm hover:underline">
              Zaten bir hesabınız var mı? Giriş yapın
            </Link>
          </div>
        </div>
      </div>

      {/* Dekoratif elementler */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-primary rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-primary rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
    </div>
  );
};

export default Register;
