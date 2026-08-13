const scraperService = require('../services/scraperService');

class AnimeController {
  /**
   * @swagger
   * /api/anime/latest:
   *   get:
   *     summary: Get latest episodes
   *     tags: [Anime]
   *     responses:
   *       200:
   *         description: List of latest episodes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Response'
   */
  async getLatestEpisodes(req, res) {
    try {
      const episodes = await scraperService.getLatestEpisodes();
      res.json({
        success: true,
        data: episodes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/ongoing:
   *   get:
   *     summary: Get ongoing anime
   *     tags: [Anime]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *     responses:
   *       200:
   *         description: List of ongoing anime
   */
  async getOngoingAnime(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await scraperService.getOngoingAnime(page);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/complete:
   *   get:
   *     summary: Get complete anime
   *     tags: [Anime]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *     responses:
   *       200:
   *         description: List of complete anime
   */
  async getCompleteAnime(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await scraperService.getCompleteAnime(page);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/search:
   *   get:
   *     summary: Search anime
   *     tags: [Search]
   *     parameters:
   *       - in: query
   *         name: query
   *         required: true
   *         schema:
   *           type: string
   *         description: Search keyword
   *     responses:
   *       200:
   *         description: Search results
   */
  async searchAnime(req, res) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
      }
      const results = await scraperService.searchAnime(query);
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/anime/detail:
   *   get:
   *     summary: Get anime details
   *     tags: [Anime]
   *     parameters:
   *       - in: query
   *         name: url
   *         required: true
   *         schema:
   *           type: string
   *         description: Anime detail URL
   *     responses:
   *       200:
   *         description: Anime details
   */
  async getAnimeDetail(req, res) {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL parameter is required'
        });
      }
      const data = await scraperService.getAnimeDetail(url);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/episode/detail:
   *   get:
   *     summary: Get episode details
   *     tags: [Episodes]
   *     parameters:
   *       - in: query
   *         name: url
   *         required: true
   *         schema:
   *           type: string
   *         description: Episode URL
   *     responses:
   *       200:
   *         description: Episode details with streaming links
   */
  async getEpisodeDetail(req, res) {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL parameter is required'
        });
      }
      const data = await scraperService.getEpisodeDetail(url);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/genres:
   *   get:
   *     summary: Get all genres
   *     tags: [Genre]
   *     responses:
   *       200:
   *         description: List of genres
   */
  async getGenres(req, res) {
    try {
      const genres = await scraperService.getGenres();
      res.json({
        success: true,
        data: genres
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/genre/{genre}:
   *   get:
   *     summary: Get anime by genre
   *     tags: [Genre]
   *     parameters:
   *       - in: path
   *         name: genre
   *         required: true
   *         schema:
   *           type: string
   *         description: Genre name
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *     responses:
   *       200:
   *         description: Anime list by genre
   */
  async getAnimeByGenre(req, res) {
    try {
      const { genre } = req.params;
      const page = parseInt(req.query.page) || 1;
      const data = await scraperService.getAnimeByGenre(genre, page);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/anime/schedule:
   *   get:
   *     summary: Get release schedule
   *     tags: [Anime]
   *     responses:
   *       200:
   *         description: Weekly release schedule
   */
  async getSchedule(req, res) {
    try {
      const schedule = await scraperService.getSchedule();
      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AnimeController();
