import Message from '../models/Message.js';
import User from '../models/User.js';

export const getChatUsers = async (userId) => {
  // Get all users except the current user
  const users = await User.find({ _id: { $ne: userId } })
    .sort({ lastMessageAt: -1 })
    .select('-password');
  
  return users;
};

export const getMessagesBetweenUsers = async (userId1, userId2) => {
  const messages = await Message.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ]
  })
  .sort({ createdAt: 1 })
  .populate('sender', 'name avatar')
  .populate('recipient', 'name avatar');

  return messages;
};

export const sendMessage = async ({ sender, recipient, text }) => {
  // Create new message
  const message = new Message({ sender, recipient, text });
  await message.save();
  
  // Update last message for both users
  await User.findByIdAndUpdate(sender, {
    lastMessage: text,
    lastMessageAt: new Date()
  });
  
  await User.findByIdAndUpdate(recipient, {
    lastMessage: text,
    lastMessageAt: new Date()
  });

  // Populate sender and recipient details
  const populatedMessage = await Message.populate(message, [
    { path: 'sender', select: 'name avatar' },
    { path: 'recipient', select: 'name avatar' }
  ]);

  return populatedMessage;
};

export const markMessageAsRead = async (messageId, userId) => {
  const message = await Message.findOneAndUpdate(
    { _id: messageId, recipient: userId, read: false },
    { $set: { read: true } },
    { new: true }
  );

  if (!message) {
    throw new Error('Message not found or already read');
  }

  return message;
};



// import Message from '../models/Message.js';
// import User from '../models/User.js';

// export const getChatUsers = async (userId) => {
//   return await User.find({ _id: { $ne: userId } })
//     .sort({ lastMessageAt: -1 })
//     .select('-password');
// };

// export const getMessagesBetweenUsers = async (userId1, userId2) => {
//   return await Message.find({
//     $or: [
//       { sender: userId1, recipient: userId2 },
//       { sender: userId2, recipient: userId1 }
//     ]
//   })
//   .sort({ createdAt: 1 })
//   .populate('sender', 'name avatar')
//   .populate('recipient', 'name avatar');
// };

// export const createMessage = async ({ sender, recipient, text }) => {
//   const message = await Message.create({ sender, recipient, text });
  
//   await User.findByIdAndUpdate(sender, {
//     lastMessage: text,
//     lastMessageAt: new Date()
//   });
  
//   await User.findByIdAndUpdate(recipient, {
//     lastMessage: text,
//     lastMessageAt: new Date()
//   });

//   return await Message.populate(message, [
//     { path: 'sender', select: 'name avatar' },
//     { path: 'recipient', select: 'name avatar' }
//   ]);
// };

// export const markMessageAsRead = async (messageId, userId) => {
//   const message = await Message.findOneAndUpdate(
//     { _id: messageId, recipient: userId, read: false },
//     { $set: { read: true } },
//     { new: true }
//   );

//   if (!message) throw new Error('Message not found or already read');
//   return message;
// };