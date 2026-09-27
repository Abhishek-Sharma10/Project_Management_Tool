const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

router.get('/', notificationController.list);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:notificationId/read', notificationController.markRead);

module.exports = router;
