const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
} = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', bookAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id/cancel', cancelAppointment);
router.put('/:id/reschedule', rescheduleAppointment);

module.exports = router;
