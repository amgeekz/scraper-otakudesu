require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  baseUrl: process.env.OTAKUDESU_BASE_URL || 'https://otakudesu.blog',
  timeout: parseInt(process.env.REQUEST_TIMEOUT_MS) || 15000,
  cache: {
    ttl: parseInt(process.env.CACHE_TTL_MS) || 300000,
    maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES) || 500
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 60
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  searchMaxLength: parseInt(process.env.SEARCH_QUERY_MAX_LENGTH) || 100
};
