const express = require('express');
const projectController = require('../controllers/projectController');
const memberController = require('../controllers/memberController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

router.post('/', projectController.create);
router.get('/', projectController.list);
router.get('/:projectId', projectController.getOne);
router.patch('/:projectId', projectController.update);
router.delete('/:projectId', projectController.remove);

router.get('/:projectId/members', memberController.list);
router.post('/:projectId/members', memberController.add);
router.patch('/:projectId/members/:userId', memberController.updateRole);
router.delete('/:projectId/members/:userId', memberController.remove);

module.exports = router;
