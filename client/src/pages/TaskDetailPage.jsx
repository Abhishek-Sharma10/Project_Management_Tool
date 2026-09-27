import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, User, MessageSquare } from 'lucide-react';
import * as taskApi from '../services/taskService';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import UserAvatar from '../components/UserAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskDetailDrawer from '../components/TaskDetailDrawer';

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toastError } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await taskApi.getTask(taskId);
        setTask(data);
      } catch (err) {
        console.error(err);
        toastError('Could not load task');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [taskId, toastError]);

  if (loading) {
    return <LoadingSpinner label="Loading task details…" />;
  }

  if (!task) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-slate-500">Task not found or access denied.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${task.projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project Board
        </Link>
      </div>

      <TaskDetailDrawer
        taskId={taskId}
        isOpen={true}
        onClose={() => navigate(`/projects/${task.projectId}`)}
        onTaskUpdated={(updated) => setTask(updated)}
        onTaskDeleted={() => navigate(`/projects/${task.projectId}`)}
      />
    </div>
  );
}
