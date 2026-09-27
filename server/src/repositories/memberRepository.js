const { query } = require('../config/db');

async function listMembers(projectId) {
  const result = await query(
    `SELECT
       pm.id,
       pm.project_id,
       pm.role,
       pm.joined_at,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'avatarUrl', u.avatar_url
       ) AS "user"
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY
       CASE pm.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         ELSE 3
       END,
       pm.joined_at ASC`,
    [projectId]
  );
  return result.rows;
}

async function addMember({ projectId, userId, role = 'member' }) {
  const result = await query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3::project_member_role)
     RETURNING id, project_id, user_id, role, joined_at`,
    [projectId, userId, role]
  );
  return result.rows[0];
}

async function updateMemberRole(projectId, userId, role) {
  const result = await query(
    `UPDATE project_members
     SET role = $3::project_member_role
     WHERE project_id = $1 AND user_id = $2
     RETURNING id, project_id, user_id, role, joined_at`,
    [projectId, userId, role]
  );
  return result.rows[0] || null;
}

async function removeMember(projectId, userId) {
  const result = await query(
    `DELETE FROM project_members
     WHERE project_id = $1 AND user_id = $2
     RETURNING id, user_id`,
    [projectId, userId]
  );
  return result.rows[0] || null;
}

async function findMembership(projectId, userId) {
  const result = await query(
    `SELECT id, project_id, user_id, role, joined_at
     FROM project_members
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  return result.rows[0] || null;
}

async function findMemberWithUser(projectId, userId) {
  const result = await query(
    `SELECT
       pm.id,
       pm.project_id,
       pm.role,
       pm.joined_at,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'avatarUrl', u.avatar_url
       ) AS "user"
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  findMembership,
  findMemberWithUser,
};
