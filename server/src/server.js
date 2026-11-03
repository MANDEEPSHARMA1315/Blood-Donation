require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  🩸 Blood Donation Camp Coordination System Server`);
      console.log(`  🚀 Server listening on http://localhost:${PORT}`);
      console.log(`  📋 Health endpoint: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Database closed and server terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[Server] Critical startup error:', err.message);
    process.exit(1);
  }
};

startServer();
