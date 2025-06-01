import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setMessages,
  setLoading,
  setError,
} from "../store/slices/messageSlice";
import MessageService from "../services/MessageService";
import axios from "axios";
import { useChat } from "../context/ChatContext";
import { api } from '../services/api';

const ChatWidget = () => {
  const { isOpen, setIsOpen, activeChat, setActiveChat } = useChat();
  const [content, setContent] = useState("");
  const [receiver, setReceiver] = useState("");
  const [friends, setFriends] = useState([]);
  const [coach, setCoach] = useState(null);
  const messagesEndRef = useRef(null);
  const dispatch = useDispatch();
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [coachAthleteIds, setCoachAthleteIds] = useState([]);

  const { messages, loading, error } = useSelector((state) => state.message);
  const user = useSelector((state) => state.auth?.user) || JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  const currentUserType = user?.userType;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Token ve config yönetimi
  const getAuthConfig = () => {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
    return token
      ? {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        }
      : null;
  };

  const fetchLists = async () => {
    const config = getAuthConfig();
    if (!config) return;
    try {
      const friendsRes = await axios.get("http://localhost:5000/api/friends", config);
      setFriends(friendsRes.data);
    } catch (error) {
      console.error("Arkadaş listesi alınamadı:", error);
      setFriends([]);
    }

    try {
      const messagesRes = await axios.get("http://localhost:5000/api/messages", config);
      dispatch(setMessages(messagesRes.data));
    } catch (error) {
      console.error("Mesajlar alınamadı:", error);
      dispatch(setMessages([]));
    }

    if (user?.coach) setCoach(user.coach);
  };

  useEffect(() => {
  if (user?._id) {
    fetchLists();
  }
}, [user?._id]);

  useEffect(() => {
  let interval;
  if (user?._id) {
    fetchMessages();
    interval = setInterval(() => {
      if (!isMarkingRead) {
        fetchMessages();
      }
    }, 10000); // 10 saniyede bir
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [user?._id, isMarkingRead]);

  const fetchMessages = async () => {
    const config = getAuthConfig();
    if (!config) return;
    dispatch(setLoading(true));
    try {
      const res = await axios.get("http://localhost:5000/api/messages", config);
      const messages = res.data;
      console.log("Fetched messages:", messages);
      
      // Aktif sohbetteki okunmamış mesajları işaretle
      if (activeChat) {
        const unreadMsgs = messages.filter(
          msg => !msg.read && 
          msg.sender._id === activeChat._id && 
          msg.receiver._id === user._id
        );
        
        console.log("Unread messages:", unreadMsgs);
        
        if (unreadMsgs.length > 0) {
          setIsMarkingRead(true);
          try {
            // Tüm okunmamış mesajları işaretle
            const markPromises = unreadMsgs.map(async (msg) => {
              console.log("Marking message as read:", msg._id);
              const response = await MessageService.markAsRead(msg._id);
              console.log("Mark as read response:", response);
              return response;
            });
            
            const markedMessages = await Promise.all(markPromises);
            console.log("Marked messages:", markedMessages);
            
            // Mesajları güncelle
            const updatedMessages = messages.map(msg => {
              const markedMsg = markedMessages.find(m => m._id === msg._id);
              if (markedMsg) {
                console.log("Updating message in state:", msg._id);
                return { ...msg, read: true };
              }
              return msg;
            });
            
            console.log("Updated messages state:", updatedMessages);
            dispatch(setMessages(updatedMessages));
          } catch (error) {
            console.error("Error marking messages as read:", error);
          } finally {
            setIsMarkingRead(false);
          }
        } else {
          console.log("No unread messages to mark");
          dispatch(setMessages(messages));
        }
      } else {
        console.log("No active chat, updating messages directly");
        dispatch(setMessages(messages));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      dispatch(setError('Mesajlar alınamadı.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeChat?._id || !content.trim()) return;
    
    try {
      const response = await MessageService.sendMessage(activeChat._id, content.trim());
      console.log("Message sent:", response);
      setContent("");
      // Mesaj gönderildikten sonra mesajları yenile
      await fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      dispatch(setError("Mesaj gönderilemedi."));
    }
  };

  const getUnreadCount = (userId) => {
    const count = messages?.filter(
      (msg) =>
        !msg.read &&
        msg.sender._id === userId &&
        msg.receiver._id === user._id
    ).length || 0;
    console.log(`Unread count for user ${userId}:`, count);
    return count;
  };

  const getLastMessage = (userId) => {
    const userMessages = messages?.filter(
      (msg) =>
      (msg.sender._id === userId && msg.receiver._id === user._id) || 
      (msg.sender._id === user._id && msg.receiver._id === userId)
    );
    return (
      userMessages?.[userMessages.length - 1]?.content || "Henüz mesaj yok"
    );
  };

  const getTotalUnreadCount = () => {
    const count = messages?.filter(
      (msg) => !msg.read && msg.receiver._id === user._id
    ).length || 0;
    console.log("Total unread count:", count);
    return count;
  };

  // Mesajlardan ekstra kullanıcıları bul (friends/coach olmayanlar)
  const extraUsers = user && messages
    ? Array.from(new Set(
        messages
          .map(msg => (msg.sender._id === user._id ? msg.receiver : msg.sender))
          .filter(u =>
            !friends.some(f => f._id === u._id) &&
            (!coach || coach._id !== u._id)
          )
          .map(u => u._id)
      ))
        .map(id =>
          messages
            .map(msg => (msg.sender._id === user._id ? msg.receiver : msg.sender))
            .find(u => u._id === id)
        )
    : [];

  const handleChatClick = async (chatUser) => {
    setActiveChat(chatUser);
    setIsOpen(true);
    
    // Aktif sohbet ayarlandıktan sonra mesajları yenile ve okundu olarak işaretle
    const config = getAuthConfig();
    if (!config) return;
    
    try {
      const res = await axios.get("http://localhost:5000/api/messages", config);
      const messages = res.data;
      
      // Bu kullanıcıdan gelen okunmamış mesajları bul
      const unreadMsgs = messages.filter(
        msg => !msg.read && 
        msg.sender._id === chatUser._id && 
        msg.receiver._id === user._id
      );
      
      console.log("Unread messages for chat:", unreadMsgs);
      
      if (unreadMsgs.length > 0) {
        setIsMarkingRead(true);
        try {
          // Tüm okunmamış mesajları işaretle
          const markPromises = unreadMsgs.map(async (msg) => {
            console.log("Marking message as read:", msg._id);
            const response = await MessageService.markAsRead(msg._id);
            console.log("Mark as read response:", response);
            return response;
          });
          
          const markedMessages = await Promise.all(markPromises);
          console.log("Marked messages:", markedMessages);
          
          // Mesajları güncelle
          const updatedMessages = messages.map(msg => {
            const markedMsg = markedMessages.find(m => m._id === msg._id);
            if (markedMsg) {
              console.log("Updating message in state:", msg._id);
              return { ...msg, read: true };
            }
            return msg;
          });
          
          console.log("Updated messages state:", updatedMessages);
          dispatch(setMessages(updatedMessages));
        } catch (error) {
          console.error("Error marking messages as read:", error);
        } finally {
          setIsMarkingRead(false);
        }
      } else {
        dispatch(setMessages(messages));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      dispatch(setError('Mesajlar alınamadı.'));
    }
  };

  useEffect(() => {
    // Fetch coach's athletes if user is a coach
    if (user?.userType === 'coach') {
      const fetchCoachAthletes = async () => {
        try {
          const response = await api.get('/coaches/athletes');
          setCoachAthleteIds(response.data.map(a => a._id));
        } catch (err) {
          setCoachAthleteIds([]);
        }
      };
      fetchCoachAthletes();
    }
  }, [user?.userType, user?._id]);

  if (!user?._id) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <div className="relative">
          <button
            onClick={() => handleChatClick(null)}
            className="bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:bg-yellow-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
          {getTotalUnreadCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {getTotalUnreadCount()}
            </span>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg shadow-xl w-[410px] h-[440px] flex flex-col border border-gray-700">
          <div className="p-3 bg-yellow-500 text-black rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Mesajlar</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex">
            {/* Sohbet Listesi */}
            <div className="w-1/2 border-r border-gray-700 overflow-y-auto p-2">
              <div className="space-y-2">
                {[...(coach ? [coach] : []), ...friends, ...extraUsers].map(listedekiKisi => {
                  const displayName = listedekiKisi.profile?.fullName || listedekiKisi.fullName || 'Bilinmeyen Kullanıcı';
                  const kisiUserType = listedekiKisi.userType 
                    || listedekiKisi.profile?.userType 
                    || (listedekiKisi._id === user?.coach?._id ? 'coach' : 'athlete');
                  let userTypeLabel = '';
                  if (kisiUserType === 'coach') {
                    if (listedekiKisi._id === user?.coach?._id) {
                      userTypeLabel = 'Antrenör (Senin antrenörün)';
                    } else {
                      userTypeLabel = 'Antrenör';
                    }
                  } else if (kisiUserType === 'athlete') {
                    if (user?.userType === 'coach' && coachAthleteIds.includes(listedekiKisi._id)) {
                      userTypeLabel = 'Sporcu (Senin sporcun)';
                    } else {
                      userTypeLabel = 'Sporcu';
                    }
                  } else {
                    userTypeLabel = 'Kullanıcı';
                  }

                  return (
                    <div
                      key={listedekiKisi._id}
                      onClick={() => handleChatClick(listedekiKisi)}
                      className={`p-3 cursor-pointer hover:bg-gray-800 rounded-lg ${activeChat?._id === listedekiKisi._id ? 'bg-gray-800' : ''}`}
                    >
                      <div className="flex flex-col items-start whitespace-normal break-words">
                        <span className="text-base font-semibold text-white">{displayName}</span>
                        <span className="text-xs text-gray-400 mt-1">{userTypeLabel}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-1">{getLastMessage(listedekiKisi._id)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mesaj Alanı */}
            <div className="w-2/3 flex flex-col">
              {activeChat ? (
                <>
                  <div className="p-2 border-b border-gray-700">
                    <h4 className="font-medium text-white">
                      {activeChat.fullName || activeChat.profile?.fullName}
                    </h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {messages
                      ?.filter(
                        (msg) =>
                          (msg.sender._id === activeChat._id &&
                            msg.receiver._id === user._id) ||
                          (msg.sender._id === user._id &&
                            msg.receiver._id === activeChat._id)
                      )
                      .map((msg) => (
                      <div
                        key={msg._id}
                        className={`p-2 rounded-lg max-w-[80%] ${
                          msg.sender._id === user._id
                              ? "bg-yellow-500 text-black ml-auto"
                              : "bg-gray-800 text-white"
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form
                    onSubmit={handleSend}
                    className="p-2 border-t border-gray-700"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Mesajınız..."
                        className="flex-1 p-2 border rounded bg-gray-800 text-white border-gray-700 text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-yellow-500 text-black px-3 py-2 rounded hover:bg-yellow-600 w-20 min-w-fit text-sm"
                      >
                        Gönder
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Sohbet başlatmak için bir kişi seçin
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget; 
