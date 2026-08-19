const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    const email = process.env.ADMIN_EMAIL || 'admin@workwagon.local';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin account ${email} already exists.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    console.log(`Admin account ${email} created successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
