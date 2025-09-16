const { Router } = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { createLink, getLinks, updateLink, deleteLink } = require('../controllers/linksController');
const express = require('express');

const router = Router();
router.use(express.json());

router.post(
    '/',
    [
        authMiddleware,
        [
            body('title', 'O título é obrigatório').not().isEmpty(),
            body('url', 'Por favor, inclua uma URL válida').isURL()
        ]
    ],
    createLink
);

router.get('/', authMiddleware, getLinks);

router.put('/:id', authMiddleware, updateLink);

router.delete('/:id', authMiddleware, deleteLink);

module.exports = router;