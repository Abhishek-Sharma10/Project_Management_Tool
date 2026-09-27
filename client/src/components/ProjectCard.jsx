import { Link } from 'react-router-dom';
import { Users, MoreVertical, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import UserAvatar from './UserAvatar';

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  currentUserId,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isOwner = project.owner?.id === currentUserId || project.myRole === 'owner';
  const isAdmin = isOwner || project.myRole === 'admin';

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link
            to={`/projects/${project.id}`}
            className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
          >
            {project.name}
          </Link>

          {isAdmin && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-32 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-20 text-xs">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(project);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {isOwner && onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(project);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.memberCount || 1} members</span>
          </div>

          {project.myRole && (
            <span className="capitalize text-[11px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
              {project.myRole}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-400">
            Updated {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
          </span>

          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
          >
            Open Project
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
