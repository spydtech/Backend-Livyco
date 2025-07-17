import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'booking_request', 
            'booking_approved', 
            'booking_rejected',
            'payment_received',
            'system_alert'
        ]
    },
    message: {
        type: String,
        required: true
    },
    relatedEntity: {
        type: {
            type: String,
            required: true,
            enum: ['booking', 'payment', 'property']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {  // Additional flexible data storage
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { 
    timestamps: true,  // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },  // Include virtuals when converting to JSON
    toObject: { virtuals: true }  // Include virtuals when converting to plain objects
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;