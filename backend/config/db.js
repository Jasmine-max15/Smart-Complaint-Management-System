const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_complaint_db';
    
    // Set connection timeout
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Primary connection failed (${error.message}). Attempting fallback to in-memory MongoDB...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB] Fallback in-memory database started at: ${uri}`);
      return conn;
    } catch (fallbackErr) {
      console.error(`[MongoDB] Could not establish database connection:`, fallbackErr.message);
      console.error('Please ensure MongoDB service is running or check your MONGO_URI in .env');
      throw fallbackErr;
    }
  }
};

module.exports = connectDB;

