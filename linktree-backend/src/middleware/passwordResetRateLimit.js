const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

module.exports = function passwordResetRateLimit(req, res, next) {
    const key = `${req.ip || req.connection.remoteAddress || 'unknown'}:${normalizeEmail(req.body?.email)}`;
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
        attempts.set(key, {
            count: 1,
            resetAt: now + WINDOW_MS,
        });
        return next();
    }

    if (current.count >= MAX_ATTEMPTS) {
        return res.status(429).json({
            msg: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
        });
    }

    current.count += 1;
    attempts.set(key, current);
    return next();
};
