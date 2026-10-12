/**
 * Chat Controller
 * Manages direct messaging conversations, message history, real-time broadcasts,
 * and unread status tracking
 */

const mongoose = require('mongoose');
const { Conversation, Message, User } = require('../models');
const logger = require('../utils/logger');

// @desc    Get or initiate a conversation with another user
// @route   POST /api/chat/conversations
// @access  Private
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { recipientId, serviceRequestId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient user ID is required.',
      });
    }

    if (req.user._id.toString() === recipientId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot initiate a conversation with yourself.',
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.',
      });
    }

    // Check if a conversation already exists between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    })
      .populate('participants', 'name email phone role city area profileImage')
      .populate('serviceRequestId', 'serviceType status finalPrice');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        serviceRequestId: serviceRequestId || null,
        lastMessage: 'Conversation started',
        lastMessageAt: new Date(),
      });

      await conversation.populate('participants', 'name email phone role city area profileImage');
      if (serviceRequestId) {
        await conversation.populate('serviceRequestId', 'serviceType status finalPrice');
      }

      logger.info(`New conversation initiated between ${req.user.name} and ${recipient.name}`);
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for the logged in user
// @route   GET /api/chat/conversations
// @access  Private
const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email phone role city area profileImage')
      .populate('serviceRequestId', 'serviceType status finalPrice')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get message history for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Security check: Must be a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a participant in this conversation.',
      });
    }

    const messages = await Message.find({ conversationId: id })
      .populate('senderId', 'name profileImage role')
      .sort({ createdAt: 1 });

    // Mark unread messages addressed to current user as read
    await Message.updateMany(
      {
        conversationId: id,
        receiverId: req.user._id,
        isRead: false,
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and message text are required.',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation thread not found.',
      });
    }

    // Security check
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a participant in this conversation.',
      });
    }

    // Identify the receiver
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    // Create Message
    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId,
      text: text.trim(),
    });

    // Populate sender info
    await message.populate('senderId', 'name profileImage role');

    // Update Conversation with last message and timestamp
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Broadcast message via Socket.IO if active
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('receive_message', message);
      io.to(`user_${receiverId}`).emit('new_message_notification', {
        conversationId,
        message,
        sender: {
          _id: req.user._id,
          name: req.user.name,
          profileImage: req.user.profileImage,
        },
      });
    }

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation messages as read
// @route   PATCH /api/chat/conversations/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Message.updateMany(
      {
        conversationId: id,
        receiverId: req.user._id,
        isRead: false,
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrCreateConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
};
