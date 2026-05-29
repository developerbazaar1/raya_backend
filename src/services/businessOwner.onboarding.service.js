const UserOnboarding = require('../models/businessOwnerTeam/onboarding.model');
const BusinessOwnerInfo = require('../models/businessOwner/businessOwnerInfo.model');
const BusinessOwnerInvite = require('../models/businessOwner/businessOwnerInvite.model');
const Training = require('../models/businessOwner/training.model');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const ONBOARDING_STEPS_MASTER = [
  {
    key: 'complete_profile',
    title: 'Complete your profile.',
    description: 'Profile updated!'
  },
  {
    key: 'watch_success_video',
    title: "Watch Swann Ave's success video.",
    description: 'Watch to learn how!'
  },
  {
    key: 'complete_disc_assessment',
    title: 'Complete the DISC assessment.',
    description: 'Know yourself and your team.'
  },
  {
    key: 'invite_team_member',
    title: 'Invite a team member.',
    description: 'Invite your team so Swann Ave can analyze your team dynamics!'
  },
  {
    key: 'upload_first_sop',
    title: 'Upload your first SOP.',
    description: 'Create or add a new SOP.'
  }
];

const getOrInitOnboarding = async (userId) => {
  let onboarding = await UserOnboarding.findOne({ userId });
  if (!onboarding) {
    logger.info(`Initializing onboarding checklist for User ID: ${userId}`);
    onboarding = new UserOnboarding({
      userId,
      steps: ONBOARDING_STEPS_MASTER.map((step) => ({
        key: step.key,
        status: 'pending',
        completedAt: null
      })),
      progress: 0,
      isCompleted: false
    });
    await onboarding.save();
  }
  return onboarding;
};

exports.getOnboardingProgressService = async (userId) => {
  const onboarding = await getOrInitOnboarding(userId);
  const stepMap = {};
  onboarding.steps.forEach((s) => {
    stepMap[s.key] = s;
  });

  let stateUpdated = false;
  const now = new Date();

  // 1. Complete Profile (Dynamic check)
  if (stepMap['complete_profile']?.status !== 'completed') {
    const ownerInfo = await BusinessOwnerInfo.findOne({ userId })
      .select('registrationState.profileCompleted')
      .lean();
    if (ownerInfo?.registrationState?.profileCompleted) {
      stepMap['complete_profile'].status = 'completed';
      stepMap['complete_profile'].completedAt = now;
      stateUpdated = true;
    }
  }

  // 2. Invite Team Member (Dynamic check)
  if (stepMap['invite_team_member']?.status !== 'completed') {
    const hasSentInvite = await BusinessOwnerInvite.exists({ invitedByUserId: userId });
    if (hasSentInvite) {
      stepMap['invite_team_member'].status = 'completed';
      stepMap['invite_team_member'].completedAt = now;
      stateUpdated = true;
    }
  }

  // 3. Upload First SOP (Dynamic check)
  if (stepMap['upload_first_sop']?.status !== 'completed') {
    const hasUploadedSop = await Training.exists({
      businessOwnerId: userId,
      sopFileUrl: { $exists: true, $ne: '' }
    });
    if (hasUploadedSop) {
      stepMap['upload_first_sop'].status = 'completed';
      stepMap['upload_first_sop'].completedAt = now;
      stateUpdated = true;
    }
  }

  if (stateUpdated) {
    const completedCount = onboarding.steps.filter((s) => s.status === 'completed').length;
    onboarding.progress = Math.round((completedCount / onboarding.steps.length) * 100);
    onboarding.isCompleted = completedCount === onboarding.steps.length;
    await onboarding.save();
  }

  const formattedSteps = onboarding.steps.map((s) => {
    const meta = ONBOARDING_STEPS_MASTER.find((m) => m.key === s.key) || {};
    return {
      key: s.key,
      title: meta.title || '',
      description: meta.description || '',
      status: s.status,
      completedAt: s.completedAt || null
    };
  });

  return {
    userId: onboarding.userId,
    progressPercent: onboarding.progress,
    isCompleted: onboarding.isCompleted,
    stepsCompleted: onboarding.steps.filter((s) => s.status === 'completed').length,
    totalSteps: onboarding.steps.length,
    steps: formattedSteps
  };
};

exports.completeOnboardingStepService = async (userId, stepKey) => {
  const allowedManualSteps = ['watch_success_video', 'complete_disc_assessment'];
  if (!allowedManualSteps.includes(stepKey)) {
    throw new AppError(
      `Step '${stepKey}' is dynamically resolved based on database activity and cannot be marked manually.`,
      400
    );
  }

  const onboarding = await getOrInitOnboarding(userId);
  const targetStep = onboarding.steps.find((s) => s.key === stepKey);

  if (!targetStep) {
    throw new AppError(`Checklist step '${stepKey}' is invalid or was not found.`, 404);
  }

  if (targetStep.status === 'completed') {
    return this.getOnboardingProgressService(userId);
  }

  targetStep.status = 'completed';
  targetStep.completedAt = new Date();

  const completedCount = onboarding.steps.filter((s) => s.status === 'completed').length;
  onboarding.progress = Math.round((completedCount / onboarding.steps.length) * 100);
  onboarding.isCompleted = completedCount === onboarding.steps.length;

  await onboarding.save();

  return this.getOnboardingProgressService(userId);
};