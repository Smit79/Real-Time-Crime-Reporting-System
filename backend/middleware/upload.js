const multer  = require('multer');
const ApiError = require('../utils/apiError');

const storage = multer.memoryStorage();       // store in memory, upload to cloudinary

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError('Only images, videos and audio files are allowed', 400), false);
  }
};

const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },    // 50 MB max
});

const uploadAvatar = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError('Only image files are allowed for avatar', 400), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },     // 5 MB max
});

module.exports = { uploadMedia, uploadAvatar };