const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const config = require('../src/config');
const animeRoutes = require('../src/routes/animeRoutes');
const swaggerSpec = require('../src/docs/swagger');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());

// Logging
app.use(morgan('combined'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Otakudesu API Documentation'
}));

// Routes
app.use('/api/anime', animeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    baseUrl: config.baseUrl
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    docs: '/docs'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Export for Vercel
module.exports = app;

// Run locally
if (require.main === module) {
  const PORT = config.port || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
    console.log(`📡 API: http://localhost:${PORT}/api/anime`);
  });
              }
