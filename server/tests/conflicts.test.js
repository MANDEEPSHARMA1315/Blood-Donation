const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Camp = require('../src/models/Camp');
const Appointment = require('../src/models/Appointment');
const { generateToken } = require('../src/utils/jwt');

let mongod;
let donorToken;
let donorUser;
let testCamp;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  donorUser = await User.create({
    name: 'Conflict Test Donor',
    email: 'conflictdonor@example.com',
    password: 'Password123!',
    role: 'donor',
  });
  donorToken = generateToken({ id: donorUser._id, role: donorUser.role, email: donorUser.email });

  testCamp = await Camp.create({
    name: 'Conflict Test Camp',
    organizer: 'Lions Club',
    venue: 'Community Center',
    address: '45 Park Avenue',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110002',
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    startTime: '09:00',
    endTime: '13:00',
    capacity: 20,
    slotDurationMinutes: 30,
    maxPerSlot: 5,
  });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('Prevents duplicate/double booking for the same donor in the same camp', async () => {
  // First booking
  const res1 = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${donorToken}`)
    .send({
      campId: testCamp._id,
      slotStartTime: '09:00',
      slotEndTime: '09:30',
    });
  assert.equal(res1.status, 201);

  // Duplicate booking attempt for a different slot in the same camp
  const res2 = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${donorToken}`)
    .send({
      campId: testCamp._id,
      slotStartTime: '10:00',
      slotEndTime: '10:30',
    });

  assert.equal(res2.status, 409);
  assert.equal(res2.body.success, false);
  assert.match(res2.body.message, /already have an active appointment/i);
});

test('Allows cancelling appointment and updates camp bookedCount', async () => {
  const existingAppt = await Appointment.findOne({ donor: donorUser._id, camp: testCamp._id });
  assert.ok(existingAppt);

  const res = await request(app)
    .put(`/api/appointments/${existingAppt._id}/cancel`)
    .set('Authorization', `Bearer ${donorToken}`)
    .send({ cancellationReason: 'Personal emergency' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.appointment.status, 'cancelled');

  const campAfterCancel = await Camp.findById(testCamp._id);
  assert.equal(campAfterCancel.bookedCount, 0);
});
