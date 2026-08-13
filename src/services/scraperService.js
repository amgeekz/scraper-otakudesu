const { 
  fetchHTML, 
  tryBases,
  cleanText, 
  extractNumber, 
  extractSlug, 
  normalizeUrl, 
  formatDate,
  absolutize
} = require('../utils/helpers');
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
  // HOME / LATEST - DENGAN tryBases
  // ========================================
  async getLatest() {
    const cacheKey = 'latest';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const $ = await fetchHTML(BASE);
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
                  url: normalizeUrl(link, BASE),
                  image_url: image ? normalizeUrl(image, BASE) : null,
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

        return { 
          ongoing_anime: ongoingAnime.slice(0, 20), 
          complete_anime: completeAnime.slice(0, 20) 
        };
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getLatest');
    }
  }

  // ========================================
  // ONGOING ANIME - DENGAN tryBases
  // ========================================
  async getOngoing(page = 1) {
    const cacheKey = `ongoing:${page}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = page === 1 
          ? `${BASE}/ongoing-anime`
          : `${BASE}/ongoing-anime/page/${page}`;
        
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
                  url: normalizeUrl(link, BASE),
                  image_url: image ? normalizeUrl(image, BASE) : null,
                  episode: cleanText(episode) || null,
                  genres: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
                });
              }
            });
            if (animeList.length > 0) break;
          }
        }

        return { data: animeList, page };
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getOngoing');
    }
  }

  // ========================================
  // COMPLETED ANIME - DENGAN tryBases
  // ========================================
  async getCompleted(page = 1) {
    const cacheKey = `completed:${page}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = page === 1
          ? `${BASE}/complete-anime`
          : `${BASE}/complete-anime/page/${page}`;
        
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
                  url: normalizeUrl(link, BASE),
                  image_url: image ? normalizeUrl(image, BASE) : null,
                  rating: cleanText(rating) || null,
                  genres: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean)
                });
              }
            });
            if (animeList.length > 0) break;
          }
        }

        return { data: animeList, page };
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getCompleted');
    }
  }

  // ========================================
  // SEARCH - DENGAN tryBases
  // ========================================
  async search(query) {
    const cacheKey = `search:${query}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/?s=${encodeURIComponent(query)}&post_type=anime`;
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
                  url: normalizeUrl(link, BASE),
                  image_url: image ? normalizeUrl(image, BASE) : null,
                  genres: cleanText(genre).split(',').map(g => g.trim()).filter(Boolean),
                  status: cleanText(status) || null,
                  rating: cleanText(rating) || null
                });
              }
            });
            if (results.length > 0) break;
          }
        }

        return results;
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }

  // ========================================
  // ANIME LIST - DENGAN tryBases
  // ========================================
  async getAnimeList() {
    const cacheKey = 'anime-list';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/anime-list/`;
        const $ = await fetchHTML(url);
        const animeList = [];

        const selectors = [
          '.bariskelom a',
          '.fl-l a',
          '.list-anime a',
          '.venutama .abc a',
          '.anime-list a',
          '.list a'
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
                  url: normalizeUrl(link, BASE)
                });
              }
            });
            if (animeList.length > 0) break;
          }
        }

        return animeList;
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getAnimeList');
    }
  }

  // ========================================
  // GENRES - DENGAN tryBases
  // ========================================
  async getGenres() {
    const cacheKey = 'genres';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/genre/`;
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
                  url: normalizeUrl(link, BASE)
                });
              }
            });
            if (genres.length > 0) break;
          }
        }

        return genres;
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getGenres');
    }
  }

  // ========================================
  // SCHEDULE - DENGAN tryBases
  // ========================================
  async getSchedule() {
    const cacheKey = 'schedule';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/jadwal-rilis/`;
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
                    url: normalizeUrl(link, BASE),
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

        return schedule;
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, 'getSchedule');
    }
  }

  // ========================================
  // ANIME DETAIL - DENGAN tryBases
  // ========================================
  async getAnimeDetail(slug) {
    const cacheKey = `anime:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/anime/${slug}/`;
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
              url: normalizeUrl(genreLink, BASE)
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
                  url: normalizeUrl(episodeLink, BASE),
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
                url: normalizeUrl(batchLink, BASE)
              };
            } else if (batchSlug && (batchSlug.includes('lengkap') || batchTitle.toLowerCase().includes('lengkap') || batchTitle.toLowerCase().includes('complete'))) {
              completeDownload = {
                title: cleanText(batchTitle),
                slug: batchSlug,
                url: normalizeUrl(batchLink, BASE)
              };
            }
          }
        });

        return {
          title: cleanText(title) || 'Unknown',
          slug,
          url: normalizeUrl(url, BASE),
          image_url: image ? normalizeUrl(image, BASE) : null,
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
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `getAnimeDetail: ${slug}`);
    }
  }

  // ========================================
  // EPISODE DETAIL - DENGAN tryBases
  // ========================================
  async getEpisodeDetail(slug) {
    const cacheKey = `episode:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/episode/${slug}/`;
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
                    url: normalizeUrl(urlLink, BASE)
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

        // Episode selector
        const episodeSelector = [];
        $('.episode-selector a, .episode-nav a, .nav-links a, .pagination a, .episode-navigation a').each((i, el) => {
          const epTitle = $(el).text();
          const epLink = $(el).attr('href');
          if (epLink && epLink !== '#' && !epLink.includes('javascript')) {
            episodeSelector.push({
              title: cleanText(epTitle),
              slug: extractSlug(epLink),
              url: normalizeUrl(epLink, BASE)
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

        return {
          title: cleanText(title) || 'Episode',
          slug,
          url: normalizeUrl(url, BASE),
          episode: episodeNum,
          anime: animeTitle && animeLink ? {
            title: cleanText(animeTitle),
            slug: extractSlug(animeLink),
            url: normalizeUrl(animeLink, BASE)
          } : null,
          stream_url: streamUrl,
          mirrors,
          downloads,
          episode_selector: episodeSelector,
          previous_episode: previousEpisode,
          next_episode: nextEpisode,
          all_episodes: allEpisodes
        };
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `getEpisodeDetail: ${slug}`);
    }
  }

  // ========================================
  // BATCH DETAIL - DENGAN tryBases
  // ========================================
  async getBatchDetail(slug) {
    const cacheKey = `batch:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/batch/${slug}/`;
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
                    url: normalizeUrl(urlLink, BASE)
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

        return {
          title: cleanText(title) || 'Batch',
          slug,
          url: normalizeUrl(url, BASE),
          anime: animeTitle && animeLink ? {
            title: cleanText(animeTitle),
            slug: extractSlug(animeLink),
            url: normalizeUrl(animeLink, BASE)
          } : null,
          image_url: image ? normalizeUrl(image, BASE) : null,
          metadata,
          downloads
        };
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `getBatchDetail: ${slug}`);
    }
  }

  // ========================================
  // COMPLETE DOWNLOADS - DENGAN tryBases
  // ========================================
  async getCompleteDownloads(slug) {
    const cacheKey = `complete:${slug}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await tryBases(async (BASE) => {
        const url = `${BASE}/lengkap/${slug}/`;
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
                      url: normalizeUrl(urlLink, BASE)
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
                url: normalizeUrl(urlLink, BASE)
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

        return {
          title: cleanText(title) || 'Complete Downloads',
          slug,
          url: normalizeUrl(url, BASE),
          anime: animeTitle && animeLink ? {
            title: cleanText(animeTitle),
            slug: extractSlug(animeLink),
            url: normalizeUrl(animeLink, BASE)
          } : null,
          metadata,
          episodes,
          batch: batchDownloads
        };
      });

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `getCompleteDownloads: ${slug}`);
    }
  }

  // ========================================
  // ADVANCED: GET ONGOING BY DAY
  // ========================================
  async getOngoingByDay(dayKey) {
    const DAY_MAP = {
      senin: 'Senin',
      selasa: 'Selasa',
      rabu: 'Rabu',
      kamis: 'Kamis',
      jumat: 'Jumat',
      sabtu: 'Sabtu',
      minggu: 'Minggu'
    };

    const target = DAY_MAP[String(dayKey || '').toLowerCase()];
    if (!target) return [];

    return await tryBases(async (BASE) => {
      const url = `${BASE}/jadwal-rilis/`;
      const $ = await fetchHTML(url);

      const DAY_SEL = 'h1,h2,h3,h4,h5,strong,b,.day,.jadwal,.title,.widget-title';
      const heads = [];

      $(DAY_SEL).each((_, el) => {
        const txt = cleanText($(el).text());
        if (/Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu/i.test(txt)) {
          heads.push({ el, text: txt });
        }
      });

      const segments = {};
      for (let i = 0; i < heads.length; i++) {
        const cur = heads[i];
        const next = heads[i + 1];
        const curDay = (cur.text.match(/Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu/i) || [])[0];
        if (!curDay) continue;

        const seg = $('<div/>');
        let n = $(cur.el).next();

        while (n && n.length) {
          if (next && n[0] === next.el) break;
          const txt = cleanText(n.text());
          if (/Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu/i.test(txt) && n.is(DAY_SEL)) break;
          seg.append(n.clone());
          n = n.next();
        }

        segments[curDay] = segments[curDay] 
          ? segments[curDay].append(seg.children()) 
          : seg;
      }

      const seg = segments[target];
      if (!seg || !seg.length) return [];

      const items = [];
      const S_LINKS = [
        'a.series', 'a.seriestitle', 'a', '.series a', '.ag a', '.jdlflm a', '.list a',
        '.bxcl a', 'ul li a', 'ol li a'
      ].join(', ');

      seg.find(S_LINKS).each((_, a) => {
        const href = $(a).attr('href');
        let title = cleanText($(a).text());
        if (!title) title = cleanText($(a).find('span, .tt, .title').text());
        if (!href || !title) return;

        title = title
          .replace(/\b(Episode|Eps|Ep)\s*\d+\b/ig, '')
          .replace(/\b(Subtitle Indonesia|Sub Indo)\b/ig, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (title.length < 2) return;
        items.push({ 
          title, 
          url: normalizeUrl(href, BASE),
          slug: extractSlug(href)
        });
      });

      const seen = new Set();
      return items.filter(it => {
        const key = it.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }
}

module.exports = new ScraperService();