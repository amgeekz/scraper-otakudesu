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
// Penting untuk Vercel, Heroku, dan platform yang menggunakan proxy
// Agar rate limiter bisa membaca IP asli pengguna dari header X-Forwarded-For
app.set('trust proxy', true);
// Atau bisa menggunakan: app.set('trust proxy', 1);
// Untuk Vercel, bisa juga menggunakan:
// app.set('trust proxy', (ip) => {
//   return true; // Percaya semua proxy
// });

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
// Rate limiter sudah bisa membaca IP asli dari X-Forwarded-For
// berkat konfigurasi trust proxy di atas
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs || 60000,
  max: config.rateLimit.max || 60,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { 
    ok: false, 
    error: 'Too many requests, please try again later.' 
  },
  // Key generator sudah otomatis menggunakan IP dari X-Forwarded-For
  // karena trust proxy sudah diaktifkan
  keyGenerator: (req) => {
    // Fallback manual jika diperlukan
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
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - IP: ${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`);
  });
  next();
});

// ============ STATIC FILES ============
// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  etag: true
}));

// ============ ROUTES ============
app.use('/', routes);

// ============ 404 HANDLER ============
app.use((req, res) => {
  // Cek apakah request untuk asset statis
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
  
  // Handle rate limit error khusus
  if (err.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
    console.warn('Rate limit misconfiguration detected, but trust proxy is enabled.');
    // Ini seharusnya tidak terjadi karena kita sudah set trust proxy
    // Tapi jika terjadi, kita tetap proses request
    return next();
  }
  
  res.status(err.status || 500).json({ 
    ok: false, 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============ START SERVER ============
// Untuk Vercel, export app
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
