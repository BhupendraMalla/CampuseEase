require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectdb = require('./db');
const userRegister = require('./models/signupModel');

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectdb();
    console.log('Database connected for seeding...');

    // Clear all collections
    console.log('🗑️  Clearing database...');
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database cleared successfully!');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin', 10);
    const currentDate = new Date().toDateString();

    // Create admin user
    const adminUser = new userRegister({
      name: 'Admin',
      email: 'admin@campusease.com',
      password: hashedPassword,
      confirmPassword: hashedPassword,
      role: 'admin',
      address: 'Admin Office',
      isVerified: true,
      isPasswordSet: true,
      registereddate: currentDate
    });

    await adminUser.save();
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@campusease.com');
    console.log('🔐 Password: admin');
    console.log('\n⚠️ NOTE: Change this password after your first login!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
