const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');

const TRAINING_GENERATION_QUEUE = 'training-generation';

const trainingGenerationQueue = new Queue(TRAINING_GENERATION_QUEUE, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 1000
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7
    }
  }
});

const enqueueTrainingGeneration = async (payload) => {
  console.log(
    `[training:queue] adding bull job generationJobId=${payload.generationJobId} trainingId=${payload.trainingId} versionId=${payload.trainingVersionId}`
  );

  return trainingGenerationQueue.add('generate-training-content', payload, {
    jobId: String(payload.generationJobId)
  });
};

module.exports = {
  TRAINING_GENERATION_QUEUE,
  enqueueTrainingGeneration,
  trainingGenerationQueue
};
