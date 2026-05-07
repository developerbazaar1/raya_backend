
const { projectCreateService, projectListService, projectDetailsService, assignedProjectsService, removeAssignedUserService  } = require('../../services/project.service');


exports.projectCreate = async (req, res) => {
    const data = await projectCreateService(req.body, req.user.userId);
    res.status(201).json({
        success: "success",
        message: 'Project created successfully',
        data
    });
}

exports.projectList = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNo = parseInt(page);
    const limitNo = parseInt(limit);
    const skip = (pageNo - 1) * limitNo;

    const data = await projectListService(req.user.userId, skip, limitNo);
    res.status(200).json({
        success: "success",
        message: 'Project list successfully',
        data
    });
}

exports.projectDetails = async (req, res) => {
    const { projectId } = req.params;
    const data = await projectDetailsService(projectId);
    res.status(200).json({
        success: "success",
        message: 'Project details successfully',
        data
    });
}

exports.assignedProjects = async (req, res) => {
    const { projectId } = req.params;
    const { assignedUsers } = req.body;
    const data = await assignedProjectsService(projectId, assignedUsers);
    res.status(200).json({
        success: "success",
        message: 'Project assigned successfully',
        data
    });
}

exports.removeAssignedUser = async (req, res) => {
    const { projectId } = req.params;
    const { assignedUsers } = req.body;
    const data = await removeAssignedUserService(projectId, assignedUsers);
    res.status(200).json({
        success: "success",
        message: 'Team member removed successfully',
        data
    });
}