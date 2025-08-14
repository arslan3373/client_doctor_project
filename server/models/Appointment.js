import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add an appointment date']
  },
  time: {
    type: String,
    required: [true, 'Please add an appointment time']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  symptoms: [{
    type: String
  }],
  diagnosis: {
    type: String
  },
  prescription: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
appointmentSchema.index({ user: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });

export default mongoose.model('Appointment', appointmentSchema);
