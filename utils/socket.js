// import { Server } from 'socket.io';
// import Conversation from '../models/Conversation.js';

// export const init = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: [
//         "https://api.livyco.com",
//         "http://localhost:5000",
//         "http://localhost:5173",
//         "https://livyco.com",
//         "http://82.29.161.78:5000",
//         "livyco-b65f5.firebaseapp.com",
//         "livyco-b65f5.web.app"
//       ],
//       methods: ["GET", "POST"],
//       credentials: true
//     }
//   });

//   io.on('connection', (socket) => {
//     console.log(`New client connected: ${socket.id}`);

//     // Join conversation room
//     socket.on('joinConversation', async ({ conversationId, userId }) => {
//       try {
//         // Verify user is part of conversation
//         const conversation = await Conversation.findOne({
//           _id: conversationId,
//           participants: userId
//         });

//         if (!conversation) {
//           return socket.emit('error', 'Not authorized to join this conversation');
//         }

//         socket.join(conversationId);
//         console.log(`User ${userId} joined conversation ${conversationId}`);
//       } catch (error) {
//         console.error('Join conversation error:', error);
//         socket.emit('error', 'Failed to join conversation');
//       }
//     });

//     // Typing indicator
//     socket.on('typing', ({ conversationId, userId }) => {
//       socket.to(conversationId).emit('typing', userId);
//     });

//     // Stop typing indicator
//     socket.on('stopTyping', ({ conversationId }) => {
//       socket.to(conversationId).emit('stopTyping');
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//       console.log(`Client disconnected: ${socket.id}`);
//     });
//   });

//   return io;
// };