const jwt = require('jsonwebtoken');
const { Message, User } = require('../models');

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

        const { recipient_id, content } = data;

        // Create message in database
        const message = await Message.create({
          sender_id: socket.userId,
          recipient_id,
          content
        });

        // Fetch complete message with user data
        const completeMessage = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'first_name', 'last_name', 'email', 'role']
            },
            {
              model: User,
              as: 'recipient',
              attributes: ['id', 'first_name', 'last_name', 'email', 'role']
            }
          ]
        });

        // Send to sender
        socket.emit('message:received', completeMessage);

        // Send to recipient if online
        io.to(`user:${recipient_id}`).emit('message:received', completeMessage);

        console.log(`Message sent from ${socket.userId} to ${recipient_id}`);
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
