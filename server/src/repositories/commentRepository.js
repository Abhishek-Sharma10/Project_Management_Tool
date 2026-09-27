const { query } = require('../config/db');

async function createComment({ taskId, userId, content }) {
  const result = await query(
    `INSERT INTO comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [taskId, userId, content]
  );
  return findById(result.rows[0].id);
}

async function listByTask(taskId) {
  const result = await query(
    `SELECT
       c.id,
       c.content,
       c.created_at,
       c.updated_at,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'avatarUrl', u.avatar_url
       ) AS "user"
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.task_id = $1
     ORDER BY c.created_at ASC`,
    [taskId]
  );
  return result.rows;
}

async function findById(commentId) {
  const result = await query(
    `SELECT
       c.id,
       c.task_id,
       c.user_id,
       c.content,
       c.created_at,
       c.updated_at,
       t.project_id,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'avatarUrl', u.avatar_url
       ) AS "user"
     FROM comments c
     JOIN tasks t ON t.id = c.task_id
     JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [commentId]
  );
  return result.rows[0] || null;
}

async function updateComment(commentId, content) {
  const result = await query(
    `UPDATE comments
     SET content = $2
     WHERE id = $1
     RETURNING id`,
    [commentId, content]
  );
  if (!result.rows[0]) return null;
  return findById(result.rows[0].id);
}

async function deleteComment(commentId) {
  const result = await query(
    `DELETE FROM comments WHERE id = $1 RETURNING id, task_id`,
    [commentId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createComment,
  listByTask,
  findById,
  updateComment,
  deleteComment,
};
