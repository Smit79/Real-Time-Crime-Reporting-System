require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET', 'REFRESH_SECRET'];
required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`WARNING: Missing env variable → ${key}`);
  }
});

const parseClientUrls = () => {
  const raw = process.env.CLIENT_URLS || process.env.CLIENT_URL || '';
  const parsed = raw
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  if (parsed.length > 0) return parsed;

  return ['http://localhost:3000', 'http://localhost:5173'];
};

const CLIENT_URLS = parseClientUrls();

module.exports = {
  PORT:               process.env.PORT              || 5000,
  NODE_ENV:           process.env.NODE_ENV          || 'development',
  MONGO_URI:          process.env.MONGO_URI,
  JWT_SECRET:         process.env.JWT_SECRET,
  JWT_EXPIRES_IN:     process.env.JWT_EXPIRES_IN    || '7d',
  REFRESH_SECRET:     process.env.REFRESH_SECRET,
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || '30d',
  CLOUDINARY_NAME:    process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_KEY:     process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_SECRET:  process.env.CLOUDINARY_API_SECRET,
  EMAIL_HOST:         process.env.EMAIL_HOST        || 'smtp.gmail.com',
  EMAIL_PORT:         process.env.EMAIL_PORT        || 587,
  EMAIL_USER:         process.env.EMAIL_USER,
  EMAIL_PASS:         process.env.EMAIL_PASS,
  EMAIL_FROM:         process.env.EMAIL_FROM,
  FCM_SERVER_KEY:     process.env.FCM_SERVER_KEY,
  CLIENT_URL:         CLIENT_URLS[0],
  CLIENT_URLS,
  RESET_LINK_BASE_URL: process.env.RESET_LINK_BASE_URL || CLIENT_URLS[0],
  VERIFY_LINK_BASE_URL: process.env.VERIFY_LINK_BASE_URL || CLIENT_URLS[0],
};