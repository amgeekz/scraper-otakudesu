const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

const fetchHTML = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: config.timeout,
      maxRedirects: 5
    });
    return cheerio.load(data);
  } catch (error) {
    throw new Error(`Failed to fetch HTML: ${error.message}`);
  }
};

const cleanText = (text) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

const extractNumber = (text) => {
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0]) : null;
};

const extractSlug = (url) => {
  if (!url) return null;
  const match = url.match(/\/([^/]+)\/?$/);
  return match ? match[1] : null;
};

const normalizeUrl = (url, baseUrl) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/${url}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

module.exports = {
  fetchHTML,
  cleanText,
  extractNumber,
  extractSlug,
  normalizeUrl,
  formatDate,
  generateSlug
};
