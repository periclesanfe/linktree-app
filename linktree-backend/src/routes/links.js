const { Router } = require('express');
const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { 
    createLink, 
    getLinks, 
    updateLink, 
    deleteLink,
    uploadLinkCoverImage
} = require('../controllers/linksController');

const router = Router();
router.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

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

router.post(
    '/:linkId/cover-image',
    authMiddleware,
    upload.single('coverImage'),
    uploadLinkCoverImage
);

module.exports = router;