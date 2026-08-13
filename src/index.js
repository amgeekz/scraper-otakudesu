const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const routes = require('./routes/animeRoutes');

const app = express();

// ============ KONFIGURASI TRUST PROXY ============
app.set('trust proxy', true);

// ============ SECURITY ============
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ============ CORS ============
app.use(cors({
  origin: config.corsOrigin || '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// ============ RATE LIMITING ============
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs || 60000,
  max: config.rateLimit.max || 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    ok: false, 
    error: 'Too many requests, please try again later.' 
  },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});
app.use(limiter);

// ============ BODY PARSER ============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ LOGGING ============
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// ============ STATIC FILES ============
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  etag: true
}));

// ============ ROUTES ============
app.use('/', routes);

// ============ 404 HANDLER ============
app.use((req, res) => {
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/images/')) {
    return res.status(404).send('File not found');
  }
  res.status(404).json({ 
    ok: false, 
    error: 'Endpoint not found',
    docs: '/docs'
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Pastikan selalu return JSON
  res.status(err.status || 500).json({ 
    ok: false, 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============ START SERVER ============
if (require.main === module) {
  const PORT = config.port || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Otakudesu API running on http://localhost:${PORT}`);
    console.log(`📡 Base URL: ${config.baseUrl}`);
    console.log(`📚 Docs: http://localhost:${PORT}/docs`);
    console.log(`🔒 Trust Proxy: ${app.get('trust proxy')}`);
    console.log(`⏱️  Rate Limit: ${config.rateLimit.max} requests per ${config.rateLimit.windowMs/1000}s`);
  });
}

module.exports = app;