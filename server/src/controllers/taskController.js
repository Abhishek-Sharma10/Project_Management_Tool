const taskService = require('../services/taskService');
const { success, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(
    req.params.projectId,
    req.user.id,
    req.body
  );
  return created(res, { task }, 'Task created');
});

const list = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.params.projectId, req.user.id, {
    status: req.query.status,
    priority: req.query.priority,
    assignedTo: req.query.assignedTo,
    search: req.query.search,
  });
  return success(res, { tasks }, 'Tasks retrieved');
});

const getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.params.taskId, req.user.id);
  return success(res, { task }, 'Task retrieved');
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.taskId,
    req.user.id,
    req.body
  );
  return success(res, { task }, 'Task updated');
});

const remove = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.params.taskId, req.user.id);
  return success(res, result, 'Task deleted');
});

const assign = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(
    req.params.taskId,
    req.user.id,
    req.body
  );
  return success(res, { task }, 'Task assigned');
});

const changeStatus = asyncHandler(async (req, res) => {
  const task = await taskService.changeStatus(
    req.params.taskId,
    req.user.id,
    req.body
  );
  return success(res, { task }, 'Task status updated');
});

const changePosition = asyncHandler(async (req, res) => {
  const task = await taskService.changePosition(
    req.params.taskId,
    req.user.id,
    req.body
  );
  return success(res, { task }, 'Task position updated');
});

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  assign,
  changeStatus,
  changePosition,
};
