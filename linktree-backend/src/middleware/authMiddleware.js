const { clearAuthCookie, getAuthSessionTokenFromRequest } = require('../config/authCookie');
const { getValidSessionByToken } = require('../services/sessionService');

module.exports = async function(req, res, next) {
    const token = getAuthSessionTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({ msg: 'Nenhuma sessao, autorizacao negada.' });
    }

    try {
        const session = await getValidSessionByToken(token);
        if (!session) {
            clearAuthCookie(res);
            return res.status(401).json({ msg: 'Sessao invalida ou expirada.' });
        }

        req.user = { id: session.user_id };
        req.authSession = { id: session.id };

        next();
    } catch (err) {
        res.status(500).json({ msg: 'Erro ao validar sessao.' });
    }
};
