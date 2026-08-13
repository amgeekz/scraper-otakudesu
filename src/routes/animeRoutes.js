const express = require('express');
const router = express.Router();
const controller = require('../controllers/animeController');

// Service & Health
router.get('/', controller.getServiceInfo.bind(controller));
router.get('/health', controller.healthCheck.bind(controller));

// Main endpoints
router.get('/api/latest', controller.getLatest.bind(controller));
router.get('/api/search', controller.search.bind(controller));
router.get('/api/ongoing', controller.getOngoing.bind(controller));
router.get('/api/completed', controller.getCompleted.bind(controller));
router.get('/api/anime-list', controller.getAnimeList.bind(controller));
router.get('/api/genres', controller.getGenres.bind(controller));
router.get('/api/schedule', controller.getSchedule.bind(controller));

// Detail endpoints with slug
router.get('/api/anime/:slug', controller.getAnimeDetail.bind(controller));
router.get('/api/episode/:slug', controller.getEpisodeDetail.bind(controller));
router.get('/api/batch/:slug', controller.getBatchDetail.bind(controller));
router.get('/api/complete-downloads/:slug', controller.getCompleteDownloads.bind(controller));

module.exports = router;
