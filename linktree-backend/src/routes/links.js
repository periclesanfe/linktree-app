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

// Configuracao do multer com limites para mobile
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'image/heic',
            'image/heif',
        ];
        
        if (allowedMimes.includes(file.mimetype.toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error(`Formato nao suportado: ${file.mimetype}. Use JPG, PNG, GIF, WebP ou HEIC.`), false);
        }
    }
});

// Middleware para tratar erros do multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'Arquivo muito grande. Maximo 20MB.' });
        }
        return res.status(400).json({ msg: `Erro no upload: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ msg: err.message });
    }
    next();
};

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
    handleMulterError,
    uploadLinkCoverImage
);

router.put('/reorder', authMiddleware, reorderLinks);

module.exports = router;