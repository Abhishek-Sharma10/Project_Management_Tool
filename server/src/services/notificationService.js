const notificationRepository = require('../repositories/notificationRepository');
const { emitToUser } = require('../sockets/socketManager');

async function notifyUser({
  userId,
  type = 'general',
  title,
  message,
  entityType = null,
  entityId = null,
}) {
  try {
    const notification = await notificationRepository.createNotification({
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
    });

    const unreadCount = await notificationRepository.getUnreadCount(userId);

    // Real-time broadcast to the recipient
    emitToUser(userId, 'notification:new', {
      notification,
      unreadCount,
    });

    return notification;
  } catch (err) {
    console.error('Failed to send notification:', err.message);
    return null;
  }
}

async function listNotifications(userId, query = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const unreadOnly = query.unread === 'true' || query.unread === true;

  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.listByUser(userId, { limit, offset, unreadOnly }),
    notificationRepository.getUnreadCount(userId),
  ]);

  return {
    notifications,
    unreadCount,
    limit,
    offset,
  };
}

async function markNotificationRead(notificationId, userId) {
  const notification = await notificationRepository.markRead(notificationId, userId);
  const unreadCount = await notificationRepository.getUnreadCount(userId);
  return { notification, unreadCount };
}

async function markAllNotificationsRead(userId) {
  const result = await notificationRepository.markAllRead(userId);
  return { ...result, unreadCount: 0 };
}

module.exports = {
  notifyUser,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
