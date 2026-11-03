const express = require('express');
const router = express.Router();
const {
  checkInDonor,
  recordDonation,
  getCampTasks,
  createCampTask,
  toggleCampTask,
  getCampAttendanceSheet,
} = require('../controllers/campOpsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// Donor check-in & donation recording (Coordinator & Admin)
router.put('/appointments/:id/check-in', requireRole('admin', 'coordinator'), checkInDonor);
router.post('/donations', requireRole('admin', 'coordinator'), recordDonation);

// Tasks & Checklists (Coordinator, Admin, Volunteer)
router.get('/camps/:campId/tasks', requireRole('admin', 'coordinator', 'volunteer'), getCampTasks);
router.post('/camps/:campId/tasks', requireRole('admin', 'coordinator'), createCampTask);
router.put('/tasks/:id/toggle', requireRole('admin', 'coordinator', 'volunteer'), toggleCampTask);

// Printable & exportable attendance
router.get('/camps/:campId/attendance-sheet', requireRole('admin', 'coordinator'), getCampAttendanceSheet);

module.exports = router;
