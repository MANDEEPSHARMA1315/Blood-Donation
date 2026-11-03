const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const campRoutes = require('./routes/campRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const campOpsRoutes = require('./routes/campOpsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'Blood Donation Camp Coordination System',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/camp-ops', campOpsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
