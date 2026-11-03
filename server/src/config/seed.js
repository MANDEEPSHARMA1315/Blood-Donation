const mongoose = require('mongoose');
const User = require('../models/User');
const DonorProfile = require('../models/DonorProfile');
const Camp = require('../models/Camp');
const Appointment = require('../models/Appointment');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const CampTask = require('../models/CampTask');
const DonationRecord = require('../models/DonationRecord');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedDemoData = async ({ silent = false } = {}) => {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  try {
    log('[Seed] Cleaning up existing collections...');
    await Promise.all([
      User.deleteMany({}),
      DonorProfile.deleteMany({}),
      Camp.deleteMany({}),
      Appointment.deleteMany({}),
      VolunteerAssignment.deleteMany({}),
      CampTask.deleteMany({}),
      DonationRecord.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    log('[Seed] Creating demo users...');
    const defaultPassword = 'Password123!';

    // 1. Admin
    const adminUser = await User.create({
      name: 'Dr. Vikram Malhotra (Admin)',
      email: 'admin@blooddonation.org',
      password: defaultPassword,
      role: 'admin',
      phone: '+91 98765 43210',
    });

    // 2. Coordinator
    const coordinatorUser = await User.create({
      name: 'Ananya Iyer (Camp Coordinator)',
      email: 'coordinator@blooddonation.org',
      password: defaultPassword,
      role: 'coordinator',
      phone: '+91 98111 22334',
    });

    // 3. Volunteer
    const volunteerUser = await User.create({
      name: 'Rohan Gupta (Volunteer)',
      email: 'volunteer@blooddonation.org',
      password: defaultPassword,
      role: 'volunteer',
      phone: '+91 99222 33445',
    });

    // 4. Primary Donor
    const primaryDonor = await User.create({
      name: 'Pooja Sharma (Donor)',
      email: 'donor@blooddonation.org',
      password: defaultPassword,
      role: 'donor',
      phone: '+91 97333 44556',
    });

    const primaryDonorProfile = await DonorProfile.create({
      user: primaryDonor._id,
      bloodGroup: 'O+',
      dateOfBirth: new Date('1996-05-14'),
      gender: 'female',
      emergencyContact: {
        name: 'Rajesh Sharma',
        relation: 'Spouse',
        phone: '+91 97333 44550',
      },
      address: {
        street: 'Flat 402, Lotus Residency',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      consentToStoreData: true,
      consentToContact: true,
      medicalDisclaimerAcknowledged: true,
      lastDonationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago (eligible now!)
      totalDonationsCount: 3,
      eligibleToDonateAfter: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    // Additional Donors
    const extraDonorsData = [
      { name: 'Arjun Patel', email: 'arjun.patel@example.com', bloodGroup: 'A+', gender: 'male', phone: '+91 98220 11223', city: 'New Delhi' },
      { name: 'Sneha Reddy', email: 'sneha.reddy@example.com', bloodGroup: 'B+', gender: 'female', phone: '+91 98330 22334', city: 'Gurugram' },
      { name: 'Kabir Das', email: 'kabir.das@example.com', bloodGroup: 'AB+', gender: 'male', phone: '+91 98440 33445', city: 'Noida' },
      { name: 'Meera Nair', email: 'meera.nair@example.com', bloodGroup: 'O-', gender: 'female', phone: '+91 98550 44556', city: 'New Delhi' },
      { name: 'Aditya Verma', email: 'aditya.verma@example.com', bloodGroup: 'A-', gender: 'male', phone: '+91 98660 55667', city: 'Faridabad' },
    ];

    const createdExtraDonors = [];
    for (const d of extraDonorsData) {
      const u = await User.create({
        name: d.name,
        email: d.email,
        password: defaultPassword,
        role: 'donor',
        phone: d.phone,
      });

      const prof = await DonorProfile.create({
        user: u._id,
        bloodGroup: d.bloodGroup,
        gender: d.gender,
        dateOfBirth: new Date('1998-08-20'),
        address: { street: 'Main Road', city: d.city, state: 'NCR', pincode: '110025' },
        consentToStoreData: true,
        consentToContact: true,
        medicalDisclaimerAcknowledged: true,
        lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        totalDonationsCount: 2,
        eligibleToDonateAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      createdExtraDonors.push({ user: u, profile: prof });
    }

    log('[Seed] Creating demo camps...');
    const now = new Date();
    const upcomingDate1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingDate2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDate3 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Camp 1: Open upcoming camp
    const camp1 = await Camp.create({
      name: 'City Central Lifesaver Blood Drive',
      organizer: 'Red Cross Society & Rotary Club',
      venue: 'City Civic Convention Hall',
      address: 'Barakhamba Road, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      coordinates: { lat: 28.6304, lng: 77.2177 },
      date: upcomingDate1,
      startTime: '09:00',
      endTime: '17:00',
      capacity: 50,
      slotDurationMinutes: 30,
      maxPerSlot: 6,
      bookedCount: 4,
      checkedInCount: 0,
      completedDonationsCount: 0,
      status: 'open',
      coordinators: [coordinatorUser._id],
      contactPerson: 'Ananya Iyer',
      contactPhone: '+91 98111 22334',
      notes: 'Fully air-conditioned indoor facility with 8 phlebotomy stations and refreshment lounge.',
    });

    // Camp 2: Tech Park Drive
    const camp2 = await Camp.create({
      name: 'CyberHub Corporate Blood Donation Camp',
      organizer: 'DLF CyberCity CSR Foundation',
      venue: 'Building 10 Amphitheatre & Medical Room',
      address: 'DLF CyberCity, Phase 2',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      coordinates: { lat: 28.4908, lng: 77.0894 },
      date: upcomingDate2,
      startTime: '10:00',
      endTime: '16:00',
      capacity: 40,
      slotDurationMinutes: 30,
      maxPerSlot: 5,
      bookedCount: 2,
      checkedInCount: 0,
      completedDonationsCount: 0,
      status: 'upcoming',
      coordinators: [coordinatorUser._id],
      contactPerson: 'Dr. Vikram Malhotra',
      contactPhone: '+91 98765 43210',
      notes: 'Dedicated corporate donor wing with digital registration kiosk.',
    });

    // Camp 3: University Drive
    const camp3 = await Camp.create({
      name: 'University Campus Youth Blood Camp',
      organizer: 'National Service Scheme (NSS)',
      venue: 'University Student Union Auditorium',
      address: 'North Campus, Mall Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110007',
      coordinates: { lat: 28.6892, lng: 77.2104 },
      date: upcomingDate3,
      startTime: '09:30',
      endTime: '16:30',
      capacity: 60,
      slotDurationMinutes: 30,
      maxPerSlot: 8,
      bookedCount: 3,
      checkedInCount: 0,
      completedDonationsCount: 0,
      status: 'upcoming',
      coordinators: [coordinatorUser._id],
      contactPerson: 'Ananya Iyer',
      contactPhone: '+91 98111 22334',
      notes: 'Youth volunteer team providing live donor assistance.',
    });

    // Camp 4: Completed Camp
    const camp4 = await Camp.create({
      name: 'Metro Care Community Blood Drive',
      organizer: 'Metro Blood Bank & Lions Club',
      venue: 'Metro Hospital Main Atrium',
      address: 'Sector 62, Electronic City',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      coordinates: { lat: 28.6270, lng: 77.3725 },
      date: pastDate,
      startTime: '09:00',
      endTime: '17:00',
      capacity: 40,
      slotDurationMinutes: 30,
      maxPerSlot: 5,
      bookedCount: 36,
      checkedInCount: 35,
      completedDonationsCount: 34,
      status: 'completed',
      coordinators: [coordinatorUser._id],
      contactPerson: 'Dr. Vikram Malhotra',
      contactPhone: '+91 98765 43210',
      notes: 'Successfully achieved 34 safe units with zero adverse incidents.',
    });

    // Camp 5: Cancelled Camp
    const camp5 = await Camp.create({
      name: 'Sector 15 Charity Blood Camp',
      organizer: 'Rotary Welfare Trust',
      venue: 'Community Center Sector 15',
      address: 'Civil Lines Road, Sector 15',
      city: 'Faridabad',
      state: 'Haryana',
      pincode: '121007',
      coordinates: { lat: 28.4089, lng: 77.3178 },
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      startTime: '09:00',
      endTime: '15:00',
      capacity: 35,
      slotDurationMinutes: 30,
      maxPerSlot: 5,
      bookedCount: 0,
      status: 'cancelled',
      cancellationReason: 'Venue booked for emergency municipal election polling center.',
      coordinators: [coordinatorUser._id],
    });

    log('[Seed] Creating demo appointments...');
    // Pooja Sharma booked for Camp 1
    const appt1 = await Appointment.create({
      camp: camp1._id,
      donor: primaryDonor._id,
      donorProfile: primaryDonorProfile._id,
      slotStartTime: '10:00',
      slotEndTime: '10:30',
      appointmentNumber: 'BDC-2026-10021',
      status: 'confirmed',
      notes: 'First time donating at this venue. Please arrange quick assistance.',
    });

    // Extra donors booked for Camp 1
    await Appointment.create({
      camp: camp1._id,
      donor: createdExtraDonors[0].user._id,
      donorProfile: createdExtraDonors[0].profile._id,
      slotStartTime: '10:00',
      slotEndTime: '10:30',
      appointmentNumber: 'BDC-2026-10022',
      status: 'confirmed',
    });

    await Appointment.create({
      camp: camp1._id,
      donor: createdExtraDonors[1].user._id,
      donorProfile: createdExtraDonors[1].profile._id,
      slotStartTime: '10:30',
      slotEndTime: '11:00',
      appointmentNumber: 'BDC-2026-10023',
      status: 'confirmed',
    });

    await Appointment.create({
      camp: camp1._id,
      donor: createdExtraDonors[2].user._id,
      donorProfile: createdExtraDonors[2].profile._id,
      slotStartTime: '11:00',
      slotEndTime: '11:30',
      appointmentNumber: 'BDC-2026-10024',
      status: 'confirmed',
    });

    // Completed appointment & donation for past camp
    const pastAppt = await Appointment.create({
      camp: camp4._id,
      donor: primaryDonor._id,
      donorProfile: primaryDonorProfile._id,
      slotStartTime: '11:30',
      slotEndTime: '12:00',
      appointmentNumber: 'BDC-2026-08912',
      status: 'completed',
      medicalCheckNotes: 'Donor fit and vitals normal. Hemoglobin 13.8 g/dL.',
    });

    await DonationRecord.create({
      camp: camp4._id,
      appointment: pastAppt._id,
      donor: primaryDonor._id,
      bloodGroup: 'O+',
      unitsCollected: 1,
      volumeMl: 450,
      hemoglobinLevel: 13.8,
      bloodPressure: '120/78',
      pulseRate: 72,
      weightKg: 64,
      phlebotomistName: 'Dr. R. K. Verma',
      verifiedBy: coordinatorUser._id,
      donationStatus: 'successful',
      bagNumber: 'BAG-2026-55421',
      donationDate: pastDate,
      postDonationAdverseEvent: false,
    });

    log('[Seed] Creating volunteer assignments...');
    await VolunteerAssignment.create({
      camp: camp1._id,
      volunteer: volunteerUser._id,
      shiftStartTime: '08:30',
      shiftEndTime: '13:30',
      roleTitle: 'Donor Registration & Token Manager',
      responsibilities: [
        'Welcome donors and check government photo IDs',
        'Verify appointment booking numbers on digital tablet',
        'Issue queue tokens and hand over pre-donation consent forms',
        'Guide first-time donors to medical screening desks',
      ],
      status: 'confirmed',
      notes: 'Morning shift lead volunteer.',
    });

    await VolunteerAssignment.create({
      camp: camp2._id,
      volunteer: volunteerUser._id,
      shiftStartTime: '10:00',
      shiftEndTime: '16:00',
      roleTitle: 'Refreshments & Post-Donation Recovery Care',
      responsibilities: [
        'Monitor resting donors in 15-minute recovery observation zone',
        'Provide electrolyte water, fruit juices, and biscuits',
        'Alert medical staff immediately if any donor feels lightheaded',
        'Distribute blood donation certificates and lapel badges',
      ],
      status: 'assigned',
      notes: 'Full day corporate drive shift.',
    });

    log('[Seed] Creating camp checklist tasks (CampTask)...');
    const camp1Tasks = [
      {
        camp: camp1._id,
        title: 'Calibrate digital hemoglobin meters and blood pressure cuffs',
        category: 'equipment_supply',
        isCompleted: true,
        priority: 'high',
        quantity: 6,
        completedBy: coordinatorUser._id,
        completedAt: new Date(),
        notes: 'Calibrated using certified reference standards.',
      },
      {
        camp: camp1._id,
        title: 'Verify cold storage blood transport coolers & temperature data loggers (2°C - 6°C)',
        category: 'equipment_supply',
        isCompleted: true,
        priority: 'urgent',
        quantity: 4,
        completedBy: coordinatorUser._id,
        completedAt: new Date(),
        notes: 'Pre-chilled gel packs loaded.',
      },
      {
        camp: camp1._id,
        title: 'Phlebotomy beds and emergency oxygen cylinder readiness check',
        category: 'safety',
        isCompleted: true,
        priority: 'urgent',
        quantity: 8,
        completedBy: coordinatorUser._id,
        completedAt: new Date(),
      },
      {
        camp: camp1._id,
        title: 'Biohazard sharps disposal containers and sterile consumable supplies in place',
        category: 'safety',
        isCompleted: true,
        priority: 'high',
        quantity: 10,
        completedBy: coordinatorUser._id,
        completedAt: new Date(),
      },
      {
        camp: camp1._id,
        title: 'Prepare donor refreshment packs (fruit juices, glucose biscuits, water bottles)',
        category: 'readiness',
        isCompleted: false,
        priority: 'medium',
        quantity: 60,
        notes: 'Catering vendor scheduled for delivery 07:30 AM.',
      },
      {
        camp: camp1._id,
        title: 'Conduct morning safety briefing with volunteers and phlebotomists',
        category: 'logistics',
        isCompleted: false,
        priority: 'high',
        quantity: 1,
        notes: 'Scheduled for 08:30 AM before doors open.',
      },
    ];
    await CampTask.insertMany(camp1Tasks);

    log('[Seed] Creating demo notifications...');
    await Notification.create({
      recipient: primaryDonor._id,
      title: 'Appointment Confirmed',
      message: `Your appointment #${appt1.appointmentNumber} at ${camp1.name} is confirmed for ${new Date(camp1.date).toLocaleDateString()} (10:00 - 10:30).`,
      type: 'booking',
      link: '/my-appointments',
      isRead: false,
    });

    await Notification.create({
      recipient: volunteerUser._id,
      title: 'Volunteer Shift Confirmed',
      message: `You are confirmed as 'Donor Registration & Token Manager' for ${camp1.name} on ${new Date(camp1.date).toLocaleDateString()}.`,
      type: 'shift',
      link: '/volunteer-shifts',
      isRead: false,
    });

    await Notification.create({
      recipient: coordinatorUser._id,
      title: 'Camp Preparation Alert',
      message: `${camp1.name} is approaching capacity (4 out of 50 booked). Review equipment readiness checklist.`,
      type: 'camp_update',
      link: `/camp-operations/${camp1._id}`,
      isRead: false,
    });

    log('[Seed] Creating initial audit log entry...');
    await AuditLog.create({
      user: adminUser._id,
      action: 'SYSTEM_SEEDED',
      entityType: 'System',
      details: { environment: 'development', timestamp: new Date() },
      ipAddress: '127.0.0.1',
    });

    log('====================================================');
    log('  ✅ Seed completed successfully with demo accounts:');
    log('  👑 Admin:       admin@blooddonation.org       / Password123!');
    log('  🏥 Coordinator: coordinator@blooddonation.org / Password123!');
    log('  🤝 Volunteer:   volunteer@blooddonation.org   / Password123!');
    log('  🩸 Donor:       donor@blooddonation.org       / Password123!');
    log('====================================================');
  } catch (err) {
    console.error('[Seed] Error during demo data generation:', err);
    throw err;
  }
};

// Allow running standalone: node src/config/seed.js
if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('./database');

  connectDB()
    .then(() => seedDemoData({ silent: false }))
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = { seedDemoData };
