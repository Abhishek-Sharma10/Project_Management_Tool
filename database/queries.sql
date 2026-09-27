-- =============================================================================
-- Project Management Tool — Common SQL Queries
-- Reference queries used by repositories. Prefer parameterized forms ($1, $2…).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- AUTH / USERS
-- -----------------------------------------------------------------------------

-- Create user
-- $1 = name, $2 = email, $3 = password_hash
INSERT INTO users (name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, name, email, avatar_url, created_at, updated_at;

-- Find user by email (login)
SELECT id, name, email, password_hash, avatar_url, created_at, updated_at
FROM users
WHERE email = $1;

-- Find user by id (GET /auth/me)
SELECT id, name, email, avatar_url, created_at, updated_at
FROM users
WHERE id = $1;

-- Check duplicate email
SELECT EXISTS (
  SELECT 1 FROM users WHERE email = $1
) AS email_taken;

-- Update profile
UPDATE users
SET name = COALESCE($2, name),
    avatar_url = COALESCE($3, avatar_url)
WHERE id = $1
RETURNING id, name, email, avatar_url, created_at, updated_at;

-- -----------------------------------------------------------------------------
-- REFRESH TOKENS
-- -----------------------------------------------------------------------------

-- Store refresh token
-- $1 = user_id, $2 = token_hash, $3 = expires_at
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id, user_id, expires_at, created_at;

-- Find valid (non-revoked, non-expired) refresh token
SELECT id, user_id, token_hash, expires_at, revoked_at
FROM refresh_tokens
WHERE token_hash = $1
  AND revoked_at IS NULL
  AND expires_at > NOW();

-- Revoke a single refresh token (logout)
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE token_hash = $1
  AND revoked_at IS NULL
RETURNING id;

-- Revoke all refresh tokens for a user
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE user_id = $1
  AND revoked_at IS NULL;

-- Cleanup expired tokens
DELETE FROM refresh_tokens
WHERE expires_at < NOW()
   OR revoked_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- PROJECTS
-- -----------------------------------------------------------------------------

-- Create project
INSERT INTO projects (name, description, owner_id)
VALUES ($1, $2, $3)
RETURNING id, name, description, owner_id, created_at, updated_at;

-- Insert owner as project member (run in same transaction as create)
INSERT INTO project_members (project_id, user_id, role)
VALUES ($1, $2, 'owner');

-- List projects for a user (member of)
SELECT
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
  ) AS "memberCount",
  pm.role AS "myRole",
  p.created_at AS "createdAt",
  p.updated_at AS "updatedAt"
FROM projects p
JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
JOIN users u ON u.id = p.owner_id
ORDER BY p.updated_at DESC;

-- Get single project (only if requester is a member)
SELECT
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
  ) AS "memberCount",
  pm.role AS "myRole",
  p.created_at AS "createdAt",
  p.updated_at AS "updatedAt"
FROM projects p
JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
JOIN users u ON u.id = p.owner_id
WHERE p.id = $1;

-- Update project
UPDATE projects
SET name = COALESCE($2, name),
    description = COALESCE($3, description)
WHERE id = $1
RETURNING id, name, description, owner_id, created_at, updated_at;

-- Delete project
DELETE FROM projects
WHERE id = $1
RETURNING id;

-- -----------------------------------------------------------------------------
-- PROJECT MEMBERS
-- -----------------------------------------------------------------------------

-- List members
SELECT
  pm.id,
  pm.project_id AS "projectId",
  pm.role,
  pm.joined_at AS "joinedAt",
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
  pm.joined_at ASC;

-- Add member by email lookup (application finds user_id first)
INSERT INTO project_members (project_id, user_id, role)
VALUES ($1, $2, COALESCE($3::project_member_role, 'member'))
RETURNING id, project_id, user_id, role, joined_at;

-- Change member role
UPDATE project_members
SET role = $3::project_member_role
WHERE project_id = $1
  AND user_id = $2
RETURNING id, project_id, user_id, role, joined_at;

-- Remove member
DELETE FROM project_members
WHERE project_id = $1
  AND user_id = $2
RETURNING id;

-- Check membership + role
SELECT role
FROM project_members
WHERE project_id = $1
  AND user_id = $2;

-- Find user by email for inviting
SELECT id, name, email, avatar_url
FROM users
WHERE email = $1;

-- -----------------------------------------------------------------------------
-- TASKS
-- -----------------------------------------------------------------------------

-- Create task
INSERT INTO tasks (
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
RETURNING *;

-- List tasks for a project (with optional filters)
-- $1 = project_id
-- $2 = status (nullable)
-- $3 = priority (nullable)
-- $4 = assigned_to (nullable)
-- $5 = search text (nullable)
SELECT
  t.id,
  t.project_id AS "projectId",
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date AS "dueDate",
  t.position,
  t.created_at AS "createdAt",
  t.updated_at AS "updatedAt",
  json_build_object(
    'id', creator.id,
    'name', creator.name,
    'email', creator.email,
    'avatarUrl', creator.avatar_url
  ) AS "createdBy",
  CASE
    WHEN assignee.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', assignee.id,
      'name', assignee.name,
      'email', assignee.email,
      'avatarUrl', assignee.avatar_url
    )
  END AS "assignedTo",
  (
    SELECT COUNT(*)::INTEGER
    FROM comments c
    WHERE c.task_id = t.id
  ) AS "commentCount"
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
    OR t.description ILIKE '%' || $5 || '%'
  )
ORDER BY t.status, t.position ASC, t.created_at DESC;

-- Get single task
SELECT
  t.*,
  json_build_object(
    'id', creator.id,
    'name', creator.name,
    'email', creator.email,
    'avatarUrl', creator.avatar_url
  ) AS "createdBy",
  CASE
    WHEN assignee.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', assignee.id,
      'name', assignee.name,
      'email', assignee.email,
      'avatarUrl', assignee.avatar_url
    )
  END AS "assignedTo",
  (
    SELECT COUNT(*)::INTEGER
    FROM comments c
    WHERE c.task_id = t.id
  ) AS "commentCount"
FROM tasks t
JOIN users creator ON creator.id = t.created_by
LEFT JOIN users assignee ON assignee.id = t.assigned_to
WHERE t.id = $1;

-- Update task (partial)
UPDATE tasks
SET
  title = COALESCE($2, title),
  description = COALESCE($3, description),
  status = COALESCE($4::task_status, status),
  priority = COALESCE($5::task_priority, priority),
  assigned_to = COALESCE($6, assigned_to),
  due_date = COALESCE($7, due_date),
  position = COALESCE($8, position)
WHERE id = $1
RETURNING *;

-- Assign task
UPDATE tasks
SET assigned_to = $2
WHERE id = $1
RETURNING *;

-- Change status
UPDATE tasks
SET status = $2::task_status
WHERE id = $1
RETURNING *;

-- Reorder within a column (set position + optionally status)
UPDATE tasks
SET status = COALESCE($2::task_status, status),
    position = $3
WHERE id = $1
RETURNING *;

-- Delete task
DELETE FROM tasks
WHERE id = $1
RETURNING id;

-- Dashboard: assigned / completed / pending / overdue for a user
SELECT
  COUNT(*) FILTER (WHERE assigned_to = $1) AS assigned_tasks,
  COUNT(*) FILTER (WHERE assigned_to = $1 AND status = 'done') AS completed_tasks,
  COUNT(*) FILTER (
    WHERE assigned_to = $1 AND status <> 'done'
  ) AS pending_tasks,
  COUNT(*) FILTER (
    WHERE assigned_to = $1
      AND status <> 'done'
      AND due_date < CURRENT_DATE
  ) AS overdue_tasks
FROM tasks t
WHERE EXISTS (
  SELECT 1
  FROM project_members pm
  WHERE pm.project_id = t.project_id
    AND pm.user_id = $1
);

-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------

-- Add comment
INSERT INTO comments (task_id, user_id, content)
VALUES ($1, $2, $3)
RETURNING id, task_id, user_id, content, created_at, updated_at;

-- List comments for a task
SELECT
  c.id,
  c.content,
  c.created_at AS "createdAt",
  c.updated_at AS "updatedAt",
  json_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email,
    'avatarUrl', u.avatar_url
  ) AS "user"
FROM comments c
JOIN users u ON u.id = c.user_id
WHERE c.task_id = $1
ORDER BY c.created_at ASC;

-- Update own comment
UPDATE comments
SET content = $2
WHERE id = $1
  AND user_id = $3
RETURNING id, task_id, user_id, content, created_at, updated_at;

-- Delete own comment
DELETE FROM comments
WHERE id = $1
  AND user_id = $2
RETURNING id;

-- Get comment with author (for authorization checks)
SELECT c.*, t.project_id
FROM comments c
JOIN tasks t ON t.id = c.task_id
WHERE c.id = $1;

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------------------------

-- Create notification
INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
VALUES ($1, $2::notification_type, $3, $4, $5, $6)
RETURNING *;

-- List notifications for user
SELECT
  id,
  type,
  title,
  message,
  entity_type AS "entityType",
  entity_id AS "entityId",
  is_read AS "isRead",
  created_at AS "createdAt"
FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT COALESCE($2, 50)
OFFSET COALESCE($3, 0);

-- Unread count
SELECT COUNT(*)::INTEGER AS "unreadCount"
FROM notifications
WHERE user_id = $1
  AND is_read = FALSE;

-- Mark one as read
UPDATE notifications
SET is_read = TRUE
WHERE id = $1
  AND user_id = $2
RETURNING *;

-- Mark all as read
UPDATE notifications
SET is_read = TRUE
WHERE user_id = $1
  AND is_read = FALSE
RETURNING id;
