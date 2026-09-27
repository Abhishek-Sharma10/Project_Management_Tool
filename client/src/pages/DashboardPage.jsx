import { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar as CalendarIcon,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import * as taskApi from '../services/taskService';
import * as projectApi from '../services/projectService';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import UserAvatar from '../components/UserAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import TaskDetailDrawer from '../components/TaskDetailDrawer';

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const outletCtx = useOutletContext();
  const openCreateProject = outletCtx?.openCreateProject;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashStats, userTasks] = await Promise.all([
        taskApi.getDashboard().catch(() => null),
        taskApi.listMyTasks().catch(() => []),
      ]);
      setStats(dashStats);
      setMyTasks(userTasks || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    function handleUpdate() {
      fetchDashboardData();
    }

    socket.on('task:created', handleUpdate);
    socket.on('task:updated', handleUpdate);
    socket.on('task:deleted', handleUpdate);
    socket.on('task:status_changed', handleUpdate);
    socket.on('task:assigned', handleUpdate);

    return () => {
      socket.off('task:created', handleUpdate);
      socket.off('task:updated', handleUpdate);
      socket.off('task:deleted', handleUpdate);
      socket.off('task:status_changed', handleUpdate);
      socket.off('task:assigned', handleUpdate);
    };
  }, [socket, fetchDashboardData]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredTasks = myTasks.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.status === taskFilter;
  });

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  };

  if (loading) {
    return <LoadingSpinner label="Loading dashboard insights…" />;
  }

  const statCards = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects ?? 0,
      subtext: 'Active workspaces',
      icon: FolderKanban,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'My Tasks',
      value: myTasks.length,
      subtext: `${myTasks.filter((t) => t.status !== 'done').length} pending`,
      icon: CheckSquare,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      label: 'In Progress',
      value: myTasks.filter((t) => t.status === 'in_progress').length,
      subtext: 'Active execution',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      label: 'Completed',
      value: myTasks.filter((t) => t.status === 'done').length,
      subtext: 'Shipped to date',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Overdue',
      value: myTasks.filter(
        (t) =>
          t.dueDate &&
          t.status !== 'done' &&
          new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
      ).length,
      subtext: 'Requires attention',
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getTimeGreeting()},{' '}
            <span className="text-blue-600">{user?.name || 'there'}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening with your projects today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/my-tasks"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <CheckSquare className="w-4 h-4 text-slate-500" />
            My Tasks
          </Link>
          <button
            type="button"
            onClick={openCreateProject}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </span>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {card.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: My Tasks (2 cols) & Recent Projects + Activity (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Tasks Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  My Tasks
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned deliverables across your workspace
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {['all', 'todo', 'in_progress', 'review', 'done'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTaskFilter(f)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      taskFilter === f
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f === 'in_progress' ? 'In Progress' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Task rows */}
            <div className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    title="No tasks found"
                    message={
                      taskFilter === 'all'
                        ? "You don't have any assigned tasks right now."
                        : `No tasks in status "${taskFilter}".`
                    }
                  />
                </div>
              ) : (
                filteredTasks.slice(0, 7).map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    task.status !== 'done' &&
                    new Date(task.dueDate) <
                      new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {task.projectName || 'Project'}
                          </span>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {task.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 text-xs font-medium ${
                              isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {filteredTasks.length > 7 && (
              <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
                <Link
                  to="/my-tasks"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  View all tasks ({filteredTasks.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Projects & Activity */}
        <div className="space-y-6">
          {/* Recent Projects Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Projects
              </h2>
              <Link
                to="/projects"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                stats.recentProjects.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="block p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {p.name}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400">
                        {p.memberCount ?? 1} members
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                        {p.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Open &rarr;
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No projects yet.{' '}
                  <button
                    onClick={openCreateProject}
                    className="text-blue-600 font-semibold underline"
                  >
                    Create one
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Recent Activity
              </h2>
            </div>

            <div className="space-y-4">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 6).map((act, idx) => (
                  <div key={act.id || idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-800 leading-snug">
                        <span className="font-semibold text-slate-900">
                          {act.title}
                        </span>{' '}
                        in{' '}
                        <span className="text-blue-600 font-medium">
                          {act.projectName}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={act.status} />
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No recent activity recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={() => fetchDashboardData()}
        onTaskDeleted={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
          fetchDashboardData();
        }}
      />
    </div>
  );
}
