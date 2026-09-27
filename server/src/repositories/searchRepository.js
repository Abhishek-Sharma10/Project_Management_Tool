const { query } = require('../config/db');

async function searchAll(userId, searchTerm) {
  const term = `%${searchTerm.trim()}%`;

  const [projectsRes, tasksRes, membersRes] = await Promise.all([
    query(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.updated_at AS "updatedAt",
         pm.role AS "myRole"
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       WHERE p.name ILIKE $2 OR COALESCE(p.description, '') ILIKE $2
       ORDER BY p.updated_at DESC
       LIMIT 8`,
      [userId, term]
    ),
    query(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.status,
         t.priority,
         t.due_date AS "dueDate",
         p.id AS "projectId",
         p.name AS "projectName"
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       WHERE t.title ILIKE $2 OR COALESCE(t.description, '') ILIKE $2
       ORDER BY t.updated_at DESC
       LIMIT 10`,
      [userId, term]
    ),
    query(
      `SELECT DISTINCT
         u.id,
         u.name,
         u.email,
         u.avatar_url AS "avatarUrl"
       FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       )
       AND (u.name ILIKE $2 OR u.email ILIKE $2)
       LIMIT 6`,
      [userId, term]
    ),
  ]);

  return {
    projects: projectsRes.rows,
    tasks: tasksRes.rows,
    members: membersRes.rows,
  };
}

module.exports = {
  searchAll,
};
