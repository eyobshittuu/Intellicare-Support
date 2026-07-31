import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { toast } from 'sonner';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  // State
  const [unreadCounts, setUnreadCounts] = useState({
    direct: {}, // { userId: count }
    channels: {}, // { channelId: count }
    total: 0
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    notificationService.getPermission()
  );
  
  // Track active conversation to avoid incrementing unread for it
  const [activeConversation, setActiveConversation] = useState({
    type: null, // 'direct' or 'channel'
    id: null // userId or channelId
  });

  // Initialize notification permission on mount
  useEffect(() => {
    const enabled = localStorage.getItem('notificationsEnabled');
    if (enabled === 'true') {
      setNotificationsEnabled(true);
    }
  }, []);

  /**
   * Request notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(notificationService.getPermission());
    
    if (granted) {
      setNotificationsEnabled(true);
      localStorage.setItem('notificationsEnabled', 'true');
      toast.success('Notifications enabled');
    } else {
      toast.error('Notification permission denied');
    }
    
    return granted;
  }, []);

  /**
   * Toggle notifications on/off
   */
  const toggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      // Enable notifications
      if (notificationPermission !== 'granted') {
        const granted = await requestNotificationPermission();
        return granted;
      } else {
        setNotificationsEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');
        toast.success('Notifications enabled');
        return true;
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');
      toast.info('Notifications disabled');
      return false;
    }
  }, [notificationsEnabled, notificationPermission, requestNotificationPermission]);

  /**
   * Increment unread count for a user or channel
   */
  const incrementUnread = useCallback((type, id) => {
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      
      if (type === 'direct') {
        newCounts.direct = {
          ...prev.direct,
          [id]: (prev.direct[id] || 0) + 1
        };
      } else if (type === 'channel') {
        newCounts.channels = {
          ...prev.channels,
          [id]: (prev.channels[id] || 0) + 1
        };
      }
      
      // Recalculate total
      newCounts.total = 
        Object.values(newCounts.direct).reduce((sum, count) => sum + count, 0) +
        Object.values(newCounts.channels).reduce((sum, count) => sum + count, 0);
      
      return newCounts;
    });
  }, []);

  /**
   * Clear unread count for a user or channel
   */
  const clearUnread = useCallback((type, id) => {
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      
      if (type === 'direct') {
        delete newCounts.direct[id];
      } else if (type === 'channel') {
        delete newCounts.channels[id];
      }
      
      // Recalculate total
      newCounts.total = 
        Object.values(newCounts.direct).reduce((sum, count) => sum + count, 0) +
        Object.values(newCounts.channels).reduce((sum, count) => sum + count, 0);
      
      return newCounts;
    });
  }, []);

  /**
   * Get unread count for a user or channel
   */
  const getUnreadCount = useCallback((type, id) => {
    if (type === 'direct') {
      return unreadCounts.direct[id] || 0;
    } else if (type === 'channel') {
      return unreadCounts.channels[id] || 0;
    }
    return 0;
  }, [unreadCounts]);

  /**
   * Set the active conversation (to avoid incrementing unread for it)
   */
  const setActive = useCallback((type, id) => {
    console.log('[NotificationContext] Setting active conversation:', type, id);
    setActiveConversation({ type, id });
    
    // Also clear unread for this conversation
    if (type && id) {
      clearUnread(type, id);
    }
  }, [clearUnread]);

  /**
   * Clear the active conversation
   */
  const clearActive = useCallback(() => {
    console.log('[NotificationContext] Clearing active conversation');
    setActiveConversation({ type: null, id: null });
  }, []);

  /**
   * Clear all unread counts
   */
  const clearAllUnread = useCallback(() => {
    setUnreadCounts({
      direct: {},
      channels: {},
      total: 0
    });
  }, []);

  // Listen for new messages and show notifications
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (message) => {
      console.log('[NotificationContext] Message received:', message);
      console.log('[NotificationContext] Current user ID:', user.id);
      console.log('[NotificationContext] Message sender ID:', message.sender_id);
      
      // Don't notify for own messages
      if (message.sender_id === user.id) {
        console.log('[NotificationContext] Ignoring own message');
        return;
      }

      const isChannel = !!message.channel_id;
      const senderId = message.sender_id;
      const channelId = message.channel_id;

      console.log('[NotificationContext] Message type:', isChannel ? 'channel' : 'direct');
      console.log('[NotificationContext] Channel ID:', channelId);
      console.log('[NotificationContext] Sender ID:', senderId);

      // Check if we're on an active page (not idle/background)
      const isPageVisible = document.visibilityState === 'visible';
      console.log('[NotificationContext] Page visible:', isPageVisible);
      console.log('[NotificationContext] Active conversation:', activeConversation);
      
      // Don't increment unread if this message is for the active conversation
      const isActiveConversation = 
        (isChannel && activeConversation.type === 'channel' && activeConversation.id === channelId) ||
        (!isChannel && activeConversation.type === 'direct' && activeConversation.id === senderId);
      
      if (isActiveConversation) {
        console.log('[NotificationContext] Message is for active conversation, not incrementing unread');
        // Still show toast but don't increment unread
        const sender = message.sender;
        const senderName = `${sender.first_name} ${sender.last_name}`;
        
        toast.info(`${senderName}${isChannel ? ` in #${message.channel.name}` : ''}`, {
          description: message.content || 'Sent an attachment',
          duration: 2000
        });
        return;
      }
      
      // Increment unread count
      if (isChannel) {
        console.log('[NotificationContext] Incrementing unread for channel:', channelId);
        incrementUnread('channel', channelId);
      } else {
        console.log('[NotificationContext] Incrementing unread for user:', senderId);
        incrementUnread('direct', senderId);
      }

      // Show notification if enabled and page is not visible
      if (notificationsEnabled && !isPageVisible) {
        console.log('[NotificationContext] Showing browser notification');
        notificationService.showMessageNotification(message, isChannel);
      }
      
      // Always show toast for new messages
      const sender = message.sender;
      const senderName = `${sender.first_name} ${sender.last_name}`;
      
      console.log('[NotificationContext] Showing toast notification');
      if (isChannel) {
        toast.info(`${senderName} in #${message.channel.name}`, {
          description: message.content || 'Sent an attachment',
          duration: 3000
        });
      } else {
        toast.info(`New message from ${senderName}`, {
          description: message.content || 'Sent an attachment',
          duration: 3000
        });
      }
    };

    const handleMention = (data) => {
      console.log('[NotificationContext] Mention received:', data);
      const { message, channel_id, everyone } = data;
      const sender = message.sender;
      const senderName = `${sender.first_name} ${sender.last_name}`;
      
      // Show browser notification if enabled
      if (notificationsEnabled) {
        notificationService.showMentionNotification(data);
      }
      
      // Show toast
      if (everyone) {
        toast.warning(`${senderName} mentioned @everyone in #${message.channel.name}`, {
          description: message.content || 'Sent an attachment',
          duration: 5000
        });
      } else if (channel_id) {
        toast.warning(`${senderName} mentioned you in #${message.channel.name}`, {
          description: message.content || 'Sent an attachment',
          duration: 5000
        });
      } else {
        toast.warning(`${senderName} mentioned you`, {
          description: message.content || 'Sent an attachment',
          duration: 5000
        });
      }
    };

    console.log('[NotificationContext] Setting up socket listeners');
    // Socket listeners
    socket.on('message:received', handleNewMessage);
    socket.on('mention:received', handleMention);

    return () => {
      console.log('[NotificationContext] Cleaning up socket listeners');
      socket.off('message:received', handleNewMessage);
      socket.off('mention:received', handleMention);
    };
  }, [socket, user, notificationsEnabled, incrementUnread, activeConversation]);

  // Listen for notification clicks
  useEffect(() => {
    const handleNotificationClick = (event) => {
      const { messageId, senderId, channelId, isChannel } = event.detail;
      
      // Clear unread for this conversation
      if (isChannel) {
        clearUnread('channel', channelId);
      } else {
        clearUnread('direct', senderId);
      }
      
      // Trigger custom event for app to navigate
      const navEvent = new CustomEvent('navigate-to-chat', {
        detail: { messageId, senderId, channelId, isChannel }
      });
      window.dispatchEvent(navEvent);
    };

    window.addEventListener('notification-clicked', handleNotificationClick);
    
    return () => {
      window.removeEventListener('notification-clicked', handleNotificationClick);
    };
  }, [clearUnread]);

  // Update page title with unread count
  useEffect(() => {
    const baseTitle = 'IntelliCare Support';
    
    if (unreadCounts.total > 0) {
      document.title = `(${unreadCounts.total}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [unreadCounts.total]);

  const value = {
    unreadCounts,
    notificationsEnabled,
    notificationPermission,
    requestNotificationPermission,
    toggleNotifications,
    incrementUnread,
    clearUnread,
    getUnreadCount,
    clearAllUnread,
    setActive,
    clearActive,
    activeConversation
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
