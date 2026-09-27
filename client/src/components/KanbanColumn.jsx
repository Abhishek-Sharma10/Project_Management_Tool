import { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

export default function KanbanColumn({
  status,
  title,
  tasks = [],
  colorClass,
  onTaskClick,
  onAddTaskClick,
  onTaskDrop,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only clear if actually leaving the column element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-72 sm:w-80 shrink-0 rounded-2xl bg-slate-100/70 border transition-all duration-200 ${
        isDragOver
          ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-400/20'
          : 'border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
          <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
            {title}
          </h3>
          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-slate-200/80 text-[11px] font-semibold text-slate-600">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddTaskClick(status)}
          title={`Add task to ${title}`}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Card List */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-230px)] min-h-[140px]">
        {tasks.length === 0 ? (
          <div className="h-28 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
            Drop task here
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>

      {/* Footer Add Task Button */}
      <div className="p-2 border-t border-slate-200/60">
        <button
          type="button"
          onClick={() => onAddTaskClick(status)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-white transition-all shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>
    </div>
  );
}
