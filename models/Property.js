// import mongoose from "mongoose";

// const PropertySchema = new mongoose.Schema({
//   propertyId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   clientId: {
//     type: String,
//     required: true
//   },
//   city: {
//     type: String,
//     required: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   locality: {
//     type: String,
//     required: true
//   },
//   street: {
//     type: String,
//     required: true
//   },
//   registrationId: {
//     type: String,
//     required: true,
//     // unique: true,
    
//   },
//   gstNo: {
//     type: String,
//     required: true
//   },
//   cgstNo: String,
//   sgstNo: String,
//   location: {
//     type: {
//       type: String,
//       enum: ['Point'],
//       default: 'Point'
//     },
//     coordinates: {
//       type: [Number],
//       index: '2dsphere'
//     }
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected', 'revision_requested'],
//     default: 'pending'
//   },
//   approvedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin'
//   },
//   rejectedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin'
//   },
//   rejectionReason: String,
//   revisionNotes: String,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ✅ Correct Indexes
// PropertySchema.index({ propertyId: 1 }, { unique: true });
// // PropertySchema.index({ registrationId: 1 }, { unique: true });

// const Property = mongoose.model("Property", PropertySchema);
// export default Property;


import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema({
  propertyId: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  locality: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  registrationId: {
    type: String,
    required: true,
  },
  gstNo: {
    type: String,
    required: true
  },
  cgstNo: String,
  sgstNo: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'revision_requested'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectionReason: String,
  revisionNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PropertySchema.index({ propertyId: 1 }, { unique: true });
// registrationId is no longer unique in the DB (manual drop the index in DB)



const Property = mongoose.model("Property", PropertySchema);
export default Property;
