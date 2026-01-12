const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    getLinkAnalytics,
    getUserAnalytics,
    recordProfileView
} = require('../controllers/analyticsController');

const router = Router();

// Analytics de um link específico
router.get('/links/:linkId', authMiddleware, getLinkAnalytics);

// Analytics gerais do usuário (todos os links)
router.get('/user', authMiddleware, getUserAnalytics);

// Registrar visualização de perfil (público)
router.post('/profile-view/:username', recordProfileView);

module.exports = router;