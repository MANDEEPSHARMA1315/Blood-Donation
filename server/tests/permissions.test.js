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
let adminToken;
let coordinatorToken;
let donorToken;
let donorUser;
let testCamp;
let testAppointment;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'adminperm@example.com',
    password: 'Password123!',
    role: 'admin',
  });
  adminToken = generateToken({ id: adminUser._id, role: 'admin', email: adminUser.email });

  const coordinatorUser = await User.create({
    name: 'Coord User',
    email: 'coordperm@example.com',
    password: 'Password123!',
    role: 'coordinator',
  });
  coordinatorToken = generateToken({ id: coordinatorUser._id, role: 'coordinator', email: coordinatorUser.email });

  donorUser = await User.create({
    name: 'Donor User',
    email: 'donorperm@example.com',
    password: 'Password123!',
    role: 'donor',
  });
  donorToken = generateToken({ id: donorUser._id, role: 'donor', email: donorUser.email });

  testCamp = await Camp.create({
    name: 'Permissions Camp',
    organizer: 'Red Cross',
    venue: 'Hall',
    address: '10 St',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    date: new Date(Date.now() + 86400000),
    startTime: '09:00',
    endTime: '12:00',
    capacity: 30,
    coordinators: [coordinatorUser._id],
  });

  testAppointment = await Appointment.create({
    camp: testCamp._id,
    donor: donorUser._id,
    slotStartTime: '09:00',
    slotEndTime: '09:30',
    appointmentNumber: 'BDC-2026-TEST1',
    status: 'confirmed',
  });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('Unauthenticated request to protected route returns 401', async () => {
  const res = await request(app).get('/api/appointments');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('Donor role cannot create a camp (returns 403 Forbidden)', async () => {
  const res = await request(app)
    .post('/api/camps')
    .set('Authorization', `Bearer ${donorToken}`)
    .send({
      name: 'Illegal Camp',
      organizer: 'Unauthorized',
      venue: 'Place',
      address: 'Street',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      date: new Date(),
      capacity: 50,
    });

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('Admin role can successfully create a camp', async () => {
  const res = await request(app)
    .post('/api/camps')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Authorized Admin Camp',
      organizer: 'Authorized Org',
      venue: 'Town Center',
      address: 'Central Square',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      date: new Date(Date.now() + 4 * 86400000),
      capacity: 50,
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.camp.name, 'Authorized Admin Camp');
});

test('Donor role cannot perform desk check-in on an appointment (returns 403)', async () => {
  const res = await request(app)
    .put(`/api/camp-ops/appointments/${testAppointment._id}/check-in`)
    .set('Authorization', `Bearer ${donorToken}`);

  assert.equal(res.status, 403);
});

test('Coordinator role can check in a donor (returns 200)', async () => {
  const res = await request(app)
    .put(`/api/camp-ops/appointments/${testAppointment._id}/check-in`)
    .set('Authorization', `Bearer ${coordinatorToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.appointment.status, 'checked_in');
});
