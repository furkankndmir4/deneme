import { useState, useEffect } from 'react';

const EventModal = ({ isOpen, onClose, onSave, onDelete, event = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'workout',
    description: '',
    completed: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEventIdx, setSelectedEventIdx] = useState(0);
  
  // Event varsa formu doldur (güncelleme modu)
  useEffect(() => {
    if (event && event.multiple && Array.isArray(event.multiple)) {
      // Çoklu etkinlik varsa, ilkini seçili yap
      const first = event.multiple[0];
      setSelectedEventIdx(0);
      setFormData({
        title: first.title || '',
        date: first.date ? new Date(first.date).toISOString().split('T')[0] : '',
        type: first.type || 'workout',
        description: first.description || '',
        completed: first.completed || false
      });
    } else if (event) {
      const eventDate = event.date ? new Date(event.date) : new Date();
      setFormData({
        title: event.title || '',
        date: eventDate.toISOString().split('T')[0],
        type: event.type || 'workout',
        description: event.description || '',
        completed: event.completed || false
      });
    } else {
      const today = new Date();
      setFormData({
        title: '',
        date: event?.date 
          ? new Date(event.date).toISOString().split('T')[0]
          : today.toISOString().split('T')[0],
        type: 'workout',
        description: '',
        completed: false
      });
    }
  }, [event, isOpen]);
  
  // Çoklu etkinlik varsa, seçiliyi değiştir
  const handleSelectEvent = (idx) => {
    if (event && event.multiple && event.multiple[idx]) {
      const ev = event.multiple[idx];
      setSelectedEventIdx(idx);
      setFormData({
        title: ev.title || '',
        date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '',
        type: ev.type || 'workout',
        description: ev.description || '',
        completed: ev.completed || false
      });
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Etkinlik başlığı gereklidir');
      }
      if (!formData.date) {
        throw new Error('Tarih gereklidir');
      }

      // Format the date to YYYY-MM-DD
      const formattedData = {
        ...formData,
        date: new Date(formData.date).toISOString().split('T')[0]
      };

      console.log('Submitting form data:', formattedData); // Debug log
      await onSave(formattedData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Seçili etkinlik (çokluysa)
  const currentEvent = event && event.multiple && Array.isArray(event.multiple)
    ? event.multiple[selectedEventIdx]
    : event;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-gray-800 shadow-xl">
        <h2 className="text-xl text-yellow-500 font-bold mb-4">
          {currentEvent && currentEvent._id ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Ekle'}
        </h2>
        
        {event && event.multiple && event.multiple.length > 1 && (
          <div className="mb-4 flex gap-2">
            {event.multiple.map((ev, idx) => (
              <button
                key={ev._id || idx}
                className={`px-2 py-1 rounded text-xs font-semibold ${selectedEventIdx === idx ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-200'}`}
                onClick={() => handleSelectEvent(idx)}
              >
                {ev.title || `Etkinlik ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-40 text-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 text-sm" htmlFor="title">
              Etkinlik Başlığı*
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Bacak Günü"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 text-sm" htmlFor="date">
              Tarih*
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 text-sm" htmlFor="type">
              Etkinlik Türü
            </label>
            <select
              id="type"
              name="type"
              className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="workout">Antrenman</option>
              <option value="cardio">Kardiyo</option>
              <option value="meeting">Görüşme</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 text-sm" htmlFor="description">
              Açıklama
            </label>
            <textarea
              id="description"
              name="description"
              className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-200 h-24"
              value={formData.description}
              onChange={handleChange}
              placeholder="Etkinlik detayları..."
            ></textarea>
          </div>
          
          {currentEvent && (
            <div className="mb-4 flex items-center">
              <input
                id="completed"
                name="completed"
                type="checkbox"
                className="mr-2"
                checked={formData.completed}
                onChange={handleChange}
              />
              <label className="text-gray-300 text-sm" htmlFor="completed">
                Tamamlandı
              </label>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-6 gap-2">
            {currentEvent && currentEvent._id && (
              <button
                type="button"
                onClick={() => onDelete(currentEvent._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition duration-200"
                disabled={loading}
              >
                Sil
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition duration-200 text-gray-300"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition duration-300"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : currentEvent && currentEvent._id ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;