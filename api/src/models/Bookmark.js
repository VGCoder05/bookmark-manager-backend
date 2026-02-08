const mongoose = require('mongoose');

/**
 * Bookmark Schema Definition
 * Defines the structure for bookmark documents in MongoDB
**/
const bookmarkSchema = new mongoose.Schema(
  {
    // URL of the bookmark (required and unique)
    url: {
      type: String,
      required: [true, 'URL is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Basic URL validation regex
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
          return urlRegex.test(v);
        },
        message: 'Please enter a valid URL',
      },
    },

    // Display name for the bookmark
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },

    // Optional description
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
      default: '',
    },

    // Array of tags for categorization
    tags: {
      type: [String],
      default: [],
      // Transform tags to lowercase before saving
      set: function (tags) {
        if (Array.isArray(tags)) {
          return tags.map((tag) => tag.toLowerCase().trim()).filter((tag) => tag.length > 0);
        }
        return [];
      },
    },

    // Favicon URL (can be auto-fetched later)
    favicon: {
      type: String,
      default: '',
    },

    // Mark as favorite
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Index for faster searches
bookmarkSchema.index({ name: 'text', tags: 'text' });
bookmarkSchema.index({ tags: 1 });
bookmarkSchema.index({ isFavorite: 1 });

/**
 * Pre-save middleware to ensure URL has protocol
bookmarkSchema.pre('save', function (next) {
  // Add https:// if no protocol specified
  if (this.url && !this.url.match(/^https?:\/\//i)) {
    this.url = 'https://' + this.url;
  }
  next();
});
*/

/**
 * Static method to get all unique tags
 */
bookmarkSchema.statics.getAllTags = async function () {
  const tags = await this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { tag: '$_id', count: 1, _id: 0 } },
  ]);
  return tags;
};

// Create and export the model
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;