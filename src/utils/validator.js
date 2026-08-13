const config = require('../config');

const validateSlug = (slug) => {
  if (!slug || typeof slug !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(slug);
};

const validatePage = (page) => {
  const num = parseInt(page);
  if (isNaN(num) || num < 1) return false;
  return true;
};

const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return false;
  if (query.length > config.searchMaxLength) return false;
  return true;
};

module.exports = {
  validateSlug,
  validatePage,
  validateSearchQuery
};
