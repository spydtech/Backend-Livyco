// import mongoose from "mongoose";

// const chatSchema = new mongoose.Schema({
//   participants: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//     validate: {
//       validator: function(arr) {
//         return arr.length >= 2; // Minimum 2 participants
//       },
//       message: "Chat must have at least 2 participants"
//     }
//   }],
//   isGroupChat: {
//     type: Boolean,
//     default: false
//   },
//   groupName: {
//     type: String,
//     required: function() {
//       return this.isGroupChat;
//     }
//   },
//   groupImage: String,
//   groupAdmin: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User"
//   },
//   latestMessage: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Message"
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },
//   unreadCount: {
//     type: Map,
//     of: Number,
//     default: {}
//   },
//   archivedBy: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User"
//   }]
// }, {
//   timestamps: true,
//   toJSON: {
//     transform: function(doc, ret) {
//       ret.id = ret._id;
//       delete ret._id;
//       delete ret.__v;
//     }
//   }
// });

// // Compound index for participant queries
// chatSchema.index({ participants: 1, updatedAt: -1 });

// // Update timestamp when latest message changes
// chatSchema.pre('save', function(next) {
//   if (this.isModified('latestMessage')) {
//     this.updatedAt = new Date();
//   }
//   next();
// });

// // Virtual for unread messages count
// chatSchema.virtual('unreadMessages').get(function() {
//   return this.unreadCount || 0;
// });

// export default mongoose.model("Chat", chatSchema);