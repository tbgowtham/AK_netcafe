import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ak_netcafe';

export let isMongoConnected = false;

export const initializeDatabase = async () => {
  console.log('Connecting to MongoDB...');
  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000 // Quick timeout so fallback registers fast
    });
    console.log(`Connected to MongoDB successfully: ${connection.connection.host}`);
    isMongoConnected = true;
    return connection;
  } catch (error) {
    console.warn('\n⚠️  MongoDB is not running or connection failed.');
    console.warn(`Attempted Connection URI: ${MONGODB_URI}`);
    console.warn('⚠️  Falling back to in-memory database for local testing.\n');
    isMongoConnected = false;
    return null;
  }
};

export const getDatabase = () => {
  return mongoose.connection;
};
