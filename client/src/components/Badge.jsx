export function StatusBadge({ status, className = '' }) {
  const normalized = (status || 'todo').toLowerCase();

  const configs = {
    todo: {
      label: 'Todo',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    review: {
      label: 'In Review',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
    },
    done: {
      label: 'Done',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
  };

  const config = configs[normalized] || configs.todo;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  const normalized = (priority || 'medium').toLowerCase();

  const configs = {
    low: {
      label: 'Low',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    medium: {
      label: 'Medium',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    high: {
      label: 'High',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    urgent: {
      label: 'Urgent',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    },
  };

  const config = configs[normalized] || configs.medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${className}`}
    >
      {config.label}
    </span>
  );
}

export function RoleBadge({ role, className = '' }) {
  const normalized = (role || 'member').toLowerCase();

  const configs = {
    owner: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    member: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const style = configs[normalized] || configs.member;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize border ${style} ${className}`}
    >
      {normalized}
    </span>
  );
}
