const { Router } = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { getMe, updateMe, deleteMe, uploadProfilePicture, uploadBackgroundImage } = require('../controllers/userController');

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.delete('/me', authMiddleware, deleteMe);
router.post(
    '/me/profile-picture',
    authMiddleware,
    upload.single('profilePicture'),
    uploadProfilePicture
);
router.post(
    '/me/background-image',
    authMiddleware,
    upload.single('backgroundImage'),
    uploadBackgroundImage
);

module.exports = router;