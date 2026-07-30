const jwt = require('jsonwebtoken');
const { Message, User, Channel, ChannelMember } = require('../models');

// Store online users
const onlineUsers = new Map();

const chatHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        
        // Add user to online users
        onlineUsers.set(decoded.id, socket.id);
        
        // Join personal room
        socket.join(`user:${decoded.id}`);
        
        // Join all user's channel rooms
        const memberships = await ChannelMember.findAll({
          where: { user_id: decoded.id },
          attributes: ['channel_id']
        });
        
        memberships.forEach(membership => {
          socket.join(`channel:${membership.channel_id}`);
        });
        
        // Broadcast user online status
        io.emit('user:online', { userId: decoded.id });
        
        socket.emit('authenticated', { userId: decoded.id });
        console.log(`User ${decoded.id} authenticated`);
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authentication:error', { message: 'Invalid token' });
      }
    });

    // Send message
    socket.on('message:send', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { recipient_id, channel_id, content, attachments, message_type, mentions } = data;

        // Validate: must have either recipient_id OR channel_id
        if (!recipient_id && !channel_id) {
          socket.emit('error', { message: 'Recipient or channel required' });
          return;
        }

        // If channel message, verify membership
        if (channel_id) {
          const membership = await ChannelMember.findOne({
            where: {
              channel_id,
              user_id: socket.userId
            }
          });

          if (!membership) {
            socket.emit('error', { message: 'You are not a member of this channel' });
            return;
          }
        }

        // Create message in database
        const message = await Message.create({
          sender_id: socket.userId,
          recipient_id: recipient_id || null,
          channel_id: channel_id || null,
          content: content || null,
          attachments: attachments || null,
          message_type: message_type || 'text',
          mentions: mentions || null
        });

        // Fetch complete message with user data
        const completeMessage = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'first_name', 'last_name', 'email', 'role']
            },
            recipient_id ? {
              model: User,
              as: 'recipient',
              attributes: ['id', 'first_name', 'last_name', 'email', 'role']
            } : null,
            channel_id ? {
              model: Channel,
              as: 'channel',
              attributes: ['id', 'name', 'channel_type']
            } : null
          ].filter(Boolean)
        });

        if (channel_id) {
          // Send to all channel members
          io.to(`channel:${channel_id}`).emit('message:received', completeMessage);
          console.log(`Channel message sent in channel ${channel_id} by user ${socket.userId}`);
          
          // Send mention notifications
          if (mentions && mentions.user_ids && mentions.user_ids.length > 0) {
            mentions.user_ids.forEach(userId => {
              io.to(`user:${userId}`).emit('mention:received', {
                message: completeMessage,
                channel_id,
                mentioned_by: socket.userId
              });
            });
          }
          
          // Notify everyone in channel if @everyone
          if (mentions && mentions.everyone) {
            const channelMembers = await ChannelMember.findAll({
              where: { channel_id },
              attributes: ['user_id']
            });
            
            channelMembers.forEach(member => {
              if (member.user_id !== socket.userId) {
                io.to(`user:${member.user_id}`).emit('mention:received', {
                  message: completeMessage,
                  channel_id,
                  mentioned_by: socket.userId,
                  everyone: true
                });
              }
            });
          }
        } else {
          // Send to sender
          socket.emit('message:received', completeMessage);
          // Send to recipient if online
          io.to(`user:${recipient_id}`).emit('message:received', completeMessage);
          console.log(`Message sent from ${socket.userId} to ${recipient_id}`);
          
          // Send mention notification for direct message
          if (mentions && mentions.user_ids && mentions.user_ids.includes(recipient_id)) {
            io.to(`user:${recipient_id}`).emit('mention:received', {
              message: completeMessage,
              mentioned_by: socket.userId
            });
          }
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      if (!socket.userId) return;
      
      const { recipient_id } = data;
      io.to(`user:${recipient_id}`).emit('typing:start', {
        userId: socket.userId
      });
    });

    socket.on('typing:stop', (data) => {
      if (!socket.userId) return;
      
      const { recipient_id } = data;
      io.to(`user:${recipient_id}`).emit('typing:stop', {
        userId: socket.userId
      });
    });

    // Mark message as read
    socket.on('message:read', async (data) => {
      try {
        if (!socket.userId) return;

        const { messageId } = data;
        
        await Message.update(
          { 
            is_read: true,
            read_at: new Date()
          },
          {
            where: {
              id: messageId,
              recipient_id: socket.userId
            }
          }
        );

        const message = await Message.findByPk(messageId);
        if (message) {
          // Notify sender that message was read
          io.to(`user:${message.sender_id}`).emit('message:read', {
            messageId,
            readAt: message.read_at
          });
        }
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    // Add reaction to message
    socket.on('message:react', async (data) => {
      try {
        if (!socket.userId) return;

        const { messageId, emoji } = data;
        
        const message = await Message.findByPk(messageId);
        if (!message) return;

        // Get current reactions or initialize
        const reactions = message.reactions || {};
        
        // Toggle reaction
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }
        
        const userIndex = reactions[emoji].indexOf(socket.userId);
        if (userIndex > -1) {
          // Remove reaction
          reactions[emoji].splice(userIndex, 1);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          // Add reaction
          reactions[emoji].push(socket.userId);
        }

        // Update message
        await message.update({ reactions });

        // Broadcast to both users
        const updatedMessage = await Message.findByPk(messageId);
        io.to(`user:${message.sender_id}`).emit('message:reaction', {
          messageId,
          reactions: updatedMessage.reactions
        });
        io.to(`user:${message.recipient_id}`).emit('message:reaction', {
          messageId,
          reactions: updatedMessage.reactions
        });
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    // Update user status
    socket.on('status:update', (data) => {
      if (!socket.userId) return;
      
      const { status } = data;
      // Broadcast status to all users
      io.emit('user:status', {
        userId: socket.userId,
        status
      });
    });

    // Join channel room
    socket.on('channel:join', async (data) => {
      if (!socket.userId) return;
      
      const { channelId } = data;
      
      // Verify membership
      const membership = await ChannelMember.findOne({
        where: {
          channel_id: channelId,
          user_id: socket.userId
        }
      });
      
      if (membership) {
        socket.join(`channel:${channelId}`);
        socket.emit('channel:joined', { channelId });
      } else {
        socket.emit('error', { message: 'Not a member of this channel' });
      }
    });

    // Leave channel room
    socket.on('channel:leave', (data) => {
      if (!socket.userId) return;
      
      const { channelId } = data;
      socket.leave(`channel:${channelId}`);
      socket.emit('channel:left', { channelId });
    });

    // Typing in channel
    socket.on('channel:typing:start', (data) => {
      if (!socket.userId) return;
      
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('channel:typing:start', {
        userId: socket.userId,
        channelId
      });
    });

    socket.on('channel:typing:stop', (data) => {
      if (!socket.userId) return;
      
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('channel:typing:stop', {
        userId: socket.userId,
        channelId
      });
    });

    // Get online users
    socket.on('users:online', () => {
      socket.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user:offline', { userId: socket.userId });
        console.log(`User ${socket.userId} disconnected`);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
};

module.exports = chatHandler;
