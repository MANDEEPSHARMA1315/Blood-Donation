const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    camp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
      required: true,
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    donorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonorProfile',
    },
    slotStartTime: {
      type: String,
      required: true,
    },
    slotEndTime: {
      type: String,
      required: true,
    },
    appointmentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'],
      default: 'confirmed',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    medicalCheckNotes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
