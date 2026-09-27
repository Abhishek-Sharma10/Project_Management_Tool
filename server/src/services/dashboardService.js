const { query } = require('../config/db');

async function getStatsForUser(userId) {
  const projectsResult = await query(
    `SELECT COUNT(*)::INTEGER AS total_projects
     FROM project_members
     WHERE user_id = $1`,
    [userId]
  );

  const tasksResult = await query(
    `SELECT
       COUNT(*) FILTER (WHERE t.assigned_to = $1)::INTEGER AS assigned_tasks,
       COUNT(*) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done')::INTEGER AS completed_tasks,
       COUNT(*) FILTER (WHERE t.assigned_to = $1 AND t.status <> 'done')::INTEGER AS pending_tasks,
       COUNT(*) FILTER (
         WHERE t.assigned_to = $1
           AND t.status <> 'done'
           AND t.due_date < CURRENT_DATE
       )::INTEGER AS overdue_tasks
     FROM tasks t
     WHERE EXISTS (
       SELECT 1 FROM project_members pm
       WHERE pm.project_id = t.project_id AND pm.user_id = $1
     )`,
    [userId]
  );

  const recentProjects = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.updated_at,
       (
         SELECT COUNT(*)::INTEGER FROM project_members pm2
         WHERE pm2.project_id = p.id
       ) AS member_count
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     ORDER BY p.updated_at DESC
     LIMIT 5`,
    [userId]
  );

  const recentActivity = await query(
    `SELECT
       t.id,
       t.title,
       t.status,
       t.updated_at,
       p.id AS project_id,
       p.name AS project_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     ORDER BY t.updated_at DESC
     LIMIT 8`,
    [userId]
  );

  return {
    totalProjects: projectsResult.rows[0].total_projects,
    assignedTasks: tasksResult.rows[0].assigned_tasks,
    completedTasks: tasksResult.rows[0].completed_tasks,
    pendingTasks: tasksResult.rows[0].pending_tasks,
    overdueTasks: tasksResult.rows[0].overdue_tasks,
    recentProjects: recentProjects.rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      memberCount: p.member_count,
      updatedAt: p.updated_at,
    })),
    recentActivity: recentActivity.rows.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      updatedAt: t.updated_at,
      projectId: t.project_id,
      projectName: t.project_name,
    })),
  };
}

module.exports = {
  getStatsForUser,
};
