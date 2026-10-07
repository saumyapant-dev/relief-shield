/**
 * Database Connection Module
 * 
 * WHY MONGOOSE:
 * Mongoose handles connection pooling, schema enforcement, validation, and creates
 * the 2dsphere index automatically on startup so geospatial operations succeed immediately.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/relief_shield';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Could not connect to MongoDB at ${uri}: ${err.message}`);

    // If local or configured MongoDB is unavailable in development, launch in-memory MongoDB fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Launching in-memory MongoDB instance for seamless local demo...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] Connected to in-memory MongoDB: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error('[Database] In-memory MongoDB failed to start:', memErr.message);
      }
    }

    console.warn(
      `[Database Tip] Ensure local MongoDB is running (e.g. 'mongod' or 'brew services start mongodb-community') ` +
      `or provide a valid MongoDB Atlas URI in server/.env under MONGODB_URI.`
    );

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

module.exports = connectDB;
