const express = require('express');
const router = express.Router();
const { getSystemAnalytics, exportReportCSV } = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireRole('admin', 'coordinator'));

router.get('/analytics', getSystemAnalytics);
router.get('/export-csv', exportReportCSV);

module.exports = router;
