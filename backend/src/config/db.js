const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    console.log('⚡ No MONGODB_URI detected in .env. Initializing MongoMemoryReplSet (with Transaction support)...');
    try {
      const { MongoMemoryReplSet } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' }
      });
      mongoUri = mongodInstance.getUri('emr_appointment_system');
      console.log(`✅ In-memory MongoDB ReplicaSet initialized at: ${mongoUri}`);
    } catch (err) {
      console.warn('⚠️ Could not start MongoMemoryReplSet, falling back to MongoMemoryServer:', err.message);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      mongoUri = mongodInstance.getUri();
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true, // Build defined indexes on models
    });
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
