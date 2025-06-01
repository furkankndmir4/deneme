import axios from 'axios';

const API_URL = 'http://localhost:5000/api/events';

class EventService {
  async getEvents(startDate, endDate) {
    try {
      let url = API_URL;
      
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken') || sessionStorage.getItem('userToken')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Etkinlik verileri alınamadı:', error);
      throw error;
    }
  }
  
  async createEvent(eventData) {
    try {
      const response = await axios.post(API_URL, eventData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken') || sessionStorage.getItem('userToken')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Etkinlik oluşturulamadı:', error);
      throw error;
    }
  }
  
  async getEventById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken') || sessionStorage.getItem('userToken')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Etkinlik detayları alınamadı:', error);
      throw error;
    }
  }
  
  async updateEvent(id, eventData) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, eventData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken') || sessionStorage.getItem('userToken')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Etkinlik güncellenemedi:', error);
      throw error;
    }
  }
  
  async deleteEvent(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken') || sessionStorage.getItem('userToken')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Etkinlik silinemedi:', error);
      throw error;
    }
  }
}

export default new EventService();