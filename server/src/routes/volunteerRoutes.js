const express = require('express');
const router = express.Router();
const {
  assignVolunteer,
  getAssignments,
  updateAssignmentStatus,
} = require('../controllers/volunteerController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/assignments', getAssignments);
router.post('/assignments', requireRole('admin', 'coordinator'), assignVolunteer);
router.put('/assignments/:id/status', updateAssignmentStatus);

module.exports = router;
