import { createContext, useContext, useState } from "react";

export const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, activeChat, setActiveChat }}>
      {children}
    </ChatContext.Provider>
  );
}; 