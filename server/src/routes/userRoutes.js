const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getAuditLogs,
} = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', toggleUserStatus);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
