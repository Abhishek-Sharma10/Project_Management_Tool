-- =============================================================================
-- Project Management Tool — PostgreSQL Schema
-- Phase 1: Complete database design supporting auth, projects, tasks,
--          comments, notifications, and refresh tokens.
-- =============================================================================

-- Enable UUID generation (pgcrypto is available on PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enum types (constrain allowed values at the database level)
-- -----------------------------------------------------------------------------

CREATE TYPE project_member_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_status_changed',
  'task_commented',
  'project_added',
  'project_updated',
  'member_added',
  'member_removed',
  'mention',
  'general'
);

-- -----------------------------------------------------------------------------
-- Helper: auto-update updated_at on row change
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. users
-- -----------------------------------------------------------------------------

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_created_at ON users (created_at DESC);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. projects
-- -----------------------------------------------------------------------------

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE INDEX idx_projects_owner_id ON projects (owner_id);
CREATE INDEX idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX idx_projects_name ON projects (name);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. project_members
-- Unique (project_id, user_id) — a user can only join a project once.
-- -----------------------------------------------------------------------------

CREATE TABLE project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role       project_member_role NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT project_members_unique UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON project_members (project_id);
CREATE INDEX idx_project_members_user_id ON project_members (user_id);
CREATE INDEX idx_project_members_role ON project_members (project_id, role);

CREATE TRIGGER trg_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. tasks
-- position is used for Kanban column ordering (lower = higher on board).
-- -----------------------------------------------------------------------------

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      task_status NOT NULL DEFAULT 'todo',
  priority    task_priority NOT NULL DEFAULT 'medium',
  created_by  UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users (id) ON DELETE SET NULL,
  due_date    DATE,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_tasks_status ON tasks (project_id, status);
CREATE INDEX idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks (created_by);
CREATE INDEX idx_tasks_due_date ON tasks (due_date);
CREATE INDEX idx_tasks_priority ON tasks (priority);
CREATE INDEX idx_tasks_position ON tasks (project_id, status, position);
CREATE INDEX idx_tasks_title_search ON tasks USING gin (to_tsvector('english', title));

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. comments
-- -----------------------------------------------------------------------------

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT comments_content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

CREATE INDEX idx_comments_task_id ON comments (task_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);
CREATE INDEX idx_comments_created_at ON comments (task_id, created_at DESC);

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. notifications
-- entity_type / entity_id let the UI deep-link to the related resource.
-- -----------------------------------------------------------------------------

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'general',
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT notifications_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT notifications_message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications (entity_type, entity_id);

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. refresh_tokens
-- Stores hashed refresh tokens for rotation / logout invalidation.
-- -----------------------------------------------------------------------------

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT refresh_tokens_hash_unique UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens (user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TRIGGER trg_refresh_tokens_updated_at
  BEFORE UPDATE ON refresh_tokens
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Convenience view: project with member count and owner info
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW project_summaries AS
SELECT
  p.id,
  p.name,
  p.description,
  p.owner_id,
  u.name AS owner_name,
  u.email AS owner_email,
  u.avatar_url AS owner_avatar_url,
  (
    SELECT COUNT(*)::INTEGER
    FROM project_members pm
    WHERE pm.project_id = p.id
  ) AS member_count,
  p.created_at,
  p.updated_at
FROM projects p
JOIN users u ON u.id = p.owner_id;
