import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  getConversations, 
  getMessages, 
  searchUsers,
  getAllUsers,
  getUnreadCount 
} from '../services/chatService';

const Chat = () => {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations and all users on mount
  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    loadAllUsers();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('message:received', (message) => {
      // Update messages if chat is open
      if (selectedUser && 
          (message.sender_id === selectedUser.id || message.recipient_id === selectedUser.id)) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read if we're viewing the conversation
        if (message.recipient_id === user.id) {
          socket.emit('message:read', { messageId: message.id });
        }
      }
      
      // Update conversations list
      loadConversations();
      loadUnreadCount();
    });

    socket.on('typing:start', (data) => {
      if (selectedUser && data.userId === selectedUser.id) {
        setIsTyping(true);
      }
    });

    socket.on('typing:stop', (data) => {
      if (selectedUser && data.userId === selectedUser.id) {
        setIsTyping(false);
      }
    });

    socket.on('message:read', (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, is_read: true, read_at: data.readAt }
            : msg
        )
      );
    });

    return () => {
      socket.off('message:received');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('message:read');
    };
  }, [socket, selectedUser, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await getAllUsers();
      console.log('Loaded all users:', response);
      if (response.success) {
        setAllUsers(response.data);
        console.log(`Loaded ${response.data.length} users`);
      }
    } catch (error) {
      console.error('Error loading all users:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await getMessages(userId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleUserSelect = async (selectedUser) => {
    setSelectedUser(selectedUser);
    setSearchQuery('');
    setSearchResults([]);
    setShowAllUsers(false);
    await loadMessages(selectedUser.id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser || !socket) return;

    socket.emit('message:send', {
      recipient_id: selectedUser.id,
      content: newMessage.trim()
    });

    setNewMessage('');
    
    // Stop typing indicator
    socket.emit('typing:stop', { recipient_id: selectedUser.id });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedUser) return;

    // Start typing indicator
    socket.emit('typing:start', { recipient_id: selectedUser.id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { recipient_id: selectedUser.id });
    }, 2000);
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowAllUsers(false);
      return;
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await searchUsers(query);
      console.log('Search response:', response);
      if (response.success) {
        setSearchResults(response.data);
        setShowAllUsers(true);
        console.log(`Found ${response.data.length} users`);
      } else {
        console.error('Search failed:', response.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setSearchResults([]);
    }
  };

  const handleBrowseAllUsers = () => {
    setShowAllUsers(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Messages</h2>
          {unreadCount > 0 && (
            <span className="inline-block px-2 py-1 text-xs bg-teal-500 text-white rounded-full">
              {unreadCount} unread
            </span>
          )}
          
          {/* Connection Status */}
          <div className="flex items-center gap-2 mt-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Search Users */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
          />
          <button
            onClick={handleBrowseAllUsers}
            className="w-full px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Browse All Users ({allUsers.length})
          </button>
        </div>

        {/* Search Results or All Users */}
        {showAllUsers && (
          <div className="border-b border-gray-200">
            <div className="p-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase flex justify-between items-center">
              <span>{searchResults.length > 0 ? 'Search Results' : 'All Users'}</span>
              <button 
                onClick={() => setShowAllUsers(false)}
                className="text-teal-600 hover:text-teal-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {(searchResults.length > 0 ? searchResults : allUsers).map((searchUser) => (
                <div
                  key={searchUser.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                  onClick={() => handleUserSelect(searchUser)}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {searchUser.first_name[0]}{searchUser.last_name[0]}
                    </div>
                    {isUserOnline(searchUser.id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {searchUser.first_name} {searchUser.last_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{searchUser.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Search for users to start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.user.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedUser?.id === conv.user.id ? 'bg-teal-50' : ''
                }`}
                onClick={() => handleUserSelect(conv.user)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {conv.user.first_name[0]}{conv.user.last_name[0]}
                    </div>
                    {isUserOnline(conv.user.id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-800 truncate">
                        {conv.user.first_name} {conv.user.last_name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTime(conv.lastMessage.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage.sender_id === user.id ? 'You: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-teal-500 text-white rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                </div>
                {isUserOnline(selectedUser.id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {isUserOnline(selectedUser.id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isSent = message.sender_id === user.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-sm ${isSent ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isSent
                            ? 'bg-teal-500 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                      </div>
                      <div className={`mt-1 text-xs text-gray-500 ${isSent ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.created_at)}
                        {isSent && message.is_read && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-2 rounded-lg shadow">
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
            <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={newMessage}
                  onChange={handleTyping}
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newMessage.trim() || !isConnected}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-4 text-lg font-medium">Select a conversation</p>
              <p className="mt-2 text-sm">Choose a user from the list or search to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
