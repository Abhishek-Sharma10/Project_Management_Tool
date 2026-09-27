const { query, getClient } = require('../config/db');

async function createProject({ name, description, ownerId }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const projectResult = await client.query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, owner_id, created_at, updated_at`,
      [name, description, ownerId]
    );
    const project = projectResult.rows[0];

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [project.id, ownerId]
    );

    await client.query('COMMIT');
    return project;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listProjectsForUser(userId) {
  const result = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.owner_id,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'avatarUrl', u.avatar_url
       ) AS owner,
       (
         SELECT COUNT(*)::INTEGER
         FROM project_members pm2
         WHERE pm2.project_id = p.id
       ) AS member_count,
       pm.role AS my_role,
       p.created_at,
       p.updated_at
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     JOIN users u ON u.id = p.owner_id
     ORDER BY p.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

async function findProjectForUser(projectId, userId) {
  const result = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.owner_id,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'avatarUrl', u.avatar_url
       ) AS owner,
       (
         SELECT COUNT(*)::INTEGER
         FROM project_members pm2
         WHERE pm2.project_id = p.id
       ) AS member_count,
       pm.role AS my_role,
       p.created_at,
       p.updated_at
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
     JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1`,
    [projectId, userId]
  );
  return result.rows[0] || null;
}

async function findById(projectId) {
  const result = await query(
    `SELECT id, name, description, owner_id, created_at, updated_at
     FROM projects
     WHERE id = $1`,
    [projectId]
  );
  return result.rows[0] || null;
}

async function updateProject(projectId, { name, description }) {
  const result = await query(
    `UPDATE projects
     SET name = COALESCE($2, name),
         description = COALESCE($3, description)
     WHERE id = $1
     RETURNING id, name, description, owner_id, created_at, updated_at`,
    [projectId, name, description]
  );
  return result.rows[0] || null;
}

async function deleteProject(projectId) {
  const result = await query(
    `DELETE FROM projects
     WHERE id = $1
     RETURNING id`,
    [projectId]
  );
  return result.rows[0] || null;
}

async function getMemberRole(projectId, userId) {
  const result = await query(
    `SELECT role
     FROM project_members
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  return result.rows[0]?.role || null;
}

module.exports = {
  createProject,
  listProjectsForUser,
  findProjectForUser,
  findById,
  updateProject,
  deleteProject,
  getMemberRole,
};
