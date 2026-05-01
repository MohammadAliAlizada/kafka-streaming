import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kafkastream';

export const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected:', MONGO_URI);
  } catch (error) {
    console.warn('⚠️  MongoDB not available. Events will not be persisted.');
    console.warn('   Set MONGO_URI in .env or install MongoDB locally.');
  }
};

export const disconnectMongo = async () => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};

export default mongoose;
