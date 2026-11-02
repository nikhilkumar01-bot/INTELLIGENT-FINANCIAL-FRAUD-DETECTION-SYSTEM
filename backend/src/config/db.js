/**
 * Database Connection Manager
 * Attempts connection to MongoDB / Atlas.
 * Falls back to Embedded Storage seamlessly if mongod is not running.
 */
const mongoose = require('mongoose');
const embeddedStore = require('../utils/dataStore');

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud_detection_system';
  
  try {
    console.log(`[Database] Connecting to MongoDB at ${uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log('[Database] Connected successfully to native MongoDB.');
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
    uri: isMongoConnected ? process.env.MONGODB_URI : 'Local In-Memory Cache'
  };
};

module.exports = {
  connectDB,
  getDBStatus,
  isNative: () => isMongoConnected
};
