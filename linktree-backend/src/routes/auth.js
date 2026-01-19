const { Router } = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');

const router = Router();
router.use(express.json()); 

router.get('/me', authMiddleware, getCurrentUser);

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

module.exports = router;