// controllers/chatController.js
// controllers/chatController.js
import mongoose from 'mongoose'; // Add this at the top
import Message from '../models/Message.js';
import User from '../models/User.js';
import Property from '../models/Property.js';

// Get all conversations for a user
// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all unique users this user has chatted with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          property: { $first: "$property" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property"
        }
      },
      {
        $unwind: "$property"
      },
      {
        $project: {
          "user._id": 1,
          "user.name": 1,
          "user.profileImage": 1,
          "user.online": 1,
          "lastMessage.content": 1,
          "lastMessage.createdAt": 1,
          "lastMessage.read": 1,
          "property._id": 1,
          "property.name": 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

// Get messages between two users for a specific property
// Get messages between two users for a specific property
export const getMessages = async (req, res) => {
  try {
    const { recipientId, propertyId } = req.params;
    const userId = req.user.id;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(recipientId) || 
        !mongoose.Types.ObjectId.isValid(propertyId) ||
        !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        sender: recipientId,
        recipient: userId,
        property: propertyId,
        read: false
      },
      { $set: { read: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId, property: propertyId },
        { sender: recipientId, recipient: userId, property: propertyId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name profileImage');

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};
// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, propertyId, content } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !propertyId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, property, and content are required'
      });
    }

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      property: propertyId,
      content
    });

    await message.save();

    // Update last message for both users
    await User.findByIdAndUpdate(senderId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt
    });

    await User.findByIdAndUpdate(recipientId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt
    });

    // Populate sender info for real-time updates
    const populatedMessage = await Message.populate(message, {
      path: 'sender',
      select: 'name profileImage'
    });

    res.status(201).json({
      success: true,
      message: populatedMessage
    });

    // Emit real-time event (handled by WebSocket)
    if (req.io) {
      const recipientSocket = req.connectedUsers[recipientId];
      if (recipientSocket) {
        req.io.to(recipientSocket).emit('newMessage', populatedMessage);
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.countDocuments({
      recipient: userId,
      read: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};