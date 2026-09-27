const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

router.post('/', projectController.create);
router.get('/', projectController.list);
router.get('/:projectId', projectController.getOne);
router.patch('/:projectId', projectController.update);
router.delete('/:projectId', projectController.remove);

module.exports = router;
