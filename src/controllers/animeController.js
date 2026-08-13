const scraperService = require('../services/scraperService');
const { validateSlug, validatePage, validateSearchQuery } = require('../utils/validator');

class AnimeController {
  // GET /
  async getServiceInfo(req, res) {
    res.json({
      ok: true,
      data: {
        name: 'Otakudesu REST API',
        description: 'Scraping API for Otakudesu.blog',
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
          '/api/complete-downloads/:slug'
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
        timestamp: new Date().toISOString()
      }
    });
  }

  // GET /api/latest
  async getLatest(req, res) {
    try {
      const data = await scraperService.getLatest();
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
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
      res.json({ ok: true, data, query: q });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/ongoing
  async getOngoing(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      if (!validatePage(page)) {
        return res.status(400).json({ ok: false, error: 'Invalid page number' });
      }
      const { data, page: currentPage } = await scraperService.getOngoing(page);
      res.json({ ok: true, data, page: currentPage });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/completed
  async getCompleted(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      if (!validatePage(page)) {
        return res.status(400).json({ ok: false, error: 'Invalid page number' });
      }
      const { data, page: currentPage } = await scraperService.getCompleted(page);
      res.json({ ok: true, data, page: currentPage });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/anime-list
  async getAnimeList(req, res) {
    try {
      const data = await scraperService.getAnimeList();
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/genres
  async getGenres(req, res) {
    try {
      const data = await scraperService.getGenres();
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/schedule
  async getSchedule(req, res) {
    try {
      const data = await scraperService.getSchedule();
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/anime/:slug
  async getAnimeDetail(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ ok: false, error: 'Invalid slug' });
      }
      const data = await scraperService.getAnimeDetail(slug);
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/episode/:slug
  async getEpisodeDetail(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ ok: false, error: 'Invalid slug' });
      }
      const data = await scraperService.getEpisodeDetail(slug);
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/batch/:slug
  async getBatchDetail(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ ok: false, error: 'Invalid slug' });
      }
      const data = await scraperService.getBatchDetail(slug);
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/complete-downloads/:slug
  async getCompleteDownloads(req, res) {
    try {
      const { slug } = req.params;
      if (!validateSlug(slug)) {
        return res.status(400).json({ ok: false, error: 'Invalid slug' });
      }
      const data = await scraperService.getCompleteDownloads(slug);
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
}

module.exports = new AnimeController();
