const { query } = require('../config/db');

async function createNotification({
  userId,
  type = 'general',
  title,
  message,
  entityType = null,
  entityId = null,
}) {
  const result = await query(
    `INSERT INTO notifications (
       user_id, type, title, message, entity_type, entity_id
     )
     VALUES ($1, $2::notification_type, $3, $4, $5, $6)
     RETURNING
       id,
       user_id AS "userId",
       type,
       title,
       message,
       entity_type AS "entityType",
       entity_id AS "entityId",
       is_read AS "isRead",
       created_at AS "createdAt"`,
    [userId, type, title, message, entityType, entityId]
  );
  return result.rows[0];
}

async function listByUser(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
  const result = await query(
    `SELECT
       id,
       type,
       title,
       message,
       entity_type AS "entityType",
       entity_id AS "entityId",
       is_read AS "isRead",
       created_at AS "createdAt"
     FROM notifications
     WHERE user_id = $1
       AND ($4::BOOLEAN IS FALSE OR is_read = FALSE)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset, unreadOnly]
  );
  return result.rows;
}

async function getUnreadCount(userId) {
  const result = await query(
    `SELECT COUNT(*)::INTEGER AS "unreadCount"
     FROM notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rows[0]?.unreadCount || 0;
}

async function markRead(notificationId, userId) {
  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING
       id,
       type,
       title,
       message,
       entity_type AS "entityType",
       entity_id AS "entityId",
       is_read AS "isRead",
       created_at AS "createdAt"`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

async function markAllRead(userId) {
  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE
     RETURNING id`,
    [userId]
  );
  return { updatedCount: result.rowCount };
}

module.exports = {
  createNotification,
  listByUser,
  getUnreadCount,
  markRead,
  markAllRead,
};
