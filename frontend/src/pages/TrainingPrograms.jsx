import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const TrainingPrograms = () => {
  const [activeProgram, setActiveProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveProgram = async () => {
      try {
        const token =
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken");
        if (!token) {
          setError("Oturum bulunamadı");
          setLoading(false);
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(
          `${API_URL}/athletes/active-program`,
          config
        );
        setActiveProgram(res.data);
      } catch (err) {
        setError("Aktif program bulunamadı");
        setActiveProgram(null);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveProgram();
  }, []);

  // Yardımcı: Zorluk etiketleri
  const difficultyLabels = {
    beginner: "Başlangıç",
    intermediate: "Orta",
    advanced: "İleri",
  };

  // Süreyi Türkçe ve okunabilir şekilde formatlayan yardımcı fonksiyon
  function formatDuration(duration) {
    if (!duration || typeof duration !== "object") return "";
    const { value, type } = duration;
    let totalDays = 0;
    if (type === "day") totalDays = value;
    if (type === "week") totalDays = value * 7;
    if (type === "month") totalDays = value * 30;
    const ay = Math.floor(totalDays / 30);
    const kalanGün = totalDays % 30;
    const hafta = Math.floor(kalanGün / 7);
    const gun = kalanGün % 7;
    let result = [];
    if (ay > 0) result.push(`${ay} ay`);
    if (hafta > 0) result.push(`${hafta} hafta`);
    if (gun > 0) result.push(`${gun} gün`);
    if (result.length === 0) return "0 gün";
    return result.join(" ");
  }

  // Kalan süreyi hesaplayan fonksiyon
  function formatRemainingDuration(duration, startDate) {
    if (!duration || !startDate) return "";
    const { value, type } = duration;
    let totalDays = 0;
    if (type === "day") totalDays = value;
    if (type === "week") totalDays = value * 7;
    if (type === "month") totalDays = value * 30;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let kalan = totalDays - diffDays;
    if (kalan < 0) kalan = 0;
    // Sadeleştirme: 7, 14, 21... ise hafta, 30, 60... ise ay
    if (kalan > 0 && kalan % 30 === 0) {
      return `${kalan / 30} ay`;
    }
    if (kalan > 0 && kalan % 7 === 0) {
      return `${kalan / 7} hafta`;
    }
    const ay = Math.floor(kalan / 30);
    const kalanGün = kalan % 30;
    const hafta = Math.floor(kalanGün / 7);
    const gun = kalanGün % 7;
    let result = [];
    if (ay > 0) result.push(`${ay} ay`);
    if (hafta > 0) result.push(`${hafta} hafta`);
    if (gun > 0) result.push(`${gun} gün`);
    if (result.length === 0) return "0 gün";
    return result.join(" ");
  }

  return (
    <div className="min-h-screen w-full bg-[#10131a] text-white p-0 m-0">
      <div className="pt-4 px-4">
        <Link
          to="/dashboard"
          className="mb-6 flex items-center text-yellow-500 hover:text-yellow-400 transition duration-200"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Panele Dön
        </Link>
      </div>
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6">
          Aktif Antrenman Programın
        </h2>
        {activeProgram ? (
          <div className="bg-gray-900 bg-opacity-60 border border-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-yellow-100 mb-2">
              {activeProgram.name}
            </h3>
            <div className="mb-2 text-gray-300">
              Zorluk:{" "}
              <span className="font-semibold text-yellow-300">
                {difficultyLabels[activeProgram.difficultyLevel] ||
                  activeProgram.difficultyLevel}
              </span>
            </div>
            {activeProgram.duration && (
              <div className="mb-2 text-sm text-gray-300">
                <span className="font-semibold text-yellow-400">
                  Program Süresi:{" "}
                </span>
                <span>{formatDuration(activeProgram.duration)}</span>
              </div>
            )}
            {activeProgram.programDays &&
              activeProgram.programDays.length > 0 && (
                <div className="mb-2 text-sm text-gray-300">
                  <span className="font-semibold text-yellow-400">
                    Uygulama Günleri:{" "}
                  </span>
                  <span>
                    {activeProgram.programDays
                      .sort((a, b) => a - b)
                      .map(
                        (day) =>
                          [
                            "Pazartesi",
                            "Salı",
                            "Çarşamba",
                            "Perşembe",
                            "Cuma",
                            "Cumartesi",
                            "Pazar",
                          ][day - 1]
                      )
                      .join(", ")}
                  </span>
                </div>
              )}
            <div className="mb-6 text-gray-400">
              {activeProgram.description}
            </div>
            <div>
              <span className="text-xl font-bold text-yellow-300">
                Antrenmanlar:
              </span>
              {activeProgram.workouts.map((workout, idx) => (
                <div
                  key={idx}
                  className="mt-6 bg-gray-900 bg-opacity-60 border border-gray-800 rounded-xl shadow p-6"
                >
                  <div className="text-lg font-semibold text-yellow-200 mb-3">
                    {
                      [
                        "Pazartesi",
                        "Salı",
                        "Çarşamba",
                        "Perşembe",
                        "Cuma",
                        "Cumartesi",
                        "Pazar",
                      ][workout.day - 1]
                    }
                  </div>
                  <ul className="space-y-3">
                    {workout.exercises.map((ex, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-center space-x-3 bg-gray-800 bg-opacity-60 rounded-lg px-4 py-2"
                      >
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                        <span className="text-yellow-200 font-semibold">
                          {ex.name}
                        </span>
                        <span className="text-gray-200">
                          | Set:{" "}
                          <span className="text-yellow-300 font-bold">
                            {ex.sets}
                          </span>
                        </span>
                        <span className="text-gray-200">
                          | Tekrar:{" "}
                          <span className="text-yellow-300 font-bold">
                            {ex.reps}
                          </span>
                        </span>
                        {ex.notes && (
                          <span className="italic text-gray-400 ml-3">
                            {ex.notes}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 bg-opacity-60 border border-gray-800 rounded-xl shadow-lg p-8 text-gray-400 text-lg">
            Aktif program bulunamadı
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingPrograms;
