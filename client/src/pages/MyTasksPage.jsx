import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as taskApi from '../services/taskService';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import TaskDetailDrawer from '../components/TaskDetailDrawer';

export default function MyTasksPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchMyTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await taskApi.listMyTasks();
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
      toastError('Could not load your assigned tasks');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const handleStatusChange = async (taskId, newStatus, e) => {
    e.stopPropagation();
    try {
      await taskApi.changeTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      success('Status updated');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const categorizedTasks = useMemo(() => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const overdue = [];
    const dueToday = [];
    const upcoming = [];
    const completed = [];

    tasks.forEach((t) => {
      if (t.status === 'done') {
        completed.push(t);
        return;
      }

      if (!t.dueDate) {
        upcoming.push(t);
        return;
      }

      const due = new Date(t.dueDate);
      const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      if (dueStart < today) {
        overdue.push(t);
      } else if (dueStart.getTime() === today.getTime()) {
        dueToday.push(t);
      } else {
        upcoming.push(t);
      }
    });

    return { overdue, dueToday, upcoming, completed };
  }, [tasks]);

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  };

  if (loading) {
    return <LoadingSpinner label="Loading your deliverables…" />;
  }

  const renderTaskSection = (title, taskList, icon, badgeClass) => {
    const Icon = icon;
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${badgeClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {taskList.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {taskList.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No tasks in this section.
            </div>
          ) : (
            taskList.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {task.projectName || 'Project'}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}

                  <select
                    value={task.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(task.id, e.target.value, e)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Tasks
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Stay on top of all deliverables assigned to you across projects.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <EmptyState
            title="All caught up!"
            message="You have no tasks assigned to you across any project right now."
          />
          <Link
            to="/projects"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" />
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {categorizedTasks.overdue.length > 0 &&
            renderTaskSection(
              'Overdue',
              categorizedTasks.overdue,
              AlertCircle,
              'bg-rose-50 text-rose-600'
            )}

          {/* Today */}
          {renderTaskSection(
            'Due Today',
            categorizedTasks.dueToday,
            Clock,
            'bg-amber-50 text-amber-600'
          )}

          {/* Upcoming */}
          {renderTaskSection(
            'Upcoming',
            categorizedTasks.upcoming,
            Calendar,
            'bg-blue-50 text-blue-600'
          )}

          {/* Completed */}
          {renderTaskSection(
            'Completed',
            categorizedTasks.completed,
            CheckCircle2,
            'bg-emerald-50 text-emerald-600'
          )}
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={() => fetchMyTasks()}
        onTaskDeleted={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
          fetchMyTasks();
        }}
      />
    </div>
  );
}
