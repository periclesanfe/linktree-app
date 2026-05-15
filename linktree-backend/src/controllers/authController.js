const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db/pool');
const logger = require('../utils/logger'); 
const { clearAuthCookie, getAuthSessionTokenFromRequest, setAuthCookie } = require('../config/authCookie');
const { sendPasswordResetCode } = require('../services/emailService');
const {
    createUserSession,
    revokeSessionByToken,
    revokeUserSessions,
} = require('../services/sessionService');

const RESET_CODE_EXPIRES_MINUTES = 15;
const RESET_TOKEN_EXPIRES_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const FORGOT_PASSWORD_RESPONSE = {
    msg: 'Se o e-mail estiver cadastrado, enviaremos um codigo de recuperacao.',
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const generateResetCode = () => String(crypto.randomInt(100000, 1000000));
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const findValidResetByToken = async (resetToken) => {
    const candidates = await pool.query(
        `SELECT id, user_id, reset_token_hash
         FROM password_reset_codes
         WHERE used_at IS NULL
           AND reset_token_hash IS NOT NULL
           AND reset_token_expires_at > NOW()
         ORDER BY reset_token_expires_at DESC
         LIMIT 50`
    );

    for (const candidate of candidates.rows) {
        const matches = await bcrypt.compare(resetToken, candidate.reset_token_hash);
        if (matches) {
            return candidate;
        }
    }

    return null;
};

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, inviteCode } = req.body;
    const usernameLower = username.toLowerCase(); // Forçar lowercase

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
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1 OR username = $2", [email, usernameLower]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'Usuário ou e-mail já cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Criar usuário
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
            [usernameLower, email, password_hash]
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
            username: usernameLower,
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

        const session = await createUserSession(user.id, req);
        setAuthCookie(res, session.token);
        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                display_name: user.display_name,
                bio: user.bio,
                profile_image_url: user.profile_image_url,
                background_image_url: user.background_image_url,
                accent_color: user.accent_color,
            },
        });

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

exports.logoutUser = async (req, res) => {
    try {
        const sessionToken = getAuthSessionTokenFromRequest(req);
        await revokeSessionByToken(sessionToken);
    } catch (err) {
        logger.warn('Auth warning - logout session revoke failed', {
            endpoint: 'logout',
            error: err.message,
        });
    } finally {
        clearAuthCookie(res);
    }

    res.json({ msg: 'Logout realizado com sucesso.' });
};

exports.forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const email = normalizeEmail(req.body.email);

    try {
        const userResult = await pool.query(
            `SELECT id, username, email
             FROM users
             WHERE lower(email) = $1
               AND is_active = TRUE`,
            [email]
        );

        if (userResult.rows.length === 0) {
            logger.info('Password reset requested for unknown email', { email });
            return res.json(FORGOT_PASSWORD_RESPONSE);
        }

        const user = userResult.rows[0];
        const code = generateResetCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRES_MINUTES * 60 * 1000);

        await pool.query(
            `UPDATE password_reset_codes
             SET used_at = NOW()
             WHERE user_id = $1
               AND used_at IS NULL`,
            [user.id]
        );

        await pool.query(
            `INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [user.id, email, codeHash, expiresAt]
        );

        try {
            await sendPasswordResetCode({
                to: user.email,
                code,
                username: user.username,
            });
        } catch (emailError) {
            logger.error('Failed to send password reset email', {
                email,
                error: emailError.message,
                stack: emailError.stack,
            });
        }

        return res.json(FORGOT_PASSWORD_RESPONSE);
    } catch (err) {
        logger.error('Auth error - forgotPassword', {
            endpoint: 'forgotPassword',
            email,
            error: err.message,
            stack: err.stack,
        });
        return res.status(500).send('Erro no servidor');
    }
};

exports.verifyResetCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    try {
        const resetResult = await pool.query(
            `SELECT id, code_hash, attempts
             FROM password_reset_codes
             WHERE lower(email) = $1
               AND used_at IS NULL
               AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [email]
        );

        if (resetResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Codigo invalido ou expirado.' });
        }

        const reset = resetResult.rows[0];

        if (Number(reset.attempts) >= MAX_CODE_ATTEMPTS) {
            return res.status(400).json({ msg: 'Codigo invalido ou expirado.' });
        }

        const isMatch = await bcrypt.compare(code, reset.code_hash);
        if (!isMatch) {
            await pool.query(
                `UPDATE password_reset_codes
                 SET attempts = attempts + 1
                 WHERE id = $1`,
                [reset.id]
            );
            return res.status(400).json({ msg: 'Codigo invalido ou expirado.' });
        }

        const resetToken = generateResetToken();
        const resetTokenHash = await bcrypt.hash(resetToken, 10);
        const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

        await pool.query(
            `UPDATE password_reset_codes
             SET reset_token_hash = $1,
                 reset_token_expires_at = $2
             WHERE id = $3`,
            [resetTokenHash, resetTokenExpiresAt, reset.id]
        );

        return res.json({
            msg: 'Codigo validado com sucesso.',
            resetToken,
        });
    } catch (err) {
        logger.error('Auth error - verifyResetCode', {
            endpoint: 'verifyResetCode',
            email,
            error: err.message,
            stack: err.stack,
        });
        return res.status(500).send('Erro no servidor');
    }
};

exports.resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { resetToken, password } = req.body;

    try {
        const reset = await findValidResetByToken(resetToken);
        if (!reset) {
            return res.status(400).json({ msg: 'Token de recuperacao invalido ou expirado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query(
                `UPDATE users
                 SET password_hash = $1
                 WHERE id = $2`,
                [passwordHash, reset.user_id]
            );
            await client.query(
                `UPDATE password_reset_codes
                 SET used_at = NOW()
                 WHERE user_id = $1
                   AND used_at IS NULL`,
                [reset.user_id]
            );
            await revokeUserSessions(reset.user_id, {}, client);
            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        clearAuthCookie(res);
        return res.json({ msg: 'Senha redefinida com sucesso.' });
    } catch (err) {
        logger.error('Auth error - resetPassword', {
            endpoint: 'resetPassword',
            error: err.message,
            stack: err.stack,
        });
        return res.status(500).send('Erro no servidor');
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
