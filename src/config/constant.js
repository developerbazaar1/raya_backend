module.exports = {
  ROLES: ['business_owner', 'employee'],
  TIME_OFF_STATUS: ['pending', 'approved', 'rejected', 'changeRequested', 'cancelled'],
  SCHEDULE_STATUS: ['notStarted', 'inProgress', 'completed'],
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  JWT_EXPIRY: '7d', // 7 days
  GUEST_USERS: ['dbrahul03@.gmail.com', 'guest@example.com'],
  FILE_TYPES: ['jpeg', 'jpg', 'png', 'jfif', 'avif'],
  FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DO_SPACES_REGION: 'sgp1',
  DO_SPACES_BUCKET: 'seer-app',
};
