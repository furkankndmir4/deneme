import React, { useEffect, useState } from 'react';
import MessageService from '../services/MessageService';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setMessages, setLoading, setError } from '../store/slices/messageSlice';

const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://denemebackend.vercel.app/api';

const Messages = () => {
  const [content, setContent] = useState('');
  const [receiver, setReceiver] = useState('');
  const [friends, setFriends] = useState([]);
  const [coach, setCoach] = useState(null);
  const dispatch = useDispatch();

  const { messages, loading, error } = useSelector(state => state.message);
  const user = useSelector(state => state.auth?.user) || JSON.parse(localStorage.getItem('user'));

  // Arkadaş ve antrenör listesini çek
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const friendsRes = await axios.get(`${API_URL}/friends`, config);
        setFriends(friendsRes.data);
        if (user?.coach) setCoach(user.coach);
      } catch (err) {
        console.error('Arkadaş listesi alınamadı:', err);
      }
    };
    fetchLists();
  }, [user]);

  const fetchMessages = async () => {
    dispatch(setLoading(true));
    try {
      const res = await MessageService.getMessages();
      dispatch(setMessages(res.data));
      // Okunmamış ve bana gelen mesajları okundu olarak işaretle
      res.data.forEach(msg => {
        if (!msg.read && msg.receiver._id === user._id) {
          MessageService.markAsRead(msg._id);
        }
      });
    } catch (err) {
      dispatch(setError('Mesajlar alınamadı.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!receiver || !content) return;
    try {
      await MessageService.sendMessage(receiver, content);
      setContent('');
      fetchMessages();
    } catch (err) {
      dispatch(setError('Mesaj gönderilemedi.'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Mesajlar</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSend} className="mb-4 flex gap-2 items-center">
        <select
          value={receiver}
          onChange={e => setReceiver(e.target.value)}
          className="border px-2 py-1 rounded w-1/3"
        >
          <option value="">Alıcı Seç</option>
          {coach && (
            <option value={coach._id}>Antrenör: {coach.fullName}</option>
          )}
          {friends.map(friend => (
            <option key={friend._id} value={friend._id}>
              {friend.fullName}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Mesajınız"
          value={content}
          onChange={e => setContent(e.target.value)}
          className="border px-2 py-1 rounded flex-1"
        />
        <button type="submit" className="bg-yellow-500 px-4 py-1 rounded text-black font-semibold">Gönder</button>
      </form>
      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <div className="space-y-2">
          {messages?.length === 0 && <div>Hiç mesaj yok.</div>}
          {messages?.map(msg => (
            <div key={msg._id} className={`p-2 rounded ${msg.sender._id === user._id ? 'bg-yellow-100 text-black' : 'bg-gray-800 text-white'}`}>
              <div className="text-xs text-gray-500 mb-1">
                {msg.sender.fullName} → {msg.receiver.fullName} ({new Date(msg.createdAt).toLocaleString()})
                {!msg.read && msg.receiver._id === user._id && <span className="ml-2 text-yellow-500">(yeni)</span>}
              </div>
              <div>{msg.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages; 