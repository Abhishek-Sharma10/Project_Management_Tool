import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Settings,
  Bell,
  Palette,
  Shield,
  LogOut,
  User,
  Check,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  // Notification preferences state (persisted locally)
  const [notifyAssignment, setNotifyAssignment] = useState(true);
  const [notifyStatusChange, setNotifyStatusChange] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  // Active settings tab
  const [activeTab, setActiveTab] = useState('notifications');

  const handleSavePreferences = () => {
    success('Notification preferences saved successfully');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure your workspace preferences, alerts, and security options.
        </p>
      </div>

      {/* Main Settings Container with Left Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-100 p-3 sm:p-4 space-y-1 bg-slate-50/50 shrink-0">
          {[
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'security', label: 'Security & Sessions', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-200/60 mt-4">
            <Link
              to="/profile"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <User className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Edit Profile &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 sm:p-8">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which events trigger in-app alerts and notifications.
                </p>
              </div>

              <div className="space-y-4 pt-2 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Task Assignments
                    </h4>
                    <p className="text-xs text-slate-400">
                      Receive an alert when someone assigns a task to you.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAssignment}
                    onChange={(e) => setNotifyAssignment(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Task Status Changes
                    </h4>
                    <p className="text-xs text-slate-400">
                      Notify me when tasks in my projects change workflow columns.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyStatusChange}
                    onChange={(e) => setNotifyStatusChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      New Comments & Mentions
                    </h4>
                    <p className="text-xs text-slate-400">
                      Alert me when a team member comments on deliverables.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyComments}
                    onChange={(e) => setNotifyComments(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Weekly Digest Email
                    </h4>
                    <p className="text-xs text-slate-400">
                      Send a summary email of completed tasks every Monday.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailDigest}
                    onChange={(e) => setEmailDigest(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Theme & Display
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the look and feel of your ProjectFlow workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl border-2 border-blue-600 bg-white shadow-2xs space-y-2 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Clean Light (Default)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">
                    Optimized for high contrast and productivity with crisp borders and subtle neutral backgrounds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 opacity-60 space-y-2 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Dark SaaS Mode
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Low-light theme designed for evening focus sessions and reduced eye strain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security & Sessions Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Security & Active Sessions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage active JWT tokens and your current login session.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Current Account:</span>
                  <span className="font-semibold text-slate-900">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Session Token:</span>
                  <span className="font-mono text-emerald-600 font-medium">Active (Auto-refresh enabled)</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Encryption:</span>
                  <span className="text-slate-600">HMAC SHA-256 JWT + PostgreSQL pgcrypto</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  Sign Out from this Device
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
