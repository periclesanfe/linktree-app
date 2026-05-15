const AUTH_COOKIE_NAME = 'meuhub_session';
const AUTH_COOKIE_MAX_AGE_MS = 5 * 60 * 60 * 1000;

const getAuthCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
});

const setAuthCookie = (res, token) => {
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
    const { maxAge, ...options } = getAuthCookieOptions();
    res.clearCookie(AUTH_COOKIE_NAME, options);
};

const getAuthTokenFromRequest = (req) => {
    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        const cookie = cookieHeader
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));

        if (cookie) {
            return decodeURIComponent(cookie.slice(AUTH_COOKIE_NAME.length + 1));
        }
    }

    return req.header('x-auth-token');
};

module.exports = {
    AUTH_COOKIE_NAME,
    setAuthCookie,
    clearAuthCookie,
    getAuthTokenFromRequest,
};
