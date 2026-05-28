require('dotenv').config();
const mongoose = require('mongoose');
const KpiResetFrequency = require('../src/models/shared/kpiResetFrequency.model');
const logger = require('../src/utils/logger');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to Database for KPI Reset Frequencies Seeding');

    const frequencies = [
      { name: 'Weekly', code: 'weekly' },
      { name: 'Monthly', code: 'monthly' },
      { name: 'Yearly', code: 'yearly' }
    ];

    for (const freq of frequencies) {
      const exists = await KpiResetFrequency.findOne({ code: freq.code });
      if (!exists) {
        await KpiResetFrequency.create(freq);
        logger.info(`Inserted: ${freq.name} (${freq.code})`);
      } else {
        logger.info(`Already exists: ${freq.name} (${freq.code})`);
      }
    }

    logger.info('KPI Reset Frequencies seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding KPI Reset Frequencies data:', error);
    process.exit(1);
  }
};

seed();
