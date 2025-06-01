import axios from 'axios';

const API_URL = 'http://localhost:5000/api/friends';

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('userToken') || sessionStorage.getItem('userToken')}`
  }
});

export const getFriends = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

export const sendFriendRequest = async (friendId) => {
  const response = await axios.post(`${API_URL}/request/${friendId}`, {}, getAuthHeader());
  return response.data;
};

export const acceptFriendRequest = async (requestId) => {
  const response = await axios.post(`${API_URL}/accept/${requestId}`, {}, getAuthHeader());
  return response.data;
};

export const rejectFriendRequest = async (requestId) => {
  const response = await axios.delete(`${API_URL}/reject/${requestId}`, getAuthHeader());
  return response.data;
};

export const removeFriend = async (friendId) => {
  const response = await axios.delete(`${API_URL}/${friendId}`, getAuthHeader());
  return response.data;
}; 