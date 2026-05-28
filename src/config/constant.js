module.exports = {
  ROLES: ['business_owner', 'employee', 'admin'],
  TIME_OFF_STATUS: ['pending', 'approved', 'rejected', 'change_requested', 'cancelled'],
  SCHEDULE_STATUS: ['not_started', 'in_progress', 'completed', 'overdue'],
  TASK_PRIORITY: ['low', 'medium', 'high'],
  KPI_RESET_FREQUENCY: ['daily', 'weekly', 'monthly'],
  TRAINING_STATUS: ['draft', 'generating', 'ready_for_review', 'published', 'failed'],
  TRAINING_VERSION_STATUS: ['draft', 'generating', 'selected', 'archived', 'failed'],
  TRAINING_GENERATION_STATUS: ['queued', 'processing', 'completed', 'failed'],
  TRAINING_SOURCE_TYPES: ['text', 'file'],
  CHAPTER_PROGRESS_STATUS: ['not_started', 'in_progress', 'completed'],
  TRAINING_ASSIGNMENT_STATUS: ['not_started', 'in_progress', 'completed', 'failed'],
  OTP_PURPOSES: ['login', 'email_verification', 'phone_verification', 'reset_password'],
  KPI_STATUS: ['on_track', 'need_attention', 'at_risk'],
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  JWT_EXPIRY: '7d', // 7 days
  GUEST_USERS: ['dbrahul03@.gmail.com', 'guest@example.com'],
  FILE_TYPES: ['jpeg', 'jpg', 'png', 'jfif', 'avif', 'pdf'],
  FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DO_SPACES_REGION: 'sfo3',
  DO_SPACES_BUCKET: 'swann',
  DEFAULT_PROFILE_IMAGE:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-kxsrlL89sKekYAVXwyzqv-SNUcCVDihjnA&s',

  REPETITION_TYPES: ['daily', 'weekly', 'monthly', 'one-time', 'yearly'],
  VENDOR_ROLES: [
    'Plumber',
    'Interior Designer',
    'Painter',
    'Electrician',
    'Carpenter',
    'Mason',
    'Tiles'
  ],
  CONTRACTOR_ROLES: [
    'Plumber',
    'Interior Designer',
    'Painter',
    'Electrician',
    'Carpenter',
    'Mason',
    'Tiles'
  ],
  GENDER: ['Male', 'Female', 'Other'],
  MOOD_LABELS: ['Critical', 'Struggling', 'Neutral', 'Good', 'Excellent'],
  BUSINESS_OWNER_APPROVAL_STATUS: ['pending_approval', 'approved', 'rejected']
};
