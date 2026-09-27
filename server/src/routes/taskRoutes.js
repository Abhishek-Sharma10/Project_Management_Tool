const express = require('express');
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

router.get('/:taskId', taskController.getOne);
router.patch('/:taskId', taskController.update);
router.delete('/:taskId', taskController.remove);
router.patch('/:taskId/assign', taskController.assign);
router.patch('/:taskId/status', taskController.changeStatus);
router.patch('/:taskId/position', taskController.changePosition);

router.post('/:taskId/comments', commentController.create);
router.get('/:taskId/comments', commentController.list);

module.exports = router;
