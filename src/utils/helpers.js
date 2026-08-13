const axios = require('axios');
const cheerio = require('cheerio');

const fetchHTML = async (url) => {
  try {
    console.log(`Fetching: ${url}`);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    return cheerio.load(data);
  } catch (error) {
    console.error(`Failed to fetch HTML from ${url}:`, error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    throw new Error(`Failed to fetch HTML: ${error.message}`);
  }
};

const cleanText = (text) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

const extractNumber = (text) => {
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
};

const formatDate = (dateStr) => {
  try {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

module.exports = {
  fetchHTML,
  cleanText,
  extractNumber,
  formatDate
};
