const searchRepository = require('../repositories/searchRepository');
const { success } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const search = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) {
    return success(res, { projects: [], tasks: [], members: [] }, 'Empty search query');
  }

  const results = await searchRepository.searchAll(req.user.id, q);
  return success(res, results, 'Search results');
});

module.exports = {
  search,
};
