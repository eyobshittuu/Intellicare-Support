import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Users } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../services/chatService';
import { userService } from '../services/userService';
import { toast } from 'sonner';

const AdminChatWidget = () => {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load admin list
  useEffect(() => {
    if (isOpen) {
      loadAdmins();
    }
  }, [isOpen]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isOpen) return;

    socket.on('message:received', (message) => {
      // Update messages if chat is open with this user
      if (selectedAdmin && 
          (message.sender_id === selectedAdmin.id || message.recipient_id === selectedAdmin.id)) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read
        if (message.recipient_id === user.id) {
          socket.emit('message:read', { messageId: message.id });
        }
      }
    });

    socket.on('typing:start', (data) => {
      if (selectedAdmin && data.userId === selectedAdmin.id) {
        setIsTyping(true);
      }
    });

    socket.on('typing:stop', (data) => {
      if (selectedAdmin && data.userId === selectedAdmin.id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('message:received');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [socket, isOpen, selectedAdmin, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAdmins = async () => {
    try {
      console.log('Loading admins...');
      // Use userService to get all users
      const response = await userService.getUsers();
      console.log('Users response:', response);
      
      if (response.success && response.users) {
        // Filter to only show admins and super admins, exclude self
        const adminUsers = response.users.filter(u => 
          (u.role === 'admin' || u.role === 'super_admin') && u.id !== user.id
        );
        console.log('Filtered admins:', adminUsers);
        setAdmins(adminUsers);
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Failed to load admin list');
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      toast.error('Failed to load admin list');
    }
  };

  const loadAdminsFromUserService = async () => {
    // This function is no longer needed, kept for compatibility
    await loadAdmins();
  };

  const loadMessages = async (adminId) => {
    try {
      const response = await getMessages(adminId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleAdminSelect = async (admin) => {
    setSelectedAdmin(admin);
    setShowUserList(false);
    await loadMessages(admin.id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedAdmin || !socket) return;

    socket.emit('message:send', {
      recipient_id: selectedAdmin.id,
      content: newMessage.trim()
    });

    setNewMessage('');
    
    // Stop typing indicator
    socket.emit('typing:stop', { recipient_id: selectedAdmin.id });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedAdmin) return;

    // Start typing indicator
    socket.emit('typing:start', { recipient_id: selectedAdmin.id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { recipient_id: selectedAdmin.id });
    }, 2000);
  };

  const handleBackToList = () => {
    setShowUserList(true);
    setSelectedAdmin(null);
    setMessages([]);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredAdmins = admins.filter(admin => {
    const fullName = `${admin.first_name} ${admin.last_name}`.toLowerCase();
    const email = admin.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-all hover:scale-110 z-50 flex items-center justify-center"
          title="Admin Chat"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all ${
          isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
        } flex flex-col`}>
          {/* Header */}
          <div className="bg-teal-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} />
              <h3 className="font-semibold">
                {selectedAdmin ? `${selectedAdmin.first_name} ${selectedAdmin.last_name}` : 'Admin Chat'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-teal-700 rounded transition-colors"
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-teal-700 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content - Hidden when minimized */}
          {!isMinimized && (
            <>
              {/* User List or Chat */}
              {showUserList ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search admins..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Admin List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredAdmins.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-sm">No admins found</p>
                      </div>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <div
                          key={admin.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center gap-3"
                          onClick={() => handleAdminSelect(admin)}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {admin.first_name[0]}{admin.last_name[0]}
                            </div>
                            {isUserOnline(admin.id) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {admin.first_name} {admin.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // Chat View
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Back Button */}
                  <div className="p-2 border-b border-gray-200">
                    <button
                      onClick={handleBackToList}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      ← Back to admins
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-sm">No messages yet</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isSent = message.sender_id === user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="max-w-xs">
                              <div
                                className={`px-3 py-2 rounded-lg text-sm ${
                                  isSent
                                    ? 'bg-teal-500 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow'
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                              </div>
                              <div className={`mt-1 text-xs text-gray-500 ${isSent ? 'text-right' : 'text-left'}`}>
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white px-3 py-2 rounded-lg shadow">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={newMessage}
                        onChange={handleTyping}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!newMessage.trim() || !isConnected}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AdminChatWidget;
