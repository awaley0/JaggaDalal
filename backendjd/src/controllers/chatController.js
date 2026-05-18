import Chat from '../models/Chat.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import cloudinary from '../Utils/cloudinary.js';

const ADMIN_AUTO_GREETING = 'Hello sir, waht are you interested in';

const uploadChatImage = async (imageData) => {
  const uploadResult = await cloudinary.uploader.upload(imageData, {
    folder: 'jagga_dalal/chat',
    resource_type: 'image',
  });

  return {
    secureUrl: uploadResult.secure_url,
    originalName: uploadResult.original_filename || 'shared-image',
  };
};

/**
 * Send a message
 */
export const sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      message,
      propertyId,
      messageType = 'text',
      attachmentUrl,
      attachmentName,
      imageData,
      location,
    } = req.body;
    const senderId = req.user.id;

    const normalizedType = String(messageType || 'text').toLowerCase();
    const trimmedMessage = String(message || '').trim();

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID is required',
      });
    }

    if (!['text', 'image', 'file', 'location'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message type',
      });
    }

    let resolvedAttachmentUrl = attachmentUrl;
    let resolvedAttachmentName = attachmentName;
    let resolvedLocation = null;

    if (normalizedType === 'image') {
      if (imageData) {
        const uploaded = await uploadChatImage(imageData);
        resolvedAttachmentUrl = uploaded.secureUrl;
        resolvedAttachmentName = resolvedAttachmentName || uploaded.originalName;
      }

      if (!resolvedAttachmentUrl) {
        return res.status(400).json({
          success: false,
          error: 'Image message requires an image',
        });
      }
    }

    if (normalizedType === 'location') {
      const latitude = Number(location?.latitude);
      const longitude = Number(location?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({
          success: false,
          error: 'Location message requires valid latitude and longitude',
        });
      }

      resolvedLocation = {
        latitude,
        longitude,
        address: location?.address || '',
        label: location?.label || 'Shared location',
      };
    }

    if (normalizedType === 'text' && !trimmedMessage) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required for text messages',
      });
    }

    if (trimmedMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot exceed 1000 characters',
      });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found',
      });
    }

    // Create and save message
    const newMessage = new Chat({
      sender: senderId,
      receiver: receiverId,
      propertyId,
      message: trimmedMessage,
      messageType: normalizedType,
      attachmentUrl: resolvedAttachmentUrl,
      attachmentName: resolvedAttachmentName,
      location: resolvedLocation,
    });

    const savedMessage = await newMessage.save();

    // Populate sender and receiver info
    await savedMessage.populate('sender', 'name email profileImage');
    await savedMessage.populate('receiver', 'name email profileImage');
    await savedMessage.populate('propertyId', 'title price');

    let autoReply = null;

    // If buyer starts chat with seller/admin, send one automatic reply to kick off the conversation.
    if (req.user.role === 'buyer' && (receiver.role === 'seller' || receiver.role === 'admin')) {
      const sellerHasRepliedBefore = await Chat.exists({
        sender: receiverId,
        receiver: senderId,
      });

      if (!sellerHasRepliedBefore) {
        const autoReplyMessage = new Chat({
          sender: receiverId,
          receiver: senderId,
          propertyId,
          message: receiver.role === 'admin' ? ADMIN_AUTO_GREETING : 'Hello, what are you interested in?',
          messageType: 'text',
        });

        autoReply = await autoReplyMessage.save();
        await autoReply.populate('sender', 'name email profileImage');
        await autoReply.populate('receiver', 'name email profileImage');
        await autoReply.populate('propertyId', 'title price');
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: savedMessage,
      autoReply,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: error.message,
    });
  }
};

/**
 * Buyer sends message directly to admin
 */
export const sendMessageToAdmin = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { propertyId, message } = req.body;

    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        error: 'Only buyers can start admin chat from property details',
      });
    }

    const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'No admin account is available to receive messages',
      });
    }

    const buyerMessage = String(message || '').trim();
    if (!buyerMessage) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const newMessage = new Chat({
      sender: senderId,
      receiver: adminUser._id,
      propertyId,
      message: buyerMessage,
      messageType: 'text',
    });

    const savedMessage = await newMessage.save();
    await savedMessage.populate('sender', 'name email profileImage role');
    await savedMessage.populate('receiver', 'name email profileImage role');
    await savedMessage.populate('propertyId', 'title price');

    let autoReply = null;

    const adminHasRepliedBefore = await Chat.exists({
      sender: adminUser._id,
      receiver: senderId,
    });

    if (!adminHasRepliedBefore) {
      const autoReplyMessage = new Chat({
        sender: adminUser._id,
        receiver: senderId,
        propertyId,
        message: ADMIN_AUTO_GREETING,
        messageType: 'text',
      });

      autoReply = await autoReplyMessage.save();
      await autoReply.populate('sender', 'name email profileImage role');
      await autoReply.populate('receiver', 'name email profileImage role');
      await autoReply.populate('propertyId', 'title price');
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent to admin successfully',
      data: savedMessage,
      autoReply,
      recipient: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        profileImage: adminUser.profileImage || null,
      },
    });
  } catch (error) {
    console.error('Send message to admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send message to admin',
      details: error.message,
    });
  }
};

/**
 * Get messages between two users
 */
export const getMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const messages = await Chat.find({
      $or: [
        { sender: userId, receiver: recipientId },
        { sender: recipientId, receiver: userId },
      ],
      deletedFor: { $ne: userObjectId },
    })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('sender', 'name email profileImage')
      .populate('receiver', 'name email profileImage')
      .populate('propertyId', 'title price');

    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
    });
  }
};

/**
 * Get all conversations for a user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
          deletedFor: { $ne: userObjectId },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', userObjectId] }, '$receiver', '$sender'],
          },
          lastMessage: { $last: '$message' },
          lastMessageTime: { $last: '$createdAt' },
          lastMessageType: { $last: '$messageType' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userObjectId] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
    ]);

    const formattedConversations = conversations.map((conv) => ({
      conversationId: conv._id,
      user: {
        id: conv.userInfo._id,
        name: conv.userInfo.name,
        email: conv.userInfo.email,
        avatar: conv.userInfo.profileImage || null,
      },
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      lastMessageType: conv.lastMessageType,
      unreadCount: conv.unreadCount,
    }));

    res.json({
      success: true,
      conversations: formattedConversations,
      count: formattedConversations.length,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
    });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Chat.updateMany(
      {
        receiver: userId,
        sender: conversationId,
        isRead: false,
        deletedFor: { $ne: userObjectId },
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read',
    });
  }
};

/**
 * Update a message
 */
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    if (String(message).trim().length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot exceed 1000 characters',
      });
    }

    const chatMessage = await Chat.findById(messageId);

    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    if (chatMessage.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to edit this message',
      });
    }

    if (chatMessage.isDeleted) {
      return res.status(400).json({
        success: false,
        error: 'Deleted messages cannot be edited',
      });
    }

    if (chatMessage.messageType !== 'text') {
      return res.status(400).json({
        success: false,
        error: 'Only text messages can be edited',
      });
    }

    chatMessage.message = String(message).trim();
    chatMessage.isEdited = true;
    chatMessage.editedAt = new Date();

    const saved = await chatMessage.save();
    await saved.populate('sender', 'name email profileImage');
    await saved.populate('receiver', 'name email profileImage');
    await saved.populate('propertyId', 'title price');

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: saved,
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message',
    });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const chatMessage = await Chat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Only sender can delete
    if (chatMessage.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this message',
      });
    }

    if (chatMessage.isDeleted) {
      return res.status(400).json({
        success: false,
        error: 'Message already deleted',
      });
    }

    chatMessage.isDeleted = true;
    chatMessage.deletedAt = new Date();
    chatMessage.message = 'This message was deleted';
    chatMessage.attachmentUrl = undefined;
    chatMessage.attachmentName = undefined;
    chatMessage.location = undefined;
    await chatMessage.save();

    res.json({
      success: true,
      message: 'Message deleted successfully',
      messageId,
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
    });
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const unreadCount = await Chat.countDocuments({
      receiver: userId,
      isRead: false,
      deletedFor: { $ne: userObjectId },
    });

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
    });
  }
};

/**
 * Get polling messages (for real-time polling without WebSocket)
 * Fetch messages since a specific timestamp with optional propertyId filter
 */
export const getPollingMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { since, propertyId } = req.query;
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build query
    let query = {
      $or: [
        { sender: userId, receiver: conversationId },
        { sender: conversationId, receiver: userId },
      ],
      deletedFor: { $ne: userObjectId },
    };

    // Filter by timestamp if provided (in milliseconds)
    if (since) {
      query.createdAt = { $gt: new Date(parseInt(since)) };
    }

    // Filter by propertyId if provided
    if (propertyId) {
      query.propertyId = propertyId;
    }

    const messages = await Chat.find(query)
      .sort({ createdAt: 1 })
      .populate('sender', 'name email profileImage role')
      .populate('receiver', 'name email profileImage role')
      .populate('propertyId', 'title price');

    // Mark as read if receiver
    if (messages.length > 0) {
      const unreadMessages = messages.filter((msg) => msg.receiver.toString() === userId && !msg.isRead);

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg) => msg._id);
        await Chat.updateMany(
          { _id: { $in: messageIds } },
          { isRead: true, readAt: new Date() }
        );

        // Update local messages with read status
        messages.forEach((msg) => {
          if (messageIds.some((id) => String(id) === String(msg._id))) {
            msg.isRead = true;
            msg.readAt = new Date();
          }
        });
      }
    }

    res.json({
      success: true,
      messages,
      count: messages.length,
      timestamp: new Date().getTime(), // Current timestamp for next poll
    });
  } catch (error) {
    console.error('Get polling messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
    });
  }
};

/**
 * Delete (hide) entire conversation for current user
 */
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const updateResult = await Chat.updateMany(
      {
        $or: [
          { sender: userId, receiver: conversationId },
          { sender: conversationId, receiver: userId },
        ],
        deletedFor: { $ne: userObjectId },
      },
      {
        $addToSet: { deletedFor: userObjectId },
      }
    );

    res.json({
      success: true,
      message: 'Conversation deleted for your account',
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
    });
  }
};
