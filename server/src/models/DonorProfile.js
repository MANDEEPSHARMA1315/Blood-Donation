const mongoose = require('mongoose');

const donorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    consentToStoreData: {
      type: Boolean,
      default: true,
      required: true,
    },
    consentToContact: {
      type: Boolean,
      default: true,
    },
    medicalDisclaimerAcknowledged: {
      type: Boolean,
      default: true,
      required: true,
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    totalDonationsCount: {
      type: Number,
      default: 0,
    },
    eligibleToDonateAfter: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DonorProfile', donorProfileSchema);
