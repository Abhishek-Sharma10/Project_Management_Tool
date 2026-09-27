import { Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { PriorityBadge } from './Badge';
import UserAvatar from './UserAvatar';

export default function TaskCard({ task, onClick, onDragStart }) {
  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        if (onDragStart) onDragStart(task);
      }}
      onClick={onClick}
      className="group relative bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400/80 transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Priority badge & comment count */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
        {task.commentCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{task.commentCount}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-1">
        {task.title}
      </h4>

      {/* Description snippet */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Footer: Due date + Assignee */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-2">
        {task.dueDate ? (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${
              isOverdue ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        ) : (
          <div />
        )}

        {task.assignedTo ? (
          <UserAvatar user={task.assignedTo} size="xs" />
        ) : (
          <div
            title="Unassigned"
            className="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400"
          >
            -
          </div>
        )}
      </div>
    </div>
  );
}
