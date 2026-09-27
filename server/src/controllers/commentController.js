const commentService = require('../services/commentService');
const { success, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(
    req.params.taskId,
    req.user.id,
    req.body
  );
  return created(res, { comment }, 'Comment created');
});

const list = asyncHandler(async (req, res) => {
  const comments = await commentService.listComments(
    req.params.taskId,
    req.user.id
  );
  return success(res, { comments }, 'Comments retrieved');
});

const update = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(
    req.params.commentId,
    req.user.id,
    req.body
  );
  return success(res, { comment }, 'Comment updated');
});

const remove = asyncHandler(async (req, res) => {
  const result = await commentService.deleteComment(
    req.params.commentId,
    req.user.id
  );
  return success(res, result, 'Comment deleted');
});

module.exports = {
  create,
  list,
  update,
  remove,
};
