const cron = require('node-cron');
const { processTodoResets } = require('../services/businessOwnerTeam/todo.service');
const logger = require('../utils/logger');

/**
 * Nightly Cron Job
 * Runs every day at midnight (00:00)
 */
const initTodoCron = () => {
    // Schedule: Minute(0) Hour(0) Day(*) Month(*) DayOfWeek(*)
    // cron.schedule('0 0 * * *', async () => {

    cron.schedule('* * * * *', async () => {

        logger.info('--- Starting Nightly Todo Cron Job ---');

        try {
            const result = await processTodoResets();
            logger.info(`--- Todo Cron Completed: Processed ${result.processedCount} tasks ---`);
        } catch (error) {
            logger.error('Error during Todo Cron Job:', error);
        }
    }, {
        scheduled: true,
        timezone: "UTC" // You can change this to your server's timezone
    });
};

module.exports = initTodoCron;
