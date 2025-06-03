// pages/ProgramCreator.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";
import axios from "axios";
import Modal from "../components/Modal";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const ProgramCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { programId } = location.state || {};
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [programName, setProgramName] = useState("");
  const [programNameError, setProgramNameError] = useState("");
  const [athleteError, setAthleteError] = useState("");
  const [exerciseError, setExerciseError] = useState("");
  const [myAthletes, setMyAthletes] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState({
    chest: [],
    back: [],
    legs: [],
    shoulders: [],
    arms: [],
    core: [],
    cardio: [],
  });
  const [difficulty, setDifficulty] = useState("intermediate");
  const [description, setDescription] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [duration, setDuration] = useState({ value: 4, type: "week" });
  const [programDays, setProgramDays] = useState([]);
  const [durationError, setDurationError] = useState("");
  const [programDaysError, setProgramDaysError] = useState("");
  const [formError, setFormError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const exercisesByCategory = {
    chest: [
      "Bench Press",
      "Incline Bench",
      "Chest Fly",
      "Push-up",
      "Cable Crossover",
      "Dips",
    ],
    back: [
      "Pull-up",
      "Lat Pulldown",
      "Bent Over Row",
      "T-Bar Row",
      "Face Pull",
      "Deadlift",
    ],
    legs: [
      "Squat",
      "Leg Press",
      "Lunges",
      "Leg Extension",
      "Leg Curl",
      "Calf Raise",
    ],
    shoulders: [
      "Shoulder Press",
      "Lateral Raise",
      "Front Raise",
      "Upright Row",
      "Reverse Fly",
    ],
    arms: [
      "Bicep Curl",
      "Tricep Extension",
      "Hammer Curl",
      "Skull Crusher",
      "Preacher Curl",
    ],
    core: ["Plank", "Russian Twist", "Sit-up", "Leg Raise", "Mountain Climber"],
    cardio: [
      "Running",
      "Cycling",
      "Jumping Rope",
      "Rowing",
      "Stair Climber",
      "Elliptical",
    ],
  };

  // Egzersizler için öneri verisi
  const exerciseDefaults = {
    "Bench Press": [
      { label: "Optimum", sets: 4, reps: "8-10" },
      { label: "Önerilen", sets: 3, reps: "10-12" },
    ],
    "Incline Bench": [
      { label: "Optimum", sets: 4, reps: "8-10" },
      { label: "Önerilen", sets: 3, reps: "10-12" },
    ],
    "Chest Fly": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    "Push-up": [
      { label: "Optimum", sets: 4, reps: "15-20" },
      { label: "Önerilen", sets: 3, reps: "12-15" },
    ],
    "Cable Crossover": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    Dips: [
      { label: "Optimum", sets: 3, reps: "8-12" },
      { label: "Önerilen", sets: 2, reps: "10-15" },
    ],
    "Pull-up": [
      { label: "Optimum", sets: 4, reps: "6-10" },
      { label: "Önerilen", sets: 3, reps: "5-8" },
    ],
    "Lat Pulldown": [
      { label: "Optimum", sets: 4, reps: "8-12" },
      { label: "Önerilen", sets: 3, reps: "10-12" },
    ],
    "Bent Over Row": [
      { label: "Optimum", sets: 4, reps: "8-10" },
      { label: "Önerilen", sets: 3, reps: "10-12" },
    ],
    "T-Bar Row": [
      { label: "Optimum", sets: 4, reps: "8-10" },
      { label: "Önerilen", sets: 3, reps: "10-12" },
    ],
    "Face Pull": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    Deadlift: [
      { label: "Optimum", sets: 3, reps: "5-8" },
      { label: "Önerilen", sets: 2, reps: "8-10" },
    ],
    Squat: [
      { label: "Optimum", sets: 4, reps: "8-10" },
      { label: "Önerilen", sets: 3, reps: "12-15" },
    ],
    "Leg Press": [
      { label: "Optimum", sets: 4, reps: "10-12" },
      { label: "Önerilen", sets: 3, reps: "12-15" },
    ],
    Lunges: [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    "Leg Extension": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    "Leg Curl": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    "Calf Raise": [
      { label: "Optimum", sets: 4, reps: "15-20" },
      { label: "Önerilen", sets: 3, reps: "12-15" },
    ],
    "Shoulder Press": [
      { label: "Optimum", sets: 4, reps: "8-10" },
      { label: "Önerilen", sets: 3, reps: "10-12" },
    ],
    "Lateral Raise": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    "Front Raise": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    "Upright Row": [
      { label: "Optimum", sets: 3, reps: "10-12" },
      { label: "Önerilen", sets: 2, reps: "12-15" },
    ],
    "Reverse Fly": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "15-20" },
    ],
    "Bicep Curl": [
      { label: "Optimum", sets: 4, reps: "8-12" },
      { label: "Önerilen", sets: 3, reps: "10-15" },
    ],
    "Tricep Extension": [
      { label: "Optimum", sets: 3, reps: "10-12" },
      { label: "Önerilen", sets: 2, reps: "12-15" },
    ],
    "Hammer Curl": [
      { label: "Optimum", sets: 3, reps: "10-12" },
      { label: "Önerilen", sets: 2, reps: "12-15" },
    ],
    "Skull Crusher": [
      { label: "Optimum", sets: 3, reps: "10-12" },
      { label: "Önerilen", sets: 2, reps: "12-15" },
    ],
    "Preacher Curl": [
      { label: "Optimum", sets: 3, reps: "10-12" },
      { label: "Önerilen", sets: 2, reps: "12-15" },
    ],
    Plank: [
      { label: "Optimum", sets: 3, reps: "30-60 sn" },
      { label: "Önerilen", sets: 2, reps: "30 sn" },
    ],
    "Russian Twist": [
      { label: "Optimum", sets: 3, reps: "15-20" },
      { label: "Önerilen", sets: 2, reps: "12-15" },
    ],
    "Sit-up": [
      { label: "Optimum", sets: 3, reps: "15-20" },
      { label: "Önerilen", sets: 2, reps: "12-15" },
    ],
    "Leg Raise": [
      { label: "Optimum", sets: 3, reps: "12-15" },
      { label: "Önerilen", sets: 2, reps: "10-12" },
    ],
    "Mountain Climber": [
      { label: "Optimum", sets: 3, reps: "30-45 sn" },
      { label: "Önerilen", sets: 2, reps: "20-30 sn" },
    ],
    Running: [
      { label: "Optimum", sets: 1, reps: "20-30 dk" },
      { label: "Önerilen", sets: 1, reps: "15-20 dk" },
    ],
    Cycling: [
      { label: "Optimum", sets: 1, reps: "30-45 dk" },
      { label: "Önerilen", sets: 1, reps: "20-30 dk" },
    ],
    "Jumping Rope": [
      { label: "Optimum", sets: 3, reps: "2-3 dk" },
      { label: "Önerilen", sets: 2, reps: "1-2 dk" },
    ],
    Rowing: [
      { label: "Optimum", sets: 1, reps: "15-20 dk" },
      { label: "Önerilen", sets: 1, reps: "10-15 dk" },
    ],
    "Stair Climber": [
      { label: "Optimum", sets: 1, reps: "10-15 dk" },
      { label: "Önerilen", sets: 1, reps: "5-10 dk" },
    ],
    Elliptical: [
      { label: "Optimum", sets: 1, reps: "20-30 dk" },
      { label: "Önerilen", sets: 1, reps: "10-20 dk" },
    ],
  };

  // Egzersiz inputlarında öneri seçimi
  const [customMode, setCustomMode] = useState({}); // { "Bench Press": true, ... }

  // Haftanın günleri
  const weekDays = [
    { id: 1, label: "Pazartesi" },
    { id: 2, label: "Salı" },
    { id: 3, label: "Çarşamba" },
    { id: 4, label: "Perşembe" },
    { id: 5, label: "Cuma" },
    { id: 6, label: "Cumartesi" },
    { id: 7, label: "Pazar" },
  ];

  // Hedef tipini Türkçeye çeviren yardımcı fonksiyon
  const getGoalTypeText = (goalType) => {
    const goals = {
      fat_loss: "Yağ Yakma",
      muscle_gain: "Kas Kütlesi Kazanma",
      maintenance: "Mevcut Formu Koruma",
      endurance: "Dayanıklılık Artırma",
    };
    return goals[goalType] || "Belirlenmemiş";
  };

  // Süreyi Türkçe ve okunabilir şekilde formatlayan yardımcı fonksiyon
  function formatDuration({ value, type }) {
    let totalDays = 0;
    if (type === "day") totalDays = value;
    if (type === "week") totalDays = value * 7;
    if (type === "month") totalDays = value * 30; // Ortalama 30 gün

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser =
          JSON.parse(localStorage.getItem("user")) ||
          JSON.parse(sessionStorage.getItem("user"));
      if (!storedUser) {
        navigate("/");
          return;
        }
        setUserData(storedUser);

        if (location.state?.selectedAthlete) {
          setSelectedAthlete(location.state.selectedAthlete);
        }

        // Eğer programId varsa düzenleme moduna geç ve programı çek
        if (programId) {
          setIsEditMode(true);
          const token =
            localStorage.getItem("userToken") ||
            sessionStorage.getItem("userToken");
          const response = await axios.get(
            `${API_URL}/training-programs/${programId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const program = response.data;
          console.log("Edit modunda program:", program);
          console.log("Edit modunda programDays:", program.programDays);
          setProgramName(program.name || "");
          setDescription(program.description || "");
          setDifficulty(program.difficultyLevel || "intermediate");
          setSelectedAthlete(program.athlete || null);
          if (program.duration) setDuration(program.duration);
          if (program.programDays) setProgramDays(program.programDays.map(Number));
          // Egzersizleri state'e uygun şekilde ata (tüm günler ve tekrarları önle)
          if (program.workouts && program.workouts.length > 0) {
            const exState = {
              chest: [],
              back: [],
              legs: [],
              shoulders: [],
              arms: [],
              core: [],
              cardio: [],
            };
            // Tüm günlerin egzersizlerini tek tek ekle, tekrarları önle
            program.workouts.forEach((workout) => {
              workout.exercises.forEach((ex) => {
                let found = false;
                Object.entries(exercisesByCategory).forEach(([cat, arr]) => {
                  if (arr.includes(ex.name)) {
                    // Aynı isimde egzersiz zaten ekli mi kontrol et
                    if (!exState[cat].some((e) => e.name === ex.name)) {
                      exState[cat].push({
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps,
                        notes: ex.notes || "",
                      });
                    }
                    found = true;
                  }
                });
                if (!found) {
                  if (!exState.core.some((e) => e.name === ex.name)) {
                    exState.core.push({
                      name: ex.name,
                      sets: ex.sets,
                      reps: ex.reps,
                      notes: ex.notes || "",
                    });
                  }
                }
              });
            });
            setSelectedExercises(exState);
          }
        }

        // Antrenörün sporcularını çek
        if (storedUser.userType?.toLowerCase() === "coach") {
          const token =
            localStorage.getItem("userToken") ||
            sessionStorage.getItem("userToken");
          if (!token) {
            throw new Error("Token bulunamadı");
          }

          const response = await axios.get(
            `${API_URL}/coaches/athletes`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          if (response.data) {
            setMyAthletes(response.data);
          } else {
            throw new Error("Sporcu verileri alınamadı");
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        if (error.response) {
          console.error("Hata detayı:", error.response.data);
        }
        setLoading(false);
        setFormError(
          error.response?.data?.message ||
            error.message ||
            "Bilinmeyen bir hata oluştu."
        );
      }
    };
    fetchUserData();
  }, [navigate, location.state, programId]);

  useEffect(() => {
    console.log("programDays state güncellendi:", programDays);
  }, [programDays]);

  const toggleExercise = (category, exercise) => {
    setSelectedExercises((prev) => {
      // Egzersiz zaten varsa çıkar, yoksa ekle
      const exists = prev[category].some((ex) => ex.name === exercise);
      if (exists) {
        return {
          ...prev,
          [category]: prev[category].filter((ex) => ex.name !== exercise),
        };
      } else {
        // Eklerken tekrar eklenmesini önle
        return {
          ...prev,
          [category]: [
            ...prev[category].filter((ex) => ex.name !== exercise),
            { name: exercise, sets: 3, reps: "10-12", notes: "" },
          ],
        };
      }
    });
  };

  const handleExerciseDetailChange = (category, exerciseName, field, value) => {
    setSelectedExercises((prev) => ({
      ...prev,
      [category]: prev[category].map((ex) =>
        ex.name === exerciseName ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const toggleDay = (dayId) => {
    setProgramDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      } else {
        return [...prev, dayId].sort((a, b) => a - b);
      }
    });
  };

  const handleSaveProgram = async () => {
    let hasError = false;
    setFormError("");

    if (!programName) {
      setProgramNameError("Lütfen program adı girin.");
      hasError = true;
    } else {
      setProgramNameError("");
    }

    if (!description || description.trim() === "") {
      setFormError("Lütfen program açıklaması girin.");
      hasError = true;
    }
    
    if (!selectedAthlete) {
      setAthleteError("Lütfen bir sporcu seçin.");
      hasError = true;
    } else {
      setAthleteError("");
    }

    if (!duration.value || duration.value < 1) {
      setDurationError("Lütfen geçerli bir süre girin.");
      hasError = true;
    } else {
      setDurationError("");
    }

    if (programDays.length === 0) {
      setProgramDaysError("Lütfen en az bir gün seçin.");
      hasError = true;
    } else {
      setProgramDaysError("");
    }

    const selectedExerciseList = Object.values(selectedExercises).flat();
    if (selectedExerciseList.length === 0) {
      setExerciseError("Lütfen en az bir egzersiz seçin.");
      hasError = true;
    } else {
      setExerciseError("");
    }

    if (!hasError) {
      try {
        const token =
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken");
        if (!token) {
          throw new Error("Token bulunamadı");
        }

        const selectedExerciseList = Object.values(selectedExercises).flat();

        // Eğer edit modundaysa, eski workouts'u bul
        let oldWorkouts = [];
        if (isEditMode && programId) {
          const programRes = await axios.get(`${API_URL}/training-programs/${programId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          oldWorkouts = programRes.data.workouts || [];
        }
        // Her programDays için doğru day ile workout oluştur
        const workouts = programDays.map((day, idx) => {
          const oldWorkout = oldWorkouts.find(w => Number(w.day) === day);
          return {
            day,
            title: oldWorkout?.title || `Antrenman ${idx + 1}`,
            exercises: oldWorkout?.exercises || selectedExerciseList
          };
        });

        console.log("Kaydedilen programDays:", programDays);
        console.log("Kaydedilen workouts:", workouts);

        const programData = {
          name: programName,
          description,
          athleteId: selectedAthlete._id,
          exercises: selectedExerciseList,
          workouts,
          difficultyLevel: difficulty,
          duration,
          programDays,
        };

        if (isEditMode && programId) {
          // GÜNCELLEME
          const response = await axios.put(
            `${API_URL}/training-programs/${programId}`,
            programData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );
          if (response.data) {
            navigate("/dashboard");
          } else {
            throw new Error("Program güncellenemedi");
          }
        } else {
          // YENİ OLUŞTURMA
          const response = await axios.post(
            `${API_URL}/training-programs`,
            programData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );
          if (response.data) {
    navigate("/dashboard");
          } else {
            throw new Error("Program kaydedilemedi");
          }
        }
      } catch (error) {
        console.error("Program kaydetme/güncelleme hatası:", error);
        if (error.response) {
          console.error("Hata detayı:", error.response.data);
          setFormError(
            error.response.data.message || "Bilinmeyen bir hata oluştu."
          );
        } else {
          setFormError(error.message || "Bilinmeyen bir hata oluştu.");
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-yellow-500 text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10131a] text-white pb-20 px-2 md:px-0">
      {/* Hata mesajı */}
      {formError && (
        <div className="mb-4 p-3 bg-red-900 text-red-300 rounded-lg border border-red-700 text-center font-semibold">
          {formError}
        </div>
      )}
      {/* Panele Dön butonu */}
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
      <div className="container mx-auto max-w-6xl pt-8 pb-4">
        <h1 className="text-3xl font-bold text-yellow-500 mb-2">
          Hızlı Program Oluştur
        </h1>
        <p className="text-gray-400 text-base mb-4">
          Sporcularınız için kolayca antrenman programı oluşturun.
        </p>
        </div>
      <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sol: Program Bilgileri ve Egzersizler */}
        <div className="md:col-span-2 space-y-8">
          {/* Program Bilgileri */}
          <div className="bg-gray-900 bg-opacity-60 rounded-xl p-8 border border-gray-800 shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Program Bilgileri
            </h2>

            {/* Program Adı */}
              <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Program Adı
              </label>
                <input
                  type="text"
                  value={programName}
                onChange={(e) => {
                  setProgramName(e.target.value);
                  if (e.target.value) setProgramNameError("");
                }}
                className={`w-full bg-gray-900 border ${
                  programNameError ? "border-red-500" : "border-gray-700"
                } rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 text-lg`}
                  placeholder="Ör: Güç Geliştirme Programı"
                />
              {programNameError && (
                <p className="text-red-500 text-sm mt-1">{programNameError}</p>
              )}
            </div>

            {/* Program Açıklaması */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Program Açıklaması
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 text-lg"
                placeholder="Program hakkında kısa bir açıklama yazın..."
                rows="3"
              />
            </div>

            {/* Program Süresi */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Program Süresi
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    value={duration.value}
                    onChange={(e) => {
                      setDuration((prev) => ({
                        ...prev,
                        value: parseInt(e.target.value) || 1,
                      }));
                      if (e.target.value) setDurationError("");
                    }}
                    className={`w-full bg-gray-900 border ${
                      durationError ? "border-red-500" : "border-gray-700"
                    } rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 text-lg`}
                  />
                  {durationError && (
                    <p className="text-red-500 text-sm mt-1">{durationError}</p>
                  )}
                </div>
                <div className="flex-1">
                  <select
                    value={duration.type}
                    onChange={(e) =>
                      setDuration((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 text-lg"
                  >
                    <option value="day">Gün</option>
                    <option value="week">Hafta</option>
                    <option value="month">Ay</option>
                  </select>
                </div>
              </div>
              {/* Süre açıklaması */}
              <div className="text-sm text-gray-400 mt-1">
                {formatDuration(duration)}
              </div>
            </div>
            
            {/* Program Günleri */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Program Günleri
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {weekDays.map((day) => (
                  <label
                    key={day.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition
                      ${
                        programDays.includes(day.id)
                          ? "bg-yellow-500 bg-opacity-20 border border-yellow-500"
                          : "bg-gray-800 border border-gray-700 hover:border-yellow-500"
                      }`}
                  >
                          <input
                            type="checkbox"
                      checked={programDays.includes(day.id)}
                      onChange={() => {
                        toggleDay(day.id);
                        if (programDays.length > 0) setProgramDaysError("");
                      }}
                      className="accent-yellow-500 w-4 h-4"
                    />
                    <span className="text-sm">{day.label}</span>
                          </label>
                ))}
              </div>
              {programDaysError && (
                <p className="text-red-500 text-sm mt-1">{programDaysError}</p>
              )}
            </div>

            {/* Zorluk Seviyesi */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Zorluk Seviyesi
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-gray-900 border border-yellow-500 text-yellow-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg transition"
              >
                <option value="beginner" className="text-gray-900">
                  Başlangıç
                </option>
                <option value="intermediate" className="text-gray-900">
                  Orta
                </option>
                <option value="advanced" className="text-gray-900">
                  İleri
                </option>
              </select>
            </div>
          </div>
          
          {/* Egzersiz Seçimi */}
          <div className="bg-gray-900 bg-opacity-60 rounded-xl p-8 border border-gray-800 shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              Egzersizleri Seç
            </h2>
            {exerciseError && (
              <p className="text-red-500 text-sm mb-4">{exerciseError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(exercisesByCategory).map(
                ([category, exercises]) => (
                  <div
                    key={category}
                    className="border border-gray-700 rounded-xl p-5 bg-gray-900 bg-opacity-60 shadow-sm"
                  >
                    <h3 className="font-semibold mb-3 text-lg capitalize text-yellow-300">
                      {category === "chest"
                        ? "Göğüs"
                        : category === "back"
                        ? "Sırt"
                        : category === "legs"
                        ? "Bacak"
                        : category === "shoulders"
                        ? "Omuz"
                        : category === "arms"
                        ? "Kollar"
                        : category === "core"
                        ? "Core"
                        : category === "cardio"
                        ? "Kardiyo"
                        : category}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {exercises.map((exercise) => {
                        const selected = selectedExercises[category].find(
                          (ex) => ex.name === exercise
                        );
                        return (
                          <div
                            key={exercise}
                            className="flex flex-col gap-1 border-b border-gray-800 pb-2 mb-2"
                          >
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={() =>
                                  toggleExercise(category, exercise)
                                }
                                className="accent-yellow-500 w-5 h-5 rounded border-gray-600 focus:ring-yellow-500"
                              />
                              <span className="text-gray-200 group-hover:text-yellow-400 transition text-base">
                                {exercise}
                              </span>
                            </label>
                            {selected && (
                              <div className="flex gap-2 mt-1 flex-wrap items-center">
                                <select
                                  value={selected.optType || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "custom") {
                                      setCustomMode((prev) => ({
                                        ...prev,
                                        [exercise]: true,
                                      }));
                                    } else {
                                      setCustomMode((prev) => ({
                                        ...prev,
                                        [exercise]: false,
                                      }));
                                      const def = exerciseDefaults[
                                        exercise
                                      ]?.find((d) => d.label === val);
                                      if (def) {
                                        handleExerciseDetailChange(
                                          category,
                                          exercise,
                                          "sets",
                                          def.sets
                                        );
                                        handleExerciseDetailChange(
                                          category,
                                          exercise,
                                          "reps",
                                          def.reps
                                        );
                                      }
                                    }
                                    handleExerciseDetailChange(
                                      category,
                                      exercise,
                                      "optType",
                                      val
                                    );
                                  }}
                                  className="bg-gray-900 border border-yellow-500 text-yellow-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm transition w-full"
                                >
                                  <option value="">Öneri seç</option>
                                  {exerciseDefaults[exercise]?.map((opt) => (
                                    <option key={opt.label} value={opt.label}>
                                      {opt.label} ({opt.sets}x{opt.reps})
                                    </option>
                                  ))}
                                  <option value="custom">Manuel</option>
                                </select>
                                {(customMode[exercise] ||
                                  !selected.optType ||
                                  selected.optType === "custom") && (
                                  <>
                                    <input
                                      type="number"
                                      min={1}
                                      value={selected.sets}
                                      onChange={(e) =>
                                        handleExerciseDetailChange(
                                          category,
                                          exercise,
                                          "sets",
                                          e.target.value
                                        )
                                      }
                                      className="w-16 px-2 py-1 rounded-lg bg-gray-900 border border-yellow-500 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm transition placeholder-gray-500"
                                      placeholder="Set"
                                    />
                                    <input
                                      type="text"
                                      value={selected.reps}
                                      onChange={(e) =>
                                        handleExerciseDetailChange(
                                          category,
                                          exercise,
                                          "reps",
                                          e.target.value
                                        )
                                      }
                                      className="w-20 px-2 py-1 rounded-lg bg-gray-900 border border-yellow-500 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm transition placeholder-gray-500"
                                      placeholder="Tekrar"
                                    />
                                  </>
                                )}
                                <input
                                  type="text"
                                  value={selected.notes}
                                  onChange={(e) =>
                                    handleExerciseDetailChange(
                                      category,
                                      exercise,
                                      "notes",
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 px-2 py-1 rounded-lg bg-gray-900 border border-yellow-500 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm transition placeholder-gray-500"
                                  placeholder="Not (opsiyonel)"
                                />
                      </div>
                            )}
                      </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
              </div>
              
        {/* Sağ: Sporcu Seçimi ve Program Özeti */}
        <div className="space-y-8">
          <div className="bg-gray-900 bg-opacity-60 rounded-xl p-8 border border-gray-800 shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Sporcuyu Seç
            </h2>
            {athleteError && (
              <p className="text-red-500 text-sm mb-4">{athleteError}</p>
            )}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {myAthletes.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  Sorumlu olduğunuz sporcu bulunamadı.
              </div>
              )}
              {myAthletes.map((athlete) => (
                <div
                  key={athlete._id}
                  onClick={() => setSelectedAthlete(athlete)}
                  className={`p-4 rounded-xl cursor-pointer transition border flex items-center gap-4
                    ${
                      selectedAthlete?._id === athlete._id
                        ? "bg-yellow-700 bg-opacity-30 border-yellow-500 text-yellow-200"
                        : "bg-gray-700 bg-opacity-30 border-gray-600 hover:border-yellow-600 text-gray-200"
                    }
                  `}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg font-bold flex-shrink-0 border border-gray-500">
                    {athlete.profile?.fullName?.charAt(0) ||
                      athlete.email.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-base">
                      {athlete.profile?.fullName || "İsimsiz Sporcu"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {athlete.profile?.age ? `${athlete.profile.age} yaş` : ""}{" "}
                      {athlete.profile?.goalType
                        ? `• ${getGoalTypeText(athlete.profile.goalType)}`
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program Özeti ve Kaydet */}
          <div className="bg-gray-900 bg-opacity-60 rounded-xl p-8 border border-gray-800 shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Program Özeti
            </h2>
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">
                Seçilen Egzersiz Sayısı:
              </p>
              <p className="text-white font-medium text-lg">
                {Object.values(selectedExercises).flat().length} egzersiz
              </p>
        </div>
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-1">Sporcu:</p>
              <p className="text-white font-medium text-lg">
                {selectedAthlete
                  ? selectedAthlete.profile?.fullName || "İsimsiz Sporcu"
                  : "Seçilmedi"}
              </p>
            </div>
            <button
              onClick={handleSaveProgram}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg transition flex items-center justify-center shadow-lg"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              {isEditMode && programId ? "Programı Güncelle" : "Programı Ata"}
          </button>
            {/* Programı Sil butonu */}
            {isEditMode && programId && (
          <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-3 mt-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-lg transition flex items-center justify-center shadow-lg"
          >
              <svg
                  className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
              </svg>
                Programı Sil
              </button>
            )}
            {/* Silme onay modali */}
            {showDeleteModal && (
              <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
              >
                <div className="p-6 text-center">
                  <h2 className="text-xl font-bold mb-4 text-red-500">
                    Programı Sil
                  </h2>
                  <p className="mb-6 text-gray-200">
                    Bu programı silmek istediğinize emin misiniz?
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-6 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Vazgeç
                    </button>
                    <button
                      className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
                          await axios.delete(
                            `${API_URL}/training-programs/${programId}`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          setShowDeleteModal(false);
                          setIsEditMode(false);
                          navigate("/dashboard");
                        } catch (err) {
                          alert("Program silinirken hata oluştu.");
                        }
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </Modal>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCreator;
