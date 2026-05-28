const router = require('express').Router();

// Health check route
router.use('/health', require('./health.route'));

// Authentication routes
router.use('/api/v1/auth', require('./auth/auth.route'));

//All Business Owner routes
router.use('/api/v1/business-owner/setting', require('./businessOwner/setting.route'));
router.use('/api/v1/business-owner/team', require('./businessOwner/team.route'));
router.use('/api/v1/business-owner/cms', require('./businessOwner/cms.route'));
router.use('/api/v1/business-owner/projects', require('./businessOwner/project.route'));
router.use('/api/v1/business-owner/projects/tasks', require('./businessOwner/task.route'));
router.use('/api/v1/business-owner/to-do', require('./businessOwner/todo.route'));
router.use('/api/v1/business-owner/foundation', require('./businessOwner/foundation.route'));
router.use('/api/v1/business-owner/time-off', require('./businessOwner/timeOff.route'));
router.use('/api/v1/business-owner/event', require('./businessOwner/event.route'));
router.use('/api/v1/business-owner/meeting', require('./businessOwner/meeting.route'));
router.use('/api/v1/business-owner/vendor', require('./businessOwner/vendor.route'));
router.use('/api/v1/business-owner/contracts', require('./businessOwner/contractor.route'));
router.use('/api/v1/business-owner/schedule', require('./businessOwner/schedule.route'));
router.use('/api/v1/business-owner/dashboard', require('./businessOwner/dashboard.route'));
router.use('/api/v1/business-owner/kpi', require('./businessOwner/kpi.route'));
router.use('/api/v1/business-owner/measurement-type', require('./businessOwner/measurementType.route'));
router.use('/api/v1/business-owner/trainings', require('./businessOwner/training.route'));
// router.use('/api/v1/business-owner/to-do', require('./businessOwner/todo.route'));

//All Business Owner Team routes
router.use('/api/v1/business-owner-team/time-off', require('./businessOwnerTeam/timeOff.route'));
router.use('/api/v1/business-owner-team/event', require('./businessOwnerTeam/event.route'));
router.use('/api/v1/business-owner-team/to-do', require('./businessOwnerTeam/todo.route'));
router.use('/api/v1/business-owner-team/projects', require('./businessOwnerTeam/project.route'));
router.use(
  '/api/v1/business-owner-team/foundation',
  require('./businessOwnerTeam/foundation.route')
);
router.use('/api/v1/business-owner-team/setting', require('./businessOwnerTeam/setting.route'));
router.use('/api/v1/business-owner-team/dashboard', require('./businessOwnerTeam/dashboard.route'));
router.use('/api/v1/business-owner-team/mental-health', require('./businessOwnerTeam/mentalHealthCheck.route'));
























// Shared routes (for both business owner and client)
router.use('/api/v1/chat', require('./shared/chat.route'));








// All Admin route
router.use('/api/v1/admin/auth', require('./admin/adminauth'));
router.use('/api/v1/admin/businesses', require('./admin/businesstype'));
router.use('/api/v1/admin/cms', require('./admin/cms'));
router.use('/api/v1/admin/user', require('./admin/user.route'));

module.exports = router;
