const express = require('express');
const router = express.Router();
const {
  getBookmarks,
  getBookmarkById,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
  getAllTags,
} = require('../controllers/bookmarkController');

/**
 * Bookmark Routes
 * Base path: /api/bookmarks
 */

// GET all bookmarks & POST new bookmark
router.route('/')
  .get(getBookmarks)
  .post(createBookmark);

// GET, PUT, DELETE single bookmark by ID
router.route('/:id')
  .get(getBookmarkById)
  .put(updateBookmark)
  .delete(deleteBookmark);

// PATCH toggle favorite status
router.patch('/:id/favorite', toggleFavorite);

module.exports = router;