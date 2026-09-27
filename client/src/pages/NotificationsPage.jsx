import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  CheckCircle2,
  FolderKanban,
  MessageSquare,
  UserPlus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import * as notificationApi from '../services/notificationService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationApi.listNotifications({ limit: 50 });
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toastError('Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time notification arrival
  useEffect(() => {
    if (!socket) return;

    function handleNew(data) {
      if (data.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      }
    }

    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [socket]);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      toastError('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      success('All notifications marked as read');
    } catch (err) {
      toastError('Failed to mark all as read');
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }

    if (notif.entityType === 'task' && notif.entityId) {
      navigate(`/tasks/${notif.entityId}`);
    } else if (notif.entityType === 'project' && notif.entityId) {
      navigate(`/projects/${notif.entityId}`);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquareIcon className="w-4 h-4 text-blue-600" />;
      case 'task_status_changed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'task_commented':
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'project_added':
      case 'member_added':
        return <UserPlus className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading notifications…" />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time updates regarding tasks, mentions, comments, and projects.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs self-start w-fit">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="You're all caught up!"
              message={
                filter === 'unread'
                  ? 'No unread notifications at this time.'
                  : 'You have not received any notifications yet.'
              }
            />
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer group ${
                notif.isRead
                  ? 'bg-white hover:bg-slate-50/80'
                  : 'bg-blue-50/20 hover:bg-blue-50/40'
              }`}
            >
              {/* Type Icon Container */}
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  notif.isRead ? 'bg-slate-100' : 'bg-blue-100/70'
                }`}
              >
                {getNotificationIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4
                    className={`text-sm tracking-tight ${
                      notif.isRead
                        ? 'font-medium text-slate-800'
                        : 'font-bold text-slate-900'
                    }`}
                  >
                    {notif.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-center">
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {(notif.entityType === 'task' || notif.entityType === 'project') && (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckSquareIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
