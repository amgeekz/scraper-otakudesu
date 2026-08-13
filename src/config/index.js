require('dotenv').config();

// Fallback untuk Vercel
const config = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || 'https://otakudesu.blog',
  cacheTime: parseInt(process.env.CACHE_TIME) || 300,
  rateLimit: {
    max: parseInt(process.env.MAX_REQUESTS) || 100,
    windowMs: parseInt(process.env.WINDOW_MS) || 60000
  },
  isDev: process.env.NODE_ENV !== 'production'
};

console.log('Config loaded:', {
  baseUrl: config.baseUrl,
  isDev: config.isDev,
  nodeEnv: process.env.NODE_ENV
});

module.exports = config;
