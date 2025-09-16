const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getLinkAnalytics } = require('../controllers/analyticsController');

const router = Router();

router.get('/:linkId', authMiddleware, getLinkAnalytics);

module.exports = router;