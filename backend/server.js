const express      = require('express');
const http         = require('http');
const path         = require('path');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const { Server }   = require('socket.io');

const connectDB      = require('./config/db');
const { PORT, NODE_ENV, CLIENT_URLS } = require('./config/env');
const errorHandler   = require('./middleware/errorHandler');
const routes         = require('./routes/index');

// ─── Init App ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// Trust proxy if we are behind a reverse proxy (e.g., Render, Heroku)
app.set('trust proxy', 1);

const allowedOrigins = Array.isArray(CLIENT_URLS) && CLIENT_URLS.length > 0
  ? CLIENT_URLS
  : ['http://localhost:3000', 'http://localhost:5173'];

const isDevLocalhostOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (NODE_ENV === 'development' && isDevLocalhostOrigin(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header), configured frontends, and localhost dev ports.
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

// ─── Connect Database ─────────────────────────────────────────────────────────
connectDB();

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers via req.io
app.set('io', io);

// Load socket event handlers
require('./sockets/index')(io);

// ─── Global Middlewares ───────────────────────────────────────────────────────
app.use(helmet());                          // security headers

app.use(cors(corsOptions));

app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(express.json({ limit: '10mb' }));           // parse JSON body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Serve Frontend in Production ──────────────────────────────────────────────
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));

  app.get('/*splat', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
      });
    }
  });
} else {
  // ─── 404 Handler for Dev ──────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │   Crime Reporting API                   │
  │   Server   : http://localhost:${PORT}   │
  │   Mode     : ${NODE_ENV}                │
  │   Docs     : http://localhost:${PORT}/health│
  └─────────────────────────────────────────┘
  `);
});

// ─── Handle Unhandled Rejections ──────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = { app, io };