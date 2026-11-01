
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/smart_complaint_db';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'admin@complaint.gov';
    const password = 'Admin@123';

    let admin = await User.findOne({ email });

    if (admin) {
      admin.name = 'System Administrator';
      admin.phone = admin.phone || '9999999999';
      admin.role = 'admin';
      admin.isActive = true;
      admin.password = password;

      await admin.save();
      console.log('Existing account updated to admin.');
    } else {
      await User.create({
        name: 'System Administrator',
        email,
        phone: '9999999999',
        password,
        role: 'admin',
        isActive: true,
      });

      console.log('Admin account created successfully.');
    }
  } catch (error) {
    console.error('Admin setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
