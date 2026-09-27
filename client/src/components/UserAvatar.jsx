function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

const COLOR_CLASSES = [
  'bg-blue-600 text-white',
  'bg-indigo-600 text-white',
  'bg-violet-600 text-white',
  'bg-emerald-600 text-white',
  'bg-teal-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
];

function getColorForString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_CLASSES[Math.abs(hash) % COLOR_CLASSES.length];
}

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-14 w-14 text-base font-semibold',
  };

  const sizeClass = sizes[size] || sizes.md;

  if (!user) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-medium shrink-0 ${className}`}
      >
        ?
      </div>
    );
  }

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || 'User'}
        className={`${sizeClass} rounded-full object-cover shrink-0 ring-1 ring-slate-200 ${className}`}
      />
    );
  }

  const colorClass = getColorForString(user.name || user.email || '');

  return (
    <div
      title={user.name || user.email}
      className={`${sizeClass} flex items-center justify-center rounded-full font-medium shrink-0 select-none shadow-xs ${colorClass} ${className}`}
    >
      {getInitials(user.name)}
    </div>
  );
}
