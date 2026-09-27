# ProjectFlow — Modern SaaS Project Management Platform

A production-grade, full-stack project management and team collaboration platform built with **React**, **Node.js/Express**, **PostgreSQL**, and **Socket.io**, containerized via **Docker**.

---

## Demo Accounts & Credentials

The database comes pre-seeded with realistic team members and projects. All seed users share the same password:

| Name | Role | Email | Password |
|---|---|---|---|
| **Alice Owner** | Workspace Owner | `alice@example.com` | `Password123!` |
| **Bob Admin** | Project Admin | `bob@example.com` | `Password123!` |
| **Carol Member** | Team Member | `carol@example.com` | `Password123!` |
| **Dave Member** | Team Member | `dave@example.com` | `Password123!` |

> 💡 **Quick Login**: The `/login` page features one-click demo login buttons to instantly switch between Owner, Admin, and Member profiles.

---

## Key Features

- **Authentication & Security**:
  - Secure bcrypt password hashing with salt factor 10.
  - JWT access tokens (15m expiry) paired with rotatable, hashed refresh tokens (7d expiry).
  - Cookie / Authorization header transmission and auto-refresh interceptors.
  - Helmet security headers, CORS origin whitelisting, and brute-force rate limiters.
- **Projects Management**:
  - Full CRUD operations with rich descriptions and team assignments.
  - Project filtering (All, Owned by me, Member) and instant search.
- **Interactive Kanban Board**:
  - Drag-and-drop workflow across 4 columns: `TODO`, `IN PROGRESS`, `REVIEW`, `DONE`.
  - Optimistic UI updates with instant server synchronization and rollback on network failure.
  - Visual indicators for priority (`low`, `medium`, `high`, `urgent`), due dates, overdue badges, and comment counts.
- **Alternative List View**:
  - Searchable, sortable table view of all tasks with multi-field filters (status, priority, assignee).
- **Task Detail & Collaboration**:
  - Sliding drawer for task details, assignment, and status modification.
  - Persistent comment threads with real-time updates and edit/delete capabilities for comment authors.
- **Role-Based Authorization (RBAC)**:
  - **OWNER**: Full workspace control, update/delete projects, manage members and tasks.
  - **ADMIN**: Manage members, invite team users, assign tasks, update project details.
  - **MEMBER**: Create and update assigned tasks, leave comments, participate in workflows without destructive project privileges.
- **Real-Time Collaboration**:
  - Powered by Socket.io with project rooms (`project:{projectId}`) and user private channels (`user:{userId}`).
  - Instant synchronization for task creation, drag-and-drop moves, status changes, comments, and member updates across all connected clients.
- **Notification Center**:
  - Navbar bell with live unread badge.
  - Quick dropdown preview and dedicated `/notifications` management page with All/Unread tabs and "Mark all as read".
- **My Tasks & Calendar**:
  - `/my-tasks`: Categorized deliverables (Overdue, Due Today, Upcoming, Completed) with inline status dropdowns.
  - `/calendar`: Month view displaying task deadlines with interactive detail drawer access.
- **Global Search**:
  - Real-time search across Projects, Tasks, and Team Members via backend search API.
- **Responsive SaaS UI**:
  - Clean, modern layout with collapsible sidebar, accessible form controls, and Lucide icons.
  - Full loading, empty, and error state coverage across all routes.
- **System Health Diagnostics**:
  - Preserved Phase 1 infrastructure status screen available under `/system-status`.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Axios, Lucide React, Socket.io Client |
| **Backend** | Node.js, Express 5, `pg` (node-postgres), Socket.io, Helmet, Morgan, Express Rate Limit |
| **Database** | PostgreSQL 16 (Alpine) running via Docker (port 5433 host mapping) |
| **Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, parameterized SQL |

---

## Architecture Overview

```
project-management-tool/
├── client/                      # React + Vite frontend (http://localhost:5173)
│   ├── src/
│   │   ├── components/          # Reusable UI components (KanbanColumn, TaskCard, TaskDetailDrawer, etc.)
│   │   ├── context/             # AuthContext, ToastContext, SocketContext
│   │   ├── layouts/             # MainLayout (Sidebar + Navbar + Content)
│   │   ├── pages/               # LoginPage, RegisterPage, DashboardPage, ProjectDetailPage, etc.
│   │   ├── services/            # api.js, authService, projectService, taskService, etc.
│   │   ├── App.jsx              # Application router
│   │   └── main.jsx
│   └── vite.config.js
│
├── server/                      # Express API + WebSockets (http://localhost:5000)
│   ├── src/
│   │   ├── config/              # PostgreSQL pool and environment configuration
│   │   ├── controllers/         # HTTP request/response handlers
│   │   ├── middleware/          # JWT authentication, role verification, error handler
│   │   ├── repositories/        # Data-access layer using parameterized SQL
│   │   ├── routes/              # REST endpoint declarations
│   │   ├── services/            # Core business logic & authorization checks
│   │   ├── sockets/             # Socket.io connection and room event handlers
│   │   ├── utils/               # AppError, tokens, validators, formatters
│   │   ├── app.js               # Express application pipeline
│   │   └── server.js            # HTTP and Socket.io server bootstrap
│
├── database/
│   ├── schema.sql               # PostgreSQL DDL (tables, enums, triggers, indexes)
│   ├── seed.sql                 # Sample users, projects, tasks, and comments
│   └── queries.sql              # Reference SQL queries
│
├── docker-compose.yml           # PostgreSQL Docker service definition
└── package.json                 # Monorepo root scripts
```

---

## REST API Reference

### Health & System
- `GET /api/health` — Check server and database liveness

### Authentication
- `POST /api/auth/register` — Create new user account
- `POST /api/auth/login` — Authenticate credentials and receive tokens
- `POST /api/auth/refresh` — Rotate refresh token for a new access token
- `POST /api/auth/logout` — Revoke active refresh token
- `GET /api/auth/me` — Retrieve current authenticated user profile
- `PATCH /api/auth/profile` — Update display name and avatar URL
- `PATCH /api/auth/password` — Change password with current password verification

### Projects
- `GET /api/projects` — List projects accessible to current user
- `POST /api/projects` — Create a new project (caller becomes Owner)
- `GET /api/projects/:projectId` — Get project details and user's role
- `PATCH /api/projects/:projectId` — Update project name/description (Owner & Admin only)
- `DELETE /api/projects/:projectId` — Delete project and cascade tasks (Owner only)

### Project Members
- `GET /api/projects/:projectId/members` — List members and roles
- `POST /api/projects/:projectId/members` — Add an existing user by email (Admin & Owner)
- `PATCH /api/projects/:projectId/members/:userId` — Change member role (Owner & Admin)
- `DELETE /api/projects/:projectId/members/:userId` — Remove member (Owner & Admin)

### Tasks
- `GET /api/projects/:projectId/tasks` — List tasks in project
- `POST /api/projects/:projectId/tasks` — Create task in project
- `GET /api/tasks/:taskId` — Get single task details
- `PATCH /api/tasks/:taskId` — Update task details
- `DELETE /api/tasks/:taskId` — Delete task
- `PATCH /api/tasks/:taskId/status` — Move task across workflow columns
- `PATCH /api/tasks/:taskId/assign` — Assign or unassign task
- `PATCH /api/tasks/:taskId/position` — Reorder task position within column
- `GET /api/tasks/my-tasks` — List tasks assigned to current user
- `GET /api/tasks/calendar` — List tasks scheduled with due dates

### Comments
- `GET /api/tasks/:taskId/comments` — List comments for task
- `POST /api/tasks/:taskId/comments` — Add comment to task
- `PATCH /api/comments/:commentId` — Edit own comment
- `DELETE /api/comments/:commentId` — Delete own comment

### Notifications & Search
- `GET /api/notifications` — List notifications for current user
- `PATCH /api/notifications/:notificationId/read` — Mark single notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read
- `GET /api/search?q=...` — Global search across projects, tasks, and members
- `GET /api/dashboard/stats` — Summary metrics for dashboard

---

## Real-Time Socket.io Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join:project` | Client → Server | `projectId` | Join project collaboration room |
| `leave:project` | Client → Server | `projectId` | Leave project collaboration room |
| `authenticate` | Client → Server | `token` | Authenticate socket connection |
| `task:created` | Server → Client | `{ task, projectId }` | Broadcast new task creation |
| `task:updated` | Server → Client | `{ task, projectId }` | Broadcast task edit / assignment |
| `task:status_changed` | Server → Client | `{ task, projectId }` | Broadcast Kanban column change |
| `task:deleted` | Server → Client | `{ taskId, projectId }` | Broadcast task deletion |
| `comment:created` | Server → Client | `{ comment, taskId }` | Broadcast new comment |
| `comment:updated` | Server → Client | `{ comment, taskId }` | Broadcast edited comment |
| `comment:deleted` | Server → Client | `{ commentId, taskId }` | Broadcast deleted comment |
| `member:added` | Server → Client | `{ member, projectId }` | Broadcast member addition |
| `member:updated` | Server → Client | `{ member, projectId }` | Broadcast member role change |
| `member:removed` | Server → Client | `{ userId, projectId }` | Broadcast member removal |
| `notification:new` | Server → Client | `{ notification, unreadCount }` | Personal alert sent to `user:{userId}` |

---

## How to Run the Project

### 1. Start PostgreSQL (Docker)
```bash
docker compose up -d
```
PostgreSQL will run on port `5433` (host), initialized with the schema and seed data.

### 2. Start Backend Server
```bash
cd server
npm run dev
```
The Express API and Socket.io server will listen on `http://localhost:5000`.

### 3. Start Frontend Client
```bash
cd client
npm run dev
```
The Vite development server will start on `http://localhost:5173` (or `5174`).

### 4. Run Monorepo Concurrently
Alternatively, run everything with a single command from the project root:
```bash
npm run dev
```

---

## Automated Verification Suite

Run the full end-to-end integration test suite verifying health, authentication, project workflows, drag-and-drop status changes, comments, notifications, search, and authorization enforcement:

```bash
node scratch/test-full-suite.js
```
