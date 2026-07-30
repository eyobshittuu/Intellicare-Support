const { Message, User } = require('../models');
const { Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('file');

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique users the current user has chatted with
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: userId },
          { recipient_id: userId }
        ]
      },
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
      ],
      order: [['created_at', 'DESC']]
    });

    // Extract unique conversation partners
    const conversationMap = new Map();
    
    conversations.forEach(msg => {
      const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.recipient : msg.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          user: partner,
          lastMessage: msg,
          unreadCount: 0
        });
      }
      
      // Count unread messages
      if (msg.recipient_id === userId && !msg.is_read) {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    const conversationList = Array.from(conversationMap.values());

    res.json({
      success: true,
      data: conversationList
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            sender_id: userId,
            recipient_id: otherUserId
          },
          {
            sender_id: otherUserId,
            recipient_id: userId
          }
        ]
      },
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
      ],
      order: [['created_at', 'ASC']]
    });

    // Mark messages as read
    await Message.update(
      { 
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          sender_id: otherUserId,
          recipient_id: userId,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipient_id, content } = req.body;

    // Validate recipient exists
    const recipient = await User.findByPk(recipient_id);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const message = await Message.create({
      sender_id: senderId,
      recipient_id,
      content
    });

    // Fetch the complete message with user data
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

    res.status(201).json({
      success: true,
      data: completeMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId } = req.params;

    await Message.update(
      { 
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          sender_id: senderId,
          recipient_id: userId,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};

// Search users for chat (excluding current user)
exports.searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.query;

    console.log('Search query:', query, 'User ID:', userId);

    // If no query provided, return empty array
    if (!query || query.trim().length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchQuery = query.trim();

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        is_active: true,
        [Op.or]: [
          { first_name: { [Op.like]: `%${searchQuery}%` } },
          { last_name: { [Op.like]: `%${searchQuery}%` } },
          { email: { [Op.like]: `%${searchQuery}%` } }
        ]
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
      limit: 10
    });

    console.log(`Found ${users.length} users matching "${searchQuery}"`);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.count({
      where: {
        recipient_id: userId,
        is_read: false
      }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
};

// Get all users (for chat user list)
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        is_active: true
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
      limit: 50
    });

    console.log(`Returning ${users.length} total active users`);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users',
      error: error.message
    });
  }
};

// Upload file for chat
exports.uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const file = req.file;
    
    // Determine resource type based on mimetype
    let resourceType = 'raw';
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'intellicare-chat',
          resource_type: resourceType,
          public_id: `chat-${Date.now()}-${Math.floor(Math.random() * 1000000000)}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    const fileData = {
      filename: result.public_id,
      originalName: file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      mimetype: file.mimetype,
      resourceType: result.resource_type,
      uploadedAt: new Date()
    };

    res.json({
      success: true,
      data: fileData
    });
  } catch (error) {
    console.error('Upload chat file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

exports.upload = upload;
