const AppError = require('../utils/AppError');
const projectRepository = require('../repositories/projectRepository');
const { formatProject } = require('../utils/formatters');

function validateProjectInput({ name, description }, { partial = false } = {}) {
  const errors = [];

  if (!partial || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Project name must be at least 2 characters');
    } else if (name.trim().length > 150) {
      errors.push('Project name must be at most 150 characters');
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.length > 5000) {
      errors.push('Description must be at most 5000 characters');
    }
  }

  return errors;
}

async function createProject(userId, payload) {
  const errors = validateProjectInput(payload);
  if (errors.length) {
    throw new AppError('Validation failed', 400, { errors });
  }

  const project = await projectRepository.createProject({
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    ownerId: userId,
  });

  const full = await projectRepository.findProjectForUser(project.id, userId);
  return formatProject(full);
}

async function listProjects(userId) {
  const rows = await projectRepository.listProjectsForUser(userId);
  return rows.map(formatProject);
}

async function getProject(projectId, userId) {
  const row = await projectRepository.findProjectForUser(projectId, userId);
  if (!row) {
    // Hide existence from non-members
    throw new AppError('Project not found', 404);
  }
  return formatProject(row);
}

async function updateProject(projectId, userId, payload) {
  const errors = validateProjectInput(payload, { partial: true });
  if (errors.length) {
    throw new AppError('Validation failed', 400, { errors });
  }

  const role = await projectRepository.getMemberRole(projectId, userId);
  if (!role) {
    throw new AppError('Project not found', 404);
  }
  if (role !== 'owner' && role !== 'admin') {
    throw new AppError('Only owners and admins can update this project', 403);
  }

  const name =
    payload.name !== undefined ? payload.name.trim() : undefined;
  const description =
    payload.description !== undefined
      ? payload.description === null
        ? null
        : payload.description.trim()
      : undefined;

  await projectRepository.updateProject(projectId, { name, description });
  const full = await projectRepository.findProjectForUser(projectId, userId);
  return formatProject(full);
}

async function deleteProject(projectId, userId) {
  const role = await projectRepository.getMemberRole(projectId, userId);
  if (!role) {
    throw new AppError('Project not found', 404);
  }
  if (role !== 'owner') {
    throw new AppError('Only the project owner can delete this project', 403);
  }

  await projectRepository.deleteProject(projectId);
  return { id: projectId, deleted: true };
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
};
