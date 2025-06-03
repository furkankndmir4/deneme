import React, { useState, useEffect } from "react";

const BodyInfoPopup = ({ isOpen, onClose, onSave, initialData }) => {
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

  useEffect(() => {
    if (initialData) {
      setPhysicalData({
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
    }
  }, [initialData]);

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
    onSave(physicalData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Vücut Ölçüleri</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-2 custom-styled-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vücut Yağ Oranı (%)
              </label>
              <input
                type="text"
                name="bodyFat"
                value={physicalData.bodyFat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Boyun Çevresi (cm)
              </label>
              <input
                type="text"
                name="neckCircumference"
                value={physicalData.neckCircumference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bel Çevresi (cm)
              </label>
              <input
                type="text"
                name="waistCircumference"
                value={physicalData.waistCircumference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kalça Çevresi (cm)
              </label>
              <input
                type="text"
                name="hipCircumference"
                value={physicalData.hipCircumference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 95"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Göğüs Çevresi (cm)
              </label>
              <input
                type="text"
                name="chestCircumference"
                value={physicalData.chestCircumference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biceps Çevresi (cm)
              </label>
              <input
                type="text"
                name="bicepCircumference"
                value={physicalData.bicepCircumference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 35"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bacak Çevresi (cm)
              </label>
              <input
                type="text"
                name="thighCircumference"
                value={physicalData.thighCircumference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 55"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baldır Çevresi (cm)
              </label>
              <input
                type="text"
                name="calfCircumference"
                value={physicalData.calfCircumference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 38"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Omuz Genişliği (cm)
              </label>
              <input
                type="text"
                name="shoulderWidth"
                value={physicalData.shoulderWidth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: 45"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BodyInfoPopup;
