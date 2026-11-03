const mongoose = require('mongoose');

const donationRecordSchema = new mongoose.Schema(
  {
    camp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
      index: true,
    },
    unitsCollected: {
      type: Number,
      default: 1,
      min: 0,
    },
    volumeMl: {
      type: Number,
      default: 450,
    },
    hemoglobinLevel: {
      type: Number, // g/dL
      default: 13.0,
    },
    bloodPressure: {
      type: String, // e.g. "120/80"
      default: '120/80',
    },
    pulseRate: {
      type: Number,
      default: 72,
    },
    weightKg: {
      type: Number,
      default: 65,
    },
    phlebotomistName: {
      type: String,
      default: 'Staff Phlebotomist',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    donationStatus: {
      type: String,
      enum: ['successful', 'deferred'],
      default: 'successful',
      index: true,
    },
    deferralReason: {
      type: String,
      default: '',
    },
    bagNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    postDonationAdverseEvent: {
      type: Boolean,
      default: false,
    },
    adverseNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DonationRecord', donationRecordSchema);
