const mongoose = require('mongoose');

const campSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Camp name is required'],
      trim: true,
      index: true,
    },
    organizer: {
      type: String,
      required: [true, 'Organizer organization is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.2090 },
    },
    date: {
      type: Date,
      required: [true, 'Camp date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      default: '09:00',
    },
    endTime: {
      type: String,
      required: true,
      default: '17:00',
    },
    capacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
    },
    maxPerSlot: {
      type: Number,
      default: 10,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    checkedInCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedDonationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'open', 'full', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    coordinators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    contactPerson: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Helper to calculate available slots dynamically
campSchema.methods.generateTimeSlots = function () {
  const slots = [];
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);

  let current = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  const duration = this.slotDurationMinutes || 30;

  while (current + duration <= end) {
    const sH = String(Math.floor(current / 60)).padStart(2, '0');
    const sM = String(current % 60).padStart(2, '0');
    const eH = String(Math.floor((current + duration) / 60)).padStart(2, '0');
    const eM = String((current + duration) % 60).padStart(2, '0');

    slots.push({
      startTime: `${sH}:${sM}`,
      endTime: `${eH}:${eM}`,
      label: `${sH}:${sM} - ${eH}:${eM}`,
    });

    current += duration;
  }

  return slots;
};

module.exports = mongoose.model('Camp', campSchema);
