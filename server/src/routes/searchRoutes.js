const express = require('express');
const searchController = require('../controllers/searchController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

router.get('/', searchController.search);

module.exports = router;
