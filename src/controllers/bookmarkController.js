const Bookmark = require('../models/Bookmark');

/**
 * @desc    Get all bookmarks with optional filtering and search
 * @route   GET /api/bookmarks
 * @query   tag - Filter by tag
 * @query   search - Search by name or tags
 * @query   favorite - Filter favorites only
 * @access  Public
 */
const getBookmarks = async (req, res, next) => {
  try {
    const { tag, search, favorite, sort = '-createdAt' } = req.query;
    
    // Build query object
    let query = {};

    // Filter by tag
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    // Filter favorites
    if (favorite === 'true') {
      query.isFavorite = true;
    }

    // Search by name or tags
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { tags: searchRegex },
        { description: searchRegex },
      ];
    }

    // Execute query with sorting
    const bookmarks = await Bookmark.find(query).sort(sort);

    res.status(200).json({
      success: true,
      count: bookmarks.length,
      data: bookmarks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single bookmark by ID
 * @route   GET /api/bookmarks/:id
 * @access  Public
 */
const getBookmarkById = async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
    }

    res.status(200).json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new bookmark
 * @route   POST /api/bookmarks
 * @access  Public
 */
const createBookmark = async (req, res, next) => {
  try {
    const { url, name, description, tags, favicon, isFavorite } = req.body;

    // Check for duplicate URL
    let normalizedUrl = url.trim().toLowerCase();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const existingBookmark = await Bookmark.findOne({
      url: { $regex: new RegExp(`^${normalizedUrl}$`, 'i') },
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: 'A bookmark with this URL already exists',
        existingBookmark,
      });
    }

    // Process tags - handle both comma-separated string and array
    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
      }
    }

    // Create bookmark
    const bookmark = await Bookmark.create({
      url,
      name,
      description: description || '',
      tags: processedTags,
      favicon: favicon || '',
      isFavorite: isFavorite || false,
    });

    res.status(201).json({
      success: true,
      message: 'Bookmark created successfully',
      data: bookmark,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A bookmark with this URL already exists',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update bookmark
 * @route   PUT /api/bookmarks/:id
 * @access  Public
 */
const updateBookmark = async (req, res, next) => {
  try {
    const { url, name, description, tags, favicon, isFavorite } = req.body;

    // Find existing bookmark
    let bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
    }

    // If URL is being changed, check for duplicates
    if (url && url !== bookmark.url) {
      let normalizedUrl = url.trim().toLowerCase();
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      const existingBookmark = await Bookmark.findOne({
        url: { $regex: new RegExp(`^${normalizedUrl}$`, 'i') },
        _id: { $ne: req.params.id },
      });

      if (existingBookmark) {
        return res.status(400).json({
          success: false,
          message: 'A bookmark with this URL already exists',
        });
      }
    }

    // Process tags
    let processedTags = bookmark.tags;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
      }
    }

    // Update bookmark
    bookmark = await Bookmark.findByIdAndUpdate(
      req.params.id,
      {
        url: url || bookmark.url,
        name: name || bookmark.name,
        description: description !== undefined ? description : bookmark.description,
        tags: processedTags,
        favicon: favicon !== undefined ? favicon : bookmark.favicon,
        isFavorite: isFavorite !== undefined ? isFavorite : bookmark.isFavorite,
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    );

    res.status(200).json({
      success: true,
      message: 'Bookmark updated successfully',
      data: bookmark,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A bookmark with this URL already exists',
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete bookmark
 * @route   DELETE /api/bookmarks/:id
 * @access  Public
 */
const deleteBookmark = async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
    }

    await Bookmark.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Bookmark deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle favorite status
 * @route   PATCH /api/bookmarks/:id/favorite
 * @access  Public
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
    }

    bookmark.isFavorite = !bookmark.isFavorite;
    await bookmark.save();

    res.status(200).json({
      success: true,
      message: `Bookmark ${bookmark.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: bookmark,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unique tags with count
 * @route   GET /api/tags
 * @access  Public
 */
const getAllTags = async (req, res, next) => {
  try {
    const tags = await Bookmark.getAllTags();

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookmarks,
  getBookmarkById,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
  getAllTags,
};