const express = require('express');
const router = express.Router();
const animeController = require('../controllers/animeController');

// Anime routes
router.get('/latest', animeController.getLatestEpisodes);
router.get('/ongoing', animeController.getOngoingAnime);
router.get('/complete', animeController.getCompleteAnime);
router.get('/search', animeController.searchAnime);
router.get('/anime/detail', animeController.getAnimeDetail);
router.get('/episode/detail', animeController.getEpisodeDetail);
router.get('/genres', animeController.getGenres);
router.get('/genre/:genre', animeController.getAnimeByGenre);
router.get('/schedule', animeController.getSchedule);

// Export langsung
module.exports = router;
