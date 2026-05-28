const path = require('path');
const Training = require('../models/businessOwner/training.model');
const TrainingVersion = require('../models/businessOwner/trainingVersion.model');
const TrainingGenerationJob = require('../models/businessOwner/trainingGenerationJob.model');
const Quiz = require('../models/businessOwner/quiz.model');
const Question = require('../models/businessOwner/question.model');
const AppError = require('../utils/appError');
const { enqueueTrainingGeneration } = require('../queues/trainingGeneration.queue');
const { extractPdfTextFromBuffer } = require('./pdfExtraction.service');
const {
  uploadTrainingFileToSpaces,
  uploadTrainingTextToSpaces
} = require('./localTrainingStorage.service');

const MAX_SCRIPT_GENERATIONS = 3;

const createGenerationJob = async ({
  businessOwnerId,
  generateQuiz,
  quizCount,
  trainingId,
  versionId
}) => {
  console.log(
    `[training:queue] creating generation job trainingId=${trainingId} versionId=${versionId} generateQuiz=${generateQuiz} quizCount=${quizCount}`
  );

  const generationJob = await TrainingGenerationJob.create({
    trainingId,
    trainingVersionId: versionId,
    businessOwnerId,
    generateQuiz,
    quizCount,
    status: 'queued'
  });

  const bullJob = await enqueueTrainingGeneration({
    generationJobId: generationJob._id,
    trainingId,
    trainingVersionId: versionId
  });

  generationJob.bullJobId = bullJob.id;
  await generationJob.save();

  console.log(
    `[training:queue] queued generation job generationJobId=${generationJob._id} bullJobId=${bullJob.id}`
  );

  await TrainingVersion.findByIdAndUpdate(versionId, {
    generationJobId: generationJob._id
  });

  return generationJob;
};

const normalizeQuizCount = (quizCount) => {
  const parsed = Number(quizCount || 10);
  if (Number.isNaN(parsed)) {
    return 10;
  }

  return Math.min(Math.max(parsed, 1), 30);
};

const createTrainingService = async ({ body, file, userId }) => {
  const sourceText = String(body.sourceText || '').trim();

  console.log(
    `[training:create] start userId=${userId} title="${body.title}" hasFile=${Boolean(file)} sourceTextChars=${sourceText.length}`
  );

  if (!sourceText && !file) {
    throw new AppError('Either sourceText or sourceFile is required.', 400);
  }

  if (file) {
    const isPdf =
      file.mimetype?.includes('pdf') || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf && !sourceText) {
      throw new AppError('Only PDF files are supported unless sourceText is provided.', 400);
    }
  }

  const quizCount = normalizeQuizCount(body.quizCount);
  const training = await Training.create({
    businessOwnerId: userId,
    title: body.title,
    description: body.description,
    sourceType: file ? 'file' : 'text',
    quizCount,
    totalVersions: 1,
    status: 'generating'
  });

  console.log(`[training:create] training created trainingId=${training._id}`);

  if (file) {
    console.log(
      `[training:create] source file received trainingId=${training._id} originalName="${file.originalname}" mime=${file.mimetype}`
    );

    const savedFile = await uploadTrainingFileToSpaces(training._id, file);
    training.sopFileUrl = savedFile.url;
    training.sourceFilePath = savedFile.key;
    training.sourceFileName = savedFile.fileName;
    training.sourceMimeType = savedFile.mimeType;

    const isPdf =
      savedFile.mimeType?.includes('pdf') || savedFile.fileName.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      const extractedText = await extractPdfTextFromBuffer(file.buffer);
      const savedText = await uploadTrainingTextToSpaces(
        training._id,
        extractedText,
        'extracted.txt'
      );
      training.sourceTextPath = savedText.key;
      console.log(
        `[training:create] extracted pdf text saved trainingId=${training._id} key=${savedText.key}`
      );
    }
  }

  if (sourceText) {
    const savedText = await uploadTrainingTextToSpaces(training._id, sourceText);
    training.sourceTextPath = savedText.key;
    console.log(
      `[training:create] source text saved trainingId=${training._id} key=${savedText.key}`
    );
  }

  await training.save();
  console.log(`[training:create] source metadata saved trainingId=${training._id}`);

  const version = await TrainingVersion.create({
    trainingId: training._id,
    versionNumber: 1,
    title: body.title,
    description: body.description,
    passingMarks: 70,
    status: 'generating',
    generatedBy: userId
  });

  console.log(
    `[training:create] version created trainingId=${training._id} versionId=${version._id} versionNumber=${version.versionNumber}`
  );

  training.activeVersionId = version._id;
  await training.save();

  const generationJob = await createGenerationJob({
    businessOwnerId: userId,
    generateQuiz: true,
    quizCount,
    trainingId: training._id,
    versionId: version._id
  });

  return {
    training,
    version,
    generationJob
  };
};

const generateTrainingVersionService = async ({ trainingId, userId }) => {
  console.log(`[training:regenerate] start trainingId=${trainingId} userId=${userId}`);

  const training = await Training.findOne({ _id: trainingId, businessOwnerId: userId });

  if (!training) {
    throw new AppError('Training not found.', 404);
  }

  if (training.totalVersions >= MAX_SCRIPT_GENERATIONS) {
    throw new AppError('Maximum 3 video script generations are allowed for this training.', 400);
  }

  if (!training.sourceTextPath && !training.sourceFilePath) {
    throw new AppError('Training source content is missing.', 400);
  }

  const nextVersionNumber = training.totalVersions + 1;
  const version = await TrainingVersion.create({
    trainingId: training._id,
    versionNumber: nextVersionNumber,
    title: training.title,
    description: training.description,
    passingMarks: 70,
    status: 'generating',
    generatedBy: userId
  });

  console.log(
    `[training:regenerate] version created trainingId=${training._id} versionId=${version._id} versionNumber=${version.versionNumber}`
  );

  training.totalVersions = nextVersionNumber;
  training.status = 'generating';
  await training.save();

  const generationJob = await createGenerationJob({
    businessOwnerId: userId,
    generateQuiz: true,
    quizCount: training.quizCount,
    trainingId: training._id,
    versionId: version._id
  });

  return {
    training,
    version,
    generationJob
  };
};

const listTrainingsService = async (userId) =>
  Training.find({ businessOwnerId: userId })
    .sort({ createdAt: -1 })
    .populate('activeVersionId')
    .lean();

const getTrainingDetailsService = async ({ trainingId, userId }) => {
  const training = await Training.findOne({ _id: trainingId, businessOwnerId: userId })
    .populate('activeVersionId')
    .lean();

  if (!training) {
    throw new AppError('Training not found.', 404);
  }

  const versions = await TrainingVersion.find({ trainingId }).sort({ versionNumber: 1 }).lean();
  const jobs = await TrainingGenerationJob.find({ trainingId }).sort({ createdAt: -1 }).lean();

  return {
    ...training,
    sourceFileExtension: training.sourceFileName
      ? path.extname(training.sourceFileName)
      : undefined,
    versions,
    generationJobs: jobs
  };
};

const getTrainingQuizService = async ({ trainingId, userId, versionId }) => {
  const training = await Training.findOne({ _id: trainingId, businessOwnerId: userId }).lean();

  if (!training) {
    throw new AppError('Training not found.', 404);
  }

  const version = await TrainingVersion.findOne({ _id: versionId, trainingId }).lean();
  if (!version) {
    throw new AppError('Training version not found.', 404);
  }

  const quizzes = await Quiz.find({ trainingId, trainingVersionId: versionId })
    .populate('trainingVersionId', 'versionNumber title passingMarks status')
    .populate('chapterId', 'title objective order')
    .sort({ createdAt: 1 })
    .lean();

  const quizIds = quizzes.map((quiz) => quiz._id);
  const questions = await Question.find({ quizId: { $in: quizIds } })
    .sort({ createdAt: 1 })
    .lean();

  const questionsByQuizId = questions.reduce((acc, question) => {
    const quizId = String(question.quizId);
    if (!acc[quizId]) {
      acc[quizId] = [];
    }

    const correctOption = question.options.find((option) => option.isCorrect);
    acc[quizId].push({
      _id: question._id,
      question: question.question,
      options: question.options,
      correctAnswer: correctOption?.text || '',
      explanation: question.explanation || '',
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    });

    return acc;
  }, {});

  return {
    training: {
      _id: training._id,
      title: training.title,
      description: training.description,
      status: training.status,
      quizGenerated: training.quizGenerated
    },
    version,
    totalQuizzes: quizzes.length,
    totalQuestions: questions.length,
    quizzes: quizzes.map((quiz) => ({
      _id: quiz._id,
      title: quiz.title,
      trainingVersion: quiz.trainingVersionId,
      chapter: quiz.chapterId,
      questions: questionsByQuizId[String(quiz._id)] || [],
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    }))
  };
};

module.exports = {
  createTrainingService,
  generateTrainingVersionService,
  getTrainingDetailsService,
  getTrainingQuizService,
  listTrainingsService
};
