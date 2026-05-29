const {
  getOnboardingProgressService,
  completeOnboardingStepService
} = require('../../services/businessOwner.onboarding.service');

exports.getOnboardingProgress = async (req, res) => {
  const data = await getOnboardingProgressService(req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'Onboarding progress fetched successfully',
    data
  });
};

exports.completeStep = async (req, res) => {
  const data = await completeOnboardingStepService(req.user.userId, req.body.stepKey);
  res.status(200).json({
    status: 'success',
    message: 'Onboarding step completed successfully',
    data
  });
};
