const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createTracker, getTrackers, deleteTracker } = require('../controllers/trackerController');

const router = Router();

// Rotas aninhadas (precisam ser montadas corretamente no index)
// GET /api/links/:linkId/trackers
// POST /api/links/:linkId/trackers
// Mas o Express Router não herda params por padrão se montado separadamente.
// Vou definir as rotas completas aqui e montar em /api

router.post('/links/:linkId/trackers', authMiddleware, createTracker);
router.get('/links/:linkId/trackers', authMiddleware, getTrackers);
router.delete('/trackers/:trackerId', authMiddleware, deleteTracker);

module.exports = router;
