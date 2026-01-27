const express = require('express');
const router = express.Router();
const { getAllTags } = require('../controllers/bookmarkController');

/**
 * Tag Routes
 * Base path: /api/tags
 */

// GET all unique tags
router.get('/', getAllTags);

module.exports = router;