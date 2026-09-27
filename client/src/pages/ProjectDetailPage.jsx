import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  Users,
  Activity,
  Plus,
  Settings,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import * as projectApi from '../services/projectService';
import * as taskApi from '../services/taskService';
import KanbanColumn from '../components/KanbanColumn';
import TaskModal from '../components/TaskModal';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import AddMemberModal from '../components/AddMemberModal';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import UserAvatar from '../components/UserAvatar';
import { StatusBadge, PriorityBadge } from '../components/Badge';

const COLUMNS = [
  { id: 'todo', title: 'TODO', color: 'bg-slate-400' },
  { id: 'in_progress', title: 'IN PROGRESS', color: 'bg-blue-500' },
  { id: 'review', title: 'REVIEW', color: 'bg-amber-500' },
  { id: 'done', title: 'DONE', color: 'bg-emerald-500' },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'board'; // 'overview', 'board', 'tasks', 'members', 'activity'

  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();
  const { success, error: toastError } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalStatus, setTaskModalStatus] = useState('todo');
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Edit Project Settings Modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // List view search & filter state
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const isOwner =
    project?.owner?.id === user?.id || project?.myRole === 'owner';
  const isAdmin = isOwner || project?.myRole === 'admin';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projData, tasksData, membersData] = await Promise.all([
        projectApi.getProject(projectId),
        taskApi.listTasks(projectId),
        projectApi.listMembers(projectId).catch(() => []),
      ]);
      setProject(projData);
      setProjectName(projData.name);
      setProjectDesc(projData.description || '');
      setTasks(tasksData || []);
      setMembers(membersData || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
      toastError('Project not found or access denied');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate, toastError]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Join & leave socket room for real-time collaboration
  useEffect(() => {
    if (projectId) {
      joinProject(projectId);
    }
    return () => {
      if (projectId) {
        leaveProject(projectId);
      }
    };
  }, [projectId, joinProject, leaveProject]);

  // Socket event listeners for real-time changes
  useEffect(() => {
    if (!socket || !projectId) return;

    function handleTaskCreated(data) {
      if (data.task && data.task.projectId === projectId) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === data.task.id)) return prev;
          return [...prev, data.task];
        });
      }
    }

    function handleTaskUpdated(data) {
      if (data.task && data.task.projectId === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === data.task.id ? data.task : t))
        );
      }
    }

    function handleTaskDeleted(data) {
      if (data.taskId) {
        setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
      }
    }

    function handleMemberAdded(data) {
      if (data.projectId === projectId && data.member) {
        setMembers((prev) => {
          if (prev.some((m) => m.id === data.member.id)) return prev;
          return [...prev, data.member];
        });
      }
    }

    function handleMemberUpdated(data) {
      if (data.projectId === projectId && data.member) {
        setMembers((prev) =>
          prev.map((m) => (m.id === data.member.id ? data.member : m))
        );
      }
    }

    function handleMemberRemoved(data) {
      if (data.projectId === projectId && data.userId) {
        setMembers((prev) => prev.filter((m) => m.user?.id !== data.userId));
      }
    }

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:status_changed', handleTaskUpdated);
    socket.on('task:reordered', handleTaskUpdated);
    socket.on('member:added', handleMemberAdded);
    socket.on('member:updated', handleMemberUpdated);
    socket.on('member:removed', handleMemberRemoved);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:status_changed', handleTaskUpdated);
      socket.off('task:reordered', handleTaskUpdated);
      socket.off('member:added', handleMemberAdded);
      socket.off('member:updated', handleMemberUpdated);
      socket.off('member:removed', handleMemberRemoved);
    };
  }, [socket, projectId]);

  // Drag and Drop Status Change
  const handleTaskDrop = async (taskId, newStatus) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    const previousStatus = currentTask.status;

    // 1. Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // 2. Send API request
    try {
      await taskApi.changeTaskStatus(taskId, newStatus);
      success(`Task moved to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      // 3. Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
      toastError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleOpenAddTask = (colStatus = 'todo') => {
    setTaskToEdit(null);
    setTaskModalStatus(colStatus);
    setTaskModalOpen(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    setDrawerOpen(true);
  };

  const handleUpdateProjectSettings = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setSettingsLoading(true);
      const updated = await projectApi.updateProject(projectId, {
        name: projectName.trim(),
        description: projectDesc.trim() || null,
      });
      setProject(updated);
      success('Project settings updated');
      setSettingsModalOpen(false);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    try {
      await projectApi.updateMemberRole(projectId, memberUserId, newRole);
      setMembers((prev) =>
        prev.map((m) =>
          m.user?.id === memberUserId ? { ...m, role: newRole } : m
        )
      );
      success('Member role updated successfully');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${memberName || 'this user'} from the project?`
      )
    ) {
      return;
    }

    try {
      await projectApi.removeMember(projectId, memberUserId);
      setMembers((prev) => prev.filter((m) => m.user?.id !== memberUserId));
      success('Member removed from project');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Filter tasks for List view
  const filteredListTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (t.description &&
          t.description.toLowerCase().includes(taskSearch.toLowerCase()));
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority =
        priorityFilter === 'all' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, taskSearch, statusFilter, priorityFilter]);

  if (loading) {
    return <LoadingSpinner label="Loading project workspace…" />;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        message="The project you requested does not exist or you do not have permission to view it."
      />
    );
  }

  // Calculate task counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const reviewTasks = tasks.filter((t) => t.status === 'review').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== 'done' &&
      new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  ).length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link
          to="/projects"
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                <Shield className="w-3 h-3" />
                {project.myRole || 'member'}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Members Stack */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 5).map((m) => (
                  <div key={m.id} title={`${m.user?.name} (${m.role})`}>
                    <UserAvatar user={m.user} size="sm" />
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAddMemberOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-500" />
                Add Member
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAddTask('todo')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                title="Project Settings"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'board', label: 'Board', icon: Kanban },
            { id: 'tasks', label: 'Tasks', icon: ListTodo },
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'members', label: `Members (${members.length})`, icon: Users },
            { id: 'activity', label: 'Activity', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: KANBAN BOARD */}
      {/* ========================================================= */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              Showing {tasks.length} tasks across 4 workflow stages. Drag and
              drop cards to update status.
            </span>
          </div>

          {/* Kanban Columns (Horizontal Scrolling Container) */}
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <KanbanColumn
                  key={col.id}
                  status={col.id}
                  title={col.title}
                  colorClass={col.color}
                  tasks={colTasks}
                  onTaskClick={handleTaskClick}
                  onAddTaskClick={handleOpenAddTask}
                  onTaskDrop={handleTaskDrop}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TASKS (LIST VIEW) */}
      {/* ========================================================= */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-600 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
              >
                <option value="all">All Statuses</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Task</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Assignee</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredListTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No tasks matched your filters.
                    </td>
                  </tr>
                ) : (
                  filteredListTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleTaskClick(t)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900 group-hover:text-blue-600">
                        {t.title}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3.5">
                        {t.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={t.assignedTo} size="xs" />
                            <span className="text-slate-700">
                              {t.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {t.dueDate ? (
                          new Date(t.dueDate).toLocaleDateString()
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(t);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          View &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Total Tasks
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {totalTasks}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                In Progress
              </span>
              <div className="text-3xl font-black text-blue-600 mt-1">
                {inProgressTasks}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                In Review
              </span>
              <div className="text-3xl font-black text-amber-600 mt-1">
                {reviewTasks}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Completed
              </span>
              <div className="text-3xl font-black text-emerald-600 mt-1">
                {completedTasks}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Overdue
              </span>
              <div className="text-3xl font-black text-rose-600 mt-1">
                {overdueTasks}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Project Completion Progress
              </h3>
              <span className="text-xs font-extrabold text-blue-600">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {completedTasks} of {totalTasks} deliverables completed.
            </p>
          </div>

          {/* Info Details & Team Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Project Information
              </h3>
              <div className="text-xs space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Created:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Owner:</span>
                  <span className="font-semibold text-slate-800">
                    {project.owner?.name} ({project.owner?.email})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Team Size:</span>
                  <span className="font-semibold text-slate-800">
                    {members.length} contributors
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Team Leadership
              </h3>
              <div className="space-y-2">
                {members
                  .filter((m) => m.role === 'owner' || m.role === 'admin')
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar user={m.user} size="xs" />
                        <span className="font-semibold text-slate-800">
                          {m.user?.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {m.role}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MEMBERS */}
      {/* ========================================================= */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Project Team Members
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                People with access to view, update, and collaborate on this
                project.
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setAddMemberOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Joined</th>
                  {isAdmin && <th className="px-4 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {members.map((m) => {
                  const isCurrent = m.user?.id === user?.id;
                  const isProjectOwner = m.role === 'owner';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={m.user} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {m.user?.name} {isCurrent && '(You)'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {m.user?.email}
                      </td>
                      <td className="px-4 py-3.5">
                        {isAdmin && !isProjectOwner && !isCurrent ? (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              handleRoleChange(m.user?.id, e.target.value)
                            }
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-hidden focus:border-blue-600"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              m.role === 'owner'
                                ? 'bg-purple-100 text-purple-800'
                                : m.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {new Date(m.joinedAt || m.createdAt).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-right">
                          {!isProjectOwner && !isCurrent && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(m.user?.id, m.user?.name)
                              }
                              className="text-rose-600 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ACTIVITY */}
      {/* ========================================================= */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Project Activity Log
          </h3>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No activity logged yet.
              </p>
            ) : (
              tasks.slice(0, 10).map((t, idx) => (
                <div key={t.id || idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="text-slate-800 font-medium">
                      Task <span className="font-bold text-slate-900">{t.title}</span>{' '}
                      is currently in status <StatusBadge status={t.status} />
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Updated {new Date(t.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GLOBAL MODALS */}
      {/* ========================================================= */}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projectId={projectId}
        members={members}
        initialStatus={taskModalStatus}
        taskToEdit={taskToEdit}
        onTaskSaved={(savedTask) => {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === savedTask.id);
            if (exists) {
              return prev.map((t) => (t.id === savedTask.id ? savedTask : t));
            }
            return [...prev, savedTask];
          });
        }}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        members={members}
        onTaskUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
        }}
        onTaskDeleted={(deletedId) => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
        }}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        projectId={projectId}
        onMemberAdded={(newMember) => {
          setMembers((prev) => [...prev, newMember]);
        }}
      />

      {/* Project Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Project Settings"
        subtitle="Update project name and description."
      >
        <form onSubmit={handleUpdateProjectSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={settingsLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {settingsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
