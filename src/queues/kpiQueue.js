/**
 * KPI Distributed Rollover Queue & Worker
 * ---------------------------------------
 * Purpose: Coordinated timezone-safe KPI resets across horizontally scaled servers.
 * Broker: Valkey / Redis (DigitalOcean Managed Cluster via SSL/TLS).
 * Scheduler: BullMQ repeatable hourly distributed job.
 * Auditor: Persistent MongoDB JobLog collection (guarantees lightweight Valkey memory).
 * 
 * Payload / API Contract:
 * - Queue Name: 'kpi-rollover'
 * - Job Name: 'hourly-rollover-job'
 * - Frequency: Every hour at minute 0 ('0 * * * *')
 */
const os = require('os');
const { Queue, Worker } = require('bullmq');
const { processKpiRollovers } = require('../services/kpi.service');
const Redis = require('ioredis');
const JobLog = require('../models/shared/jobLog.model');
const logger = require('../utils/logger');

const connection = require('../config/redis');

const monitorClient = new Redis(connection);
monitorClient.on('connect', () => {
  logger.info('Valkey/Redis database connection established successfully.');
});
monitorClient.on('error', (err) => {
  logger.error(`Valkey/Redis database connection status: ${err.message}`);
});

let rolloverQueue;
let rolloverWorker;

/**
 * Initializes the KPI Rollover Queue and distributed worker.
 * Establishes a repeatable hourly rollover check and registers connection event listeners.
 * 
 * Params: None
 * Returns: Promise<void>
 */
const initKpiRolloverQueue = async () => {
  logger.info('Initializing Distributed KPI Rollover Queue...');

  try {
    rolloverQueue = new Queue('kpi-rollover', { connection });

    await rolloverQueue.add('hourly-rollover-job', {}, {
      repeat: { pattern: '0 * * * *' },
      jobId: 'hourly-rollover-job',
      removeOnComplete: true,
      removeOnFail: true
    });

    logger.info('Distributed KPI Rollover Queue registered successfully.');

    rolloverWorker = new Worker('kpi-rollover', async (job) => {
      const hostname = os.hostname();
      logger.info(`Job ${job.id} started on worker instance: ${hostname}`);

      const auditLog = new JobLog({
        jobId: job.id,
        queueName: 'kpi-rollover',
        jobName: job.name,
        status: 'active',
        runByWorker: hostname,
        attempts: job.attemptsMade
      });
      await auditLog.save();

      const startTime = Date.now();
      const lockKey = 'kpi-rollover-lock';
      const lockToken = `${hostname}-${job.id}`;
      const lockTtlMs = 15 * 60 * 1000;

      try {
        const acquired = await monitorClient.set(lockKey, lockToken, 'PX', lockTtlMs, 'NX');
        if (!acquired) {
          logger.warn(`Another instance is already processing KPI Rollover. Skipping.`);
          auditLog.status = 'completed';
          auditLog.finishedAt = new Date();
          auditLog.durationMs = Date.now() - startTime;
          auditLog.processedCount = 0;
          auditLog.deletedCount = 0;
          await auditLog.save();
          return { status: 'skipped', reason: 'concurrency_lock_acquired_by_other_instance' };
        }

        logger.info(`Distributed lock '${lockKey}' acquired successfully by ${hostname}.`);

        const result = await processKpiRollovers();

        const duration = Date.now() - startTime;
        auditLog.status = 'completed';
        auditLog.finishedAt = new Date();
        auditLog.durationMs = duration;
        auditLog.processedCount = result.resetCount;
        auditLog.deletedCount = result.deleteCount;
        await auditLog.save();

        logger.info(`Job ${job.id} completed successfully on worker: ${hostname} in ${duration}ms`);
        return result;

      } catch (err) {
        const duration = Date.now() - startTime;
        auditLog.status = 'failed';
        auditLog.finishedAt = new Date();
        auditLog.durationMs = duration;
        auditLog.error = {
          message: err.message,
          stack: err.stack
        };
        await auditLog.save();

        logger.error(`Job ${job.id} failed on worker: ${hostname} after ${duration}ms`, err);
        throw err;

      } finally {
        try {
          const currentLockToken = await monitorClient.get(lockKey);
          if (currentLockToken === lockToken) {
            await monitorClient.del(lockKey);
            logger.info(`Distributed lock '${lockKey}' released successfully by ${hostname}.`);
          }
        } catch (lockErr) {
          logger.error('Failed to release distributed lock cleanly:', lockErr);
        }
      }
    }, { connection });

    rolloverWorker.on('error', (err) => {
      logger.error('Valkey/BullMQ Worker error:', err);
    });

  } catch (err) {
    logger.error('Failed to initialize KPI Rollover Queue:', err);
  }
};

module.exports = initKpiRolloverQueue;
