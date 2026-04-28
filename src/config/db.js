const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error("Error connecting to MongoDB: \n" + err.message);
    process.exit(1);
  }
})();


