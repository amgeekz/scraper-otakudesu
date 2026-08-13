const scraperService = require('../services/scraperService');
const { validateSlug, validatePage, validateSearchQuery } = require('../utils/validator');

class AnimeController {
  // ========================================
  // SERVICE & HEALTH
  // ========================================

  // GET /
  async getServiceInfo(req, res) {
    res.json({
      ok: true,
      data: {
        name: 'Otakudesu REST API',
        description: 'Scraping API for Otakudesu.blog with multiple domain fallback',
        version: '2.0.0',
        endpoints: [
          '/health',
          '/api/latest',
          '/api/search?q=keyword',
          '/api/ongoing?page=1',
          '/api/completed?page=1',
          '/api/anime-list',
          '/api/genres',
          '/api/schedule',
          '/api/anime/:slug',
          '/api/episode/:slug',
          '/api/batch/:slug',
          '/api/complete-downloads/:slug',
          '/api/ongoing-by-day/:day'
        ],
        fallback_domains: [
          'https://otakudesu.blog',
          'https://otakudesu.best',
          'https://otakudesuu.online',
          'https://otakudesu.cloud',
          'https://otakudesutv.com'
        ]
      }
    });
  }

  // GET /health
  async healthCheck(req, res) {
    res.json({
      ok: true,
      data: {
        status: 'up',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version
      }
    });
  }

  // ========================================
  // MAIN ENDPOINTS
  // ========================================

  // GET /api/latest
  async getLatest(req, res) {
    try {
      const data = await scraperService.getLatest();
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code || 'SCRAPE_ERROR'
        });
      }
      res.json({ ok: true, data });
    } catch (error) {
      console.error('[Controller] getLatest error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to fetch latest anime'
      });
    }
  }

  // GET /api/search
  async search(req, res) {
    try {
      const { q } = req.query;
      if (!q || !validateSearchQuery(q)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid search query. Max length: 100 characters'
        });
      }
      const data = await scraperService.search(q);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ ok: true, data, query: q });
    } catch (error) {
      console.error('[Controller] search error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to search anime'
      });
    }
  }

  // GET /api/ongoing
  async getOngoing(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      if (!validatePage(page)) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid page number. Must be a positive integer.' 
        });
      }
      const result = await scraperService.getOngoing(page);
      if (result && result.error) {
        return res.status(500).json({ 
          ok: false, 
          error: result.message,
          code: result.code
        });
      }
      res.json({ 
        ok: true, 
        data: result.data, 
        page: result.page,
        total: result.total || result.data?.length || 0
      });
    } catch (error) {
      console.error('[Controller] getOngoing error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to fetch ongoing anime'
      });
    }
  }

  // GET /api/completed
  async getCompleted(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      if (!validatePage(page)) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid page number. Must be a positive integer.' 
        });
      }
      const result = await scraperService.getCompleted(page);
      if (result && result.error) {
        return res.status(500).json({ 
          ok: false, 
          error: result.message,
          code: result.code
        });
      }
      res.json({ 
        ok: true, 
        data: result.data, 
        page: result.page,
        total: result.total || result.data?.length || 0
      });
    } catch (error) {
      console.error('[Controller] getCompleted error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to fetch completed anime'
      });
    }
  }

  // ========================================
  // LIST ENDPOINTS
  // ========================================

  // GET /api/anime-list
  async getAnimeList(req, res) {
    try {
      const data = await scraperService.getAnimeList();
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ 
        ok: true, 
        data,
        total: data.length || 0
      });
    } catch (error) {
      console.error('[Controller] getAnimeList error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to fetch anime list'
      });
    }
  }

  // GET /api/genres
  async getGenres(req, res) {
    try {
      const data = await scraperService.getGenres();
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ 
        ok: true, 
        data,
        total: data.length || 0
      });
    } catch (error) {
      console.error('[Controller] getGenres error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to fetch genres'
      });
    }
  }

  // GET /api/schedule
  async getSchedule(req, res) {
    try {
      const data = await scraperService.getSchedule();
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ 
        ok: true, 
        data,
        total_days: data.length || 0
      });
    } catch (error) {
      console.error('[Controller] getSchedule error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to fetch schedule'
      });
    }
  }

  // ========================================
  // DETAIL ENDPOINTS (with slug)
  // ========================================

  // GET /api/anime/:slug
  async getAnimeDetail(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid slug. Only alphanumeric, underscore, and hyphen allowed.' 
        });
      }
      const data = await scraperService.getAnimeDetail(slug);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ ok: true, data });
    } catch (error) {
      console.error('[Controller] getAnimeDetail error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || `Failed to fetch anime detail for: ${req.params.slug}`
      });
    }
  }

  // GET /api/episode/:slug
  async getEpisodeDetail(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid slug. Only alphanumeric, underscore, and hyphen allowed.' 
        });
      }
      const data = await scraperService.getEpisodeDetail(slug);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ ok: true, data });
    } catch (error) {
      console.error('[Controller] getEpisodeDetail error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || `Failed to fetch episode detail for: ${req.params.slug}`
      });
    }
  }

  // GET /api/batch/:slug
  async getBatchDetail(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid slug. Only alphanumeric, underscore, and hyphen allowed.' 
        });
      }
      const data = await scraperService.getBatchDetail(slug);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ ok: true, data });
    } catch (error) {
      console.error('[Controller] getBatchDetail error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || `Failed to fetch batch detail for: ${req.params.slug}`
      });
    }
  }

  // GET /api/complete-downloads/:slug
  async getCompleteDownloads(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid slug. Only alphanumeric, underscore, and hyphen allowed.' 
        });
      }
      const data = await scraperService.getCompleteDownloads(slug);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ ok: true, data });
    } catch (error) {
      console.error('[Controller] getCompleteDownloads error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || `Failed to fetch complete downloads for: ${req.params.slug}`
      });
    }
  }

  // ========================================
  // ADVANCED ENDPOINTS
  // ========================================

  // GET /api/ongoing-by-day/:day
  async getOngoingByDay(req, res) {
    try {
      const { day } = req.params;
      const validDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
      
      if (!day || !validDays.includes(day.toLowerCase())) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid day. Valid values: senin, selasa, rabu, kamis, jumat, sabtu, minggu' 
        });
      }
      
      const data = await scraperService.getOngoingByDay(day);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ 
        ok: true, 
        data,
        day: day.toLowerCase(),
        total: data.length || 0
      });
    } catch (error) {
      console.error('[Controller] getOngoingByDay error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || `Failed to fetch ongoing anime for day: ${req.params.day}`
      });
    }
  }

  // ========================================
  // EXTRA: FUZZY SEARCH (Optional)
  // ========================================

  // GET /api/fuzzy-search?q=keyword
  async fuzzySearch(req, res) {
    try {
      const { q } = req.query;
      if (!q || !validateSearchQuery(q)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid search query. Max length: 100 characters'
        });
      }
      const data = await scraperService.fuzzySearchIndex(q);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ 
        ok: true, 
        data,
        query: q,
        total: data.length || 0
      });
    } catch (error) {
      console.error('[Controller] fuzzySearch error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to perform fuzzy search'
      });
    }
  }

  // ========================================
  // EXTRA: SEARCH WITH FALLBACK
  // ========================================

  // GET /api/search-fallback?q=keyword
  async searchWithFallback(req, res) {
    try {
      const { q } = req.query;
      if (!q || !validateSearchQuery(q)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid search query. Max length: 100 characters'
        });
      }
      const data = await scraperService.searchWithFallback(q);
      if (data && data.error) {
        return res.status(500).json({ 
          ok: false, 
          error: data.message,
          code: data.code
        });
      }
      res.json({ 
        ok: true, 
        data,
        query: q,
        total: data.length || 0,
        method: data.length > 0 ? 'direct' : 'fuzzy'
      });
    } catch (error) {
      console.error('[Controller] searchWithFallback error:', error.message);
      res.status(500).json({ 
        ok: false, 
        error: error.message || 'Failed to search with fallback'
      });
    }
  }
}

module.exports = new AnimeController();