import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  Bell,
  Settings,
  User,
  Plus,
  Layers,
  ChevronDown,
  X,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as projectApi from '../services/projectService';
import UserAvatar from './UserAvatar';

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen,
  onCreateProjectClick,
}) {
  const { user } = useAuth();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await projectApi.listProjects();
        setProjects(data || []);
      } catch (err) {
        // silent fail or fallback
      }
    }
    loadProjects();
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">
            Project<span className="text-blue-600">Flow</span>
          </span>
        </Link>
        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Menu
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Workspace / Projects list */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5">
            <button
              type="button"
              onClick={() => setProjectsCollapsed(!projectsCollapsed)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            >
              <span>Projects</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  projectsCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
            <button
              type="button"
              onClick={onCreateProjectClick}
              title="Create Project"
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {!projectsCollapsed && (
            <div className="space-y-0.5">
              {projects.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-slate-400 italic">No projects yet</p>
              ) : (
                projects.map((proj) => (
                  <NavLink
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors truncate ${
                        isActive
                          ? 'bg-slate-100 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">{proj.name}</span>
                  </NavLink>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile / Settings */}
      <div className="border-t border-slate-100 p-3 space-y-1 bg-slate-50/50 shrink-0">
        <NavLink
          to="/system-status"
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>System Status</span>
        </NavLink>

        <NavLink
          to="/settings"
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Settings</span>
        </NavLink>

        <Link
          to="/profile"
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 transition-colors mt-1"
        >
          <UserAvatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
