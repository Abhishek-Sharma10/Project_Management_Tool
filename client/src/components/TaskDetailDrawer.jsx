import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  User,
  Clock,
  Trash2,
  Edit2,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from './Badge';
import UserAvatar from './UserAvatar';
import * as taskApi from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

export default function TaskDetailDrawer({
  taskId,
  isOpen,
  onClose,
  members = [],
  onTaskUpdated,
  onTaskDeleted,
}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error: toastError } = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const loadTaskData = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const [taskData, commentsData] = await Promise.all([
        taskApi.getTask(taskId),
        taskApi.listComments(taskId),
      ]);
      setTask(taskData);
      setComments(commentsData || []);
    } catch (err) {
      console.error('Failed to load task:', err);
      toastError('Could not load task details');
    } finally {
      setLoading(false);
    }
  }, [taskId, toastError]);

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskData();
    } else {
      setTask(null);
      setComments([]);
      setNewComment('');
    }
  }, [isOpen, taskId, loadTaskData]);

  // Real-time comment and task updates via Socket.io
  useEffect(() => {
    if (!socket || !taskId) return;

    function handleTaskUpdated(data) {
      if (data.task && data.task.id === taskId) {
        setTask(data.task);
      }
    }

    function handleCommentCreated(data) {
      if (data.taskId === taskId && data.comment) {
        setComments((prev) => {
          if (prev.some((c) => c.id === data.comment.id)) return prev;
          return [...prev, data.comment];
        });
      }
    }

    function handleCommentUpdated(data) {
      if (data.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === data.comment.id ? data.comment : c))
        );
      }
    }

    function handleCommentDeleted(data) {
      if (data.commentId) {
        setComments((prev) => prev.filter((c) => c.id !== data.commentId));
      }
    }

    socket.on('task:updated', handleTaskUpdated);
    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [socket, taskId]);

  if (!isOpen) return null;

  const handleStatusChange = async (newStatus) => {
    if (!task) return;
    try {
      const updated = await taskApi.changeTaskStatus(task.id, newStatus);
      setTask(updated);
      success(`Status updated to ${newStatus.replace('_', ' ')}`);
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      toastError('Failed to change status');
    }
  };

  const handleAssigneeChange = async (userId) => {
    if (!task) return;
    try {
      const updated = await taskApi.assignTask(task.id, userId || null);
      setTask(updated);
      success('Assignee updated');
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      toastError('Failed to update assignee');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskApi.deleteTask(task.id);
      success('Task deleted successfully');
      if (onTaskDeleted) onTaskDeleted(task.id);
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      const comment = await taskApi.createComment(task.id, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      success('Comment added');
    } catch (err) {
      toastError('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) return;
    try {
      const updated = await taskApi.updateComment(commentId, editingContent.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
      setEditingCommentId(null);
      setEditingContent('');
      success('Comment updated');
    } catch (err) {
      toastError('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await taskApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      success('Comment deleted');
    } catch (err) {
      toastError('Failed to delete comment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Task Detail
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteTask}
                title="Delete task"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading || !task ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {task.title}
                </h2>
              </div>

              {/* Task Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Status</span>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-hidden"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Assignee</span>
                  <select
                    value={task.assignedTo?.id || ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-hidden"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => {
                      const u = m.user || m;
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Due Date</span>
                    <span className="font-semibold text-slate-700">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Created By</span>
                    <span className="font-semibold text-slate-700">
                      {task.createdBy?.name || 'User'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </h4>
                <div className="p-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                  {task.description || (
                    <span className="text-slate-400 italic">No description provided.</span>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Comments ({comments.length})
                  </h4>
                </div>

                {/* Comment input form */}
                <form onSubmit={handleAddComment} className="mb-6 space-y-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment... (use @ to mention team members)"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={commentLoading || !newComment.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    >
                      {commentLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Comment
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No comments yet. Start the conversation!
                    </p>
                  ) : (
                    comments.map((c) => {
                      const isOwn = c.user?.id === user?.id;
                      const isEditing = editingCommentId === c.id;

                      return (
                        <div
                          key={c.id}
                          className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <UserAvatar user={c.user} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-900">
                                {c.user?.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                · {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  rows={2}
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentId(null)}
                                    className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEditComment(c.id)}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded-md"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">
                                {c.content}
                              </p>
                            )}

                            {isOwn && !isEditing && (
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditingContent(c.content);
                                  }}
                                  className="text-[10px] font-medium text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-[10px] font-medium text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
