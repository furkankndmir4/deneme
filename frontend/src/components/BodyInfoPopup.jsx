import React, { useState, useEffect } from "react";
import { updatePhysicalData } from "../services/api";
import axios from "axios";

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const BodyInfoPopup = ({ onClose, onSave, initialData }) => {
  const [physicalData, setPhysicalData] = useState({
    bodyFat: initialData?.bodyFat || "",
    neckCircumference: initialData?.neckCircumference || "",
    waistCircumference: initialData?.waistCircumference || "",
    hipCircumference: initialData?.hipCircumference || "",
    chestCircumference: initialData?.chestCircumference || "",
    bicepCircumference: initialData?.bicepCircumference || "",
    thighCircumference: initialData?.thighCircumference || "",
    calfCircumference: initialData?.calfCircumference || "",
    shoulderWidth: initialData?.shoulderWidth || "",
  });

  // initialData değiştiğinde state'i güncelle
  useEffect(() => {
    console.log("Initial data changed:", initialData);
    setPhysicalData({
      bodyFat: initialData?.bodyFat || "",
      neckCircumference: initialData?.neckCircumference || "",
      waistCircumference: initialData?.waistCircumference || "",
      hipCircumference: initialData?.hipCircumference || "",
      chestCircumference: initialData?.chestCircumference || "",
      bicepCircumference: initialData?.bicepCircumference || "",
      thighCircumference: initialData?.thighCircumference || "",
      calfCircumference: initialData?.calfCircumference || "",
      shoulderWidth: initialData?.shoulderWidth || "",
    });
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sadece sayısal değerleri kabul et
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPhysicalData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting physical data:", physicalData);
    onSave(physicalData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-yellow-500">Vücut Ölçüleri</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
        <div className="overflow-y-auto pr-2 custom-styled-scrollbar flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Vücut Yağ Oranı (%)
              </label>
              <input
                type="number"
                name="bodyFat"
                min="0"
                max="100"
                step="0.1"
                value={physicalData.bodyFat}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Örn: 15"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Boyun Çevresi (cm)
                </label>
                <input
                  type="number"
                  name="neckCircumference"
                  min="0"
                  step="0.1"
                  value={physicalData.neckCircumference}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 35"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bel Çevresi (cm)
                </label>
                <input
                  type="number"
                  name="waistCircumference"
                  min="0"
                  step="0.1"
                  value={physicalData.waistCircumference}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Kalça Çevresi (cm)
                </label>
                <input
                  type="number"
                  name="hipCircumference"
                  min="0"
                  step="0.1"
                  value={physicalData.hipCircumference}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Göğüs Çevresi (cm)
                </label>
                <input
                  type="number"
                  name="chestCircumference"
                  min="0"
                  step="0.1"
                  value={physicalData.chestCircumference}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 95"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Biceps Çevresi (cm)
                </label>
                <input
                  type="number"
                  name="bicepCircumference"
                  min="0"
                  step="0.1"
                  value={physicalData.bicepCircumference}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Uyluk Çevresi (cm)
                </label>
                <input
                  type="number"
                  name="thighCircumference"
                  min="0"
                  step="0.1"
                  value={physicalData.thighCircumference}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 55"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Baldır Çevresi (cm)
                </label>
                <input
                  type="number"
                  name="calfCircumference"
                  min="0"
                  step="0.1"
                  value={physicalData.calfCircumference}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 35"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Omuz Genişliği (cm)
                </label>
                <input
                  type="number"
                  name="shoulderWidth"
                  min="0"
                  step="0.1"
                  value={physicalData.shoulderWidth}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Örn: 45"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BodyInfoPopup;
