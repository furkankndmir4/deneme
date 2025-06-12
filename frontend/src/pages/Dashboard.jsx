import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BodyInfoPopup from "../components/BodyInfoPopup";
import ProfileSetupPopup from "../components/ProfileSetupPopup";
import EventModal from "../components/EventModal";
import { api } from "../services/api";
import Modal from "../components/Modal";
import { useChat } from "../context/ChatContext";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const mealRecommendations = [
  {
    id: 1,
    name: "Protein Pancake",
    calories: 420,
    protein: 32,
    carbs: 40,
    fat: 10,
    ingredients: ["Yulaf", "Protein Tozu", "Yumurta", "Muz", "Tarçın"],
    time: "Sabah",
    type: "protein",
    prepTime: "15 dk",
  },
  {
    id: 2,
    name: "Avokadolu Tam Buğday Tost",
    calories: 380,
    protein: 18,
    carbs: 45,
    fat: 16,
    ingredients: [
      "Tam Buğday Ekmeği",
      "Avokado",
      "Haşlanmış Yumurta",
      "Pul Biber",
    ],
    time: "Sabah",
    type: "balanced",
    prepTime: "10 dk",
  },
  {
    id: 3,
    name: "Izgara Tavuklu Bowl",
    calories: 520,
    protein: 45,
    carbs: 50,
    fat: 15,
    ingredients: [
      "Tavuk Göğüs",
      "Esmer Pirinç",
      "Kinoa",
      "Ispanak",
      "Domates",
      "Salata Sosu",
    ],
    time: "Öğle",
    type: "protein",
    prepTime: "25 dk",
  },
  {
    id: 4,
    name: "Ton Balıklı Salata",
    calories: 450,
    protein: 35,
    carbs: 20,
    fat: 25,
    ingredients: [
      "Ton Balığı",
      "Marul",
      "Salatalık",
      "Zeytin",
      "Yumurta",
      "Zeytinyağı",
    ],
    time: "Öğle",
    type: "lowcarb",
    prepTime: "15 dk",
  },
  {
    id: 5,
    name: "Protein Bar",
    calories: 280,
    protein: 20,
    carbs: 25,
    fat: 8,
    ingredients: ["Yulaf", "Protein Tozu", "Fıstık Ezmesi", "Bal", "Kakao"],
    time: "Ara Öğün",
    type: "snack",
    prepTime: "5 dk",
  },
  {
    id: 6,
    name: "Yoğurtlu Smoothie",
    calories: 320,
    protein: 25,
    carbs: 35,
    fat: 6,
    ingredients: ["Süzme Yoğurt", "Muz", "Çilek", "Keten Tohumu"],
    time: "Ara Öğün",
    type: "protein",
    prepTime: "5 dk",
  },
  {
    id: 7,
    name: "Fırında Somon",
    calories: 480,
    protein: 42,
    carbs: 30,
    fat: 22,
    ingredients: [
      "Somon Fileto",
      "Tatlı Patates",
      "Kuşkonmaz",
      "Limon",
      "Dereotu",
    ],
    time: "Akşam",
    type: "recovery",
    prepTime: "30 dk",
  },
  {
    id: 8,
    name: "Kırmızı Et ve Sebze",
    calories: 550,
    protein: 50,
    carbs: 25,
    fat: 30,
    ingredients: ["Dana Bonfile", "Brokoli", "Havuç", "Mantar", "Zeytinyağı"],
    time: "Akşam",
    type: "protein",
    prepTime: "35 dk",
  },
  {
    id: 9,
    name: "Mercimek Köftesi",
    calories: 380,
    protein: 22,
    carbs: 45,
    fat: 12,
    ingredients: ["Kırmızı Mercimek", "Bulgur", "Soğan", "Maydanoz", "Salata"],
    time: "Öğle",
    type: "vegan",
    prepTime: "40 dk",
  },
  {
    id: 10,
    name: "Tofu Stir Fry",
    calories: 400,
    protein: 28,
    carbs: 35,
    fat: 18,
    ingredients: ["Tofu", "Brokoli", "Biber", "Mantar", "Soya Sosu"],
    time: "Akşam",
    type: "vegan",
    prepTime: "20 dk",
  },
  {
    id: 11,
    name: "Makarna ve Tavuk",
    calories: 580,
    protein: 45,
    carbs: 65,
    fat: 15,
    ingredients: ["Tam Buğday Makarna", "Tavuk", "Mantar", "Krema", "Sarımsak"],
    time: "Akşam",
    type: "recovery",
    prepTime: "25 dk",
  },
  {
    id: 12,
    name: "Patatesli Omlet",
    calories: 450,
    protein: 30,
    carbs: 40,
    fat: 18,
    ingredients: ["Yumurta", "Haşlanmış Patates", "Peynir", "Yeşillik"],
    time: "Sabah",
    type: "recovery",
    prepTime: "20 dk",
  },
  {
    id: 13,
    name: "Wraplı Tavuk",
    calories: 480,
    protein: 38,
    carbs: 45,
    fat: 16,
    ingredients: [
      "Tam Buğday Tortilla",
      "Tavuk",
      "Marul",
      "Domates",
      "Yoğurt Sos",
    ],
    time: "Öğle",
    type: "quick",
    prepTime: "15 dk",
  },
  {
    id: 14,
    name: "Kinoa Salatası",
    calories: 420,
    protein: 22,
    carbs: 50,
    fat: 15,
    ingredients: ["Kinoa", "Nar", "Ispanak", "Badem", "Zeytinyağı"],
    time: "Öğle",
    type: "quick",
    prepTime: "20 dk",
  },
  {
    id: 15,
    name: "Kuruyemişli Karışım",
    calories: 600,
    protein: 25,
    carbs: 30,
    fat: 45,
    ingredients: ["Badem", "Ceviz", "Fındık", "Kuru Üzüm", "Kuru Kayısı"],
    time: "Ara Öğün",
    type: "highcal",
    prepTime: "5 dk",
  },
  {
    id: 16,
    name: "Fıstık Ezmeli Sandviç",
    calories: 550,
    protein: 20,
    carbs: 45,
    fat: 35,
    ingredients: ["Tam Buğday Ekmeği", "Fıstık Ezmesi", "Muz", "Bal"],
    time: "Ara Öğün",
    type: "highcal",
    prepTime: "5 dk",
  },
  {
    id: 17,
    name: "Sebze Çorbası",
    calories: 280,
    protein: 15,
    carbs: 40,
    fat: 6,
    ingredients: ["Kabak", "Havuç", "Soğan", "Sarımsak", "Tavuk Suyu"],
    time: "Akşam",
    type: "lowcal",
    prepTime: "30 dk",
  },
  {
    id: 18,
    name: "Izgara Balık",
    calories: 350,
    protein: 40,
    carbs: 15,
    fat: 12,
    ingredients: ["Levrek", "Limon", "Roka", "Kırmızı Soğan"],
    time: "Akşam",
    type: "lowcal",
    prepTime: "20 dk",
  },
  {
    id: 19,
    name: "Antrenman Sonrası Shake",
    calories: 400,
    protein: 35,
    carbs: 45,
    fat: 8,
    ingredients: ["Whey Protein", "Muz", "Yulaf", "Badem Sütü"],
    time: "Antrenman Sonrası",
    type: "postworkout",
    prepTime: "5 dk",
  },
  {
    id: 20,
    name: "Gece Proteini",
    calories: 320,
    protein: 40,
    carbs: 15,
    fat: 12,
    ingredients: ["Süzme Peynir", "Keten Tohumu", "Ceviz", "Tarçın"],
    time: "Gece",
    type: "casien",
    prepTime: "5 dk",
  },
];

axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'https://denemebackend.vercel.app';

const getAuthToken = () => {
  try {
    const localToken = localStorage.getItem("userToken");
    const sessionToken = sessionStorage.getItem("userToken");

    console.log("Token Debug:", {
      localToken,
      sessionToken,
      tokenValue: localToken || sessionToken,
    });

    const token = localToken || sessionToken;
    if (!token) {
      console.error("No token found in storage");
      return null;
    }

    return `Bearer ${token}`;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

const saveAuthToken = (token) => {
  try {
    localStorage.setItem("userToken", token);
    sessionStorage.setItem("userToken", token);
  } catch (error) {
    console.error("Error saving auth token:", error);
  }
};

const clearAuthData = () => {
  try {
    localStorage.removeItem("userToken");
    sessionStorage.removeItem("userToken");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [needsPhysicalData, setNeedsPhysicalData] = useState(true);
  const [isProfileSetupPopupOpen, setIsProfileSetupPopupOpen] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(true);
  const [isBodyInfoPopupOpen, setIsBodyInfoPopupOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myAthletes, setMyAthletes] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [visibleMeals, setVisibleMeals] = useState(6);
  const [activeFilter, setActiveFilter] = useState("all");
  const [pendingAthleteRequests, setPendingAthleteRequests] = useState([]);
  const [selectedAthleteDetail, setSelectedAthleteDetail] = useState(null);
  const [openMessageAthlete, setOpenMessageAthlete] = useState(null);
  const navigate = useNavigate();
  const { setIsOpen, setActiveChat } = useChat();
  const [lastLeaderboardUpdate, setLastLeaderboardUpdate] = useState(
    Date.now()
  );
  const [streak, setStreak] = useState(0);
  const [allAthletes, setAllAthletes] = useState([]);

  const handleLogout = async () => {
    try {
      // Tüm auth verilerini temizle
      localStorage.removeItem("user");
      localStorage.removeItem("userToken");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userToken");
      localStorage.removeItem("profileSetupDone");
      sessionStorage.removeItem("profileSetupDone");
      
      // State'i sıfırla
      setUserData(null);
      setLoading(true);
      setError(null);
      
      // Ana sayfaya yönlendir
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (!token) {
        console.log("No token found, redirecting to login");
        clearAuthData(); // Tüm auth verilerini temizle
        navigate("/");
        return;
      }

      console.log("Fetching user data with token:", token);
      const response = await axios.get(
        `${API_URL}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API response:", response.data);

      if (response.data) {
        let updatedUserData = response.data;

        if (response.data.physicalDataHistory && response.data.physicalDataHistory.length > 0) {
          const latestHistoryEntry = response.data.physicalDataHistory[0];
          updatedUserData.physicalData = {
            ...updatedUserData.physicalData,
            bodyFatChange: latestHistoryEntry.bodyFatChange,
            weightChange: latestHistoryEntry.weightChange,
            heightChange: latestHistoryEntry.heightChange,
            bmiChange: latestHistoryEntry.bmiChange
          };
        }

        // Kullanıcı verilerini hem state'e hem de storage'a kaydet
        setUserData(updatedUserData);
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        sessionStorage.setItem("user", JSON.stringify(updatedUserData));

        const hasProfileData = response.data.profile &&
          response.data.profile.height &&
          response.data.profile.weight &&
          response.data.profile.age &&
          response.data.profile.gender &&
          response.data.profile.fullName;

        setNeedsProfileSetup(!hasProfileData);
        setIsProfileSetupPopupOpen(!hasProfileData);

        // Fiziksel veri setup durumunu kontrol et ve state'i güncelle
        const hasPhysicalData =
          response.data.physicalData &&
          response.data.physicalData.neckCircumference !== undefined &&
          response.data.physicalData.waistCircumference !== undefined &&
          response.data.physicalData.hipCircumference !== undefined &&
          response.data.physicalData.bodyFat !== undefined &&
          response.data.physicalData.chestCircumference !== undefined &&
          response.data.physicalData.bicepCircumference !== undefined &&
          response.data.physicalData.thighCircumference !== undefined &&
          response.data.physicalData.calfCircumference !== undefined &&
          response.data.physicalData.shoulderWidth !== undefined;

        console.log("Profile/Physical data check:", { hasProfileData, hasPhysicalData });

        setNeedsPhysicalData(!hasPhysicalData);
        // Fiziksel veri popupunu sadece profil setup tamamlandıysa veya fiziksel veri eksikse aç
        if (!hasProfileData) {
          // Profil setup popup zaten açık olacak
          setIsBodyInfoPopupOpen(false);
        } else if (!hasPhysicalData) {
          // Profil setup tamamlandı ama fiziksel veri eksik
          setIsBodyInfoPopupOpen(true);
        } else {
          // Hem profil hem fiziksel veri tamam
          setIsBodyInfoPopupOpen(false);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 401) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        clearAuthData(); // Tüm auth verilerini temizle
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError("Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
        try {
        await fetchUserData();
        } catch (error) {
        console.error("Error initializing data:", error);
        setError(
          "Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin."
        );
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const checkAuth = () => {
    const token = getAuthToken();
    if (!token) {
      console.error("No token found on page load");
      setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
      clearAuthData();
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
    };

    checkAuth();
  }, [navigate]);

  const handleProfileSave = async (data) => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      if (!token) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        return;
      }

      const profileData = {
        fullName: data.fullName.trim(),
        age: parseInt(data.age),
        gender: data.gender,
        height: parseFloat(data.height),
        weight: parseFloat(data.weight),
        goalType: data.goalType || "maintenance",
        activityLevel: data.activityLevel || "moderate",
      };

      const response = await axios.put(
        `${API_URL}/users/profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setUserData(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        sessionStorage.setItem("user", JSON.stringify(response.data));
        localStorage.setItem("profileSetupDone", "true");
        setNeedsProfileSetup(false);
        setIsProfileSetupPopupOpen(false);
        
        // Profil verilerini güncelledikten sonra kullanıcı verilerini yeniden çek
        await fetchUserData();
      }
    } catch (error) {
      console.error("Profile save error:", error);
      if (error.response?.status === 401) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        clearAuthData();
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Profil kaydedilirken bir hata oluştu";
        setError(errorMessage);
      }
    }
  };

  useEffect(() => {
    const fetchMyAthletes = async () => {
      if (userData?.userType?.toLowerCase() === "coach") {
        try {
          const response = await api.get("/coaches/athletes");
          setMyAthletes(response.data);
        } catch (error) {
          console.error("Sporcular alınamadı:", error);
        }
      }
    };
    fetchMyAthletes();
  }, [userData]);

  const fetchEvents = async () => {
    try {
      setCalendarLoading(true);
      setCalendarError(null);

      const response = await api.get(
        `/events?month=${
          currentMonth.getMonth() + 1
        }&year=${currentMonth.getFullYear()}`
      );

      console.log("Fetched events:", response.data);

      const todayStr = new Date().toISOString().split("T")[0];
      const futureOrTodayEvents = [];
      for (const event of response.data) {
        const eventDateStr = new Date(event.date).toISOString().split("T")[0];
        if (eventDateStr < todayStr) {
          try {
            await api.delete(`/events/${event._id}`);
          } catch (err) {
            console.error("Otomatik silinemeyen etkinlik:", event, err);
          }
        } else {
          futureOrTodayEvents.push({
            ...event,
            date: eventDateStr,
          });
        }
      }
      setEvents(futureOrTodayEvents);
      setCalendarLoading(false);
    } catch (error) {
      console.error("Events fetch error:", error);
      setCalendarError("Etkinlikler yüklenemedi");
      setCalendarLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newDate = new Date(year, month, day, 12, 0, 0);
    setSelectedDate(newDate);

    const dateStr = newDate.toISOString().split("T")[0];
    const dayEvents = events.filter((event) => event.date === dateStr);

    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
    } else if (dayEvents.length > 1) {
      setSelectedEvent({ date: newDate, multiple: dayEvents });
    } else {
      setSelectedEvent({ date: newDate });
    }
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (formData) => {
    try {
      const formattedData = {
        ...formData,
        date: new Date(formData.date).toISOString().split("T")[0],
      };

      console.log("Sending event data:", formattedData);

      if (selectedEvent && selectedEvent._id) {
        await api.put(`/events/${selectedEvent._id}`, formattedData);
      } else {
        const { _id, ...newEventData } = formattedData;
        await api.post("/events", newEventData);
      }

      await fetchEvents();
      setSelectedEvent(null);
      setIsEventModalOpen(false);
    } catch (error) {
      console.error("Event save error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError(error.response?.data?.message || "Etkinlik kaydedilemedi");
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "cardio":
        return "bg-blue-500";
      case "workout":
        return "bg-green-500";
      case "nutrition":
        return "bg-yellow-500";
      case "meeting":
        return "bg-purple-500";
      case "other":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredMeals = mealRecommendations.filter((meal) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "protein") return meal.type.includes("protein");
    if (activeFilter === "vegan") return meal.type === "vegan";
    if (activeFilter === "quick") return meal.type === "quick";
    return true;
  });

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `${API_URL}/friends/requests`,
          config
        );
        setPendingRequests(response.data);
        console.log("Dashboard - Gelen istekler:", response.data);
      } catch (error) {
        console.error("Dashboard - Arkadaşlık istekleri alınamadı:", error);
        setPendingRequests([]);
      }
    };
    fetchPendingRequests();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      await axios.post(
        `${API_URL}/friends/accept/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (error) {
      alert("İstek kabul edilirken hata oluştu.");
      console.error(error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      await axios.delete(
        `${API_URL}/friends/reject/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (error) {
      console.error(error);
      setError("İstek reddedilirken hata oluştu.");
    }
  };

  useEffect(() => {
    const fetchPendingAthleteRequests = async () => {
      console.log("fetchPendingAthleteRequests called.");
      console.log("Current userData in fetchPendingAthleteRequests:", userData);
      if (userData?.userType?.toLowerCase() === "coach") {
        console.log("User is coach, fetching pending requests...");
        try {
          const token =
            localStorage.getItem("userToken") ||
            sessionStorage.getItem("userToken");
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const response = await axios.get(
            `${API_URL}/coaches/athlete-requests`,
            config
          );
          setPendingAthleteRequests(response.data);
        } catch (error) {
          setPendingAthleteRequests([]);
          console.error("Error fetching pending athlete requests:", error);
        }
      } else {
        console.log("User is not coach or userData is not available, skipping fetching pending requests.");
      }
    };
    fetchPendingAthleteRequests();
  }, [userData]);

  const handleAcceptAthleteRequest = async (requestId, athleteId) => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      await axios.post(
        `${API_URL}/coaches/athlete-requests/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllAthletes((prev) =>
        prev.map((a) =>
          a._id === athleteId ? { ...a, status: "accepted" } : a
        )
      );
    } catch (error) {
      setError("İstek kabul edilirken hata oluştu.");
    }
  };

  const handleRejectAthleteRequest = async (requestId, athleteId) => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");

      setAllAthletes((prev) =>
        prev.filter((athlete) => athlete._id !== athleteId)
      );

      try {
        await axios.post(
          `${API_URL}/coaches/athlete-relationships/${requestId}/reject`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Backend'de reddetme hatası:", error);
      }

      setError(null);
    } catch (error) {
      console.error("İstek reddedilirken hata oluştu:", error);
      setError("İstek reddedilirken hata oluştu.");
    }
  };

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const token =
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken");
        if (!token) return;
        const res = await axios.get(
          `${API_URL}/athletes/streak`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStreak(res.data.streak);
      } catch (err) {
        setStreak(0);
      }
    };
    fetchStreak();
  }, []);

  useEffect(() => {
    if (userData?.userType?.toLowerCase() === "coach") {
      const fetchAllAthletes = async () => {
        try {
          const token =
            localStorage.getItem("userToken") ||
            sessionStorage.getItem("userToken");
          if (!token) return;
          const config = { headers: { Authorization: `Bearer ${token}` } };
          
          // Bekleyen istekleri al
          const pendingResponse = await axios.get(
            `${API_URL}/coaches/athlete-requests`,
            config
          );
          
          // Tüm sporcuları al
          const athletesResponse = await axios.get(
            `${API_URL}/coaches/athletes`,
            config
          );
          
          // Bekleyen istekleri ve mevcut sporcuları birleştir
          const pendingAthletes = pendingResponse.data.map(request => ({
            ...request.athlete,
            status: 'pending',
            requestId: request._id
          }));
          
          const allAthletesData = [...pendingAthletes, ...athletesResponse.data];
          setAllAthletes(allAthletesData);
        } catch (error) {
          setAllAthletes([]);
          console.error("Sporcular alınamadı:", error);
        }
      };
      fetchAllAthletes();
    }
  }, [userData]);

  const getSuitableTypes = (goalType) => {
    switch (goalType) {
      case "muscle_gain":
        return ["protein", "recovery", "highcal", "postworkout"];
      case "fat_loss":
        return ["lowcal", "lowcarb", "vegan", "quick"];
      case "maintenance":
        return ["balanced", "quick", "vegan", "protein"];
      case "endurance":
        return ["recovery", "highcal", "quick", "protein"];
      default:
        return [];
    }
  };
  const userGoalType = userData?.profile?.goalType || "maintenance";
  const suitableTypes = getSuitableTypes(userGoalType);
  const [favoriteMeals, setFavoriteMeals] = useState(() => {
    const stored = localStorage.getItem("favoriteMeals");
    return stored ? JSON.parse(stored) : [];
  });
  const toggleFavorite = (mealId) => {
    setFavoriteMeals((prev) => {
      let updated;
      if (prev.includes(mealId)) {
        updated = prev.filter((id) => id !== mealId);
      } else {
        updated = [...prev, mealId];
      }
      localStorage.setItem("favoriteMeals", JSON.stringify(updated));
      return updated;
    });
  };
  const [showAllIngredients, setShowAllIngredients] = useState({});
  const handleShowAllIngredients = (mealId, value) => {
    setShowAllIngredients((prev) => ({ ...prev, [mealId]: value }));
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.delete(`/events/${eventId}`);
      await fetchEvents();
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      setError("Etkinlik silinemedi");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const token =
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken");
        if (!token) {
          console.log("Liderlik tablosu için token bulunamadı.");
          setLeaderboardData([]);
          setUserRank(null);
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `${API_URL}/leaderboard`,
          config
        );

        if (response.data && Array.isArray(response.data.leaderboard)) {
          setLeaderboardData(response.data.leaderboard);
          setUserRank(response.data.currentUserRank);
        } else {
          console.error(
            "Liderlik tablosu API'sinden geçersiz formatta veri geldi:",
            response.data
          );
          setLeaderboardData([]);
          setUserRank(null);
        }
      } catch (err) {
        console.error("Liderlik tablosu verisi alınırken hata:", err);
        setLeaderboardData([]);
        setUserRank(null);
      }
    };

    fetchLeaderboardData();
  }, [userData?.points]);

  const handlePhysicalDataSave = async (data) => {
    try {
      const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (!token) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        return;
      }

      // Fiziksel verileri hazırla
      const physicalData = {
        bodyFat: parseFloat(data.bodyFat) || 0,
        neckCircumference: parseFloat(data.neckCircumference) || 0,
        waistCircumference: parseFloat(data.waistCircumference) || 0,
        hipCircumference: parseFloat(data.hipCircumference) || 0,
        chestCircumference: parseFloat(data.chestCircumference) || 0,
        bicepCircumference: parseFloat(data.bicepCircumference) || 0,
        thighCircumference: parseFloat(data.thighCircumference) || 0,
        calfCircumference: parseFloat(data.calfCircumference) || 0,
        shoulderWidth: parseFloat(data.shoulderWidth) || 0,
      };

      console.log("Gönderilen fiziksel veriler:", physicalData);

      const response = await axios.put(
        `${API_URL}/users/physical-data`,
        physicalData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        // Kullanıcı verilerini güncelle
        const currentUserData = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUserData = {
          ...currentUserData,
          physicalData: {
            ...currentUserData.physicalData,
            ...physicalData,
          },
        };

        localStorage.setItem("user", JSON.stringify(updatedUserData));
        sessionStorage.setItem("user", JSON.stringify(updatedUserData));

        // Kullanıcı verilerini güncelle
        setUserData(updatedUserData);
        
        // Popup'ı kapat
        setIsBodyInfoPopupOpen(false);
        setNeedsPhysicalData(false);

        // Kullanıcı verilerini yeniden çek
        await fetchUserData();
      }
    } catch (error) {
      console.error("Fiziksel veri kaydetme hatası:", error);
      if (error.response?.status === 401) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
      } else {
        setError(
          error.response?.data?.message ||
            "Fiziksel veriler kaydedilirken bir hata oluştu"
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDayEvents = events.filter(
    (event) =>
      new Date(event.date).toDateString() === selectedDate.toDateString()
  );

  const formatLeaderboardUpdate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return `Bugün, ${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${date.getDate()}.${
        date.getMonth() + 1
      }.${date.getFullYear()}, ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
  };

  const getGoalTypeText = (goalType) => {
    const goals = {
      fat_loss: "Yağ Yakma",
      muscle_gain: "Kas Kütlesi Kazanma",
      maintenance: "Mevcut Formu Koruma",
      endurance: "Dayanıklılık Artırma",
    };
    return goals[goalType] || "Belirlenmemiş";
  };

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

  function formatDurationWithSuffix(duration) {
    if (!duration || typeof duration !== "object") return "";
    const { value, type } = duration;
    if (type === "day") return `${value} günlük program`;
    if (type === "week") return `${value} haftalık program`;
    if (type === "month") return `${value} aylık program`;
    return "";
  }

  return (
    <div className="pt-4 pb-20 md:pb-6 px-4">
      {/* Header */}
      <header className="bg-gray-900 bg-opacity-70 backdrop-blur-md text-white p-4 shadow-lg border-b border-gray-800 mb-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-500">FitWeb</h1>
          <nav className="space-x-4 hidden md:block">
            <Link
              to="/profile"
              className="px-3 py-1 rounded hover:bg-gray-800 transition duration-300"
            >
              Profil
            </Link>
            <button
              className="px-3 py-1 bg-yellow-500 text-black font-medium rounded hover:bg-yellow-400 transition duration-300"
              onClick={handleLogout}
            >
              Çıkış
            </button>
          </nav>
        </div>
      </header>

      {needsPhysicalData && !isBodyInfoPopupOpen && (
        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-4 mb-6 border-l-4 border-yellow-500 rounded-r-lg shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-500">
                Vücut ölçülerinizi tamamlayın
              </h3>
              <div className="mt-1 text-sm text-gray-300">
                <p>
                  İlerlemenizi doğru şekilde takip etmek için fiziksel
                  ölçülerinizi girmemiz gerekiyor.
                </p>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  className="bg-yellow-500 text-black font-medium py-1 px-3 text-sm rounded hover:bg-yellow-400 transition duration-300"
                  onClick={() => setIsBodyInfoPopupOpen(true)}
                >
                  Şimdi Tamamla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isProfileSetupPopupOpen && (
        <ProfileSetupPopup
          onClose={() => setIsProfileSetupPopupOpen(false)}
          onSave={handleProfileSave}
          userType={userData?.userType || "athlete"}
        />
      )}

      {isBodyInfoPopupOpen && (
        <BodyInfoPopup
          onClose={() => setIsBodyInfoPopupOpen(false)}
          onSave={handlePhysicalDataSave}
          initialData={{
            ...userData?.physicalData,
            height: userData?.physicalData?.height || userData?.profile?.height,
            weight: userData?.physicalData?.weight || userData?.profile?.weight,
          }}
        />
      )}

      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-lg p-6 mb-6 border border-gray-800">
        <h2 className="text-2xl font-bold mb-2 text-yellow-500">
          Hoş Geldiniz, {userData?.profile?.fullName || "Sporcu"}
        </h2>
        <p className="text-gray-400">
          Bugünkü önerin:{" "}
          <span className="text-yellow-400">Alt vücut güçlendirme</span>
        </p>
        {streak > 0 && (
          <div className="mt-2 flex items-center text-yellow-500 font-semibold text-lg">
            <span className="mr-2">🔥</span>
            {streak} gün üst üste antrenman!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* İlerleme Durumu kartı */}
        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-100">
              İlerleme Durumu
            </h3>
            <div className="p-2 bg-yellow-500 rounded-full">
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">Kilo</span>
                <span className="text-gray-300 text-sm">
                  {userData?.physicalData?.weight || "--"} kg
                  {userData?.physicalData?.weightChange !== undefined &&
                    userData?.physicalData?.weightChange !== null && (
                      <span
                        className={`ml-1 ${userData.physicalData.weightChange > 0
                            ? "text-red-400"
                            : userData.physicalData.weightChange < 0
                              ? "text-green-400"
                              : "text-gray-400"
                        }`}
                      >
                        ({userData.physicalData.weightChange > 0 ? "+" : ""}
                        {userData.physicalData.weightChange?.toFixed(1)}kg)
                      </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: userData?.physicalData?.weight
                      ? `${Math.min(100, userData.physicalData.weight)}%`
                      : "0%",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">Yağ Oranı</span>
                <span className="text-gray-300 text-sm">
                  {userData?.physicalData?.bodyFat || "--"}%
                  {userData?.physicalData?.bodyFatChange !== undefined &&
                    userData?.physicalData?.bodyFatChange !== null && (
                      <span
                        className={`ml-1 ${userData.physicalData.bodyFatChange > 0
                            ? "text-red-400"
                            : userData.physicalData.bodyFatChange < 0
                              ? "text-green-400"
                              : "text-gray-400"
                        }`}
                      >
                        ({userData.physicalData.bodyFatChange > 0 ? "+" : ""}
                        {typeof userData.physicalData.bodyFatChange === "number"
                          ? userData.physicalData.bodyFatChange.toFixed(1)
                          : "--"}
                        %)
                      </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: userData?.physicalData?.bodyFat
                      ? `${Math.min(100, userData.physicalData.bodyFat)}%`
                      : "0%",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">Boy</span>
                <span className="text-gray-300 text-sm">
                  {userData?.physicalData?.height || "--"} cm
                  {userData?.physicalData?.heightChange !== undefined &&
                    userData?.physicalData?.heightChange !== null && (
                      <span
                        className={`ml-1 ${userData.physicalData.heightChange > 0
                            ? "text-green-400"
                            : userData.physicalData.heightChange < 0
                            ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        ({userData.physicalData.heightChange > 0 ? "+" : ""}
                        {userData.physicalData.heightChange?.toFixed(1)}cm)
                      </span>
                    )}
                </span>
              </div>
            </div>

            {userData?.physicalData?.bmi && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400 text-sm">BMI</span>
                  <span className="text-gray-300 text-sm">
                    {userData.physicalData.bmi.toFixed(1)}
                    {userData?.physicalData?.bmiChange !== undefined &&
                      userData?.physicalData?.bmiChange !== null && (
                        <span
                          className={`ml-1 ${userData.physicalData.bmiChange > 0
                              ? "text-red-400"
                              : userData.physicalData.bmiChange < 0
                                ? "text-green-400"
                                : "text-gray-400"
                          }`}
                        >
                          ({userData.physicalData.bmiChange > 0 ? "+" : ""}
                          {userData.physicalData.bmiChange?.toFixed(1)})
                        </span>
                      )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Link
              to="/progress-history"
              className="text-yellow-500 text-sm font-semibold hover:text-yellow-400 transition duration-200"
            >
              Tüm İstatistikleri Gör →
            </Link>
          </div>
        </div>

        {/* Antrenman Programı kartı - Sadece sporcular için */}
        {userData?.userType === "athlete" && (
          <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-100">
                Antrenman Programı
              </h3>
              <div className="p-2 bg-yellow-500 rounded-full">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4 mb-4">
              <p className="text-gray-300 text-sm mb-1">Aktif Program:</p>
              <p className="text-yellow-400 font-medium mb-3">
                {userData?.trainingProgram?.name || "Tanımlı program yok"}
              </p>
              {/* Program detayları: günler */}
              {userData?.trainingProgram?.programDays &&
                userData.trainingProgram.programDays.length > 0 && (
                  <div className="mb-1 text-sm text-gray-300">
                    <span className="font-semibold text-yellow-400">
                      Günler:{" "}
                    </span>
                    <span>
                      {userData.trainingProgram.programDays
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
              {userData?.trainingProgram?.workouts &&
                (() => {
                  // Haftanın günü: 1 (Pazartesi) - 7 (Pazar)
                  const today = new Date().getDay();
                  // JavaScript'te 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
                  // Bizim sistemimizde 1: Pazartesi, ..., 7: Pazar
                  const todayIndex = today === 0 ? 7 : today;
                  console.log(
                    "Bugün:",
                    today,
                    "Bugünün indeksi:",
                    todayIndex,
                    "Program günleri:",
                    userData.trainingProgram.workouts.map((w) => w.day)
                  );
                  const todayWorkout = userData.trainingProgram.workouts.find(
                    (workout) => Number(workout.day) === todayIndex
                  );
                  if (!todayWorkout) {
                    return (
                      <div className="mt-2">
                        <span className="text-gray-400 text-sm">
                          Bugün programda antrenman yok
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-2">
                      <span className="text-gray-400 text-sm">
                        Bugünkü antrenman:
                      </span>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-gray-200 font-semibold">
                          {
                            [
                              "Pazartesi",
                              "Salı",
                              "Çarşamba",
                              "Perşembe",
                              "Cuma",
                              "Cumartesi",
                              "Pazar",
                            ][todayWorkout.day - 1]
                          }{" "}
                          Antrenmanı
                        </span>
                  </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {todayWorkout.exercises &&
                        todayWorkout.exercises.length > 0
                          ? todayWorkout.exercises
                              .map((ex) => ex.name)
                              .join(", ")
                          : "Egzersiz eklenmemiş"}
                      </div>
                    </div>
                  );
                })()}
            </div>
            <div className="bg-gray-800 bg-opacity-40 rounded-lg p-3">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-yellow-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-300">
                  {/* Program süresi burada gösterilecek */}
                  {userData?.trainingProgram?.duration
                    ? formatDurationWithSuffix(
                        userData.trainingProgram.duration
                      )
                    : `${
                        userData?.trainingProgram?.workouts?.length || 0
                      } günlük program`}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/training-programs"
                className="text-yellow-500 text-sm font-semibold hover:text-yellow-400 transition duration-200"
              >
                Programı Görüntüle →
              </Link>
            </div>
          </div>
        )}

        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-100">
              Arkadaşlık İstekleri
            </h3>
            <div className="p-2 bg-yellow-500 rounded-full">
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4 mb-4">
              <p className="text-gray-300 text-sm mb-1">Bekleyen istekler:</p>
              <p className="text-yellow-400 font-medium mb-3">
                {pendingRequests.length} yeni istek
              </p>
              <div>
                {pendingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between bg-gray-900 bg-opacity-60 border border-gray-700 rounded-lg px-3 py-2 mb-2 shadow-sm"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-yellow-400 font-bold mr-3 overflow-hidden">
                        {request.from.photoUrl ? (
                          <img
                            src={request.from.photoUrl}
                            alt={request.from.fullName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span>{request.from.fullName?.charAt(0) || "?"}</span>
                        )}
                      </div>
                      <span className="text-gray-200 font-medium">
                        {request.from.fullName}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-full px-3 py-1 text-xs font-semibold transition"
                        onClick={() => handleAcceptRequest(request._id)}
                      >
                        Kabul Et
                      </button>
                      <button
                        className="bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 rounded-full px-3 py-1 text-xs font-semibold transition"
                        onClick={() => handleRejectRequest(request._id)}
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4 mb-4 text-center">
              <p className="text-gray-400 text-sm">
                Bekleyen arkadaşlık isteği yok
              </p>
            </div>
          )}

          <div className="mt-4">
            <Link
              to="/find-friends"
              className="text-yellow-500 text-sm font-semibold hover:text-yellow-400 transition duration-200"
            >
              Arkadaş Bul →
            </Link>
          </div>
        </div>

        {/* Sporcularım kartı - Sadece antrenörler için */}
        {userData?.userType?.toLowerCase() === "coach" && (
          <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-100">
                Sporcularım
              </h3>
              <div className="p-2 bg-yellow-500 rounded-full">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {allAthletes.length > 0 ? (
                allAthletes.map((athlete) => (
                  <div
                    key={athlete._id}
                    className={`bg-gray-800 bg-opacity-70 rounded-xl p-3 border ${
                      athlete.status === "pending"
                        ? "border-yellow-700"
                        : "border-yellow-600"
                    } shadow hover:shadow-yellow-700 hover:bg-gray-700/80 transition-colors duration-150 flex items-center gap-3 mb-3`}
                    style={{ minHeight: 64, maxWidth: 440 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg text-yellow-400 font-bold border border-yellow-500 overflow-hidden">
                        {athlete.profile?.photoUrl ? (
                          <img
                          src={athlete.profile?.photoUrl}
                            alt={athlete.profile.fullName}
                          className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          athlete.profile?.fullName?.charAt(0) || "A"
                        )}
                      </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base text-gray-100 truncate">
                              {athlete.profile?.fullName || "İsimsiz Sporcu"}
                            </p>
                        {athlete.status === "pending" ? (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500 bg-opacity-20 text-yellow-400 rounded-full">
                            Bekliyor
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500 bg-opacity-20 text-yellow-400 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                              {athlete.profile?.age
                                ? `${athlete.profile.age} yaş • `
                                : ""}
                        {athlete.profile?.goalType
                          ? getGoalTypeText(athlete.profile.goalType)
                          : "Hedef belirlenmedi"}
                            </p>
                          </div>
                    <div className="flex gap-2 ml-2">
                      {athlete.status === "pending" ? (
                        <>
                          <button
                            className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-full px-3 py-1 text-xs font-semibold transition"
                            onClick={() =>
                              handleAcceptAthleteRequest(
                                athlete.requestId,
                                athlete._id
                              )
                            }
                          >
                            Kabul Et
                          </button>
                          <button
                            className="bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 rounded-full px-3 py-1 text-xs font-semibold transition"
                            onClick={() =>
                              handleRejectAthleteRequest(
                                athlete.requestId,
                                athlete._id
                              )
                            }
                          >
                            Reddet
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            title={
                              athlete.trainingProgram
                                ? "Programı Güncelle"
                                : "Program Ata"
                            }
                            onClick={() => {
                              const athleteData = {
                                _id: athlete._id,
                                profile: athlete.profile,
                                email: athlete.email,
                              };
                              navigate("/program-creator", {
                                state: {
                                  selectedAthlete: athleteData,
                                  programId:
                                    athlete.trainingProgram?._id || null,
                                },
                              });
                            }}
                            className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full flex items-center justify-center transition"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 640 512"
                            >
                              <path d="M96 64c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 160 0 64 0 160c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-64-32 0c-17.7 0-32-14.3-32-32l0-64c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-64c0-17.7 14.3-32 32-32l32 0 0-64zm448 0l0 64 32 0c17.7 0 32 14.3 32 32l0 64c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 64c0 17.7-14.3 32-32 32l-32 0 0 64c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-160 0-64 0-160c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32zM416 224l0 64-192 0 0-64 192 0z" />
                            </svg>
                          </button>
                          <button
                            title="Mesaj Gönder"
                            onClick={() => {
                              setActiveChat(athlete);
                              setIsOpen(true);
                            }}
                            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full flex items-center justify-center transition"
                          >
                            {/* Chat Widget Icon */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                              />
                            </svg>
                          </button>
                          <button
                            title="Profili Görüntüle"
                            onClick={() => navigate(`/profile/${athlete._id}`)}
                            className="w-10 h-10 border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black rounded-full flex items-center justify-center transition"
                          >
                            {/* User Icon */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p>Henüz sporcu kaydınız bulunmamaktadır.</p>
                  <Link
                    to="/athletes"
                    className="text-yellow-500 hover:text-yellow-400 text-sm mt-2 inline-block"
                  >
                    Sporcu Ekle →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Antrenörüm kartı - Sadece sporcular için */}
        {userData?.userType === "athlete" && (
          <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-100">
                Antrenörüm
              </h3>
              <div className="p-2 bg-yellow-500 rounded-full">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            {userData?.coach ? (
              <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-yellow-500 flex items-center justify-center">
                    {userData.coach.profile?.photoUrl ? (
                      <img
                        src={userData.coach.profile?.photoUrl}
                        alt={userData.coach.profile.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gray-400">
                        {userData.coach.profile?.fullName?.charAt(0) || "C"}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-200">
                      {userData.coach.profile?.fullName || "İsimsiz Antrenör"}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {userData.coach.profile?.specialization ||
                        "Uzmanlaşma alanı belirtilmedi"}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => {
                          setActiveChat(userData.coach);
                          setIsOpen(true);
                        }}
                        className="px-3 py-1 text-sm bg-yellow-500 text-black rounded-full hover:bg-yellow-400 transition duration-200"
                      >
                        Mesaj Gönder
                      </button>
                      <Link
                        to={`/profile/${userData.coach._id}`}
                        className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition duration-200"
                      >
                        Profili Görüntüle
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4 text-center">
                <p className="text-gray-400 mb-3">
                  Henüz bir antrenörünüz bulunmamaktadır.
                </p>
                <Link
                  to="/coaches"
                  className="inline-block px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition duration-200"
                >
                  Antrenör Bul
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-100">
              Beslenme Önerileri
            </h3>
            <div className="p-2 bg-yellow-500 rounded-full">
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>

          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {[
                /* Filtre butonları */
              ].map((filter) => (
                <button key={filter.id} /* ... */>{filter.label}</button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px] pr-2 custom-styled-scrollbar">
            {" "}
            <div className="grid grid-cols-1 gap-4">
              {" "}
              {filteredMeals.map((meal) => {
                const isSuitable = suitableTypes.includes(meal.type);
                const isFavorite = favoriteMeals.includes(meal.id);
                const isShowingAll = !!showAllIngredients[meal.id];
                const maxIngredients = 4;
                const visibleIngredients = isShowingAll
                  ? meal.ingredients
                  : meal.ingredients.slice(0, maxIngredients);
                return (
                <div
                  key={meal.id}
                  className="bg-gray-800 bg-opacity-40 p-4 rounded-lg border border-gray-700 hover:border-yellow-500 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium text-yellow-500 mr-2">
                        {meal.name}
                      </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        meal.type === "protein"
                          ? "bg-blue-900 text-blue-300"
                          : meal.type === "vegan"
                          ? "bg-green-900 text-green-300"
                          : meal.type === "quick"
                          ? "bg-purple-900 text-purple-300"
                              : meal.type === "lowcarb"
                              ? "bg-pink-900 text-pink-300"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {meal.type === "protein"
                        ? "Protein"
                        : meal.type === "vegan"
                        ? "Vegan"
                        : meal.type === "quick"
                        ? "Hızlı"
                        : meal.type === "lowcarb"
                        ? "Düşük Karbonhidrat"
                        : "Diğer"}
                    </span>
                        {isSuitable && (
                          <span className="ml-2 text-xs bg-green-700 text-white px-2 py-1 rounded">
                            Senin hedefin için uygun
                          </span>
                        )}
                  </div>
                      <button
                        onClick={() => toggleFavorite(meal.id)}
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          isFavorite
                            ? "bg-yellow-400 text-black"
                            : "bg-gray-700 text-white"
                        }`}
                        title={
                          isFavorite ? "Favoriden çıkar" : "Favorilere ekle"
                        }
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                    </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-gray-900 bg-opacity-50 p-1 rounded">
                      <p className="text-xs text-gray-400">Protein</p>
                      <p className="text-blue-400 font-medium">
                        {meal.protein}g
                      </p>
                    </div>
                    <div className="bg-gray-900 bg-opacity-50 p-1 rounded">
                      <p className="text-xs text-gray-400">Karbonhidrat</p>
                      <p className="text-yellow-400 font-medium">
                        {meal.carbs}g
                      </p>
                    </div>
                    <div className="bg-gray-900 bg-opacity-50 p-1 rounded">
                      <p className="text-xs text-gray-400">Yağ</p>
                      <p className="text-red-400 font-medium">{meal.fat}g</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Malzemeler:</p>
                    <div className="flex flex-wrap gap-1">
                        {visibleIngredients.map((ingredient, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300"
                        >
                          {ingredient}
                        </span>
                      ))}
                        {meal.ingredients.length > maxIngredients &&
                          !isShowingAll && (
                            <span
                              className="cursor-pointer text-yellow-400 ml-2"
                              onClick={() =>
                                handleShowAllIngredients(meal.id, true)
                              }
                            >
                              ...
                            </span>
                          )}
                        {isShowingAll && (
                          <span
                            className="cursor-pointer text-yellow-400 ml-2"
                            onClick={() =>
                              handleShowAllIngredients(meal.id, false)
                            }
                          >
                            gizle
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-100">Takvim</h3>
              <div className="p-2 bg-yellow-500 rounded-full">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
            </div>
          </div>

          {calendarError && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-50 text-red-200 rounded-lg text-sm">
              {calendarError}
              <button
                onClick={fetchEvents}
                className="ml-2 underline hover:text-red-100"
              >
                Yeniden Dene
              </button>
            </div>
          )}

          <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4 mb-4 relative">
            {calendarLoading && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-3">
              <button
                className="text-gray-400 hover:text-yellow-500 transition duration-200"
                onClick={prevMonth}
              >
                <svg
                  className="w-5 h-5"
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
              </button>
              <div className="text-yellow-400 font-medium">
                {new Intl.DateTimeFormat("tr-TR", {
                  month: "long",
                  year: "numeric",
                }).format(currentMonth)}
              </div>
              <button
                className="text-gray-400 hover:text-yellow-500 transition duration-200"
                onClick={nextMonth}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"].map((day, index) => (
                <div
                  key={`weekday-${index}`}
                  className="text-xs text-gray-500 text-center font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const daysInMonth = getDaysInMonth(year, month);
                const firstDayOfMonth = getFirstDayOfMonth(year, month);
                const days = [];

                for (let i = 0; i < firstDayOfMonth; i++) {
                  days.push(<div key={`empty-${i}`} className="h-8"></div>);
                }

                for (let i = 1; i <= daysInMonth; i++) {
                  const dateStr = `${year}-${(month + 1)
                    .toString()
                    .padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
                  const dayEvents = events.filter(
                    (event) => event.date === dateStr
                  );
                  const isToday =
                    i === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();

                  days.push(
                    <div
                      key={`day-${i}`}
                      className={`h-8 flex items-center justify-center relative 
                      ${
                        isToday
                          ? "bg-yellow-500 text-black rounded-full font-bold"
                          : dayEvents.length > 0
                          ? "text-white cursor-pointer hover:bg-gray-700 rounded-full"
                          : "text-gray-400 hover:bg-gray-800 hover:text-gray-300 rounded-full cursor-pointer"
                      }`}
                      onClick={() => handleDayClick(i)}
                      title={
                        dayEvents.length > 0
                          ? dayEvents.map((e) => e.title).join(", ")
                          : "Yeni etkinlik ekle"
                      }
                    >
                      {i}
                      {dayEvents.length > 0 && (
                        <div
                          className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5`}
                        >
                          {dayEvents.map((event, index) => (
                            <div
                              key={`indicator-${i}-${index}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                              className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(
                                event.type
                              )}`}
                              title={event.title}
                            ></div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return days;
              })()}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl border border-gray-800 shadow-lg transition-all duration-300 hover:shadow-yellow-900/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-100">
              Liderlik Tablosu
            </h3>
            <div className="p-2 bg-yellow-500 rounded-full">
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 10 L12 14 L16 10 L20 14 L24 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="8" cy="9" r="1" fill="currentColor" />
                <circle cx="16" cy="9" r="1" fill="currentColor" />
                <circle cx="24" cy="9" r="1" fill="currentColor" />
                <rect
                  x="5"
                  y="20"
                  width="6"
                  height="6"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <rect
                  x="13"
                  y="16"
                  width="6"
                  height="10"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <rect
                  x="21"
                  y="22"
                  width="6"
                  height="4"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <text
                  x="16"
                  y="23"
                  textAnchor="middle"
                  fontSize="7"
                  fill="currentColor"
                  fontWeight="bold"
                >
                  1
                </text>
              </svg>
            </div>
          </div>

          <div className="bg-[#1a2236] rounded-xl shadow-lg p-4">
            <div className="grid grid-cols-12 py-2 border-b border-gray-700 mb-2">
              <div className="col-span-1 text-xs text-gray-400 text-center">
                #
              </div>
              <div className="col-span-7 text-xs text-gray-400">Kullanıcı</div>
              <div className="col-span-4 text-xs text-gray-400 text-right">
                Puan
              </div>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-styled-scrollbar">
              {leaderboardData.map((user, idx) => (
                <div
                  key={`dashboard-list-${user.id}`}
                  className={`grid grid-cols-12 items-center py-1.5 px-1 rounded-lg border ${
                    user.id === userData?._id
                      ? "bg-yellow-900/20 border-yellow-700"
                      : idx === 0
                      ? "bg-yellow-900/20 border-yellow-800"
                      : idx === 1
                      ? "bg-gray-600/20 border-gray-700"
                      : idx === 2
                      ? "bg-yellow-800/10 border-yellow-900"
                      : "hover:bg-gray-700/30"
                  }`}
                >
                  <div className="col-span-1 text-center text-gray-500 font-semibold">
                    {idx === 0 && <span className="text-yellow-400">🏆</span>}
                    {idx === 1 && idx !== 0 && (
                      <span className="text-gray-400">🥈</span>
                    )}
                    {idx === 2 && idx !== 0 && idx !== 1 && (
                      <span className="text-yellow-700">🥉</span>
                    )}
                    {idx > 2 && idx + 1}
                  </div>
                  <div className="col-span-7 flex items-center">
                    <div className="w-6 h-6 bg-gray-700 rounded-full mr-2 flex items-center justify-center text-xs border-2 border-gray-600 overflow-hidden">
                      {user.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <span
                      className={`truncate text-sm ${
                        user.id === userData?._id
                          ? "text-yellow-400 font-medium"
                          : "text-gray-300"
                      }`}
                    >
                      {user.name} {user.id === userData?._id && "(Siz)"}
                    </span>
                  </div>
                  <div
                    className={`col-span-4 text-right text-sm font-semibold ${
                      user.id === userData?._id
                        ? "text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    {user.points.toLocaleString()}
                  </div>
                </div>
              ))}
              {leaderboardData.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  Liderlik verileri yüklenemedi veya boş.
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-40 rounded-lg p-3 border border-yellow-900 border-opacity-40">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {/* userRank null ise veya 0 ise gösterme */}
                {userRank !== null && userRank > 0 && (
                <div className="bg-yellow-500 text-black rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2">
                  {userRank}
                </div>
                )}
                <div>
                  <p className="text-gray-200">Sıralamanız</p>
                  {userRank !== null && userRank > 0 ? (
                  <p className="text-xs text-gray-400">
                      {/* Sıralama 100'den küçük veya eşitse göster */}
                      {userRank <= 100
                        ? "İlk 100 içerisindesiniz!"
                        : "Sıralamanız 100+."}
                  </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Sıralama henüz belirlenmedi.
                    </p>
                  )}
                </div>
              </div>
              {userData?.points !== undefined ? (
                <div className="text-yellow-400 font-bold">
                  {userData.points.toLocaleString()} puan
                </div>
              ) : leaderboardData.length > 0 && userRank !== null ? (
              <div className="text-yellow-400 font-bold">
                {leaderboardData
                    .find((user) => user.id === userData?._id)
                    ?.points.toLocaleString() || "--"}{" "}
                puan
              </div>
              ) : (
                <div className="text-yellow-400 font-bold">-- puan</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              className="text-yellow-500 text-sm font-semibold hover:text-yellow-400 transition duration-200"
              onClick={() => navigate("/leaderboard")}
            >
              Tüm Sıralamayı Gör →
            </button>
            <div className="text-xs text-gray-400">
              Son güncelleme: {formatLeaderboardUpdate(lastLeaderboardUpdate)}
            </div>
          </div>
        </div>

        {isEventModalOpen && (
          <EventModal
            isOpen={isEventModalOpen}
            onClose={() => {
              setIsEventModalOpen(false);
              setSelectedEvent(null);
            }}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
            event={selectedEvent}
          />
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link
          to="/progress-history"
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-4 rounded-lg flex items-center transition duration-300"
        >
          <div className="bg-yellow-500 rounded-full p-2 mr-3 text-black">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">İlerleme Takibi</h3>
            <p className="text-sm text-gray-400">
              Fiziksel verilerinizi grafiklerle izleyin ve hedeflerinizin
              ilerlemesini takip edin
            </p>
          </div>
        </Link>

        {userData?.userType === "athlete" && (
          <Link
            to="/training-programs"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-4 rounded-lg flex items-center transition duration-300"
          >
            <div className="bg-yellow-500 rounded-full p-2 mr-3 text-black">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Antrenman Programları</h3>
              <p className="text-sm text-gray-400">
                Hazır programlardan birini seçin
              </p>
            </div>
          </Link>
        )}

        {userData?.userType === "athlete" && (
          <Link
            to="/coaches"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-4 rounded-lg flex items-center transition duration-300"
          >
            <div className="bg-yellow-500 rounded-full p-2 mr-3 text-black">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Antrenörler</h3>
              <p className="text-sm text-gray-400">
                Size uygun bir antrenör seçin
              </p>
            </div>
          </Link>
        )}

        <Link
          to="/friends"
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-4 rounded-lg flex items-center transition duration-300"
        >
          <div className="bg-yellow-500 rounded-full p-2 mr-3 text-black">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Arkadaşlar</h3>
            <p className="text-sm text-gray-400">
              Antrenman arkadaşlarınızı yönetin
            </p>
          </div>
        </Link>

        <Link
          to="/movement-detection"
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-4 rounded-lg flex items-center transition duration-300"
        >
          <div className="bg-yellow-500 rounded-full p-2 mr-3 text-black">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Hareket Algılama</h3>
            <p className="text-sm text-gray-400">
              Egzersiz hareketlerinizi analiz edin
            </p>
          </div>
        </Link>

        {userData?.userType === "coach" && (
          <Link
            to="/program-creator"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-4 rounded-lg flex items-center transition duration-300"
          >
            <div className="bg-yellow-500 rounded-full p-2 mr-3 text-black">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Program Oluştur</h3>
              <p className="text-sm text-gray-400">
                Sporcularınız için yeni antrenman programları oluşturun
              </p>
            </div>
          </Link>
        )}
      </div>
      {/* Sporcu detay modalı */}
      {selectedAthleteDetail && (
        <Modal
          isOpen={!!selectedAthleteDetail}
          onClose={() => setSelectedAthleteDetail(null)}
        >
          <div
            className="p-7 bg-gray-900 rounded-xl max-w-sm mx-auto"
            style={{ maxWidth: 420 }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-yellow-400 font-bold border border-yellow-500 overflow-hidden">
                {selectedAthleteDetail.profile?.photoUrl ? (
                  <img
                    src={selectedAthleteDetail.profile?.photoUrl}
                    alt={selectedAthleteDetail.profile.fullName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  selectedAthleteDetail.profile?.fullName?.charAt(0) || "A"
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-100">
                  {selectedAthleteDetail.profile?.fullName || "İsimsiz Sporcu"}
                </h2>
                <p className="text-sm text-gray-400">
                  {selectedAthleteDetail.profile?.age
                    ? `${selectedAthleteDetail.profile.age} yaş`
                    : "-"}
                </p>
                <p className="text-sm text-yellow-400">
                  {selectedAthleteDetail.profile?.goalType || "-"}
                </p>
              </div>
            </div>
            <div className="mb-5 space-y-2 text-sm">
              <p className="text-gray-300">
                Boy:{" "}
                <span className="text-yellow-400">
                  {selectedAthleteDetail.profile?.height || "-"} cm
                </span>
              </p>
              <p className="text-gray-300">
                Kilo:{" "}
                <span className="text-yellow-400">
                  {selectedAthleteDetail.profile?.weight || "-"} kg
                </span>
              </p>
              <p className="text-gray-300">
                Yağ Oranı:{" "}
                <span className="text-yellow-400">
                  {selectedAthleteDetail.profile?.bodyFat || "-"}%
                </span>
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  const athleteData = {
                    _id: selectedAthleteDetail._id,
                    profile: selectedAthleteDetail.profile,
                    email: selectedAthleteDetail.email,
                  };

                  // Doğrudan yönlendirme yap
                  navigate("/program-creator", {
                    state: { selectedAthlete: athleteData },
                  });
                }}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-2 rounded font-semibold text-sm transition flex items-center justify-center"
              >
                Program Ata
              </button>
              <button
                onClick={() => {
                  setActiveChat(selectedAthleteDetail);
                  setIsOpen(true);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded font-semibold text-xs transition"
              >
                Mesaj Gönder
              </button>
              <button
                onClick={() => navigate(`/profile/${athlete._id}`)}
                className="bg-gray-800 hover:bg-gray-700 text-yellow-400 px-3 py-2 rounded font-semibold text-sm transition ml-2"
              >
                Profili Görüntüle
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* Mesaj widgetı (basit modal) */}
      {openMessageAthlete && (
        <Modal
          isOpen={!!openMessageAthlete}
          onClose={() => setOpenMessageAthlete(null)}
        >
          <div className="p-4 bg-gray-900 rounded-xl max-w-xs mx-auto">
            <h2 className="text-lg font-bold text-yellow-400 mb-2">
              {openMessageAthlete.profile?.fullName || openMessageAthlete.email}
            </h2>
            <textarea
              className="w-full h-24 bg-gray-800 text-gray-200 rounded p-2 mb-2"
              placeholder="Mesajınızı yazın..."
            />
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-700 text-gray-200 px-3 py-1 rounded text-xs"
                onClick={() => setOpenMessageAthlete(null)}
              >
                İptal
              </button>
              <button className="bg-yellow-500 text-black px-3 py-1 rounded text-xs">
                Gönder
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
