const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const logger = require('../utils/logger'); 

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, inviteCode } = req.body;

    try {
        // Validar código de convite
        if (!inviteCode) {
            return res.status(400).json({ msg: 'Código de convite é obrigatório' });
        }

        // Remove espacos e hifens para validacao flexivel
        const cleanCode = inviteCode.toUpperCase().replace(/[\s-]/g, '');

        // Verificar se o código existe e está válido
        const codeResult = await pool.query(
            `SELECT * FROM invite_codes
             WHERE replace(code, '-', '') = $1
             AND is_used = false
             AND (expires_at IS NULL OR expires_at > NOW())`,
            [cleanCode]
        );

        if (codeResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Código de convite inválido, já utilizado ou expirado' });
        }

        // Recuperar o código original com formatação correta do banco para marcar como usado
        const originalCode = codeResult.rows[0].code;

        // Verificar se usuário ou email já existe
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1 OR username = $2", [email, username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'Usuário ou e-mail já cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Criar usuário
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, password_hash]
        );

        // Marcar código de convite como usado
        await pool.query(
            `UPDATE invite_codes
             SET is_used = true,
                 used_by = $1,
                 used_at = NOW()
             WHERE code = $2`,
            [newUser.rows[0].id, originalCode]
        );

        logger.info('User registered successfully', {
            userId: newUser.rows[0].id,
            username: username,
            inviteCode: originalCode
        });

        res.status(201).json({ msg: 'Usuário registrado com sucesso!', user: newUser.rows[0] });

    } catch (err) {
        logger.error('Auth error - register', {
            endpoint: 'register',
            email: req.body.email,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Credenciais inválidas.' }); 
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciais inválidas.' });
        }

        const payload = {
            user: {
                id: user.id 
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token }); 
            }
        );

    } catch (err) {
        logger.error('Auth error - login', { 
            endpoint: 'login',
            email: req.body.email,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, email, display_name, bio, profile_image_url, background_image_url, accent_color FROM users WHERE id = $1", [req.user.id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }

        res.json(user.rows[0]);
    } catch (err) {
        logger.error('Auth error - getCurrentUser', {
            endpoint: 'getCurrentUser',
            userId: req.user.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};
