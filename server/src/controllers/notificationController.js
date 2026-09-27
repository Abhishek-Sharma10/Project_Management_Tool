const notificationService = require('../services/notificationService');
const { success } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const list = asyncHandler(async (req, res) => {
  const data = await notificationService.listNotifications(req.user.id, req.query);
  return success(res, data, 'Notifications retrieved');
});

const markRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markNotificationRead(
    req.params.notificationId,
    req.user.id
  );
  return success(res, data, 'Notification marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllNotificationsRead(req.user.id);
  return success(res, data, 'All notifications marked as read');
});

module.exports = {
  list,
  markRead,
  markAllRead,
};
