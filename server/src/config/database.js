const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blood_donation_db';

  try {
    // Attempt standard connection with 2.5s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected successfully to MongoDB at: ${uri.replace(/\/\/.*@/, '//***@')}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to external/local MongoDB (${err.message}).`);
    console.log('[Database] Starting embedded in-memory MongoDB fallback...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to Embedded In-Memory MongoDB at: ${memoryUri}`);
      
      // Auto seed if running in-memory so the app is instantly usable
      const { seedDemoData } = require('./seed');
      await seedDemoData({ silent: false });
    } catch (memErr) {
      console.error('[Database] Failed to start embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[Database] Error while disconnecting:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
