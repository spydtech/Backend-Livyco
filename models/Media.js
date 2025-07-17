import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Property',
    required: true,
  },
  images: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true }, // Using public_id instead of filename
    resource_type: { type: String, required: true }
  }],
  videos: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    resource_type: { type: String, required: true }
  }]
}, { timestamps: true });

const Media = mongoose.model('Media', mediaSchema);

export default Media;