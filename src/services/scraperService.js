const { fetchHTML, cleanText, extractNumber, extractSlug, normalizeUrl, formatDate } = require('../utils/helpers');
const cache = require('../utils/cache');
const config = require('../config');

class ScraperService {
  constructor() {
    this.baseUrl = config.baseUrl;
  }

  // === HOME / LATEST ===
  async getLatest() {
    const cacheKey = 'latest';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const $ = await fetchHTML(this.baseUrl);
    const ongoingAnime = [];
    const completeAnime = [];

    // Ambil dari homepage (selector disesuaikan)
    $('.venz .col-md-3, .listanime .col-md-3, .anime-list .item').each((i, el) => {
      const title = $(el).find('.thumb a, .image a').attr('title') || $(el).find('.thumb a, .image a').text();
      const link = $(el).find('.thumb a, .image a').attr('href');
      const image = $(el).find('.thumb img, .image img').attr('src');
      const episode = $(el).find('.epz, .eps, .info .episode').text();
      const genre = $(el).find('.genre, .genres, .info .genre').text();

      if (title && link) {
        const anime = {
          title: cleanText(title),
          slug: extractSlug(link),
          url: normalizeUrl(link, this.baseUrl),
          image_url: image ? normalizeUrl(image, this.baseUrl) : null,
          episode: cleanText(episode) || null,
          genre: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
        };

        // Cek apakah ini ongoing atau complete berdasarkan ada/tidaknya episode
        if (episode && episode.includes('Episode')) {
          ongoingAnime.push(anime);
        } else {
          completeAnime.push(anime);
        }
      }
    });

    const result = { ongoing_anime: ongoingAnime, complete_anime: completeAnime };
    cache.set(cacheKey, result);
    return result;
  }

  // === SEARCH ===
  async search(query) {
    const cacheKey = `search:${query}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=anime`;
    const $ = await fetchHTML(url);
    const results = [];

    $('.chivsrc li, .search-results .item, .result-item').each((i, el) => {
      const title = $(el).find('h2 a, h3 a, .title a').text();
      const link = $(el).find('h2 a, h3 a, .title a').attr('href');
      const image = $(el).find('img').attr('src');
      const genre = $(el).find('.set, .genre, .info').text();
      const status = $(el).find('.type, .status, .info .status').text();
      const rating = $(el).find('.score, .rating').text();

      if (title && link) {
        results.push({
          title: cleanText(title),
          slug: extractSlug(link),
          url: normalizeUrl(link, this.baseUrl),
          image_url: image ? normalizeUrl(image, this.baseUrl) : null,
          genres: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean),
          status: cleanText(status) || null,
          rating: cleanText(rating) || null
        });
      }
    });

    cache.set(cacheKey, results);
    return results;
  }

  // === ONGOING ANIME ===
  async getOngoing(page = 1) {
    const cacheKey = `ongoing:${page}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = page === 1 
      ? `${this.baseUrl}/ongoing-anime`
      : `${this.baseUrl}/ongoing-anime/page/${page}`;
    
    const $ = await fetchHTML(url);
    const animeList = [];

    $('.venz .col-md-3, .listanime .col-md-3, .anime-list .item').each((i, el) => {
      const title = $(el).find('.thumb a, .image a').attr('title') || $(el).find('.thumb a, .image a').text();
      const link = $(el).find('.thumb a, .image a').attr('href');
      const image = $(el).find('.thumb img, .image img').attr('src');
      const episode = $(el).find('.epz, .eps, .info .episode').text();
      const genre = $(el).find('.genre, .genres, .info .genre').text();

      if (title && link) {
        animeList.push({
          title: cleanText(title),
          slug: extractSlug(link),
          url: normalizeUrl(link, this.baseUrl),
          image_url: image ? normalizeUrl(image, this.baseUrl) : null,
          episode: cleanText(episode) || null,
          genres: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
        });
      }
    });

    const result = { data: animeList, page };
    cache.set(cacheKey, result);
    return result;
  }

  // === COMPLETED ANIME ===
  async getCompleted(page = 1) {
    const cacheKey = `completed:${page}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = page === 1
      ? `${this.baseUrl}/complete-anime`
      : `${this.baseUrl}/complete-anime/page/${page}`;
    
    const $ = await fetchHTML(url);
    const animeList = [];

    $('.venz .col-md-3, .listanime .col-md-3, .anime-list .item').each((i, el) => {
      const title = $(el).find('.thumb a, .image a').attr('title') || $(el).find('.thumb a, .image a').text();
      const link = $(el).find('.thumb a, .image a').attr('href');
      const image = $(el).find('.thumb img, .image img').attr('src');
      const rating = $(el).find('.score, .rating').text();
      const genre = $(el).find('.genre, .genres, .info .genre').text();

      if (title && link) {
        animeList.push({
          title: cleanText(title),
          slug: extractSlug(link),
          url: normalizeUrl(link, this.baseUrl),
          image_url: image ? normalizeUrl(image, this.baseUrl) : null,
          rating: cleanText(rating) || null,
          genres: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
        });
      }
    });

    const result = { data: animeList, page };
    cache.set(cacheKey, result);
    return result;
  }

  // === ANIME LIST ===
  async getAnimeList() {
    const cacheKey = 'anime-list';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/anime-list`;
    const $ = await fetchHTML(url);
    const animeList = [];

    // Selector untuk anime list
    $('.anime-list a, .list-anime a, .daftar-anime a').each((i, el) => {
      const title = $(el).text();
      const link = $(el).attr('href');
      if (title && link) {
        animeList.push({
          title: cleanText(title),
          slug: extractSlug(link),
          url: normalizeUrl(link, this.baseUrl)
        });
      }
    });

    cache.set(cacheKey, animeList);
    return animeList;
  }

  // === GENRES ===
  async getGenres() {
    const cacheKey = 'genres';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/genre`;
    const $ = await fetchHTML(url);
    const genres = [];

    $('.genre-list a, .genres a, .list-genre a').each((i, el) => {
      const title = $(el).text();
      const link = $(el).attr('href');
      if (title && link) {
        genres.push({
          title: cleanText(title),
          slug: extractSlug(link),
          url: normalizeUrl(link, this.baseUrl)
        });
      }
    });

    cache.set(cacheKey, genres);
    return genres;
  }

  // === SCHEDULE ===
  async getSchedule() {
    const cacheKey = 'schedule';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/jadwal-rilis`;
    const $ = await fetchHTML(url);
    const schedule = [];

    $('.jadwal, .schedule-day, .release-schedule').each((i, el) => {
      const day = $(el).find('.hari, .day, .day-name').text();
      const animeList = [];

      $(el).find('.anime, .item, .anime-item').each((j, anime) => {
        const title = $(anime).find('a, .title').text();
        const link = $(anime).find('a, .title a').attr('href');
        const time = $(anime).find('.time, .jam, .time-slot').text();

        if (title && link) {
          animeList.push({
            title: cleanText(title),
            slug: extractSlug(link),
            url: normalizeUrl(link, this.baseUrl),
            time: cleanText(time) || null
          });
        }
      });

      if (animeList.length > 0) {
        schedule.push({
          day: cleanText(day) || 'Unknown',
          anime: animeList
        });
      }
    });

    cache.set(cacheKey, schedule);
    return schedule;
  }

  // === ANIME DETAIL ===
  async getAnimeDetail(slug) {
    const cacheKey = `anime:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/anime/${slug}/`;
    const $ = await fetchHTML(url);
    
    const title = $('.infoanime h1, .anime-title h1, .title-single').text();
    const image = $('.infoanime img, .anime-image img, .thumb img').first().attr('src');
    const synopsis = $('.sinopsis p, .description p, .synopsis p').text();
    
    const info = {};
    $('.infoanime .info, .anime-info .info, .info-detail').each((i, el) => {
      const label = $(el).find('b, strong, .label').text().replace(':', '');
      const value = $(el).text().replace(`${label}:`, '').replace(`${label}`, '').trim();
      if (label && value) {
        info[label.toLowerCase().trim()] = cleanText(value);
      }
    });

    // Genres
    const genres = [];
    $('.infoanime .genre a, .anime-info .genre a, .genres a').each((i, el) => {
      const genreTitle = $(el).text();
      const genreLink = $(el).attr('href');
      if (genreTitle && genreLink) {
        genres.push({
          title: cleanText(genreTitle),
          slug: extractSlug(genreLink),
          url: normalizeUrl(genreLink, this.baseUrl)
        });
      }
    });

    // Episodes
    const episodes = [];
    $('.episodelist ul li, .episode-list .item, .list-episode li').each((i, el) => {
      const episodeTitle = $(el).find('a').text();
      const episodeLink = $(el).find('a').attr('href');
      const episodeDate = $(el).find('.date, time').text();

      if (episodeLink) {
        const episodeNum = extractNumber(episodeTitle);
        episodes.push({
          title: cleanText(episodeTitle) || `Episode ${i + 1}`,
          slug: extractSlug(episodeLink),
          url: normalizeUrl(episodeLink, this.baseUrl),
          episode: episodeNum,
          date: formatDate(episodeDate) || cleanText(episodeDate) || null
        });
      }
    });

    // Batch & Complete Download
    let batch = null;
    let completeDownload = null;

    $('.batch-link a, .download-batch a').each((i, el) => {
      const batchTitle = $(el).text();
      const batchLink = $(el).attr('href');
      if (batchTitle && batchLink) {
        const batchSlug = extractSlug(batchLink);
        if (batchSlug && batchSlug.includes('batch')) {
          batch = {
            title: cleanText(batchTitle),
            slug: batchSlug,
            url: normalizeUrl(batchLink, this.baseUrl)
          };
        } else if (batchSlug && batchSlug.includes('lengkap')) {
          completeDownload = {
            title: cleanText(batchTitle),
            slug: batchSlug,
            url: normalizeUrl(batchLink, this.baseUrl)
          };
        }
      }
    });

    const result = {
      title: cleanText(title) || 'Unknown',
      slug,
      url: normalizeUrl(url, this.baseUrl),
      image_url: image ? normalizeUrl(image, this.baseUrl) : null,
      japanese: info['japanese'] || null,
      score: info['skor'] || info['score'] || null,
      producer: info['produser'] || info['producer'] || null,
      type: info['tipe'] || info['type'] || null,
      status: info['status'] || null,
      total_episodes: info['total episode'] || info['episode'] || null,
      duration: info['durasi'] || info['duration'] || null,
      release_date: info['rilis'] || info['release'] || null,
      studio: info['studio'] || null,
      genres,
      synopsis: cleanText(synopsis) || 'No synopsis available',
      batch,
      complete_download: completeDownload,
      episodes: episodes.reverse()
    };

    cache.set(cacheKey, result);
    return result;
  }

  // === EPISODE DETAIL ===
  async getEpisodeDetail(slug) {
    const cacheKey = `episode:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/episode/${slug}/`;
    const $ = await fetchHTML(url);
    
    const title = $('.breadcrumb .active, .episode-title, h1.entry-title').text();
    const animeTitle = $('.breadcrumb a, .anime-title a').eq(1).text();
    const animeLink = $('.breadcrumb a, .anime-title a').eq(1).attr('href');
    
    // Stream URL (iframe)
    let streamUrl = null;
    $('iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('google') && !src.includes('facebook')) {
        streamUrl = src;
        return false;
      }
    });

    // Mirrors
    const mirrors = [];
    $('.mirror-link, .stream-mirror, .mirror-item').each((i, el) => {
      const quality = $(el).find('.quality, .label').text();
      const providers = [];
      $(el).find('a, .provider').each((j, provider) => {
        const name = $(provider).text();
        const link = $(provider).attr('href');
        const dataContent = $(provider).attr('data-content') || null;
        if (name && link) {
          providers.push({
            name: cleanText(name),
            data_content: dataContent,
            is_default: link.includes('default') || false
          });
        }
      });
      if (providers.length > 0) {
        mirrors.push({
          quality: cleanText(quality) || 'Default',
          providers
        });
      }
    });

    // Downloads
    const downloads = [];
    $('.download-link .download, .download-list .item, .dl-list .item').each((i, el) => {
      const quality = $(el).find('.quality, .label').text();
      const size = $(el).find('.size, .filesize').text();
      const links = [];
      $(el).find('a').each((j, link) => {
        const provider = $(link).text();
        const urlLink = $(link).attr('href');
        if (provider && urlLink) {
          links.push({
            provider: cleanText(provider),
            url: normalizeUrl(urlLink, this.baseUrl)
          });
        }
      });
      if (links.length > 0) {
        downloads.push({
          quality: cleanText(quality) || 'Unknown',
          size: cleanText(size) || null,
          links
        });
      }
    });

    // Episode selector (previous, next, all)
    const episodeSelector = [];
    $('.episode-selector a, .episode-nav a, .nav-links a').each((i, el) => {
      const epTitle = $(el).text();
      const epLink = $(el).attr('href');
      if (epLink) {
        episodeSelector.push({
          title: cleanText(epTitle),
          slug: extractSlug(epLink),
          url: normalizeUrl(epLink, this.baseUrl)
        });
      }
    });

    const previousEpisode = episodeSelector.find(e => e.title.includes('Previous') || e.title.includes('Prev')) || null;
    const nextEpisode = episodeSelector.find(e => e.title.includes('Next')) || null;
    const allEpisodes = episodeSelector.find(e => e.title.includes('All')) || null;

    const episodeNum = extractNumber(title);

    const result = {
      title: cleanText(title) || 'Episode',
      slug,
      url: normalizeUrl(url, this.baseUrl),
      episode: episodeNum,
      anime: animeTitle && animeLink ? {
        title: cleanText(animeTitle),
        slug: extractSlug(animeLink),
        url: normalizeUrl(animeLink, this.baseUrl)
      } : null,
      stream_url: streamUrl,
      mirrors,
      downloads,
      episode_selector: episodeSelector,
      previous_episode: previousEpisode,
      next_episode: nextEpisode,
      all_episodes: allEpisodes
    };

    cache.set(cacheKey, result);
    return result;
  }

  // === BATCH DETAIL ===
  async getBatchDetail(slug) {
    const cacheKey = `batch:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/batch/${slug}/`;
    const $ = await fetchHTML(url);
    
    const title = $('.infoanime h1, .anime-title h1, .title-single').text();
    const image = $('.infoanime img, .anime-image img, .thumb img').first().attr('src');
    
    const metadata = {};
    $('.infoanime .info, .anime-info .info, .info-detail').each((i, el) => {
      const label = $(el).find('b, strong, .label').text().replace(':', '');
      const value = $(el).text().replace(`${label}:`, '').replace(`${label}`, '').trim();
      if (label && value) {
        metadata[label.toLowerCase().trim()] = cleanText(value);
      }
    });

    const animeTitle = $('.breadcrumb a, .anime-title a').eq(1).text();
    const animeLink = $('.breadcrumb a, .anime-title a').eq(1).attr('href');

    // Downloads
    const downloads = [];
    $('.download-link .download, .download-list .item, .dl-list .item').each((i, el) => {
      const quality = $(el).find('.quality, .label').text();
      const size = $(el).find('.size, .filesize').text();
      const links = [];
      $(el).find('a').each((j, link) => {
        const provider = $(link).text();
        const urlLink = $(link).attr('href');
        if (provider && urlLink) {
          links.push({
            provider: cleanText(provider),
            url: normalizeUrl(urlLink, this.baseUrl)
          });
        }
      });
      if (links.length > 0) {
        downloads.push({
          quality: cleanText(quality) || 'Unknown',
          size: cleanText(size) || null,
          links
        });
      }
    });

    const result = {
      title: cleanText(title) || 'Batch',
      slug,
      url: normalizeUrl(url, this.baseUrl),
      anime: animeTitle && animeLink ? {
        title: cleanText(animeTitle),
        slug: extractSlug(animeLink),
        url: normalizeUrl(animeLink, this.baseUrl)
      } : null,
      image_url: image ? normalizeUrl(image, this.baseUrl) : null,
      metadata,
      downloads
    };

    cache.set(cacheKey, result);
    return result;
  }

  // === COMPLETE DOWNLOADS ===
  async getCompleteDownloads(slug) {
    const cacheKey = `complete:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/lengkap/${slug}/`;
    const $ = await fetchHTML(url);
    
    const title = $('.infoanime h1, .anime-title h1, .title-single').text();
    
    const metadata = {};
    $('.infoanime .info, .anime-info .info, .info-detail').each((i, el) => {
      const label = $(el).find('b, strong, .label').text().replace(':', '');
      const value = $(el).text().replace(`${label}:`, '').replace(`${label}`, '').trim();
      if (label && value) {
        metadata[label.toLowerCase().trim()] = cleanText(value);
      }
    });

    const animeTitle = $('.breadcrumb a, .anime-title a').eq(1).text();
    const animeLink = $('.breadcrumb a, .anime-title a').eq(1).attr('href');

    // Episodes with downloads
    const episodes = [];
    $('.episode-item, .list-episode .item, .episode-list .item').each((i, el) => {
      const epTitle = $(el).find('.title, .episode-title').text();
      const epNum = extractNumber(epTitle);
      const isFinal = epTitle.toLowerCase().includes('end') || false;
      
      const downloads = [];
      $(el).find('.download-link .download, .download-list .item, .dl-list .item').each((j, dl) => {
        const quality = $(dl).find('.quality, .label').text();
        const size = $(dl).find('.size, .filesize').text();
        const links = [];
        $(dl).find('a').each((k, link) => {
          const provider = $(link).text();
          const urlLink = $(link).attr('href');
          if (provider && urlLink) {
            links.push({
              provider: cleanText(provider),
              url: normalizeUrl(urlLink, this.baseUrl)
            });
          }
        });
        if (links.length > 0) {
          downloads.push({
            quality: cleanText(quality) || 'Unknown',
            size: cleanText(size) || null,
            links
          });
        }
      });

      if (downloads.length > 0) {
        episodes.push({
          episode: epNum,
          title: cleanText(epTitle) || `Episode ${i + 1}`,
          is_final: isFinal,
          downloads
        });
      }
    });

    // Batch downloads (if any)
    const batchDownloads = [];
    $('.batch-download .download, .batch-list .item').each((i, el) => {
      const quality = $(el).find('.quality, .label').text();
      const size = $(el).find('.size, .filesize').text();
      const links = [];
      $(el).find('a').each((j, link) => {
        const provider = $(link).text();
        const urlLink = $(link).attr('href');
        if (provider && urlLink) {
          links.push({
            provider: cleanText(provider),
            url: normalizeUrl(urlLink, this.baseUrl)
          });
        }
      });
      if (links.length > 0) {
        batchDownloads.push({
          quality: cleanText(quality) || 'Unknown',
          size: cleanText(size) || null,
          links
        });
      }
    });

    const result = {
      title: cleanText(title) || 'Complete Downloads',
      slug,
      url: normalizeUrl(url, this.baseUrl),
      anime: animeTitle && animeLink ? {
        title: cleanText(animeTitle),
        slug: extractSlug(animeLink),
        url: normalizeUrl(animeLink, this.baseUrl)
      } : null,
      metadata,
      episodes,
      batch: batchDownloads
    };

    cache.set(cacheKey, result);
    return result;
  }
}

module.exports = new ScraperService();
          
