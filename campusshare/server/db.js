import mongoose from 'mongoose';

// Establish a MongoDB connection using env var MONGO_URI (fallback to MONGODB_URI)
export async function connectDB() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Missing MONGO_URI/MONGODB_URI in environment');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    await mongoose.connect(uri);
    return mongoose.connection;
}

// Example usage:
// import { connectDB } from './db.js';
// connectDB().then(() => console.log('DB connected')).catch(console.error);

export default connectDB;


