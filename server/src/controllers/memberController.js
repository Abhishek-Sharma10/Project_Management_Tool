const memberService = require('../services/memberService');
const { success, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const list = asyncHandler(async (req, res) => {
  const members = await memberService.listMembers(
    req.params.projectId,
    req.user.id
  );
  return success(res, { members }, 'Members retrieved');
});

const add = asyncHandler(async (req, res) => {
  const member = await memberService.addMember(
    req.params.projectId,
    req.user.id,
    req.body
  );
  return created(res, { member }, 'Member added');
});

const updateRole = asyncHandler(async (req, res) => {
  const member = await memberService.updateMemberRole(
    req.params.projectId,
    req.params.userId,
    req.user.id,
    req.body
  );
  return success(res, { member }, 'Member role updated');
});

const remove = asyncHandler(async (req, res) => {
  const result = await memberService.removeMember(
    req.params.projectId,
    req.params.userId,
    req.user.id
  );
  return success(res, result, 'Member removed');
});

module.exports = {
  list,
  add,
  updateRole,
  remove,
};
