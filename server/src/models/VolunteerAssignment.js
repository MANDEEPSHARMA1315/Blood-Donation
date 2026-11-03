const mongoose = require('mongoose');

const volunteerAssignmentSchema = new mongoose.Schema(
  {
    camp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
      required: true,
      index: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shiftStartTime: {
      type: String,
      required: true,
      default: '09:00',
    },
    shiftEndTime: {
      type: String,
      required: true,
      default: '17:00',
    },
    roleTitle: {
      type: String,
      required: true,
      default: 'Camp Volunteer',
    },
    responsibilities: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['assigned', 'confirmed', 'attended', 'absent', 'declined'],
      default: 'assigned',
      index: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    hoursLogged: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VolunteerAssignment', volunteerAssignmentSchema);
