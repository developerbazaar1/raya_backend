if (require.main === module) {
  require('../config/db');
}

const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const Training = require('../models/businessOwner/training.model');
const TrainingVersion = require('../models/businessOwner/trainingVersion.model');
const TrainingGenerationJob = require('../models/businessOwner/trainingGenerationJob.model');
const Chapter = require('../models/businessOwner/chapter.model');
const Quiz = require('../models/businessOwner/quiz.model');
const Question = require('../models/businessOwner/question.model');
const { TRAINING_GENERATION_QUEUE } = require('../queues/trainingGeneration.queue');
const { generateTrainingContent } = require('../services/trainingAi.service');
const { readTrainingTextFromSpaces } = require('../services/localTrainingStorage.service');
const logger = require('../utils/logger');

const MAX_SOURCE_CHARS = 60000;

const resolveSourceText = async (training) => {
  if (training.sourceTextPath) {
    console.log(
      `[training:worker] resolving source text trainingId=${training._id} key=${training.sourceTextPath}`
    );
    return readTrainingTextFromSpaces(training.sourceTextPath);
  }

  if (!training.sourceFilePath) {
    return '';
  }

  throw new Error('No extracted text found for the uploaded source file.');
};

const createQuizForVersion = async ({ generated, training, version }) => {
  console.log(`[training:quiz] checking quiz trainingId=${training._id} versionId=${version._id}`);

  const existingQuiz = await Quiz.findOne({
    trainingId: training._id,
    trainingVersionId: version._id
  });

  if (existingQuiz) {
    console.log(
      `[training:quiz] quiz already exists trainingId=${training._id} versionId=${version._id}`
    );
    return;
  }

  console.log(
    `[training:quiz] creating chapter trainingId=${training._id} versionId=${version._id}`
  );

  const chapter = await Chapter.create({
    trainingVersionId: version._id,
    title: generated.title || version.title || training.title,
    objective: generated.learningObjectives?.[0],
    sections: [
      {
        heading: 'Training Script',
        content: generated.videoScript,
        order: 1
      }
    ],
    summary: generated.description || version.description || training.description,
    estimatedTime: Math.max(1, Math.ceil((generated.videoScript || '').split(/\s+/).length / 140)),
    order: 1
  });

  const quiz = await Quiz.create({
    trainingId: training._id,
    trainingVersionId: version._id,
    chapterId: chapter._id,
    title: `${training.title} Quiz`
  });

  const questions = generated.quiz
    .filter((item) => item.question && item.options.length === 4 && item.correctAnswer)
    .map((item) => {
      const correctAnswer = item.correctAnswer.trim().toLowerCase();
      let hasCorrectOption = false;
      const options = item.options.map((optionText) => {
        const isCorrect = optionText.trim().toLowerCase() === correctAnswer;
        hasCorrectOption = hasCorrectOption || isCorrect;
        return {
          text: optionText,
          isCorrect
        };
      });

      if (!hasCorrectOption) {
        options[0].isCorrect = true;
      }

      return {
        quizId: quiz._id,
        question: item.question,
        options,
        explanation: item.explanation
      };
    });

  if (questions.length > 0) {
    await Question.insertMany(questions);
  }

  training.quizGenerated = true;
  await training.save();
  console.log(
    `[training:quiz] quiz created trainingId=${training._id} quizId=${quiz._id} questions=${questions.length}`
  );
};

const markFinalFailure = async ({ error, generationJob, training, version }) => {
  generationJob.status = 'failed';
  generationJob.error = error.message;
  await generationJob.save();

  version.status = 'failed';
  version.generationError = error.message;
  await version.save();

  training.status = 'failed';
  training.generationError = error.message;
  await training.save();
};

const processGeneration = async (job) => {
  console.log(
    `[training:worker] job started bullJobId=${job.id} attempt=${job.attemptsMade + 1} generationJobId=${job.data.generationJobId}`
  );

  const generationJob = await TrainingGenerationJob.findById(job.data.generationJobId);
  if (!generationJob) {
    throw new Error('Training generation job not found.');
  }

  const [training, version] = await Promise.all([
    Training.findById(generationJob.trainingId),
    TrainingVersion.findById(generationJob.trainingVersionId)
  ]);

  if (!training || !version) {
    throw new Error('Training or training version not found.');
  }

  generationJob.status = 'processing';
  generationJob.attemptsMade = job.attemptsMade + 1;
  await generationJob.save();

  try {
    const sourceText = (await resolveSourceText(training)).trim();
    console.log(
      `[training:worker] source text ready trainingId=${training._id} versionId=${version._id} chars=${sourceText.length}`
    );

    if (!sourceText) {
      throw new Error('No readable source text found for this training.');
    }

    console.log(
      `[training:worker] sending source to llm trainingId=${training._id} versionId=${version._id} chars=${Math.min(sourceText.length, MAX_SOURCE_CHARS)}`
    );

    const generated = await generateTrainingContent({
      title: training.title,
      description: training.description,
      sourceText: sourceText.slice(0, MAX_SOURCE_CHARS),
      quizCount: generationJob.generateQuiz ? generationJob.quizCount : 0,
      versionNumber: version.versionNumber
    });

    version.title = generated.title || version.title;
    version.description = generated.description || version.description;
    version.learningObjectives = generated.learningObjectives;
    version.videoScript = generated.videoScript;
    version.transcription = generated.transcription;
    version.passingMarks = generated.recommendedPassScore;
    version.status = 'selected';
    version.generationError = undefined;
    await version.save();

    console.log(
      `[training:worker] version saved trainingId=${training._id} versionId=${version._id} scriptChars=${generated.videoScript.length} passScore=${generated.recommendedPassScore}`
    );

    if (generationJob.generateQuiz) {
      await createQuizForVersion({ generated, training, version });
    }

    training.activeVersionId = version._id;
    training.status = 'ready_for_review';
    training.generationError = undefined;
    await training.save();

    generationJob.status = 'completed';
    generationJob.completedAt = new Date();
    generationJob.error = undefined;
    await generationJob.save();

    console.log(
      `[training:worker] job completed trainingId=${training._id} versionId=${version._id} generationJobId=${generationJob._id}`
    );

    return {
      trainingId: String(training._id),
      trainingVersionId: String(version._id)
    };
  } catch (error) {
    console.error(
      `[training:worker] job failed bullJobId=${job.id} generationJobId=${generationJob._id} message=${error.message}`
    );

    generationJob.error = error.message;
    await generationJob.save();

    const maxAttempts = job.opts.attempts || 1;
    if (job.attemptsMade + 1 >= maxAttempts) {
      await markFinalFailure({ error, generationJob, training, version });
    }

    throw error;
  }
};

const worker = new Worker(TRAINING_GENERATION_QUEUE, processGeneration, {
  connection: getRedisConnection(),
  concurrency: 2
});

worker.on('completed', (job) => {
  logger.info(`Training generation job completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
  logger.error(`Training generation job failed: ${job?.id}`, err);
});

module.exports = worker;
