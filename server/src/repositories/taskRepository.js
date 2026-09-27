const { query } = require('../config/db');

const TASK_SELECT = `
  t.id,
  t.project_id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.position,
  t.created_at,
  t.updated_at,
  json_build_object(
    'id', creator.id,
    'name', creator.name,
    'email', creator.email,
    'avatarUrl', creator.avatar_url
  ) AS created_by,
  CASE
    WHEN assignee.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', assignee.id,
      'name', assignee.name,
      'email', assignee.email,
      'avatarUrl', assignee.avatar_url
    )
  END AS assigned_to,
  (
    SELECT COUNT(*)::INTEGER
    FROM comments c
    WHERE c.task_id = t.id
  ) AS comment_count
`;

async function createTask(data) {
  const {
    projectId,
    title,
    description,
    status = 'todo',
    priority = 'medium',
    createdBy,
    assignedTo = null,
    dueDate = null,
    position = null,
  } = data;

  const result = await query(
    `INSERT INTO tasks (
       project_id, title, description, status, priority,
       created_by, assigned_to, due_date, position
     )
     VALUES (
       $1, $2, $3,
       COALESCE($4::task_status, 'todo'),
       COALESCE($5::task_priority, 'medium'),
       $6, $7, $8,
       COALESCE(
         $9,
         (
           SELECT COALESCE(MAX(position), -1) + 1
           FROM tasks
           WHERE project_id = $1
             AND status = COALESCE($4::task_status, 'todo')
         )
       )
     )
     RETURNING id`,
    [
      projectId,
      title,
      description,
      status,
      priority,
      createdBy,
      assignedTo,
      dueDate,
      position,
    ]
  );

  return findById(result.rows[0].id);
}

async function listTasks(projectId, filters = {}) {
  const { status, priority, assignedTo, search } = filters;
  const result = await query(
    `SELECT ${TASK_SELECT}
     FROM tasks t
     JOIN users creator ON creator.id = t.created_by
     LEFT JOIN users assignee ON assignee.id = t.assigned_to
     WHERE t.project_id = $1
       AND ($2::task_status IS NULL OR t.status = $2::task_status)
       AND ($3::task_priority IS NULL OR t.priority = $3::task_priority)
       AND ($4::UUID IS NULL OR t.assigned_to = $4::UUID)
       AND (
         $5::TEXT IS NULL
         OR t.title ILIKE '%' || $5 || '%'
         OR COALESCE(t.description, '') ILIKE '%' || $5 || '%'
       )
     ORDER BY t.status, t.position ASC, t.created_at DESC`,
    [
      projectId,
      status || null,
      priority || null,
      assignedTo || null,
      search || null,
    ]
  );
  return result.rows;
}

async function findById(taskId) {
  const result = await query(
    `SELECT ${TASK_SELECT}
     FROM tasks t
     JOIN users creator ON creator.id = t.created_by
     LEFT JOIN users assignee ON assignee.id = t.assigned_to
     WHERE t.id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function updateTask(taskId, fields) {
  const {
    title,
    description,
    status,
    priority,
    assignedTo,
    dueDate,
    position,
    clearAssignee = false,
    clearDueDate = false,
  } = fields;

  const result = await query(
    `UPDATE tasks
     SET
       title = COALESCE($2, title),
       description = COALESCE($3, description),
       status = COALESCE($4::task_status, status),
       priority = COALESCE($5::task_priority, priority),
       assigned_to = CASE
         WHEN $9::BOOLEAN THEN NULL
         WHEN $6::UUID IS NOT NULL THEN $6
         ELSE assigned_to
       END,
       due_date = CASE
         WHEN $10::BOOLEAN THEN NULL
         WHEN $7::DATE IS NOT NULL THEN $7
         ELSE due_date
       END,
       position = COALESCE($8, position)
     WHERE id = $1
     RETURNING id`,
    [
      taskId,
      title ?? null,
      description ?? null,
      status ?? null,
      priority ?? null,
      assignedTo ?? null,
      dueDate ?? null,
      position ?? null,
      clearAssignee,
      clearDueDate,
    ]
  );

  if (!result.rows[0]) return null;
  return findById(result.rows[0].id);
}

async function deleteTask(taskId) {
  const result = await query(
    `DELETE FROM tasks WHERE id = $1 RETURNING id, project_id`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function getRawTask(taskId) {
  const result = await query(
    `SELECT id, project_id, title, status, priority, created_by, assigned_to, position
     FROM tasks WHERE id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function listMyTasks(userId, filters = {}) {
  const { status, priority, search } = filters;
  const result = await query(
    `SELECT
       ${TASK_SELECT},
       p.name AS project_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     JOIN users creator ON creator.id = t.created_by
     LEFT JOIN users assignee ON assignee.id = t.assigned_to
     WHERE t.assigned_to = $1
       AND ($2::task_status IS NULL OR t.status = $2::task_status)
       AND ($3::task_priority IS NULL OR t.priority = $3::task_priority)
       AND (
         $4::TEXT IS NULL
         OR t.title ILIKE '%' || $4 || '%'
         OR COALESCE(t.description, '') ILIKE '%' || $4 || '%'
       )
     ORDER BY
       CASE
         WHEN t.due_date < CURRENT_DATE AND t.status <> 'done' THEN 1
         WHEN t.due_date = CURRENT_DATE AND t.status <> 'done' THEN 2
         WHEN t.status <> 'done' THEN 3
         ELSE 4
       END,
       t.due_date ASC NULLS LAST,
       t.created_at DESC`,
    [userId, status || null, priority || null, search || null]
  );
  return result.rows;
}

async function listCalendarTasks(userId, { projectId = null } = {}) {
  const result = await query(
    `SELECT
       ${TASK_SELECT},
       p.name AS project_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     JOIN users creator ON creator.id = t.created_by
     LEFT JOIN users assignee ON assignee.id = t.assigned_to
     WHERE t.due_date IS NOT NULL
       AND ($2::UUID IS NULL OR t.project_id = $2::UUID)
     ORDER BY t.due_date ASC, t.priority DESC`,
    [userId, projectId || null]
  );
  return result.rows;
}

module.exports = {
  createTask,
  listTasks,
  listMyTasks,
  listCalendarTasks,
  findById,
  updateTask,
  deleteTask,
  getRawTask,
};

