const AppError = require('../utils/AppError');
const commentRepository = require('../repositories/commentRepository');
const taskRepository = require('../repositories/taskRepository');
const { assertProjectMember } = require('./memberService');

function formatComment(row) {
  return {
    id: row.id,
    content: row.content,
    user: row.user,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateContent(content) {
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new AppError('Validation failed', 400, {
      errors: ['Comment content cannot be empty'],
    });
  }
  if (content.trim().length > 5000) {
    throw new AppError('Validation failed', 400, {
      errors: ['Comment must be at most 5000 characters'],
    });
  }
}

async function createComment(taskId, userId, { content }) {
  const task = await taskRepository.getRawTask(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  await assertProjectMember(task.project_id, userId);
  validateContent(content);

  const row = await commentRepository.createComment({
    taskId,
    userId,
    content: content.trim(),
  });
  return formatComment(row);
}

async function listComments(taskId, userId) {
  const task = await taskRepository.getRawTask(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  await assertProjectMember(task.project_id, userId);

  const rows = await commentRepository.listByTask(taskId);
  return rows.map(formatComment);
}

async function updateComment(commentId, userId, { content }) {
  const existing = await commentRepository.findById(commentId);
  if (!existing) {
    throw new AppError('Comment not found', 404);
  }
  await assertProjectMember(existing.project_id, userId);

  if (existing.user_id !== userId) {
    throw new AppError('You can only edit your own comments', 403);
  }

  validateContent(content);
  const row = await commentRepository.updateComment(commentId, content.trim());
  return formatComment(row);
}

async function deleteComment(commentId, userId) {
  const existing = await commentRepository.findById(commentId);
  if (!existing) {
    throw new AppError('Comment not found', 404);
  }
  await assertProjectMember(existing.project_id, userId);

  if (existing.user_id !== userId) {
    throw new AppError('You can only delete your own comments', 403);
  }

  await commentRepository.deleteComment(commentId);
  return { id: commentId, deleted: true, taskId: existing.task_id };
}

module.exports = {
  createComment,
  listComments,
  updateComment,
  deleteComment,
};
