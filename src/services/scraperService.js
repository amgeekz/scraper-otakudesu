const { fetchHTML, cleanText, extractNumber, formatDate } = require('../utils/helpers');
const config = require('../config');

class ScraperService {
  constructor() {
    this.baseUrl = config.baseUrl || 'https://otakudesu.blog';
  }

  async getLatestEpisodes() {
    const $ = await fetchHTML(this.baseUrl);
    const episodes = [];

    // Adjust selectors based on otakudesu.blog structure
    $('.episode, .listepisode, .venz .episode').each((index, element) => {
      const title = $(element).find('.episode-title a, .title a, h2 a').first().text();
      const link = $(element).find('.episode-title a, .title a, h2 a').first().attr('href');
      const image = $(element).find('img').attr('src');
      const episode = $(element).find('.episode-number, .eps, .epz').text();
      const date = $(element).find('.episode-date, .date, time').text();

      if (title && link) {
        episodes.push({
          title: cleanText(title),
          link: this.normalizeUrl(link),
          image: image ? this.normalizeUrl(image) : null,
          episode: cleanText(episode),
          date: formatDate(date) || cleanText(date) || new Date().toISOString().split('T')[0]
        });
      }
    });

    // If no episodes found, try alternative selector
    if (episodes.length === 0) {
      $('.animepost, .post, .entry').each((index, element) => {
        const title = $(element).find('h2 a, h3 a').first().text();
        const link = $(element).find('h2 a, h3 a').first().attr('href');
        const image = $(element).find('img').attr('src');
        
        if (title && link) {
          episodes.push({
            title: cleanText(title),
            link: this.normalizeUrl(link),
            image: image ? this.normalizeUrl(image) : null,
            episode: 'Episode 1',
            date: new Date().toISOString().split('T')[0]
          });
        }
      });
    }

    return episodes;
  }

  async getOngoingAnime(page = 1) {
    const url = page === 1 
      ? `${this.baseUrl}/ongoing-anime`
      : `${this.baseUrl}/ongoing-anime/page/${page}`;
    
    const $ = await fetchHTML(url);
    const animeList = [];

    $('.venz .col-md-3, .listanime .col-md-3, .anime-list .item').each((index, element) => {
      const title = $(element).find('.thumb a, .image a').attr('title') || 
                    $(element).find('.thumb a, .image a').text();
      const link = $(element).find('.thumb a, .image a').attr('href');
      const image = $(element).find('.thumb img, .image img').attr('src');
      const episode = $(element).find('.epz, .eps, .info .episode').text();
      const genre = $(element).find('.genre, .genres, .info .genre').text();

      if (title && link) {
        animeList.push({
          title: cleanText(title),
          link: this.normalizeUrl(link),
          image: image ? this.normalizeUrl(image) : null,
          episode: cleanText(episode) || 'Ongoing',
          genre: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
        });
      }
    });

    const pagination = {
      current: page,
      total: this.getTotalPages($)
    };

    return { animeList, pagination };
  }

  async getCompleteAnime(page = 1) {
    const url = page === 1
      ? `${this.baseUrl}/complete-anime`
      : `${this.baseUrl}/complete-anime/page/${page}`;
    
    const $ = await fetchHTML(url);
    const animeList = [];

    $('.venz .col-md-3, .listanime .col-md-3, .anime-list .item').each((index, element) => {
      const title = $(element).find('.thumb a, .image a').attr('title') || 
                    $(element).find('.thumb a, .image a').text();
      const link = $(element).find('.thumb a, .image a').attr('href');
      const image = $(element).find('.thumb img, .image img').attr('src');
      const rating = $(element).find('.score, .rating, .info .score').text();
      const genre = $(element).find('.genre, .genres, .info .genre').text();

      if (title && link) {
        animeList.push({
          title: cleanText(title),
          link: this.normalizeUrl(link),
          image: image ? this.normalizeUrl(image) : null,
          rating: cleanText(rating) || 'N/A',
          genre: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
        });
      }
    });

    const pagination = {
      current: page,
      total: this.getTotalPages($)
    };

    return { animeList, pagination };
  }

  async searchAnime(query) {
    const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=anime`;
    const $ = await fetchHTML(url);
    const results = [];

    $('.chivsrc li, .search-results .item, .result-item').each((index, element) => {
      const title = $(element).find('h2 a, h3 a, .title a').text();
      const link = $(element).find('h2 a, h3 a, .title a').attr('href');
      const image = $(element).find('img').attr('src');
      const genre = $(element).find('.set, .genre, .info').text();
      const status = $(element).find('.type, .status, .info .status').text();

      if (title && link) {
        results.push({
          title: cleanText(title),
          link: this.normalizeUrl(link),
          image: image ? this.normalizeUrl(image) : null,
          genre: cleanText(genre),
          status: cleanText(status) || 'Unknown'
        });
      }
    });

    return results;
  }

  async getAnimeDetail(url) {
    const $ = await fetchHTML(url);
    
    const title = $('.infoanime h1, .anime-title h1, .title-single').text();
    const image = $('.infoanime img, .anime-image img, .thumb img').first().attr('src');
    const synopsis = $('.sinopsis p, .description p, .synopsis p').text();
    const info = {};

    $('.infoanime .info, .anime-info .info, .info-detail').each((index, element) => {
      const label = $(element).find('b, strong, .label').text().replace(':', '');
      const value = $(element).text().replace(`${label}:`, '').replace(`${label}`, '').trim();
      if (label && value) {
        info[label.toLowerCase().trim()] = cleanText(value);
      }
    });

    const episodes = [];
    $('.episodelist ul li, .episode-list .item, .list-episode li').each((index, element) => {
      const episodeTitle = $(element).find('a').text();
      const episodeLink = $(element).find('a').attr('href');
      const episodeDate = $(element).find('.date, time').text();

      if (episodeLink) {
        episodes.push({
          title: cleanText(episodeTitle) || `Episode ${index + 1}`,
          link: this.normalizeUrl(episodeLink),
          date: formatDate(episodeDate) || cleanText(episodeDate) || null
        });
      }
    });

    return {
      title: cleanText(title) || 'Unknown',
      image: image ? this.normalizeUrl(image) : null,
      synopsis: cleanText(synopsis) || 'No synopsis available',
      info,
      episodes: episodes.reverse()
    };
  }

  async getEpisodeDetail(url) {
    const $ = await fetchHTML(url);
    
    const title = $('.breadcrumb .active, .episode-title, h1.entry-title').text();
    const animeTitle = $('.breadcrumb a, .anime-title a').eq(1).text();
    const animeLink = $('.breadcrumb a, .anime-title a').eq(1).attr('href');
    
    const streams = [];
    $('.download-link .btn, .stream-link .btn, .download a').each((index, element) => {
      const quality = $(element).text().trim();
      const link = $(element).attr('href');
      if (link) {
        streams.push({
          quality: cleanText(quality) || `Quality ${index + 1}`,
          link: this.normalizeUrl(link)
        });
      }
    });

    const downloads = [];
    $('.download-link .download, .download-list a, .dl-list a').each((index, element) => {
      const quality = $(element).text().trim();
      const link = $(element).attr('href');
      if (link) {
        downloads.push({
          quality: cleanText(quality) || `Download ${index + 1}`,
          link: this.normalizeUrl(link)
        });
      }
    });

    return {
      title: cleanText(title) || 'Episode',
      anime: {
        title: cleanText(animeTitle) || 'Unknown',
        link: animeLink ? this.normalizeUrl(animeLink) : null
      },
      streams: streams.length > 0 ? streams : downloads,
      downloads: downloads.length > 0 ? downloads : []
    };
  }

  async getGenres() {
    const $ = await fetchHTML(`${this.baseUrl}/genre`);
    const genres = [];

    $('.genre-list a, .genres a, .list-genre a').each((index, element) => {
      const name = $(element).text();
      const link = $(element).attr('href');
      if (name && link) {
        genres.push({
          name: cleanText(name),
          link: this.normalizeUrl(link)
        });
      }
    });

    return genres;
  }

  async getAnimeByGenre(genre, page = 1) {
    const url = page === 1
      ? `${this.baseUrl}/genre/${genre}`
      : `${this.baseUrl}/genre/${genre}/page/${page}`;
    
    const $ = await fetchHTML(url);
    const animeList = [];

    $('.venz .col-md-3, .listanime .col-md-3, .anime-list .item').each((index, element) => {
      const title = $(element).find('.thumb a, .image a').attr('title') || 
                    $(element).find('.thumb a, .image a').text();
      const link = $(element).find('.thumb a, .image a').attr('href');
      const image = $(element).find('.thumb img, .image img').attr('src');
      const rating = $(element).find('.score, .rating').text();

      if (title && link) {
        animeList.push({
          title: cleanText(title),
          link: this.normalizeUrl(link),
          image: image ? this.normalizeUrl(image) : null,
          rating: cleanText(rating) || 'N/A'
        });
      }
    });

    const pagination = {
      current: page,
      total: this.getTotalPages($)
    };

    return { animeList, pagination };
  }

  async getSchedule() {
    const $ = await fetchHTML(`${this.baseUrl}/jadwal-rilis`);
    const schedule = {};

    $('.jadwal, .schedule-day, .release-schedule').each((index, element) => {
      const day = $(element).find('.hari, .day, .day-name').text();
      const animeList = [];

      $(element).find('.anime, .item, .anime-item').each((i, anime) => {
        const title = $(anime).find('a, .title').text();
        const link = $(anime).find('a, .title a').attr('href');
        const time = $(anime).find('.time, .jam, .time-slot').text();

        if (title && link) {
          animeList.push({
            title: cleanText(title),
            link: this.normalizeUrl(link),
            time: cleanText(time) || 'TBA'
          });
        }
      });

      if (animeList.length > 0) {
        schedule[cleanText(day) || 'Unknown'] = animeList;
      }
    });

    // If no schedule found, try alternative
    if (Object.keys(schedule).length === 0) {
      $('.schedule-item, .release-item').each((index, element) => {
        const day = $(element).find('.day').text();
        const title = $(element).find('.title a').text();
        const link = $(element).find('.title a').attr('href');
        const time = $(element).find('.time').text();

        if (day && title && link) {
          const cleanDay = cleanText(day);
          if (!schedule[cleanDay]) schedule[cleanDay] = [];
          schedule[cleanDay].push({
            title: cleanText(title),
            link: this.normalizeUrl(link),
            time: cleanText(time) || 'TBA'
          });
        }
      });
    }

    return schedule;
  }

  normalizeUrl(url) {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return `${this.baseUrl}/${url}`;
  }

  getTotalPages($) {
    const pagination = $('.pagination, .nav-links, .page-numbers');
    if (pagination.length === 0) return 1;

    const lastPage = pagination.find('a').last();
    if (lastPage.text() === '»' || lastPage.text() === 'Next' || lastPage.text() === '→') {
      const prevPage = pagination.find('a').eq(-2);
      return extractNumber(prevPage.text()) || 1;
    }

    return extractNumber(lastPage.text()) || 1;
  }
}

module.exports = new ScraperService();
