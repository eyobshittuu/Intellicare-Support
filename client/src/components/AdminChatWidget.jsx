import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Users, Paperclip, Image as ImageIcon, File, Smile, Download, ChevronDown, Plus, Hash, UserPlus, Settings } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../services/chatService';
import { userService } from '../services/userService';
import { uploadChatFile } from '../services/chatFileService';
import { getUserChannels, getChannelMessages, createChannel, addChannelMembers } from '../services/channelService';
import { toast } from 'sonner';

// Status options
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-400' },
];

// Common emojis for reactions
const REACTION_EMOJIS = ['👍', '❤️', '😊', '🎉', '👏', '🔥'];

const AdminChatWidget = () => {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'channels'
  const [showUserList, setShowUserList] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userStatus, setUserStatus] = useState('available');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userStatuses, setUserStatuses] = useState({});
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [channelForm, setChannelForm] = useState({ name: '', description: '', channel_type: 'private', member_ids: [] });
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const statusMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Load admin list and channels
  useEffect(() => {
    if (isOpen) {
      loadAdmins();
      loadChannels();
    }
  }, [isOpen]);

  // Load channels
  const loadChannels = async () => {
    try {
      const response = await getUserChannels();
      if (response.success) {
        setChannels(response.data);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      toast.error('Failed to load channels');
    }
  };

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isOpen) return;

    socket.on('message:received', (message) => {
      console.log('Message received:', message);
      console.log('Selected channel:', selectedChannel);
      console.log('Selected admin:', selectedAdmin);
      
      // Direct message
      if (selectedAdmin && message.recipient_id && 
          (message.sender_id === selectedAdmin.id || message.recipient_id === selectedAdmin.id)) {
        console.log('Adding direct message');
        setMessages(prev => [...prev, message]);
        
        if (message.recipient_id === user.id) {
          socket.emit('message:read', { messageId: message.id });
        }
      }
      
      // Channel message
      if (selectedChannel && message.channel_id && message.channel_id === selectedChannel.id) {
        console.log('Adding channel message');
        setMessages(prev => [...prev, message]);
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

    // Channel typing
    socket.on('channel:typing:start', (data) => {
      if (selectedChannel && data.channelId === selectedChannel.id) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      }
    });

    socket.on('channel:typing:stop', (data) => {
      if (selectedChannel && data.channelId === selectedChannel.id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    socket.on('message:reaction', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    });

    socket.on('user:status', (data) => {
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: data.status
      }));
    });

    return () => {
      socket.off('message:received');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('channel:typing:start');
      socket.off('channel:typing:stop');
      socket.off('message:reaction');
      socket.off('user:status');
    };
  }, [socket, isOpen, selectedAdmin, selectedChannel, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAdmins = async () => {
    try {
      console.log('Loading admins...');
      // Use userService to get all users with high limit to get all admins
      const response = await userService.getUsers({ limit: 1000 }); // Set high limit to get all
      console.log('Users response:', response);
      
      if (response.success && response.users) {
        // Filter to only show admins and super admins, exclude self
        const adminUsers = response.users.filter(u => 
          (u.role === 'admin' || u.role === 'super_admin') && u.id !== user.id
        );
        console.log(`Found ${adminUsers.length} admins (excluding self)`);
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
    setSelectedChannel(null); // Clear channel selection
    setShowUserList(false);
    await loadMessages(admin.id);
  };

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setSelectedAdmin(null); // Clear admin selection
    setShowUserList(false);
    await loadChannelMessages(channel.id);
    
    // Join channel room for real-time messages
    if (socket) {
      socket.emit('channel:join', { channelId: channel.id });
    }
  };

  const loadChannelMessages = async (channelId) => {
    try {
      console.log('Loading channel messages for channel:', channelId);
      const response = await getChannelMessages(channelId);
      console.log('Channel messages response:', response);
      if (response.success && response.data) {
        setMessages(response.data);
        console.log('Set channel messages:', response.data);
      }
    } catch (error) {
      console.error('Error loading channel messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleCreateChannel = async () => {
    if (!channelForm.name.trim()) {
      toast.error('Channel name is required');
      return;
    }

    try {
      const response = await createChannel(channelForm);
      if (response.success) {
        toast.success('Channel created successfully!');
        setShowCreateChannelModal(false);
        setChannelForm({ name: '', description: '', channel_type: 'private', member_ids: [] });
        await loadChannels();
        
        // Join the new channel room via socket
        if (socket) {
          socket.emit('channel:join', { channelId: response.data.id });
        }
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || !socket) return;
    if (!selectedAdmin && !selectedChannel) return;

    let attachmentData = null;
    let messageType = 'text';

    // Upload file if attached
    if (selectedFile) {
      try {
        setUploading(true);
        const uploadResult = await uploadChatFile(selectedFile);
        attachmentData = uploadResult.data;
        
        // Determine message type
        if (selectedFile.type.startsWith('image/')) {
          messageType = 'image';
        } else {
          messageType = 'file';
        }
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const messageData = {
      content: newMessage.trim() || null,
      attachments: attachmentData ? [attachmentData] : null,
      message_type: messageType
    };

    // Add recipient or channel ID
    if (selectedChannel) {
      messageData.channel_id = selectedChannel.id;
      // Stop typing in channel
      socket.emit('channel:typing:stop', { channelId: selectedChannel.id });
    } else if (selectedAdmin) {
      messageData.recipient_id = selectedAdmin.id;
      socket.emit('typing:stop', { recipient_id: selectedAdmin.id });
    }

    socket.emit('message:send', messageData);

    setNewMessage('');
    setSelectedFile(null);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;
    if (!selectedAdmin && !selectedChannel) return;

    // Start typing indicator
    if (selectedChannel) {
      socket.emit('channel:typing:start', { channelId: selectedChannel.id });
    } else if (selectedAdmin) {
      socket.emit('typing:start', { recipient_id: selectedAdmin.id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedChannel) {
        socket.emit('channel:typing:stop', { channelId: selectedChannel.id });
      } else if (selectedAdmin) {
        socket.emit('typing:stop', { recipient_id: selectedAdmin.id });
      }
    }, 2000);
  };

  const handleBackToList = () => {
    setShowUserList(true);
    setSelectedAdmin(null);
    setSelectedChannel(null);
    setMessages([]);
    setSelectedFile(null);
    setTypingUsers([]);
    
    // Leave channel room if was in one
    if (selectedChannel && socket) {
      socket.emit('channel:leave', { channelId: selectedChannel.id });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReaction = (messageId, emoji) => {
    if (!socket) return;
    socket.emit('message:react', { messageId, emoji });
  };

  const handleStatusChange = (status) => {
    setUserStatus(status);
    setShowStatusMenu(false);
    if (socket) {
      socket.emit('status:update', { status });
    }
    toast.success(`Status changed to ${status}`);
  };

  const getUserStatus = (userId) => {
    return userStatuses[userId] || 'available';
  };

  const getStatusColor = (status) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'bg-gray-400';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
                {selectedChannel ? (
                  <>
                    <Hash className="inline mr-1" size={16} />
                    {selectedChannel.name}
                  </>
                ) : selectedAdmin ? (
                  `${selectedAdmin.first_name} ${selectedAdmin.last_name}`
                ) : (
                  'Admin Chat'
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Status Indicator with Dropdown */}
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center gap-1 p-1 hover:bg-teal-700 rounded transition-colors"
                  title="Change status"
                >
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(userStatus)}`}></div>
                  <ChevronDown size={14} />
                </button>
                
                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                          userStatus === status.value ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                        <span className="text-sm text-gray-700">{status.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
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
                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                    <div className="flex">
                      <button
                        className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                          activeTab === 'direct' 
                            ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('direct')}
                      >
                        <Users size={16} />
                        Direct
                      </button>
                      <button
                        className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                          activeTab === 'channels' 
                            ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('channels')}
                      >
                        <Hash size={16} />
                        Channels
                      </button>
                    </div>
                  </div>

                  {activeTab === 'direct' ? (
                    <>
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
                                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(getUserStatus(admin.id))}`}></div>
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
                    </>
                  ) : (
                    <>
                      {/* Create Channel Button */}
                      <div className="p-3 border-b border-gray-200">
                        <button
                          onClick={() => setShowCreateChannelModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Plus size={18} />
                          Create Channel
                        </button>
                      </div>

                      {/* Channel List */}
                      <div className="flex-1 overflow-y-auto">
                        {channels.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Hash className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-sm">No channels yet</p>
                            <p className="text-xs mt-1">Create a channel to get started</p>
                          </div>
                        ) : (
                          channels.map((membership) => (
                            <div
                              key={membership.channel.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => handleChannelSelect(membership.channel)}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-lg"
                                  style={{ backgroundColor: membership.channel.avatar_color }}
                                >
                                  #
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                      {membership.channel.name}
                                    </p>
                                    {membership.channel.channel_type === 'private' && (
                                      <span className="text-xs text-gray-500">🔒</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {membership.channel.members?.length || 0} members
                                  </p>
                                </div>
                                {membership.unreadCount > 0 && (
                                  <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    {membership.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
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
                      ← Back to {activeTab === 'channels' ? 'channels' : 'admins'}
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
                            onMouseEnter={() => setHoveredMessageId(message.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            <div className="max-w-xs relative group">
                              <div
                                className={`px-3 py-2 rounded-lg text-sm ${
                                  isSent
                                    ? 'bg-teal-500 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow'
                                }`}
                              >
                                {/* Sender name for channel messages */}
                                {selectedChannel && message.sender && (
                                  <p className={`text-xs font-semibold mb-1 ${isSent ? 'text-teal-100' : 'text-gray-600'}`}>
                                    {message.sender.first_name} {message.sender.last_name}
                                  </p>
                                )}
                                
                                {/* Text content */}
                                {message.content && (
                                  <p className="break-words">{message.content}</p>
                                )}
                                
                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2">
                                    {message.attachments.map((attachment, idx) => (
                                      <div key={idx}>
                                        {message.message_type === 'image' ? (
                                          <a 
                                            href={attachment.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="block"
                                          >
                                            <img 
                                              src={attachment.url} 
                                              alt={attachment.originalName}
                                              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                              style={{ maxHeight: '200px' }}
                                            />
                                          </a>
                                        ) : (
                                          <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2 p-2 rounded ${
                                              isSent ? 'bg-teal-600' : 'bg-gray-100'
                                            } hover:opacity-90 transition-opacity`}
                                          >
                                            <File size={20} />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs truncate">{attachment.originalName}</p>
                                              <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
                                            </div>
                                            <Download size={16} />
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Reactions */}
                              {message.reactions && Object.keys(message.reactions).length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {Object.entries(message.reactions).map(([emoji, users]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(message.id, emoji)}
                                      className={`text-xs px-1.5 py-0.5 rounded-full border ${
                                        users.includes(user.id)
                                          ? 'bg-teal-100 border-teal-300'
                                          : 'bg-gray-100 border-gray-300'
                                      } hover:scale-110 transition-transform`}
                                    >
                                      {emoji} {users.length > 1 ? users.length : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              {/* Reaction button on hover */}
                              {hoveredMessageId === message.id && (
                                <div className={`absolute -top-6 ${isSent ? 'right-0' : 'left-0'} flex gap-1 bg-white shadow-lg rounded-full px-2 py-1 border border-gray-200`}>
                                  {REACTION_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(message.id, emoji)}
                                      className="hover:scale-125 transition-transform text-base"
                                      title={`React with ${emoji}`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                              
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
                  <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white">
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {selectedFile.type.startsWith('image/') ? (
                            <ImageIcon size={16} className="text-teal-600 flex-shrink-0" />
                          ) : (
                            <File size={16} className="text-teal-600 flex-shrink-0" />
                          )}
                          <span className="text-xs text-gray-600 truncate">{selectedFile.name}</span>
                          <span className="text-xs text-gray-400">({formatFileSize(selectedFile.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    
                    <div className="p-3">
                      <div className="flex gap-2 items-end">
                        {/* Attachment button */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Attach file"
                          disabled={uploading}
                        >
                          <Paperclip size={18} />
                        </button>
                        
                        {/* Emoji picker */}
                        <div className="relative" ref={emojiPickerRef}>
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Add emoji"
                          >
                            <Smile size={18} />
                          </button>
                          
                          {showEmojiPicker && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 grid grid-cols-8 gap-1 z-50">
                              {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
                                '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
                                '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
                                '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
                                '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌',
                                '💪', '🙏', '❤️', '💔', '💯', '🔥', '✨', '🎉',
                                '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐'].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleEmojiSelect(emoji)}
                                  className="text-xl hover:scale-125 transition-transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Message input */}
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          value={newMessage}
                          onChange={handleTyping}
                          disabled={uploading}
                        />
                        
                        {/* Send button */}
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={(!newMessage.trim() && !selectedFile) || !isConnected || uploading}
                        >
                          {uploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={() => setShowCreateChannelModal(false)}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Channel</h3>
              <button
                onClick={() => setShowCreateChannelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Channel Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Channel Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., General Discussion"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({...channelForm, name: e.target.value})}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows="3"
                  placeholder="What's this channel about?"
                  value={channelForm.description}
                  onChange={(e) => setChannelForm({...channelForm, description: e.target.value})}
                />
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Channel Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={channelForm.channel_type}
                  onChange={(e) => setChannelForm({...channelForm, channel_type: e.target.value})}
                >
                  <option value="private">Private (Invite only)</option>
                  <option value="public">Public (All admins can see)</option>
                </select>
              </div>

              {/* Add Members */}
              <div>
                <label className="block text-sm font-medium mb-2">Add Members</label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {admins.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500 text-center">No admins available</p>
                  ) : (
                    admins.map(admin => (
                      <label key={admin.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channelForm.member_ids.includes(admin.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setChannelForm({
                                ...channelForm,
                                member_ids: [...channelForm.member_ids, admin.id]
                              });
                            } else {
                              setChannelForm({
                                ...channelForm,
                                member_ids: channelForm.member_ids.filter(id => id !== admin.id)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{admin.first_name} {admin.last_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateChannelModal(false);
                  setChannelForm({ name: '', description: '', channel_type: 'private', member_ids: [] });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={!channelForm.name.trim()}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminChatWidget;
