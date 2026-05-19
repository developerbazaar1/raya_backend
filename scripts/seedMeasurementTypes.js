require('dotenv').config();
const mongoose = require('mongoose');
const MeasurementType = require('../src/models/shared/measurementType.model');
const logger = require('../src/utils/logger');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to Database for Seeding');

    const types = [
      { name: 'Number', symbol: '#' },
      { name: 'Dollar Amount', symbol: '$' },
      { name: 'Percentage', symbol: '%' }
    ];

    for (const type of types) {
      const exists = await MeasurementType.findOne({ name: type.name });
      if (!exists) {
        await MeasurementType.create(type);
        logger.info(`Inserted: ${type.name}`);
      } else {
        logger.info(`Already exists: ${type.name}`);
      }
    }

    logger.info('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

seed();
