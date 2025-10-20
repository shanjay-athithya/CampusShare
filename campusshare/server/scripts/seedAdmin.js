import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Upsert admin user (avoid double-hashing by letting the model pre-save hook hash plain text)
    const email = 'admin@campusshare.com';
    const plainPassword = 'admin123';

    let adminUser = await User.findOne({ email });
    if (adminUser) {
      adminUser.name = 'System Administrator';
      adminUser.department = 'Administration';
      adminUser.role = 'admin';
      adminUser.password = plainPassword; // model pre-save will hash
      await adminUser.save();
      console.log('Admin user updated successfully!');
    } else {
      adminUser = new User({
        name: 'System Administrator',
        email,
        password: plainPassword, // model pre-save will hash
        department: 'Administration',
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created successfully!');
    }

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
