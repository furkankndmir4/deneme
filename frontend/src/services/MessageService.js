import { getMessages, sendMessage, markMessageAsRead } from './api';

const MessageService = {
  getMessages: async () => {
    try {
      const response = await getMessages();
      console.log("MessageService - getMessages response:", response);
      return response;
    } catch (error) {
      console.error("MessageService - getMessages error:", error);
      throw error;
    }
  },

  sendMessage: async (receiver, content) => {
    try {
      const response = await sendMessage(receiver, content);
      console.log("MessageService - sendMessage response:", response);
      return response;
    } catch (error) {
      console.error("MessageService - sendMessage error:", error);
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      console.log("MessageService - markAsRead called for message:", id);
      const response = await markMessageAsRead(id);
      console.log("MessageService - markAsRead response:", response);
      return response;
    } catch (error) {
      console.error("MessageService - markAsRead error:", error);
      throw error;
    }
  },
};

export default MessageService; 