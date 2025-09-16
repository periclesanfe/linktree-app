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
    body('username', 'O nome de usuário é obrigatório').not().isEmpty(),
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