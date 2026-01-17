const { Router } = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { getMe, updateMe, deleteMe, uploadProfilePicture, uploadBackgroundImage, updateAccentColor, updatePassword, getVersion } = require('../controllers/userController');

const router = Router();

// Configuração do multer com limites para mobile
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max (fotos de celular podem ser grandes)
    },
    fileFilter: (req, file, cb) => {
        // Aceita formatos comuns de imagem (incluindo HEIC do iPhone)
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
            cb(new Error(`Formato não suportado: ${file.mimetype}. Use JPG, PNG, GIF, WebP ou HEIC.`), false);
        }
    }
});

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.delete('/me', authMiddleware, deleteMe);

// Middleware para tratar erros do multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'Arquivo muito grande. Máximo 10MB.' });
        }
        return res.status(400).json({ msg: `Erro no upload: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ msg: err.message });
    }
    next();
};

router.post(
    '/me/profile-picture',
    authMiddleware,
    upload.single('profilePicture'),
    handleMulterError,
    uploadProfilePicture
);
router.post(
    '/me/background-image',
    authMiddleware,
    upload.single('backgroundImage'),
    handleMulterError,
    uploadBackgroundImage
);
router.put('/me/accent-color', authMiddleware, updateAccentColor);
router.put('/me/password', authMiddleware, updatePassword);
router.get('/version', getVersion);

module.exports = router;