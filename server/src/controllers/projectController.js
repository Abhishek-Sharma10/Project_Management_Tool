const projectService = require('../services/projectService');
const { success, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  return created(res, { project }, 'Project created');
});

const list = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user.id);
  return success(res, { projects }, 'Projects retrieved');
});

const getOne = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(
    req.params.projectId,
    req.user.id
  );
  return success(res, { project }, 'Project retrieved');
});

const update = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.projectId,
    req.user.id,
    req.body
  );
  return success(res, { project }, 'Project updated');
});

const remove = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject(
    req.params.projectId,
    req.user.id
  );
  return success(res, result, 'Project deleted');
});

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
