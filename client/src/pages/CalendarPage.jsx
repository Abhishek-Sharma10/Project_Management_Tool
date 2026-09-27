import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import * as taskApi from '../services/taskService';
import * as projectApi from '../services/projectService';
import { useToast } from '../context/ToastContext';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskDetailDrawer from '../components/TaskDetailDrawer';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toastError } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projList, tasksList] = await Promise.all([
        projectApi.listProjects().catch(() => []),
        taskApi.listCalendarTasks().catch(() => []),
      ]);
      setProjects(projList || []);
      setTasks(tasksList || []);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false, dateKey: null });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateKey,
      });
    }

    return days;
  }, [year, month]);

  // Filter tasks by selected project
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Map tasks by due date string "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      if (t.dueDate) {
        const dateKey = t.dueDate.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  };

  if (loading) {
    return <LoadingSpinner label="Loading calendar deadlines…" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track deadlines, scheduled deliveries, and project milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs focus:outline-hidden focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Month Navigation */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Current Month Title */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {monthNames[month]} {year}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {filteredTasks.length} tasks scheduled with due dates
          </span>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 text-center pb-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-xs font-bold text-slate-400 uppercase tracking-wider py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 border-l border-t border-slate-200 divide-x divide-y divide-slate-200">
          {calendarDays.map((cell, index) => {
            const dayTasks = cell.dateKey ? tasksByDate[cell.dateKey] || [] : [];
            const isToday = cell.dateKey === todayKey;

            return (
              <div
                key={index}
                className={`min-h-[110px] sm:min-h-[125px] p-2 flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/50'
                    : isToday
                    ? 'bg-blue-50/30'
                    : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  {cell.dayNumber ? (
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                  ) : (
                    <span />
                  )}

                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Day Tasks preview */}
                <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-[75px]">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      title={`${task.title} (${task.status})`}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium truncate cursor-pointer transition-colors ${
                        task.status === 'done'
                          ? 'bg-emerald-50 text-emerald-800 line-through'
                          : task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {task.title}
                    </div>
                  ))}

                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-semibold px-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={() => loadData()}
        onTaskDeleted={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
          loadData();
        }}
      />
    </div>
  );
}
