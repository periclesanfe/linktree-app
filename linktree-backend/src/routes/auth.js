const { Router } = require('express');
const { body } = require('express-validator');
const {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    getCurrentUser,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const passwordResetRateLimit = require('../middleware/passwordResetRateLimit');
const express = require('express');

const router = Router();
router.use(express.json()); 

router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', logoutUser);

router.post(
    '/register',
    body('email', 'Por favor, inclua um e-mail válido').isEmail(),
    body('username')
        .not().isEmpty().withMessage('O nome de usuário é obrigatório')
        .matches(/^[a-zA-Z0-9._-]+$/).withMessage('O usuário só pode conter letras, números, ponto, traço e sublinhado.')
        .isLength({ max: 30 }).withMessage('O usuário deve ter no máximo 30 caracteres'),
    body('password', 'A senha deve ter 6 ou mais caracteres').isLength({ min: 6 }),
    registerUser
);

router.post(
    '/login',
    body('email', 'Por favor, inclua um e-mail válido').isEmail(),
    body('password', 'A senha é obrigatória').exists(),
    loginUser
);

router.post(
    '/forgot-password',
    passwordResetRateLimit,
    body('email', 'Por favor, inclua um e-mail válido').isEmail(),
    forgotPassword
);

router.post(
    '/verify-reset-code',
    passwordResetRateLimit,
    body('email', 'Por favor, inclua um e-mail válido').isEmail(),
    body('code', 'Informe o codigo de 6 digitos').isLength({ min: 6, max: 6 }).isNumeric(),
    verifyResetCode
);

router.post(
    '/reset-password',
    passwordResetRateLimit,
    body('resetToken', 'Token de recuperacao obrigatorio').isString().isLength({ min: 32 }),
    body('password', 'A senha deve ter 6 ou mais caracteres').isLength({ min: 6 }),
    resetPassword
);

module.exports = router;
