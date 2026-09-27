import { useState } from 'react';
import Modal from './Modal';
import * as projectApi from '../services/projectService';
import { useToast } from '../context/ToastContext';
import { UserPlus, Loader2 } from 'lucide-react';

export default function AddMemberModal({
  isOpen,
  onClose,
  projectId,
  onMemberAdded,
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const member = await projectApi.addMember(projectId, {
        email: email.trim(),
        role,
      });

      success(`Added ${member.user?.name || email} to project as ${role}`);
      setEmail('');
      setRole('member');
      onClose();
      if (onMemberAdded) {
        onMemberAdded(member);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add member';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Team Member"
      subtitle="Invite an existing user to collaborate on this project."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            User Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. bob@example.com, carol@example.com"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Project Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
          >
            <option value="member">Member — Can create, edit tasks and comment</option>
            <option value="admin">Admin — Full project & member management</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Add Member
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
