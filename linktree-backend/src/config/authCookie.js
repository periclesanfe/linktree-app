const AUTH_COOKIE_MAX_AGE_MS = 5 * 60 * 60 * 1000;
const LEGACY_AUTH_COOKIE_NAME = 'meuhub_session';
const AUTH_COOKIE_NAME = process.env.NODE_ENV === 'production'
    ? '__Host-meuhub_session'
    : LEGACY_AUTH_COOKIE_NAME;

const getAuthCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
});

const setAuthCookie = (res, token) => {
    clearLegacyAuthCookie(res);
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
    const { maxAge, ...options } = getAuthCookieOptions();
    res.clearCookie(AUTH_COOKIE_NAME, options);
    if (AUTH_COOKIE_NAME !== LEGACY_AUTH_COOKIE_NAME) {
        res.clearCookie(LEGACY_AUTH_COOKIE_NAME, options);
    }
};

const getCookieValue = (req, name) => {
    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        const cookie = cookieHeader
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${name}=`));

        if (cookie) {
            return decodeURIComponent(cookie.slice(name.length + 1));
        }
    }

    return null;
};

const getAuthSessionTokenFromRequest = (req) => {
    return getCookieValue(req, AUTH_COOKIE_NAME)
        || getCookieValue(req, LEGACY_AUTH_COOKIE_NAME);
};

function clearLegacyAuthCookie(res) {
    if (AUTH_COOKIE_NAME === LEGACY_AUTH_COOKIE_NAME) {
        return;
    }

    const { maxAge, ...options } = getAuthCookieOptions();
    res.clearCookie(LEGACY_AUTH_COOKIE_NAME, options);
}

const isLegacyJwtLikeToken = (token) => {
    return typeof token === 'string' && token.split('.').length === 3;
};

module.exports = {
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_MAX_AGE_MS,
    LEGACY_AUTH_COOKIE_NAME,
    setAuthCookie,
    clearAuthCookie,
    getAuthSessionTokenFromRequest,
    isLegacyJwtLikeToken,
};
