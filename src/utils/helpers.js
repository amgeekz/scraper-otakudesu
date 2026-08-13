const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

// Daftar User-Agent untuk rotating
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
];

let currentUserAgentIndex = 0;

const getRandomUserAgent = () => {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
};

const getNextUserAgent = () => {
  currentUserAgentIndex = (currentUserAgentIndex + 1) % USER_AGENTS.length;
  return USER_AGENTS[currentUserAgentIndex];
};

const fetchHTML = async (url, retries = 3) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const userAgent = getRandomUserAgent();
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
          'Referer': 'https://www.google.com/'
        },
        timeout: config.timeout,
        maxRedirects: 5,
        validateStatus: (status) => status < 400 || status === 403
      });

      // Jika status 403, coba lagi dengan User-Agent berbeda
      if (response.status === 403) {
        console.log(`[Attempt ${attempt}] Got 403, trying different User-Agent...`);
        if (attempt === retries) {
          throw new Error('Access forbidden (403). The website is blocking the request.');
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Delay increasing
        continue;
      }

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[Scraper] Success: ${url} (${response.data.length} bytes)`);
      return cheerio.load(response.data);
      
    } catch (error) {
      lastError = error;
      console.log(`[Attempt ${attempt}] Failed: ${error.message}`);
      
      if (attempt < retries) {
        const delay = 2000 * attempt;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to fetch HTML after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
};

const cleanText = (text) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

const extractNumber = (text) => {
  if (!text) return null;
  const match = text.match(/\d+/);
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
  generateSlug,
  getRandomUserAgent
};
