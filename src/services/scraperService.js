const { fetchHTML, cleanText, extractNumber, extractSlug, normalizeUrl, formatDate } = require('../utils/helpers');
const cache = require('../utils/cache');
const config = require('../config');

class ScraperService {
  constructor() {
    this.baseUrl = config.baseUrl;
  }

  // ========================================
  // HELPER
  // ========================================
  handleError(error, context) {
    console.error(`[Scraper Error] ${context}:`, error.message);
    return {
      error: true,
      message: error.message || `Failed to fetch ${context}`,
      code: error.code || 'SCRAPE_ERROR'
    };
  }

  // ========================================
  // HOME / LATEST
  // ========================================
  async getLatest() {
    const cacheKey = 'latest';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const $ = await fetchHTML(this.baseUrl);
      const ongoingAnime = [];
      const completeAnime = [];

      const selectors = [
        '.venz .col-md-3',
        '.listanime .col-md-3',
        '.anime-list .item',
        '.col-md-3 .thumb',
        '.anime-item'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const title = $(el).find('.thumb a, .image a').attr('title') || 
                          $(el).find('.thumb a, .image a').text() ||
                          $(el).find('a').attr('title') ||
                          $(el).find('a').text();
            const link = $(el).find('.thumb a, .image a, a').first().attr('href');
            const image = $(el).find('.thumb img, .image img, img').first().attr('src');
            const episode = $(el).find('.epz, .eps, .info .episode, .episode').text();
            const genre = $(el).find('.genre, .genres, .info .genre, .tags').text();

            if (title && link) {
              const anime = {
                title: cleanText(title),
                slug: extractSlug(link),
                url: normalizeUrl(link, this.baseUrl),
                image_url: image ? normalizeUrl(image, this.baseUrl) : null,
                episode: cleanText(episode) || null,
                genres: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
              };

              if (episode && (episode.includes('Episode') || episode.includes('Eps') || episode.includes('eps'))) {
                ongoingAnime.push(anime);
              } else {
                completeAnime.push(anime);
              }
            }
          });
          if (ongoingAnime.length > 0 || completeAnime.length > 0) break;
        }
      }

      const result = { 
        ongoing_anime: ongoingAnime.slice(0, 20), 
        complete_anime: completeAnime.slice(0, 20) 
      };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getLatest');
    }
  }

  // ========================================
  // SEARCH
  // ========================================
  async search(query) {
    const cacheKey = `search:${query}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=anime`;
      const $ = await fetchHTML(url);
      const results = [];

      const selectors = [
        '.chivsrc li',
        '.search-results .item',
        '.result-item',
        '.list-item',
        '.anime-item'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const title = $(el).find('h2 a, h3 a, .title a, a').first().text();
            const link = $(el).find('h2 a, h3 a, .title a, a').first().attr('href');
            const image = $(el).find('img').attr('src');
            const genre = $(el).find('.set, .genre, .info, .tags').text();
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
          if (results.length > 0) break;
        }
      }

      cache.set(cacheKey, results);
      return results;
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }

  // ========================================
  // ONGOING ANIME
  // ========================================
  async getOngoing(page = 1) {
    const cacheKey = `ongoing:${page}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = page === 1 
        ? `${this.baseUrl}/ongoing-anime`
        : `${this.baseUrl}/ongoing-anime/page/${page}`;
      
      const $ = await fetchHTML(url);
      const animeList = [];

      const selectors = [
        '.venz .col-md-3',
        '.listanime .col-md-3',
        '.anime-list .item',
        '.col-md-3 .thumb',
        '.anime-item'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const title = $(el).find('.thumb a, .image a').attr('title') || 
                          $(el).find('.thumb a, .image a').text() ||
                          $(el).find('a').attr('title') ||
                          $(el).find('a').text();
            const link = $(el).find('.thumb a, .image a, a').first().attr('href');
            const image = $(el).find('.thumb img, .image img, img').first().attr('src');
            const episode = $(el).find('.epz, .eps, .info .episode, .episode').text();
            const genre = $(el).find('.genre, .genres, .info .genre, .tags').text();

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
          if (animeList.length > 0) break;
        }
      }

      const result = { data: animeList, page };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getOngoing');
    }
  }

  // ========================================
  // COMPLETED ANIME
  // ========================================
  async getCompleted(page = 1) {
    const cacheKey = `completed:${page}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = page === 1
        ? `${this.baseUrl}/complete-anime`
        : `${this.baseUrl}/complete-anime/page/${page}`;
      
      const $ = await fetchHTML(url);
      const animeList = [];

      const selectors = [
        '.venz .col-md-3',
        '.listanime .col-md-3',
        '.anime-list .item',
        '.col-md-3 .thumb',
        '.anime-item'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const title = $(el).find('.thumb a, .image a').attr('title') || 
                          $(el).find('.thumb a, .image a').text() ||
                          $(el).find('a').attr('title') ||
                          $(el).find('a').text();
            const link = $(el).find('.thumb a, .image a, a').first().attr('href');
            const image = $(el).find('.thumb img, .image img, img').first().attr('src');
            const rating = $(el).find('.score, .rating, .info .score').text();
            const genre = $(el).find('.genre, .genres, .info .genre, .tags').text();

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
          if (animeList.length > 0) break;
        }
      }

      const result = { data: animeList, page };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getCompleted');
    }
  }

  // ========================================
  // ANIME LIST
  // ========================================
  async getAnimeList() {
    const cacheKey = 'anime-list';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/anime-list`;
      const $ = await fetchHTML(url);
      const animeList = [];

      const selectors = [
        '.anime-list a',
        '.list-anime a',
        '.daftar-anime a',
        '.list a',
        '.anime-link a'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const title = $(el).text();
            const link = $(el).attr('href');
            if (title && link && !link.includes('#') && !link.includes('javascript')) {
              animeList.push({
                title: cleanText(title),
                slug: extractSlug(link),
                url: normalizeUrl(link, this.baseUrl)
              });
            }
          });
          if (animeList.length > 0) break;
        }
      }

      cache.set(cacheKey, animeList);
      return animeList;
    } catch (error) {
      return this.handleError(error, 'getAnimeList');
    }
  }

  // ========================================
  // GENRES
  // ========================================
  async getGenres() {
    const cacheKey = 'genres';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/genre`;
      const $ = await fetchHTML(url);
      const genres = [];

      const selectors = [
        '.genre-list a',
        '.genres a',
        '.list-genre a',
        '.genre-item a',
        '.tag-item a'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
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
          if (genres.length > 0) break;
        }
      }

      cache.set(cacheKey, genres);
      return genres;
    } catch (error) {
      return this.handleError(error, 'getGenres');
    }
  }

  // ========================================
  // SCHEDULE
  // ========================================
  async getSchedule() {
    const cacheKey = 'schedule';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/jadwal-rilis`;
      const $ = await fetchHTML(url);
      const schedule = [];

      const selectors = [
        '.jadwal',
        '.schedule-day',
        '.release-schedule',
        '.day-schedule',
        '.schedule-item'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const day = $(el).find('.hari, .day, .day-name, .title').first().text();
            const animeList = [];

            $(el).find('.anime, .item, .anime-item, .schedule-anime').each((j, anime) => {
              const title = $(anime).find('a, .title, .name').first().text();
              const link = $(anime).find('a, .title a, .name a').first().attr('href');
              const time = $(anime).find('.time, .jam, .time-slot, .hour').text();

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
          if (schedule.length > 0) break;
        }
      }

      cache.set(cacheKey, schedule);
      return schedule;
    } catch (error) {
      return this.handleError(error, 'getSchedule');
    }
  }

  // ========================================
  // ANIME DETAIL
  // ========================================
  async getAnimeDetail(slug) {
    const cacheKey = `anime:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/anime/${slug}/`;
      const $ = await fetchHTML(url);
      
      const title = $('.infoanime h1, .anime-title h1, .title-single, h1.entry-title').first().text();
      const image = $('.infoanime img, .anime-image img, .thumb img, .post-image img').first().attr('src');
      const synopsis = $('.sinopsis p, .description p, .synopsis p, .entry-content p').first().text();
      
      const info = {};
      const infoSelectors = [
        '.infoanime .info',
        '.anime-info .info',
        '.info-detail',
        '.anime-detail',
        '.info-item'
      ];

      for (const selector of infoSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const label = $(el).find('b, strong, .label, .title').text().replace(':', '').trim();
            const value = $(el).text().replace(label, '').replace(':', '').trim();
            if (label && value) {
              info[label.toLowerCase().trim()] = cleanText(value);
            }
          });
          if (Object.keys(info).length > 0) break;
        }
      }

      // Genres
      const genres = [];
      $('.infoanime .genre a, .anime-info .genre a, .genres a, .genre a').each((i, el) => {
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
      const episodeSelectors = [
        '.episodelist ul li',
        '.episode-list .item',
        '.list-episode li',
        '.episode-item',
        '.episode-link'
      ];

      for (const selector of episodeSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const episodeTitle = $(el).find('a').text();
            const episodeLink = $(el).find('a').attr('href');
            const episodeDate = $(el).find('.date, time, .time').text();

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
          if (episodes.length > 0) break;
        }
      }

      // Batch & Complete Download
      let batch = null;
      let completeDownload = null;

      $('.batch-link a, .download-batch a, .batch a, .download-link a').each((i, el) => {
        const batchTitle = $(el).text();
        const batchLink = $(el).attr('href');
        if (batchTitle && batchLink) {
          const batchSlug = extractSlug(batchLink);
          if (batchSlug && (batchSlug.includes('batch') || batchTitle.toLowerCase().includes('batch'))) {
            batch = {
              title: cleanText(batchTitle),
              slug: batchSlug,
              url: normalizeUrl(batchLink, this.baseUrl)
            };
          } else if (batchSlug && (batchSlug.includes('lengkap') || batchTitle.toLowerCase().includes('lengkap') || batchTitle.toLowerCase().includes('complete'))) {
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
        score: info['skor'] || info['score'] || info['rating'] || null,
        producer: info['produser'] || info['producer'] || null,
        type: info['tipe'] || info['type'] || null,
        status: info['status'] || null,
        total_episodes: info['total episode'] || info['episode'] || info['episodes'] || null,
        duration: info['durasi'] || info['duration'] || null,
        release_date: info['rilis'] || info['release'] || info['tanggal rilis'] || null,
        studio: info['studio'] || null,
        genres,
        synopsis: cleanText(synopsis) || 'No synopsis available',
        batch,
        complete_download: completeDownload,
        episodes: episodes.reverse()
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `getAnimeDetail: ${slug}`);
    }
  }

  // ========================================
  // EPISODE DETAIL
  // ========================================
  async getEpisodeDetail(slug) {
    const cacheKey = `episode:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/episode/${slug}/`;
      const $ = await fetchHTML(url);
      
      const title = $('.breadcrumb .active, .episode-title, h1.entry-title, .title').first().text();
      const animeTitle = $('.breadcrumb a, .anime-title a, .series-title a').eq(1).text();
      const animeLink = $('.breadcrumb a, .anime-title a, .series-title a').eq(1).attr('href');
      
      // Stream URL (iframe)
      let streamUrl = null;
      $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('google') && !src.includes('facebook') && !src.includes('youtube') && !src.includes('gstatic')) {
          streamUrl = src;
          return false;
        }
      });

      // Jika tidak ada iframe, coba cari di link streaming
      if (!streamUrl) {
        $('.stream-link a, .player-link a, .stream a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && (href.includes('http') || href.includes('www'))) {
            streamUrl = href;
            return false;
          }
        });
      }

      // Mirrors
      const mirrors = [];
      $('.mirror-link, .stream-mirror, .mirror-item, .mirrors, .mirror').each((i, el) => {
        const quality = $(el).find('.quality, .label, .title, .mirror-quality').text();
        const providers = [];
        $(el).find('a, .provider, .btn, .mirror-provider').each((j, provider) => {
          const name = $(provider).text();
          const link = $(provider).attr('href');
          const dataContent = $(provider).attr('data-content') || $(provider).attr('data-link') || null;
          if (name && link) {
            providers.push({
              name: cleanText(name),
              data_content: dataContent,
              is_default: link.includes('default') || name.includes('Default') || false
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
      const downloadSelectors = [
        '.download-link .download',
        '.download-list .item',
        '.dl-list .item',
        '.download-item',
        '.download',
        '.dl-item'
      ];

      for (const selector of downloadSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const quality = $(el).find('.quality, .label, .title, .dl-quality').text();
            const size = $(el).find('.size, .filesize, .size, .dl-size').text();
            const links = [];
            $(el).find('a, .provider, .btn, .dl-link').each((j, link) => {
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
          if (downloads.length > 0) break;
        }
      }

      // Episode selector (previous, next, all)
      const episodeSelector = [];
      $('.episode-selector a, .episode-nav a, .nav-links a, .pagination a, .episode-navigation a').each((i, el) => {
        const epTitle = $(el).text();
        const epLink = $(el).attr('href');
        if (epLink && epLink !== '#' && !epLink.includes('javascript')) {
          episodeSelector.push({
            title: cleanText(epTitle),
            slug: extractSlug(epLink),
            url: normalizeUrl(epLink, this.baseUrl)
          });
        }
      });

      const previousEpisode = episodeSelector.find(e => 
        e.title.toLowerCase().includes('previous') || 
        e.title.toLowerCase().includes('prev') || 
        e.title.includes('«') ||
        e.title.includes('‹')
      ) || null;
      
      const nextEpisode = episodeSelector.find(e => 
        e.title.toLowerCase().includes('next') || 
        e.title.includes('»') ||
        e.title.includes('›')
      ) || null;
      
      const allEpisodes = episodeSelector.find(e => 
        e.title.toLowerCase().includes('all') || 
        e.title.toLowerCase().includes('semua') ||
        e.title.includes('All') ||
        e.title.includes('all')
      ) || null;

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
    } catch (error) {
      return this.handleError(error, `getEpisodeDetail: ${slug}`);
    }
  }

  // ========================================
  // BATCH DETAIL
  // ========================================
  async getBatchDetail(slug) {
    const cacheKey = `batch:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/batch/${slug}/`;
      const $ = await fetchHTML(url);
      
      const title = $('.infoanime h1, .anime-title h1, .title-single, h1.entry-title').first().text();
      const image = $('.infoanime img, .anime-image img, .thumb img, .post-image img').first().attr('src');
      
      const metadata = {};
      const infoSelectors = [
        '.infoanime .info',
        '.anime-info .info',
        '.info-detail',
        '.anime-detail',
        '.info-item'
      ];

      for (const selector of infoSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const label = $(el).find('b, strong, .label, .title').text().replace(':', '').trim();
            const value = $(el).text().replace(label, '').replace(':', '').trim();
            if (label && value) {
              metadata[label.toLowerCase().trim()] = cleanText(value);
            }
          });
          if (Object.keys(metadata).length > 0) break;
        }
      }

      const animeTitle = $('.breadcrumb a, .anime-title a, .series-title a').eq(1).text();
      const animeLink = $('.breadcrumb a, .anime-title a, .series-title a').eq(1).attr('href');

      // Downloads
      const downloads = [];
      const downloadSelectors = [
        '.download-link .download',
        '.download-list .item',
        '.dl-list .item',
        '.download-item',
        '.download',
        '.dl-item'
      ];

      for (const selector of downloadSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const quality = $(el).find('.quality, .label, .title, .dl-quality').text();
            const size = $(el).find('.size, .filesize, .size, .dl-size').text();
            const links = [];
            $(el).find('a, .provider, .btn, .dl-link').each((j, link) => {
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
          if (downloads.length > 0) break;
        }
      }

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
    } catch (error) {
      return this.handleError(error, `getBatchDetail: ${slug}`);
    }
  }

  // ========================================
  // COMPLETE DOWNLOADS
  // ========================================
  async getCompleteDownloads(slug) {
    const cacheKey = `complete:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/lengkap/${slug}/`;
      const $ = await fetchHTML(url);
      
      const title = $('.infoanime h1, .anime-title h1, .title-single, h1.entry-title').first().text();
      
      const metadata = {};
      const infoSelectors = [
        '.infoanime .info',
        '.anime-info .info',
        '.info-detail',
        '.anime-detail',
        '.info-item'
      ];

      for (const selector of infoSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const label = $(el).find('b, strong, .label, .title').text().replace(':', '').trim();
            const value = $(el).text().replace(label, '').replace(':', '').trim();
            if (label && value) {
              metadata[label.toLowerCase().trim()] = cleanText(value);
            }
          });
          if (Object.keys(metadata).length > 0) break;
        }
      }

      const animeTitle = $('.breadcrumb a, .anime-title a, .series-title a').eq(1).text();
      const animeLink = $('.breadcrumb a, .anime-title a, .series-title a').eq(1).attr('href');

      // Episodes with downloads
      const episodes = [];
      const episodeSelectors = [
        '.episode-item',
        '.list-episode .item',
        '.episode-list .item',
        '.episode',
        '.episode-download'
      ];

      for (const selector of episodeSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const epTitle = $(el).find('.title, .episode-title, .name').text() || $(el).text();
            const epNum = extractNumber(epTitle);
            const isFinal = epTitle.toLowerCase().includes('end') || epTitle.toLowerCase().includes('final') || false;
            
            const downloads = [];
            $(el).find('.download-link .download, .download-list .item, .dl-list .item, .download-item, .download, .dl-item').each((j, dl) => {
              const quality = $(dl).find('.quality, .label, .title, .dl-quality').text();
              const size = $(dl).find('.size, .filesize, .size, .dl-size').text();
              const links = [];
              $(dl).find('a, .provider, .btn, .dl-link').each((k, link) => {
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
          if (episodes.length > 0) break;
        }
      }

      // Batch downloads
      const batchDownloads = [];
      $('.batch-download .download, .batch-list .item, .batch-item, .batch .download').each((i, el) => {
        const quality = $(el).find('.quality, .label, .title, .dl-quality').text();
        const size = $(el).find('.size, .filesize, .size, .dl-size').text();
        const links = [];
        $(el).find('a, .provider, .btn, .dl-link').each((j, link) => {
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
    } catch (error) {
      return this.handleError(error, `getCompleteDownloads: ${slug}`);
    }
  }
}

module.exports = new ScraperService();