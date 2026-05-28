const {
  createTrainingService,
  generateTrainingVersionService,
  getTrainingDetailsService,
  getTrainingQuizService,
  listTrainingsService
} = require('../../services/training.service');

exports.createTraining = async (req, res) => {
  const file = req.files?.sourceFile?.[0];
  const data = await createTrainingService({
    body: req.body,
    file,
    userId: req.user.userId
  });

  res.status(201).json({
    success: 'success',
    message: 'Training generation queued successfully',
    data
  });
};

exports.generateTrainingVersion = async (req, res) => {
  const data = await generateTrainingVersionService({
    trainingId: req.params.trainingId,
    userId: req.user.userId
  });

  res.status(202).json({
    success: 'success',
    message: 'Training script regeneration queued successfully',
    data
  });
};

exports.listTrainings = async (req, res) => {
  const data = await listTrainingsService(req.user.userId);

  res.status(200).json({
    success: 'success',
    message: 'Training list fetched successfully',
    data
  });
};

exports.getTrainingDetails = async (req, res) => {
  const data = await getTrainingDetailsService({
    trainingId: req.params.trainingId,
    userId: req.user.userId
  });

  res.status(200).json({
    success: 'success',
    message: 'Training details fetched successfully',
    data
  });
};

exports.getTrainingQuiz = async (req, res) => {
  const data = await getTrainingQuizService({
    trainingId: req.params.trainingId,
    versionId: req.params.versionId,
    userId: req.user.userId
  });

  res.status(200).json({
    success: 'success',
    message: 'Training quiz fetched successfully',
    data
  });
};
