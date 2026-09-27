const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

router.patch('/:commentId', commentController.update);
router.delete('/:commentId', commentController.remove);

module.exports = router;
