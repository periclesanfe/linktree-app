const crypto = require('crypto');
const pool = require('../db/pool');
const { AUTH_COOKIE_MAX_AGE_MS, isLegacyJwtLikeToken } = require('../config/authCookie');

const SESSION_TOKEN_BYTES = 32;

const hashSessionToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const generateSessionToken = () => {
    return crypto.randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
};

const getClientIp = (req) => {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) {
        return String(cfIp);
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return String(forwardedFor).split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || null;
};

const createUserSession = async (userId, req, executor = pool) => {
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + AUTH_COOKIE_MAX_AGE_MS);

    const result = await executor.query(
        `INSERT INTO user_sessions (user_id, token_hash, user_agent, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, expires_at`,
        [
            userId,
            tokenHash,
            req.get('user-agent') || null,
            getClientIp(req),
            expiresAt,
        ]
    );

    return {
        token,
        id: result.rows[0].id,
        expiresAt: result.rows[0].expires_at,
    };
};

const getValidSessionByToken = async (token) => {
    if (!token || isLegacyJwtLikeToken(token)) {
        return null;
    }

    const tokenHash = hashSessionToken(token);
    const result = await pool.query(
        `SELECT s.id, s.user_id
         FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1
           AND s.revoked_at IS NULL
           AND s.expires_at > NOW()
           AND u.is_active = TRUE
         LIMIT 1`,
        [tokenHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const session = result.rows[0];
    await pool.query(
        `UPDATE user_sessions
         SET last_seen_at = NOW()
         WHERE id = $1`,
        [session.id]
    );

    return session;
};

const revokeSessionByToken = async (token, executor = pool) => {
    if (!token || isLegacyJwtLikeToken(token)) {
        return;
    }

    await executor.query(
        `UPDATE user_sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE token_hash = $1
           AND revoked_at IS NULL`,
        [hashSessionToken(token)]
    );
};

const revokeUserSessions = async (userId, options = {}, executor = pool) => {
    const { exceptSessionId } = options;

    if (exceptSessionId) {
        await executor.query(
            `UPDATE user_sessions
             SET revoked_at = COALESCE(revoked_at, NOW())
             WHERE user_id = $1
               AND id <> $2
               AND revoked_at IS NULL`,
            [userId, exceptSessionId]
        );
        return;
    }

    await executor.query(
        `UPDATE user_sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE user_id = $1
           AND revoked_at IS NULL`,
        [userId]
    );
};

module.exports = {
    createUserSession,
    getValidSessionByToken,
    revokeSessionByToken,
    revokeUserSessions,
};
