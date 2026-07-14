import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  // Reuse existing connection — critical for Vercel serverless cold starts
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/optical_solution';
  console.log(`Connecting to MongoDB at: ${connStr.replace(/:([^:@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully.');
  } catch (error: any) {
    isConnected = false;
    console.error('❌ MongoDB connection failed:', error?.message || error);
    throw error;
  }
};
