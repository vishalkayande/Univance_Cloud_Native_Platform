const User = require('../models/userModel');

const seedAdmin = async () => {
  try {
    const adminEmail = 'univance@dietms.org';
    const oldAdminEmail = 'admin@univance.com';

    // Migrate any existing admin with the previous email
    const existingOldAdmin = await User.findOne({ email: oldAdminEmail });
    if (existingOldAdmin) {
      existingOldAdmin.email = adminEmail;
      await existingOldAdmin.save();
      console.log(`Admin email migrated from ${oldAdminEmail} to ${adminEmail}`);
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      console.log('No admin found in database. Creating default admin...');
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'Admin@123', // Meets password requirements
        role: 'admin',
        collegeName: 'System'
      });
      console.log('-----------------------------------');
      console.log('DEFAULT ADMIN CREATED:');
      console.log(`Email: ${adminEmail}`);
      console.log('Password: Admin@123');
      console.log('-----------------------------------');
    } else {
      console.log(`Admin account verified in database (${adminEmail}).`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
