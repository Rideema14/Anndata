const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Files are held in memory only long enough to stream them to Cloudinary —
// nothing ever touches disk on our server.
const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(ApiError.badRequest('Only image files are allowed.'));
  }
  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5MB per file, up to 8 files
});

module.exports = { uploadImage };
