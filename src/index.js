const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const routes = require('./routes/animeRoutes');

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { ok: false, error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ ok: false, error: err.message });
});

// Start server (if not in Vercel)
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`🚀 Otakudesu API running on http://localhost:${config.port}`);
    console.log(`📡 Base URL: ${config.baseUrl}`);
    console.log(`📚 Docs: http://localhost:${config.port}/docs`);
  });
}

module.exports = app;
