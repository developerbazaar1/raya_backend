const {
  projectService,
  projectDetailService,
  updateProjectStatusService
} = require('../../services/businessOwnerTeam/project.service');

exports.allProject = async (req, res) => {
  const data = await projectService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'All Projects fetched successfully.',
    data
  });
};

exports.projectDetails = async (req, res) => {
  const data = await projectDetailService(req.user.userId, req.params.projectId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Project details fetched successfully.',
    data
  });
};

exports.updateProjectStatusController = async (req, res) => {
  const data = await updateProjectStatusService(req.user.userId, req.params.projectId, req.body);
  res.status(200).json({
    status: 'success',
    message: 'Project status updated successfully.',
    data
  });
};
