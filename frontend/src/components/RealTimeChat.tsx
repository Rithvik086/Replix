import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axiosInstance from '../api/axiosInstance';

interface Message {
  _id: string;
  chatId: string;
  from: string;
  to: string;
  body: string;
  direction: 'in' | 'out';
  timestamp: string;
}

interface Chat {
  chatId: string;
  lastMessage?: Message;
  unreadCount?: number;
}

const RealTimeChat: React.FC = () => {
  const [, setSocket] = useState<Socket | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
    
    socketInstance.on('connect', () => {
      console.log('🔌 Connected to server');
    });

    socketInstance.on('message:new', (message: Message) => {
      console.log('📩 New message received:', message);
      
      // Add to messages if it's for the selected chat
      if (selectedChat && message.chatId === selectedChat) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update chats list
      setChats(prev => {
        const existingChatIndex = prev.findIndex(chat => chat.chatId === message.chatId);
        if (existingChatIndex >= 0) {
          const updated = [...prev];
          updated[existingChatIndex].lastMessage = message;
          return updated;
        } else {
          return [...prev, { chatId: message.chatId, lastMessage: message }];
        }
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [selectedChat]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (chatId: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/messages?chatId=${chatId}&limit=100`);
      const data = response.data.messages || [];
      setMessages(data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await axiosInstance.get('/messages?limit=100');
      const allMessages = response.data.messages || [];
      
      // Group messages by chatId to create chat list
      const chatMap = new Map<string, Chat>();
      
      allMessages.forEach((msg: Message) => {
        if (!chatMap.has(msg.chatId)) {
          chatMap.set(msg.chatId, {
            chatId: msg.chatId,
            lastMessage: msg
          });
        } else {
          const existing = chatMap.get(msg.chatId)!;
          if (new Date(msg.timestamp) > new Date(existing.lastMessage!.timestamp)) {
            existing.lastMessage = msg;
          }
        }
      });
      
      setChats(Array.from(chatMap.values()));
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      setLoading(true);
      await axiosInstance.post('/send-message', {
        to: selectedChat,
        message: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatId = (chatId: string) => {
    // Extract phone number from WhatsApp format (e.g., "1234567890@c.us" -> "+1234567890")
    const phoneNumber = chatId.replace('@c.us', '');
    return phoneNumber.length > 10 ? `+${phoneNumber}` : phoneNumber;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border h-[600px] flex">
      {/* Chat List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Conversations</h3>
        </div>
        <div className="overflow-y-auto h-[500px]">
          {chats.map((chat) => (
            <div
              key={chat.chatId}
              onClick={() => setSelectedChat(chat.chatId)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedChat === chat.chatId ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatChatId(chat.chatId)}
                  </div>
                  {chat.lastMessage && (
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {chat.lastMessage.direction === 'out' ? 'You: ' : ''}
                      {chat.lastMessage.body}
                    </div>
                  )}
                </div>
                {chat.lastMessage && (
                  <div className="text-xs text-gray-400 ml-2">
                    {formatTime(chat.lastMessage.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {formatChatId(selectedChat)}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.direction === 'out'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">{message.body}</div>
                      <div className={`text-xs mt-1 ${
                        message.direction === 'out' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeChat;
