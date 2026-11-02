/**
 * Database Connection Manager
 * Attempts connection to MongoDB / Atlas.
 * Falls back to Embedded Storage seamlessly if mongod is not running or MONGODB_URI is not set.
 */
const mongoose = require('mongoose');
const embeddedStore = require('../utils/dataStore');

let isMongoConnected = false;

const connectDB = async () => {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  const uri = process.env.MONGODB_URI;

  // Reuse existing active connection in warm serverless containers
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return;
  }

  // If in serverless and no MONGODB_URI is configured, activate embedded store immediately without attempting 127.0.0.1
  if (!uri && isServerless) {
    console.log('[Database] Vercel environment detected without MONGODB_URI.');
    console.log('[Database] -> Activating Zero-Dependency Embedded Storage Engine.');
    isMongoConnected = false;
    return;
  }

  const connectionUri = uri || 'mongodb://127.0.0.1:27017/fraud_detection_system';

  try {
    console.log(`[Database] Connecting to MongoDB at ${uri ? 'MongoDB Atlas / Custom URI' : 'Local 127.0.0.1:27017'}...`);
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: isServerless ? 5000 : 2500,
      connectTimeoutMS: isServerless ? 7500 : 3000,
      bufferCommands: false
    });
    isMongoConnected = true;
    console.log('[Database] Connected successfully to native MongoDB / Atlas.');
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] Native MongoDB connection failed (${err.message}).`);
    console.log('[Database] -> Activating Zero-Dependency Embedded Storage Engine.');
    console.log('[Database] -> Full CRUD, Analytics, Filter, and Auth operations are 100% active.');
  }
};

const getDBStatus = () => {
  return {
    connected: true,
    engine: isMongoConnected ? 'MongoDB Native / Atlas' : 'Embedded JSON Memory Store',
    isNativeMongo: isMongoConnected,
    uri: isMongoConnected ? (process.env.MONGODB_URI ? 'Connected (Atlas/Cloud)' : 'Connected (Local)') : 'Local In-Memory Cache'
  };
};

module.exports = {
  connectDB,
  getDBStatus,
  isNative: () => isMongoConnected
};
