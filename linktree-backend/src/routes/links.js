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
    uploadLinkCoverImage,
    reorderLinks
} = require('../controllers/linksController');

const router = Router();
router.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Validacao customizada: URL obrigatoria apenas para tipo 'website'
const urlValidation = body('url').custom((value, { req }) => {
    const linkType = req.body.link_type || 'website';
    
    // Para website, URL é obrigatória e deve ser válida
    if (linkType === 'website') {
        if (!value) {
            throw new Error('URL é obrigatória para links do tipo website');
        }
        // Validar formato de URL
        try {
            new URL(value);
        } catch {
            throw new Error('Por favor, inclua uma URL válida');
        }
    }
    
    return true;
});

// Validacao de link_type
const linkTypeValidation = body('link_type')
    .optional()
    .isIn(['website', 'whatsapp', 'instagram', 'email', 'phone', 'youtube', 'tiktok'])
    .withMessage('Tipo de link inválido');

// Validacao de metadata
const metadataValidation = body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata deve ser um objeto');

router.post(
    '/',
    [
        authMiddleware,
        [
            body('title', 'O título é obrigatório').not().isEmpty(),
            urlValidation,
            linkTypeValidation,
            metadataValidation
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

router.put('/reorder', authMiddleware, reorderLinks);

module.exports = router;