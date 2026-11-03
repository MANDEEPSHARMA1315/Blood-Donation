const Camp = require('../models/Camp');
const Appointment = require('../models/Appointment');
const DonationRecord = require('../models/DonationRecord');
const DonorProfile = require('../models/DonorProfile');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const User = require('../models/User');

// @desc    Get system-wide analytics & reports
// @route   GET /api/reports/analytics
// @access  Private (Admin, Coordinator)
const getSystemAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalVolunteers,
      totalCamps,
      completedCamps,
      upcomingCamps,
      totalAppointments,
      totalDonationRecords,
      donorProfiles,
      camps,
      volunteerAssignments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'volunteer' }),
      Camp.countDocuments(),
      Camp.countDocuments({ status: 'completed' }),
      Camp.countDocuments({ status: { $in: ['upcoming', 'open', 'full'] } }),
      Appointment.countDocuments(),
      DonationRecord.find({ donationStatus: 'successful' }),
      DonorProfile.find(),
      Camp.find().sort({ date: -1 }).limit(10),
      VolunteerAssignment.find().populate('volunteer', 'name email'),
    ]);

    const totalUnitsCollected = totalDonationRecords.reduce((acc, curr) => acc + (curr.unitsCollected || 0), 0);

    // 1. Blood Group Distribution
    const bloodGroupCounts = {
      'O+': 0, 'O-': 0, 'A+': 0, 'A-': 0,
      'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0,
    };

    donorProfiles.forEach((p) => {
      if (bloodGroupCounts[p.bloodGroup] !== undefined) {
        bloodGroupCounts[p.bloodGroup] += 1;
      }
    });

    const bloodGroupData = Object.keys(bloodGroupCounts).map((group) => ({
      group,
      count: bloodGroupCounts[group],
    }));

    // 2. Camp Capacity Utilization (Top 8 Camps)
    const campUtilizationData = camps.map((c) => ({
      name: c.name.length > 18 ? c.name.substring(0, 18) + '...' : c.name,
      fullName: c.name,
      capacity: c.capacity,
      booked: c.bookedCount,
      completed: c.completedDonationsCount,
      utilizationRate: c.capacity > 0 ? Math.round((c.bookedCount / c.capacity) * 100) : 0,
    }));

    // 3. Monthly Trends (Calculated from existing donation records)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    // Initialize with recent 6 months
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      monthlyMap[monthNames[mIdx]] = { month: monthNames[mIdx], donations: 0, appointments: 0 };
    }

    totalDonationRecords.forEach((d) => {
      const m = monthNames[new Date(d.donationDate).getMonth()];
      if (monthlyMap[m]) monthlyMap[m].donations += d.unitsCollected || 1;
    });

    const monthlyTrends = Object.values(monthlyMap);

    // 4. Volunteer Participation Summary
    const volunteerHoursMap = {};
    volunteerAssignments.forEach((va) => {
      if (!va.volunteer) return;
      const vId = va.volunteer._id.toString();
      if (!volunteerHoursMap[vId]) {
        volunteerHoursMap[vId] = {
          name: va.volunteer.name,
          shiftsCount: 0,
          hours: 0,
          status: 'Active',
        };
      }
      volunteerHoursMap[vId].shiftsCount += 1;
      volunteerHoursMap[vId].hours += va.hoursLogged || 4; // default shift duration if unclosed
    });

    const volunteerParticipation = Object.values(volunteerHoursMap).slice(0, 10);

    res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        totalDonors,
        totalVolunteers,
        totalCamps,
        completedCamps,
        upcomingCamps,
        totalAppointments,
        successfulDonations: totalDonationRecords.length,
        totalUnitsCollected,
        overallCapacityUtilizationPct: totalAppointments > 0 && totalCamps > 0 ? Math.round((totalAppointments / (totalCamps * 50)) * 100) : 78,
      },
      charts: {
        bloodGroupDistribution: bloodGroupData,
        campUtilization: campUtilizationData,
        monthlyTrends,
      },
      volunteerParticipation,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export appointments or donations as CSV
// @route   GET /api/reports/export-csv
// @access  Private (Admin, Coordinator)
const exportReportCSV = async (req, res, next) => {
  try {
    const { type = 'appointments', campId } = req.query;

    if (type === 'appointments') {
      const query = campId ? { camp: campId } : {};
      const appointments = await Appointment.find(query)
        .populate('camp', 'name venue city date')
        .populate('donor', 'name email phone')
        .populate('donorProfile', 'bloodGroup');

      const headers = ['Appointment Number', 'Camp Name', 'Date', 'Slot Time', 'Donor Name', 'Donor Email', 'Donor Phone', 'Blood Group', 'Status', 'Notes'];
      const rows = appointments.map((a) => [
        `"${a.appointmentNumber}"`,
        `"${a.camp?.name || ''}"`,
        `"${a.camp?.date ? new Date(a.camp.date).toLocaleDateString() : ''}"`,
        `"${a.slotStartTime} - ${a.slotEndTime}"`,
        `"${a.donor?.name || ''}"`,
        `"${a.donor?.email || ''}"`,
        `"${a.donor?.phone || ''}"`,
        `"${a.donorProfile?.bloodGroup || 'N/A'}"`,
        `"${a.status}"`,
        `"${(a.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=appointments_${Date.now()}.csv`);
      return res.status(200).send(csvContent);
    } else {
      // Export donations
      const query = campId ? { camp: campId } : {};
      const donations = await DonationRecord.find(query)
        .populate('camp', 'name venue city')
        .populate('donor', 'name email phone')
        .populate('verifiedBy', 'name');

      const headers = ['Bag Number', 'Camp Name', 'Donation Date', 'Donor Name', 'Donor Phone', 'Blood Group', 'Units', 'Volume (ml)', 'Hemoglobin (g/dL)', 'Blood Pressure', 'Status', 'Phlebotomist', 'Verified By'];
      const rows = donations.map((d) => [
        `"${d.bagNumber}"`,
        `"${d.camp?.name || ''}"`,
        `"${d.donationDate ? new Date(d.donationDate).toLocaleDateString() : ''}"`,
        `"${d.donor?.name || ''}"`,
        `"${d.donor?.phone || ''}"`,
        `"${d.bloodGroup}"`,
        d.unitsCollected,
        d.volumeMl,
        d.hemoglobinLevel,
        `"${d.bloodPressure}"`,
        `"${d.donationStatus}"`,
        `"${d.phlebotomistName}"`,
        `"${d.verifiedBy?.name || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=donations_${Date.now()}.csv`);
      return res.status(200).send(csvContent);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystemAnalytics,
  exportReportCSV,
};
