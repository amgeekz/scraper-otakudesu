const scraperService = require('../services/scraperService');

class AnimeController {
  async getLatestEpisodes(req, res) {
    try {
      const episodes = await scraperService.getLatestEpisodes();
      res.json({
        success: true,
        data: episodes
      });
    } catch (error) {
      console.error('Error in getLatestEpisodes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch latest episodes'
      });
    }
  }

  async getOngoingAnime(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await scraperService.getOngoingAnime(page);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error in getOngoingAnime:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch ongoing anime'
      });
    }
  }

  async getCompleteAnime(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await scraperService.getCompleteAnime(page);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error in getCompleteAnime:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch complete anime'
      });
    }
  }

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
      console.error('Error in searchAnime:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search anime'
      });
    }
  }

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
      console.error('Error in getAnimeDetail:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch anime details'
      });
    }
  }

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
      console.error('Error in getEpisodeDetail:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch episode details'
      });
    }
  }

  async getGenres(req, res) {
    try {
      const genres = await scraperService.getGenres();
      res.json({
        success: true,
        data: genres
      });
    } catch (error) {
      console.error('Error in getGenres:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch genres'
      });
    }
  }

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
      console.error('Error in getAnimeByGenre:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch anime by genre'
      });
    }
  }

  async getSchedule(req, res) {
    try {
      const schedule = await scraperService.getSchedule();
      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Error in getSchedule:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch schedule'
      });
    }
  }
}

module.exports = new AnimeController();
