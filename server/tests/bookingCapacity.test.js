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
    name: 'Test Donor',
    email: 'testdonor@example.com',
    password: 'Password123!',
    role: 'donor',
  });
  donorToken = generateToken({ id: donorUser._id, role: donorUser.role, email: donorUser.email });

  testCamp = await Camp.create({
    name: 'Capacity Test Camp',
    organizer: 'Red Cross',
    venue: 'Civic Hall',
    address: '123 Main St',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    startTime: '09:00',
    endTime: '12:00',
    capacity: 2, // Low capacity to test ceiling
    slotDurationMinutes: 30,
    maxPerSlot: 1, // Only 1 allowed per slot
  });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('POST /api/appointments successfully books when slots and capacity are available', async () => {
  const res = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${donorToken}`)
    .send({
      campId: testCamp._id,
      slotStartTime: '09:00',
      slotEndTime: '09:30',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.appointment.slotStartTime, '09:00');

  const updatedCamp = await Camp.findById(testCamp._id);
  assert.equal(updatedCamp.bookedCount, 1);
});

test('POST /api/appointments rejects booking when specific time slot maxPerSlot is exceeded', async () => {
  // Create another donor
  const donor2 = await User.create({
    name: 'Second Donor',
    email: 'second@example.com',
    password: 'Password123!',
    role: 'donor',
  });
  const token2 = generateToken({ id: donor2._id, role: donor2.role, email: donor2.email });

  // Try to book the same slot (09:00 - 09:30) which maxPerSlot = 1
  const res = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${token2}`)
    .send({
      campId: testCamp._id,
      slotStartTime: '09:00',
      slotEndTime: '09:30',
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /fully booked/i);
});

test('POST /api/appointments rejects booking when overall camp capacity is reached', async () => {
  // Donor 2 books slot 09:30 - 10:00 (filling capacity to 2/2)
  const donor2 = await User.findOne({ email: 'second@example.com' });
  const token2 = generateToken({ id: donor2._id, role: donor2.role, email: donor2.email });

  const res2 = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${token2}`)
    .send({
      campId: testCamp._id,
      slotStartTime: '09:30',
      slotEndTime: '10:00',
    });
  assert.equal(res2.status, 201);

  // Donor 3 tries to book slot 10:00 - 10:30 (even though slot is empty, overall camp capacity is 2)
  const donor3 = await User.create({
    name: 'Third Donor',
    email: 'third@example.com',
    password: 'Password123!',
    role: 'donor',
  });
  const token3 = generateToken({ id: donor3._id, role: donor3.role, email: donor3.email });

  const res3 = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${token3}`)
    .send({
      campId: testCamp._id,
      slotStartTime: '10:00',
      slotEndTime: '10:30',
    });

  assert.equal(res3.status, 400);
  assert.equal(res3.body.success, false);
  assert.match(res3.body.message, /capacity has been reached/i);
});
