import React, { useState } from "react";
import { updatePhysicalData } from "../services/api";
import axios from "axios";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const BodyInfoPopup = ({ onClose, onSave, initialData = {} }) => {
  const [physicalData, setPhysicalData] = useState({
    bodyFat: initialData.bodyFat || "",
    neckCircumference: initialData.neckCircumference || "",
    waistCircumference: initialData.waistCircumference || "",
    hipCircumference: initialData.hipCircumference || "",
    chestCircumference: initialData.chestCircumference || "",
    bicepCircumference: initialData.bicepCircumference || "",
    thighCircumference: initialData.thighCircumference || "",
    calfCircumference: initialData.calfCircumference || "",
    shoulderWidth: initialData.shoulderWidth || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPhysicalData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Token kontrolü
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      if (!token) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        return;
      }

      // Fiziksel verileri hazırla
      const physicalDataToSave = {
        bodyFat: physicalData.bodyFat ? parseFloat(physicalData.bodyFat) : initialData.bodyFat || 0,
        neckCircumference: physicalData.neckCircumference
          ? parseFloat(physicalData.neckCircumference)
          : initialData.neckCircumference || 0,
        waistCircumference: physicalData.waistCircumference
          ? parseFloat(physicalData.waistCircumference)
          : initialData.waistCircumference || 0,
        hipCircumference: physicalData.hipCircumference
          ? parseFloat(physicalData.hipCircumference)
          : initialData.hipCircumference || 0,
        chestCircumference: physicalData.chestCircumference
          ? parseFloat(physicalData.chestCircumference)
          : initialData.chestCircumference || 0,
        bicepCircumference: physicalData.bicepCircumference
          ? parseFloat(physicalData.bicepCircumference)
          : initialData.bicepCircumference || 0,
        thighCircumference: physicalData.thighCircumference
          ? parseFloat(physicalData.thighCircumference)
          : initialData.thighCircumference || 0,
        calfCircumference: physicalData.calfCircumference
          ? parseFloat(physicalData.calfCircumference)
          : initialData.calfCircumference || 0,
        shoulderWidth: physicalData.shoulderWidth
          ? parseFloat(physicalData.shoulderWidth)
          : initialData.shoulderWidth || 0,
      };

      console.log("Saving physical data:", physicalDataToSave);

      // API çağrısı
      const response = await axios.put(
        `${API_URL}/users/physical-data`,
        physicalDataToSave,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Physical data save response:", response.data);

      if (response.data) {
        // Kullanıcı verilerini güncelle
        const currentUserData = JSON.parse(
          localStorage.getItem("user") || "{}"
        );
        const updatedUserData = {
          ...currentUserData,
          physicalData: {
            ...currentUserData.physicalData,
            ...response.data.physicalData,
          },
        };

        localStorage.setItem("user", JSON.stringify(updatedUserData));
        sessionStorage.setItem("user", JSON.stringify(updatedUserData));

        onSave(response.data);
        onClose();
      }
    } catch (error) {
      console.error("Physical data save error:", error);
      if (error.response?.status === 401) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
      } else {
        setError(
          error.response?.data?.message ||
            "Fiziksel veriler kaydedilirken bir hata oluştu"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-yellow-500">Vücut Ölçüleri</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-60 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <p className="mb-6 text-gray-300">
          İlerlemenizi düzgün şekilde takip etmek için vücut ölçülerinizi
          almamız gerekiyor.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="bodyFat"
            >
              Vücut Yağ Oranı (%)
            </label>
            <input
              id="bodyFat"
              name="bodyFat"
              type="text"
              className="glass-input w-full p-3"
              placeholder="18"
              value={physicalData.bodyFat}
              onChange={(e) => {
                const { name, value } = e.target;
                // Sadece sayısal karakterlere ve bir tane noktaya izin ver
                const regex = /^\d*\.?\d*$/;
                if (value === '' || regex.test(value)) {
                  setPhysicalData((prevState) => ({
                    ...prevState,
                    [name]: value,
                  }));
                }
              }}
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="neckCircumference"
            >
              Boyun Çevresi (cm)
            </label>
            <input
              id="neckCircumference"
              name="neckCircumference"
              type="number"
              className="glass-input w-full p-3"
              placeholder="35"
              value={physicalData.neckCircumference}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="waistCircumference"
            >
              Bel Çevresi (cm)
            </label>
            <input
              id="waistCircumference"
              name="waistCircumference"
              type="number"
              className="glass-input w-full p-3"
              placeholder="85"
              value={physicalData.waistCircumference}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="hipCircumference"
            >
              Kalça Çevresi (cm)
            </label>
            <input
              id="hipCircumference"
              name="hipCircumference"
              type="number"
              className="glass-input w-full p-3"
              placeholder="90"
              value={physicalData.hipCircumference}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="chestCircumference"
            >
              Göğüs Çevresi (cm)
            </label>
            <input
              id="chestCircumference"
              name="chestCircumference"
              type="number"
              className="glass-input w-full p-3"
              placeholder="95"
              value={physicalData.chestCircumference}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="bicepCircumference"
            >
              Kol Çevresi (cm)
            </label>
            <input
              id="bicepCircumference"
              name="bicepCircumference"
              type="number"
              className="glass-input w-full p-3"
              placeholder="35"
              value={physicalData.bicepCircumference}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="thighCircumference"
            >
              Bacak Çevresi (cm)
            </label>
            <input
              id="thighCircumference"
              name="thighCircumference"
              type="number"
              className="glass-input w-full p-3"
              placeholder="55"
              value={physicalData.thighCircumference}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="calfCircumference"
            >
              Baldır Çevresi (cm)
            </label>
            <input
              id="calfCircumference"
              name="calfCircumference"
              type="number"
              className="glass-input w-full p-3"
              placeholder="35"
              value={physicalData.calfCircumference}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="shoulderWidth"
            >
              Omuz Genişliği (cm)
            </label>
            <input
              id="shoulderWidth"
              name="shoulderWidth"
              type="number"
              className="glass-input w-full p-3"
              placeholder="45"
              value={physicalData.shoulderWidth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary py-2 px-4"
              disabled={loading}
            >
              {loading ? "Kaydediliyor..." : "Kaydet ve Tamamla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BodyInfoPopup;
