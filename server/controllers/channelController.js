const { Channel, ChannelMember, User, Message } = require('../models');
const { Op } = require('sequelize');

// Create a new channel
exports.createChannel = async (req, res) => {
  try {
    const { name, description, channel_type, member_ids } = req.body;
    const creatorId = req.user.id;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Channel name is required'
      });
    }

    // Create channel
    const channel = await Channel.create({
      name: name.trim(),
      description: description?.trim() || null,
      channel_type: channel_type || 'private',
      created_by: creatorId,
      avatar_color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
    });

    // Add creator as owner
    await ChannelMember.create({
      channel_id: channel.id,
      user_id: creatorId,
      role: 'owner',
      joined_at: new Date()
    });

    // Add other members
    if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
      const memberRecords = member_ids
        .filter(id => id !== creatorId) // Don't add creator twice
        .map(userId => ({
          channel_id: channel.id,
          user_id: userId,
          role: 'member',
          joined_at: new Date()
        }));

      if (memberRecords.length > 0) {
        await ChannelMember.bulkCreate(memberRecords);
      }
    }

    // Fetch complete channel with members
    const completeChannel = await Channel.findByPk(channel.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: ChannelMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'role']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeChannel,
      message: 'Channel created successfully'
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating channel',
      error: error.message
    });
  }
};

// Get all channels for current user
exports.getUserChannels = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all channels where user is a member
    const memberships = await ChannelMember.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Channel,
          as: 'channel',
          where: { is_archived: false },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'first_name', 'last_name']
            },
            {
              model: ChannelMember,
              as: 'members',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'first_name', 'last_name', 'email', 'role']
                }
              ]
            }
          ]
        }
      ],
      order: [['channel', 'created_at', 'DESC']]
    });

    // Get unread message counts for each channel
    const channelsWithUnread = await Promise.all(
      memberships.map(async (membership) => {
        const unreadCount = await Message.count({
          where: {
            channel_id: membership.channel.id,
            created_at: {
              [Op.gt]: membership.last_read_at || membership.joined_at
            },
            sender_id: {
              [Op.ne]: userId // Don't count own messages
            }
          }
        });

        return {
          ...membership.toJSON(),
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: channelsWithUnread
    });
  } catch (error) {
    console.error('Get user channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching channels',
      error: error.message
    });
  }
};

// Get channel by ID
exports.getChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const membership = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: userId
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this channel'
      });
    }

    const channel = await Channel.findByPk(channelId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: ChannelMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'role']
            }
          ]
        }
      ]
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching channel',
      error: error.message
    });
  }
};

// Get channel messages
exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const membership = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: userId
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this channel'
      });
    }

    const messages = await Message.findAll({
      where: { channel_id: channelId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role']
        }
      ],
      order: [['created_at', 'ASC']],
      limit: 100 // Last 100 messages
    });

    // Update last_read_at
    await membership.update({ last_read_at: new Date() });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get channel messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Add members to channel
exports.addChannelMembers = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { member_ids } = req.body;
    const userId = req.user.id;

    // Check if user is admin or owner
    const membership = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: userId,
        role: { [Op.in]: ['owner', 'admin'] }
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add members'
      });
    }

    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Member IDs are required'
      });
    }

    // Get existing members
    const existingMembers = await ChannelMember.findAll({
      where: {
        channel_id: channelId,
        user_id: { [Op.in]: member_ids }
      }
    });

    const existingUserIds = existingMembers.map(m => m.user_id);
    const newUserIds = member_ids.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.json({
        success: true,
        message: 'All users are already members'
      });
    }

    // Add new members
    const memberRecords = newUserIds.map(userId => ({
      channel_id: channelId,
      user_id: userId,
      role: 'member',
      joined_at: new Date()
    }));

    await ChannelMember.bulkCreate(memberRecords);

    res.json({
      success: true,
      message: `Added ${newUserIds.length} new member(s)`,
      added: newUserIds.length
    });
  } catch (error) {
    console.error('Add channel members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding members',
      error: error.message
    });
  }
};

// Remove member from channel
exports.removeChannelMember = async (req, res) => {
  try {
    const { channelId, memberId } = req.params;
    const userId = req.user.id;

    // Check if user is admin or owner, or removing themselves
    if (parseInt(memberId) !== userId) {
      const membership = await ChannelMember.findOne({
        where: {
          channel_id: channelId,
          user_id: userId,
          role: { [Op.in]: ['owner', 'admin'] }
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to remove members'
        });
      }
    }

    // Cannot remove channel owner
    const memberToRemove = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: memberId
      }
    });

    if (!memberToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (memberToRemove.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove channel owner'
      });
    }

    await memberToRemove.destroy();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove channel member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};

// Update channel
exports.updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, description, channel_type } = req.body;
    const userId = req.user.id;

    // Check if user is admin or owner
    const membership = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: userId,
        role: { [Op.in]: ['owner', 'admin'] }
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this channel'
      });
    }

    const channel = await Channel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (channel_type) updates.channel_type = channel_type;

    await channel.update(updates);

    res.json({
      success: true,
      data: channel,
      message: 'Channel updated successfully'
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating channel',
      error: error.message
    });
  }
};

// Delete channel (permanent)
exports.deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Only super_admin or owner can delete
    const membership = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: userId
      }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found or you are not a member'
      });
    }

    // Check if user is super_admin or channel owner
    const user = await User.findByPk(userId);
    if (user.role !== 'super_admin' && membership.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only channel owner or super admin can delete the channel'
      });
    }

    const channel = await Channel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Delete all messages in the channel
    await Message.destroy({ where: { channel_id: channelId } });

    // Delete all members
    await ChannelMember.destroy({ where: { channel_id: channelId } });

    // Delete the channel
    await channel.destroy();

    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting channel',
      error: error.message
    });
  }
};

// Get channel members
exports.getChannelMembers = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Check if user is a member or admin
    const user = await User.findByPk(userId);
    const membership = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: userId
      }
    });

    if (!membership && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view channel members'
      });
    }

    const members = await ChannelMember.findAll({
      where: { channel_id: channelId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'username', 'role']
        }
      ],
      order: [
        ['role', 'ASC'], // owner, admin, member
        ['joined_at', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Get channel members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching channel members',
      error: error.message
    });
  }
};

// Archive channel
exports.archiveChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Only owner can archive
    const membership = await ChannelMember.findOne({
      where: {
        channel_id: channelId,
        user_id: userId,
        role: 'owner'
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Only channel owner can archive the channel'
      });
    }

    const channel = await Channel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    await channel.update({
      is_archived: true,
      archived_at: new Date()
    });

    res.json({
      success: true,
      message: 'Channel archived successfully'
    });
  } catch (error) {
    console.error('Archive channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving channel',
      error: error.message
    });
  }
};
