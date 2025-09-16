const { Router } = require('express');
const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { createSocialIcon, getSocialIcons, updateSocialIcon, deleteSocialIcon } = require('../controllers/socialIconsController');

const router = Router();
router.use(express.json());

router.post(
    '/',
    [
        authMiddleware,
        [
            body('platform', 'A plataforma é obrigatória').not().isEmpty(),
            body('url', 'Por favor, inclua uma URL válida').isURL()
        ]
    ],
    createSocialIcon
);

router.get('/', authMiddleware, getSocialIcons);

router.put(
    '/:id', 
    [
        authMiddleware,
        [
             body('url', 'Por favor, inclua uma URL válida').isURL()
        ]
    ],
    updateSocialIcon
);

router.delete('/:id', authMiddleware, deleteSocialIcon);

module.exports = router;