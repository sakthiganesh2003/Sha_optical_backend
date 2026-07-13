import mongoose from 'mongoose';

export const connectDB = async () => {
  const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/optical_solution';
  console.log(`Connecting to MongoDB at: ${connStr.replace(/:([^:@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully.');
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error?.message || error);
    if (error?.message?.includes('ReplicaSetNoPrimary') || error?.message?.includes('ECONNREFUSED') || error?.message?.includes('querySrv')) {
      console.error('');
      console.error('  ⚠️  ATLAS IP WHITELIST FIX:');
      console.error('  1. Go to https://cloud.mongodb.com');
      console.error('  2. Cluster → Network Access → Add IP Address');
      console.error('  3. Click "Allow Access From Anywhere" (0.0.0.0/0)');
      console.error('  4. Click Confirm, then restart backend');
      console.error('');
    }
    // Don't crash the process — retry is handled by Mongoose internally
    console.error('  Server will start but DB calls will fail until connection is restored.');
  }
};

