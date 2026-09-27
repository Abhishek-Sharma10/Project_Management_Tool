const AppError = require('../utils/AppError');
const projectRepository = require('../repositories/projectRepository');
const memberRepository = require('../repositories/memberRepository');
const userRepository = require('../repositories/userRepository');

const VALID_ROLES = ['owner', 'admin', 'member'];
const ASSIGNABLE_ROLES = ['admin', 'member'];

function formatMember(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    role: row.role,
    joinedAt: row.joined_at,
    user: row.user,
  };
}

async function assertProjectMember(projectId, userId) {
  const membership = await memberRepository.findMembership(projectId, userId);
  if (!membership) {
    throw new AppError('Project not found', 404);
  }
  return membership;
}

async function assertProjectAdmin(projectId, userId) {
  const membership = await assertProjectMember(projectId, userId);
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new AppError('Admin privileges required', 403);
  }
  return membership;
}

async function listMembers(projectId, requesterId) {
  await assertProjectMember(projectId, requesterId);
  const rows = await memberRepository.listMembers(projectId);
  return rows.map(formatMember);
}

async function addMember(projectId, requesterId, { email, role = 'member' }) {
  await assertProjectAdmin(projectId, requesterId);

  if (!email || typeof email !== 'string') {
    throw new AppError('Validation failed', 400, {
      errors: ['Member email is required'],
    });
  }

  const normalizedRole = (role || 'member').toLowerCase();
  if (!ASSIGNABLE_ROLES.includes(normalizedRole)) {
    throw new AppError('Validation failed', 400, {
      errors: ['Role must be admin or member (owner cannot be assigned)'],
    });
  }

  const user = await userRepository.findByEmail(email.trim().toLowerCase());
  if (!user) {
    throw new AppError('User with that email was not found', 404);
  }

  if (user.id === requesterId) {
    // Owner/admin already in project — adding self is a conflict
  }

  const existing = await memberRepository.findMembership(projectId, user.id);
  if (existing) {
    throw new AppError('User is already a project member', 409);
  }

  try {
    await memberRepository.addMember({
      projectId,
      userId: user.id,
      role: normalizedRole,
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('User is already a project member', 409);
    }
    throw err;
  }

  const row = await memberRepository.findMemberWithUser(projectId, user.id);
  return formatMember(row);
}

async function updateMemberRole(projectId, targetUserId, requesterId, { role }) {
  const requester = await assertProjectAdmin(projectId, requesterId);

  if (!role || !ASSIGNABLE_ROLES.includes(role)) {
    throw new AppError('Validation failed', 400, {
      errors: ['Role must be admin or member'],
    });
  }

  const target = await memberRepository.findMembership(projectId, targetUserId);
  if (!target) {
    throw new AppError('Member not found', 404);
  }

  if (target.role === 'owner') {
    throw new AppError('Cannot change the project owner role', 403);
  }

  // Only owner can promote/demote admins
  if (
    (target.role === 'admin' || role === 'admin') &&
    requester.role !== 'owner'
  ) {
    throw new AppError('Only the owner can manage admin roles', 403);
  }

  await memberRepository.updateMemberRole(projectId, targetUserId, role);
  const row = await memberRepository.findMemberWithUser(projectId, targetUserId);
  return formatMember(row);
}

async function removeMember(projectId, targetUserId, requesterId) {
  const requester = await assertProjectAdmin(projectId, requesterId);

  const target = await memberRepository.findMembership(projectId, targetUserId);
  if (!target) {
    throw new AppError('Member not found', 404);
  }

  if (target.role === 'owner') {
    throw new AppError('Cannot remove the project owner', 403);
  }

  if (target.role === 'admin' && requester.role !== 'owner') {
    throw new AppError('Only the owner can remove admins', 403);
  }

  // Members cannot remove others — already blocked by assertProjectAdmin
  await memberRepository.removeMember(projectId, targetUserId);
  return { userId: targetUserId, removed: true };
}

module.exports = {
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  assertProjectMember,
  assertProjectAdmin,
  VALID_ROLES,
};
