-- =============================================================================
-- Project Management Tool — Seed Data
-- Safe for local development only. Passwords are bcrypt hashes of "Password123!".
-- =============================================================================

-- Clear existing data (respect FK order)
TRUNCATE refresh_tokens, notifications, comments, tasks, project_members, projects, users
  RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- Users
-- password for all seed users: Password123!
-- bcrypt hash generated with cost factor 10
-- -----------------------------------------------------------------------------

INSERT INTO users (id, name, email, password_hash, avatar_url) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Alice Owner',
    'alice@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NULL
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Bob Admin',
    'bob@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NULL
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Carol Member',
    'carol@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NULL
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Dave Member',
    'dave@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NULL
  );

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------

INSERT INTO projects (id, name, description, owner_id) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Website Redesign',
    'Rebuild the company marketing site with a modern stack.',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Mobile App Launch',
    'Plan and ship the first version of the mobile app.',
    '11111111-1111-1111-1111-111111111111'
  );

-- -----------------------------------------------------------------------------
-- Project members (owner is always inserted as role = owner)
-- -----------------------------------------------------------------------------

INSERT INTO project_members (project_id, user_id, role) VALUES
  -- Website Redesign
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'member'),
  -- Mobile App Launch
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'member'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'member');

-- -----------------------------------------------------------------------------
-- Tasks
-- -----------------------------------------------------------------------------

INSERT INTO tasks (
  id, project_id, title, description, status, priority,
  created_by, assigned_to, due_date, position
) VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Design landing page',
    'Create wireframes and high-fidelity mockups for the new landing page.',
    'in_progress',
    'high',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE + INTERVAL '7 days',
    0
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Set up CI pipeline',
    'Configure GitHub Actions for lint, test, and deploy.',
    'todo',
    'medium',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '14 days',
    0
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Write API documentation',
    'Document all REST endpoints with request/response examples.',
    'review',
    'medium',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    CURRENT_DATE + INTERVAL '3 days',
    0
  ),
  (
    'c4444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Migrate legacy content',
    'Move blog posts and case studies to the new CMS.',
    'done',
    'low',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE - INTERVAL '2 days',
    0
  ),
  (
    'c5555555-5555-5555-5555-555555555555',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Define MVP features',
    'Agree on the minimum feature set for the first release.',
    'todo',
    'urgent',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '5 days',
    0
  ),
  (
    'c6666666-6666-6666-6666-666666666666',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Prototype navigation',
    'Build a clickable prototype of the primary app navigation.',
    'in_progress',
    'high',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE + INTERVAL '10 days',
    0
  );

-- -----------------------------------------------------------------------------
-- Comments
-- -----------------------------------------------------------------------------

INSERT INTO comments (task_id, user_id, content) VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Looks good so far — please share the Figma link when ready.'
  ),
  (
    'c1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'Will upload the first draft by Friday.'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    'Draft is ready for review in the docs folder.'
  );

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------

INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, is_read) VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'task_assigned',
    'Task assigned',
    'You were assigned to "Design landing page".',
    'task',
    'c1111111-1111-1111-1111-111111111111',
    FALSE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'task_assigned',
    'Task assigned',
    'You were assigned to "Write API documentation".',
    'task',
    'c3333333-3333-3333-3333-333333333333',
    FALSE
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'task_commented',
    'New comment',
    'Bob Admin commented on "Design landing page".',
    'task',
    'c1111111-1111-1111-1111-111111111111',
    TRUE
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'project_added',
    'Added to project',
    'You were added to "Mobile App Launch".',
    'project',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    FALSE
  );
