const AppError = require('../utils/AppError');
const taskRepository = require('../repositories/taskRepository');
const memberRepository = require('../repositories/memberRepository');
const { assertProjectMember } = require('./memberService');

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function formatTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    position: row.position,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateTaskPayload(payload, { partial = false } = {}) {
  const errors = [];

  if (!partial || payload.title !== undefined) {
    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 1) {
      errors.push('Title is required');
    } else if (payload.title.trim().length > 255) {
      errors.push('Title must be at most 255 characters');
    }
  }

  if (payload.status !== undefined && !VALID_STATUSES.includes(payload.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (payload.priority !== undefined && !VALID_PRIORITIES.includes(payload.priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (payload.dueDate !== undefined && payload.dueDate !== null) {
    if (Number.isNaN(Date.parse(payload.dueDate))) {
      errors.push('dueDate must be a valid date');
    }
  }

  return errors;
}

async function assertCanAccessTask(taskId, userId) {
  const task = await taskRepository.getRawTask(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  await assertProjectMember(task.project_id, userId);
  return task;
}

async function createTask(projectId, userId, payload) {
  await assertProjectMember(projectId, userId);

  const errors = validateTaskPayload(payload);
  if (errors.length) {
    throw new AppError('Validation failed', 400, { errors });
  }

  if (payload.assignedTo) {
    const membership = await memberRepository.findMembership(
      projectId,
      payload.assignedTo
    );
    if (!membership) {
      throw new AppError('Assignee must be a project member', 400);
    }
  }

  const task = await taskRepository.createTask({
    projectId,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    status: payload.status || 'todo',
    priority: payload.priority || 'medium',
    createdBy: userId,
    assignedTo: payload.assignedTo || null,
    dueDate: payload.dueDate || null,
    position: payload.position ?? null,
  });

  return formatTask(task);
}

async function listTasks(projectId, userId, filters) {
  await assertProjectMember(projectId, userId);

  if (filters.status && !VALID_STATUSES.includes(filters.status)) {
    throw new AppError('Validation failed', 400, {
      errors: [`Status must be one of: ${VALID_STATUSES.join(', ')}`],
    });
  }
  if (filters.priority && !VALID_PRIORITIES.includes(filters.priority)) {
    throw new AppError('Validation failed', 400, {
      errors: [`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`],
    });
  }

  const rows = await taskRepository.listTasks(projectId, filters);
  return rows.map(formatTask);
}

async function getTask(taskId, userId) {
  await assertCanAccessTask(taskId, userId);
  const task = await taskRepository.findById(taskId);
  return formatTask(task);
}

async function updateTask(taskId, userId, payload) {
  const raw = await assertCanAccessTask(taskId, userId);
  const errors = validateTaskPayload(payload, { partial: true });
  if (errors.length) {
    throw new AppError('Validation failed', 400, { errors });
  }

  if (payload.assignedTo) {
    const membership = await memberRepository.findMembership(
      raw.project_id,
      payload.assignedTo
    );
    if (!membership) {
      throw new AppError('Assignee must be a project member', 400);
    }
  }

  const task = await taskRepository.updateTask(taskId, {
    title: payload.title !== undefined ? payload.title.trim() : undefined,
    description:
      payload.description !== undefined
        ? payload.description === null
          ? null
          : payload.description.trim()
        : undefined,
    status: payload.status,
    priority: payload.priority,
    assignedTo: payload.assignedTo,
    dueDate: payload.dueDate,
    position: payload.position,
    clearAssignee: payload.assignedTo === null,
    clearDueDate: payload.dueDate === null,
  });

  return formatTask(task);
}

async function deleteTask(taskId, userId) {
  const raw = await assertCanAccessTask(taskId, userId);
  const membership = await memberRepository.findMembership(
    raw.project_id,
    userId
  );

  // Members can delete their own tasks; admins/owners can delete any
  if (
    membership.role === 'member' &&
    raw.created_by !== userId
  ) {
    throw new AppError('You can only delete tasks you created', 403);
  }

  await taskRepository.deleteTask(taskId);
  return { id: taskId, deleted: true, projectId: raw.project_id };
}

async function assignTask(taskId, userId, { assignedTo }) {
  const raw = await assertCanAccessTask(taskId, userId);

  if (assignedTo !== null && assignedTo !== undefined) {
    const membership = await memberRepository.findMembership(
      raw.project_id,
      assignedTo
    );
    if (!membership) {
      throw new AppError('Assignee must be a project member', 400);
    }
  }

  const task = await taskRepository.updateTask(taskId, {
    assignedTo: assignedTo ?? null,
    clearAssignee: assignedTo === null || assignedTo === undefined,
  });

  return formatTask(task);
}

async function changeStatus(taskId, userId, { status }) {
  await assertCanAccessTask(taskId, userId);

  if (!status || !VALID_STATUSES.includes(status)) {
    throw new AppError('Validation failed', 400, {
      errors: [`Status must be one of: ${VALID_STATUSES.join(', ')}`],
    });
  }

  const task = await taskRepository.updateTask(taskId, { status });
  return formatTask(task);
}

async function changePosition(taskId, userId, { status, position }) {
  await assertCanAccessTask(taskId, userId);

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new AppError('Validation failed', 400, {
      errors: [`Status must be one of: ${VALID_STATUSES.join(', ')}`],
    });
  }

  if (typeof position !== 'number' || !Number.isInteger(position) || position < 0) {
    throw new AppError('Validation failed', 400, {
      errors: ['position must be a non-negative integer'],
    });
  }

  const task = await taskRepository.updateTask(taskId, {
    status,
    position,
  });
  return formatTask(task);
}

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  changeStatus,
  changePosition,
  VALID_STATUSES,
  VALID_PRIORITIES,
  formatTask,
};
