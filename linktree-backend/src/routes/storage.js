const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getStorageStats } = require('../services/imageService');
const logger = require('../utils/logger');

/**
 * GET /api/storage/stats
 * Get storage usage statistics (protected route)
 */
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const stats = await getStorageStats();
        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        logger.error('Error getting storage stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get storage statistics',
        });
    }
});

module.exports = router;
