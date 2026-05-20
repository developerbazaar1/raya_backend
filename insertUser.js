const dotenv = require('dotenv');
dotenv.config();

require('./src/config/db');
const mongoose = require('mongoose');
const User = require('./src/models/shared/users.model');

const BusinessOwnerInfo = require('./src/models/businessOwner/businessOwnerInfo.model');

(async () => {
  try {
    const user = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    const businessOwnerInfo = await BusinessOwnerInfo.create({
      userId: user._id
    });

    console.log('User inserted successfully:', user._id.toString());
    console.log('Business owner info inserted successfully:', businessOwnerInfo._id.toString());
  } catch (error) {
    console.error('Insert failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
