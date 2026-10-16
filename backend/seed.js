const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const adminEmail = 'univance@dietms.org';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }

    const admin = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: 'Admin@123', // Meets password requirements
      role: 'admin',
      collegeName: 'System', // Required by schema for non-admins, but let's provide it anyway
    });

    if (admin) {
      console.log('Default Admin Created:');
      console.log('Email: univance@dietms.org');
      console.log('Password: Admin@123');
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
