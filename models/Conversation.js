// import mongoose from 'mongoose';

// const conversationSchema = new mongoose.Schema({
//   participants: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }],
  
//   pgProperty: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'PGProperty'
//   },
//   lastMessage: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Message'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true }
// });

// // Index for faster querying
// conversationSchema.index({ participants: 1 });
// conversationSchema.index({ pgProperty: 1 });
// conversationSchema.index({ updatedAt: -1 });

// // Virtual populate messages
// conversationSchema.virtual('messages', {
//   ref: 'Message',
//   localField: '_id',
//   foreignField: 'conversation'
// });

// const Conversation = mongoose.model('Conversation', conversationSchema);
// export default Conversation;