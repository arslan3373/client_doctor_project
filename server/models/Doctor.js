import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: [true, 'Please add a specialization'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Please add years of experience']
  },
  fee: {
    type: Number,
    required: [true, 'Please add consultation fee']
  },
  availableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  availableTimeSlots: [{
    day: String,
    slots: [String] // e.g., ['09:00', '10:00', '11:00']
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model('Doctor', doctorSchema);
