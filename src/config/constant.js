module.exports = {
  ROLES: ['business_owner', 'employee'],
  TIME_OFF_STATUS: ['pending', 'approved', 'rejected', 'change_requested', 'cancelled'],
  SCHEDULE_STATUS: ['not_started', 'in_progress', 'completed'],
  TASK_PRIORITY: ['low', 'medium', 'high'],
  KPI_RESET_FREQUENCY: ['daily', 'weekly', 'monthly'],
  TRAINING_STATUS: ['draft', 'published'],
  TRAINING_VERSION_STATUS: ['draft', 'selected', 'archived'],
  CHAPTER_PROGRESS_STATUS: ['not_started', 'in_progress', 'completed'],
  TRAINING_ASSIGNMENT_STATUS: ['not_started', 'in_progress', 'completed', 'failed'],
  OTP_PURPOSES: ['login','email_verification','phone_verification','reset_password'],
  KPI_STATUS: ['on_track', 'need_attention', 'at_risk'],
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  JWT_EXPIRY: '7d', // 7 days
  GUEST_USERS: ['dbrahul03@.gmail.com', 'guest@example.com'],
  FILE_TYPES: ['jpeg', 'jpg', 'png', 'jfif', 'avif'],
  FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DO_SPACES_REGION: 'sgp1',
  DO_SPACES_BUCKET: 'seer-app'
};
