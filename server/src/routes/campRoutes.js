const express = require('express');
const router = express.Router();
const {
  createCamp,
  getCamps,
  getCampById,
  updateCamp,
  cancelCamp,
} = require('../controllers/campController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', getCamps);
router.get('/:id', getCampById);
router.post('/', authenticateToken, requireRole('admin'), createCamp);
router.put('/:id', authenticateToken, requireRole('admin', 'coordinator'), updateCamp);
router.put('/:id/cancel', authenticateToken, requireRole('admin'), cancelCamp);

module.exports = router;
