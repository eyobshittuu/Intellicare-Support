/**
 * Notification Service
 * Handles browser notifications and permission management
 */

class NotificationService {
  constructor() {
    this.permission = Notification.permission;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {object} options - Notification options
   */
  show(title, options = {}) {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const defaultOptions = {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto close after 5 seconds if not requireInteraction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  /**
   * Show a message notification
   * @param {object} message - Message object
   * @param {boolean} isChannel - Whether it's a channel message
   */
  showMessageNotification(message, isChannel = false) {
    const sender = message.sender;
    const senderName = `${sender.first_name} ${sender.last_name}`;
    
    let title, body;
    
    if (isChannel) {
      title = `${senderName} in #${message.channel.name}`;
      body = message.content || 'Sent an attachment';
    } else {
      title = `New message from ${senderName}`;
      body = message.content || 'Sent an attachment';
    }

    const notification = this.show(title, {
      body,
      tag: isChannel ? `channel-${message.channel_id}` : `dm-${message.sender_id}`,
      data: {
        messageId: message.id,
        senderId: message.sender_id,
        channelId: message.channel_id,
        isChannel
      }
    });

    if (notification) {
      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Trigger custom event for the app to handle
        const customEvent = new CustomEvent('notification-clicked', {
          detail: notification.data
        });
        window.dispatchEvent(customEvent);
      };
    }

    return notification;
  }

  /**
   * Show a mention notification
   * @param {object} data - Mention data
   */
  showMentionNotification(data) {
    const { message, channel_id, everyone } = data;
    const sender = message.sender;
    const senderName = `${sender.first_name} ${sender.last_name}`;
    
    let title, body;
    
    if (everyone) {
      title = `${senderName} mentioned @everyone`;
      body = `In #${message.channel.name}: ${message.content || 'Sent an attachment'}`;
    } else if (channel_id) {
      title = `${senderName} mentioned you`;
      body = `In #${message.channel.name}: ${message.content || 'Sent an attachment'}`;
    } else {
      title = `${senderName} mentioned you`;
      body = message.content || 'Sent an attachment';
    }

    return this.show(title, {
      body,
      tag: `mention-${message.id}`,
      requireInteraction: true, // Keep mention notifications until clicked
      data: {
        messageId: message.id,
        senderId: message.sender_id,
        channelId: channel_id,
        isMention: true
      }
    });
  }

  /**
   * Check if notifications are supported
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermission() {
    return this.permission;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
