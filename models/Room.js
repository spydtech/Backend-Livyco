import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Property ID is required']
    },
    roomTypes: [{
        type: {
            type: String,
            enum: ['single', 'double', 'triple', 'quad', 'quint', 'hex'],
            required: [true, 'Room type is required']
        },
        label: {
            type: String,
            required: [true, 'Room label is required'],
            default: function () {
                const labels = {
                    single: 'Single Room',
                    double: 'Double Sharing',
                    triple: 'Triple Sharing',
                    quad: 'Four Sharing',
                    quint: 'Five Sharing',
                    hex: 'Six Sharing'
                };
                return labels[this.type] || `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Room`;
            }
        },
        capacity: {
            type: Number,
            required: [true, 'Room capacity is required'],
            min: [1, 'Capacity must be at least 1'],
            default: function () {
                const capacities = {
                    single: 1,
                    double: 2,
                    triple: 3,
                    quad: 4,
                    quint: 5,
                    hex: 6
                };
                return capacities[this.type] || 1;
            }
        },
        availableCount: {
            type: Number,
            default: 0,
            min: [0, 'Available count cannot be negative']
        },
        price: {
            type: Number,
            required: [true, 'Room price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0
        },
        deposit: {
            type: Number,
            default: 0,
            min: [0, 'Deposit cannot be negative']
        },
        amenities: {
            type: [String],
            default: []
        },
        images: {
            type: [String],
            default: []
        }
    }],
    floorConfig: {
        selectedRooms: [{
            type: String,
            enum: ['single', 'double', 'triple', 'quad', 'quint', 'hex'],
            required: true
        }],
        floors: [{
            floor: {
                type: Number,
                required: [true, 'Floor number is required'],
                min: [1, 'Floor number must be at least 1']
            },
            rooms: {
                type: Map,
                of: [String],
                default: () => new Map()
            }
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

roomSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Room = mongoose.model("Room", roomSchema);
export default Room;




// import mongoose from "mongoose";

// const roomSchema = new mongoose.Schema({
//   propertyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property',
//     required: [true, 'Property ID is required']
//   },
//   roomTypes: [{
//     type: {
//       type: String,
//       enum: ['single', 'double', 'triple', 'quad', 'quint', 'hex'],
//       required: [true, 'Room type is required']
//     },
//     label: {
//       type: String,
//       required: [true, 'Room label is required'],
//       default: function () {
//         const labels = {
//           single: 'Single Room',
//           double: 'Double Sharing',
//           triple: 'Triple Sharing',
//           quad: 'Four Sharing',
//           quint: 'Five Sharing',
//           hex: 'Six Sharing'
//         };
//         return labels[this.type] || `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Room`;
//       }
//     },
//     capacity: {
//       type: Number,
//       required: [true, 'Room capacity is required'],
//       min: [1, 'Capacity must be at least 1'],
//       default: function () {
//         const capacities = {
//           single: 1,
//           double: 2,
//           triple: 3,
//           quad: 4,
//           quint: 5,
//           hex: 6
//         };
//         return capacities[this.type] || 1;
//       }
//     },
//     availableCount: {
//       type: Number,
//       default: 0,
//       min: [0, 'Available count cannot be negative']
//     },
//     price: {
//       type: Number,
//       required: [true, 'Room price is required'],
//       min: [0, 'Price cannot be negative'],
//       default: 0
//     },
//     deposit: {
//       type: Number,
//       default: 0,
//       min: [0, 'Deposit cannot be negative']
//     },
//     amenities: {
//       type: [String],
//       default: []
//     },
//     images: {
//       type: [String],
//       default: []
//     }
//   }],
//   floorConfig: {
//     selectedRooms: [{
//       type: String,
//       enum: ['single', 'double', 'triple', 'quad', 'quint', 'hex'],
//       required: true
//     }],
//     floors: [{
//       floor: {
//         type: Number,
//         required: [true, 'Floor number is required'],
//         min: [1, 'Floor number must be at least 1']
//       },
//       rooms: {
//         type: Map,
//         of: String,
//         default: () => new Map() // ✅ FIXED
//       }
//     }]
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// roomSchema.pre('save', function (next) {
//   this.updatedAt = new Date();
//   next();
// });

// const Room = mongoose.model("Room", roomSchema);

// export default Room;
