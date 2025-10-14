// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema({
//   name: { 
//     type: String, 
//     required: true 
//   },
//   phone: {
//     type: String,
//     required: true,
//     unique: true,
//     match: [/^[0-9]{10,15}$/, 'Enter a valid phone number']
//   },
//   location: { 
//     type: String, 
//     required: true 
//   },
//   clientId: {
//     type: String,
//     unique: true,
//     required: false // Changed from required: true
//   },
//   role: {
//     type: String,
//     enum: ['client', 'user'],
//     default: 'client',
//     required: true
//   }
// }, {
//   timestamps: true,
//   toJSON: {
//     transform: function(doc, ret) {
//       delete ret.__v;
//       delete ret.createdAt;
//       delete ret.updatedAt;
//     }
//   }
// });

// // Generate clientId before saving
// userSchema.pre('save', async function(next) {
//   if (this.isNew && !this.clientId) {
//     try {
//       const prefix = this.role === 'client' ? 'LYVC' : 'LYVU';
//       const lastUser = await this.constructor.findOne({ role: this.role })
//         .sort({ clientId: -1 })
//         .select('clientId')
//         .lean();

//       let sequenceNumber = 1;
//       if (lastUser?.clientId) {
//         const lastSeq = parseInt(lastUser.clientId.replace(prefix, ''), 10);
//         if (!isNaN(lastSeq)) {
//           sequenceNumber = lastSeq + 1;
//         }
//       }

//       this.clientId = `${prefix}${sequenceNumber.toString().padStart(5, '0')}`;
//       this.$isValid('clientId'); // Manually mark the field as valid
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// // Add custom validation to ensure clientId exists before saving
// userSchema.path('clientId').validate(function(value) {
//   return !!value;
// }, 'clientId is required');

// const User = mongoose.model('User', userSchema);
// export default User;



import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9]{10,15}$/, 'Enter a valid phone number']
  },
  location: { 
    type: String, 
    required: true 
  },
  profileImage: {
    type: String
  },
  clientId: {
    type: String,
    unique: true,
    required: false
  },
  role: {
    type: String,
    enum: ['client', 'user'],
    default: 'user',
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dob: {
    type: Date
  },
 aadhaarNumber: {
    type: String,
    unique: true,
    match: [/^\d{12}$/, 'Enter a valid Aadhaar number']
  },
  // aadharPhoto: {
  //   type: String,
  //   required: [true, 'Aadhar photo is required']
  // },
  aadharPhoto: {
  type: String,
  required: false // Make it optional
  },
  whatsappUpdates: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    enum: ['student', 'professional'],
    default: 'student'
  },
  instituteName: String,
  guardianName: String,
  guardianContact: String,
  allocationStatus: {
    type: String,
    enum: ['not allocated', 'allocated', 'terminated'],
    default: 'not allocated'
  },
// In your User model
lastMessage: { 
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Message'
},
lastMessageAt: { 
  type: Date 
},
socketId: { 
  type: String 
},
online: { 
  type: Boolean, 
  default: false 
}
},{
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;
    }
  }
});

// Generate clientId before saving
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.clientId) {
    try {
      const prefix = this.role === 'client' ? 'LYVC' : 'LYVU';
      const lastUser = await this.constructor.findOne({ role: this.role })
        .sort({ clientId: -1 })
        .select('clientId')
        .lean();

      let sequenceNumber = 1;
      if (lastUser?.clientId) {
        const lastSeq = parseInt(lastUser.clientId.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) {
          sequenceNumber = lastSeq + 1;
        }
      }

      this.clientId = `${prefix}${sequenceNumber.toString().padStart(5, '0')}`;
      this.$isValid('clientId'); // Manually mark the field as valid
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
