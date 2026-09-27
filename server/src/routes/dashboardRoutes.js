const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateUser, dashboardController.getDashboard);
router.get('/stats', authenticateUser, dashboardController.getDashboard);

module.exports = router;
