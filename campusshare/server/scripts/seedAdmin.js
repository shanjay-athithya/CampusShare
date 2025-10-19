import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@campusshare.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@campusshare.com',
      password: hashedPassword,
      department: 'Administration',
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@campusshare.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedAdmin();
