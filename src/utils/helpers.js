const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

// ========================================
// SIMPLE HTTP CLIENT - SEPERTI CONTOH
// ========================================
const HTTP = axios.create({
  timeout: 50000,
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept-Language': 'id,en;q=0.9'
  },
  maxRedirects: 5
});

// ========================================
// DAFTAR BASE URL (seperti contoh)
// ========================================
const CANDIDATE_BASE = [
  process.env.OTAKUDESU_BASE_URL || config.baseUrl,
  'https://otakudesu.best',
  'https://otakudesuu.online',
  'https://otakudesu.cloud',
  'https://otakudesutv.com'
].filter(Boolean);

// ========================================
// FETCH HTML - DENGAN RETRY KE BEBERAPA DOMAIN
// ========================================
async function fetchHTML(url, retries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[fetchHTML] Attempt ${attempt}: ${url}`);
      
      const response = await HTTP.get(url, {
        timeout: config.timeout || 50000,
        maxRedirects: 5,
        validateStatus: (status) => status < 400 || status === 403 || status === 429
      });

      // Jika 403 atau 429, coba lagi
      if (response.status === 403 || response.status === 429) {
        console.log(`[fetchHTML] Got ${response.status}, retrying...`);
        if (attempt === retries) {
          throw new Error(`Access ${response.status === 403 ? 'forbidden' : 'rate limited'} (${response.status})`);
        }
        const delay = 2000 * attempt + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[fetchHTML] Success! (${response.data.length} bytes)`);
      return cheerio.load(response.data);
      
    } catch (error) {
      lastError = error;
      console.log(`[fetchHTML] Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < retries) {
        const delay = 2000 * attempt + Math.random() * 2000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
}

// ========================================
// TRY MULTIPLE BASES (seperti contoh)
// ========================================
async function tryBases(fn) {
  for (const base of CANDIDATE_BASE) {
    try {
      console.log(`[tryBases] Trying: ${base}`);
      const result = await fn(base);
      
      // Jika result adalah array, return langsung
      if (Array.isArray(result)) return result;
      
      // Jika result memiliki __ok dan data
      if (result && result.__ok && result.data != null) return result.data;
      
      // Jika result memiliki ok dan data (format kita)
      if (result && result.ok && result.data != null) return result.data;
      
      // Jika result adalah object dengan data
      if (result && result.data != null) return result.data;
      
      return result;
    } catch (error) {
      console.log(`[tryBases] Failed on ${base}: ${error.message}`);
    }
  }
  return [];
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function extractNumber(text) {
  if (!text) return null;
  const match = String(text).match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

function extractSlug(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const match = path.match(/\/([^/]+)\/?$/);
    return match ? match[1] : null;
  } catch {
    const match = url.match(/\/([^/]+)\/?$/);
    return match ? match[1] : null;
  }
}

function normalizeUrl(url, baseUrl) {
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
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function absolutize(base, href) {
  if (!href) return '';
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

module.exports = {
  HTTP,
  CANDIDATE_BASE,
  fetchHTML,
  tryBases,
  cleanText,
  extractNumber,
  extractSlug,
  normalizeUrl,
  formatDate,
  absolutize
};