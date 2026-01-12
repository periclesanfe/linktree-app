const pool = require('../db/pool');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Função auxiliar para obter IP do visitante
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
}

// Função auxiliar para hash do IP (privacidade)
function hashIp(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
}

// Função para detectar tipo de dispositivo
function detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
}

// Função para detectar navegador
function detectBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('SamsungBrowser') > -1) return 'Samsung Internet';
    if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'Opera';
    if (userAgent.indexOf('Trident') > -1) return 'Internet Explorer';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    return 'unknown';
}

// Função para detectar sistema operacional
function detectOS(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.indexOf('Win') > -1) return 'Windows';
    if (userAgent.indexOf('Mac') > -1) return 'MacOS';
    if (userAgent.indexOf('Linux') > -1) return 'Linux';
    if (userAgent.indexOf('Android') > -1) return 'Android';
    if (userAgent.indexOf('like Mac') > -1) return 'iOS';
    return 'unknown';
}

exports.recordClickAndRedirect = async (req, res) => {
    const { linkId } = req.params;

    try {
        const linkResult = await pool.query("SELECT url FROM links WHERE id = $1", [linkId]);

        if (linkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado.' });
        }

        const originalUrl = linkResult.rows[0].url;

        // Captura informações do visitante
        const clientIp = getClientIp(req);
        const ipHash = hashIp(clientIp);
        const userAgent = req.headers['user-agent'] || '';
        const referrer = req.headers['referer'] || req.headers['referrer'] || '';
        const deviceType = detectDeviceType(userAgent);
        const browser = detectBrowser(userAgent);
        const os = detectOS(userAgent);

        // Registra o clique com informações avançadas
        pool.query(
            `INSERT INTO analytics_clicks
             (link_id, ip_hash, ip_address, user_agent, referrer, device_type, browser, os)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [linkId, ipHash, clientIp, userAgent, referrer, deviceType, browser, os]
        ).catch(err => logger.error('Failed to register click', {
            linkId,
            error: err.message
        }));

        res.redirect(301, originalUrl);

    } catch (err) {
        logger.error('Analytics error - recordClick', {
            endpoint: 'recordClickAndRedirect',
            linkId: req.params.linkId,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};


exports.getLinkAnalytics = async (req, res) => {
    const { linkId } = req.params;
    const userId = req.user.id;
    const { days = 30 } = req.query;

    try {
        const linkOwnerResult = await pool.query("SELECT id, title FROM links WHERE id = $1 AND user_id = $2", [linkId, userId]);
        if (linkOwnerResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado ou você não tem permissão.' });
        }

        const linkTitle = linkOwnerResult.rows[0].title;

        // Total de cliques
        const clickCountResult = await pool.query("SELECT COUNT(*) FROM analytics_clicks WHERE link_id = $1", [linkId]);
        const totalClicks = parseInt(clickCountResult.rows[0].count, 10);

        // Cliques por dia nos últimos X dias
        const clicksByDayResult = await pool.query(
            `SELECT
                DATE(clicked_at) as date,
                COUNT(*) as clicks
            FROM analytics_clicks
            WHERE link_id = $1
                AND clicked_at >= NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(clicked_at)
            ORDER BY date ASC`,
            [linkId]
        );

        // Cliques hoje
        const clicksTodayResult = await pool.query(
            `SELECT COUNT(*) FROM analytics_clicks
            WHERE link_id = $1 AND DATE(clicked_at) = CURRENT_DATE`,
            [linkId]
        );
        const clicksToday = parseInt(clicksTodayResult.rows[0].count, 10);

        // Cliques esta semana
        const clicksThisWeekResult = await pool.query(
            `SELECT COUNT(*) FROM analytics_clicks
            WHERE link_id = $1 AND clicked_at >= DATE_TRUNC('week', NOW())`,
            [linkId]
        );
        const clicksThisWeek = parseInt(clicksThisWeekResult.rows[0].count, 10);

        // Cliques este mês
        const clicksThisMonthResult = await pool.query(
            `SELECT COUNT(*) FROM analytics_clicks
            WHERE link_id = $1 AND clicked_at >= DATE_TRUNC('month', NOW())`,
            [linkId]
        );
        const clicksThisMonth = parseInt(clicksThisMonthResult.rows[0].count, 10);

        // Analytics avançadas - Por tipo de dispositivo
        const deviceStatsResult = await pool.query(
            `SELECT device_type, COUNT(*) as count
            FROM analytics_clicks
            WHERE link_id = $1 AND device_type IS NOT NULL
            GROUP BY device_type
            ORDER BY count DESC`,
            [linkId]
        );

        // Analytics avançadas - Por navegador
        const browserStatsResult = await pool.query(
            `SELECT browser, COUNT(*) as count
            FROM analytics_clicks
            WHERE link_id = $1 AND browser IS NOT NULL
            GROUP BY browser
            ORDER BY count DESC`,
            [linkId]
        );

        // Analytics avançadas - Por sistema operacional
        const osStatsResult = await pool.query(
            `SELECT os, COUNT(*) as count
            FROM analytics_clicks
            WHERE link_id = $1 AND os IS NOT NULL
            GROUP BY os
            ORDER BY count DESC`,
            [linkId]
        );

        // Analytics avançadas - Por referrer (top 10)
        const referrerStatsResult = await pool.query(
            `SELECT referrer, COUNT(*) as count
            FROM analytics_clicks
            WHERE link_id = $1 AND referrer IS NOT NULL AND referrer != ''
            GROUP BY referrer
            ORDER BY count DESC
            LIMIT 10`,
            [linkId]
        );

        res.json({
            linkId,
            linkTitle,
            totalClicks,
            clicksToday,
            clicksThisWeek,
            clicksThisMonth,
            clicksByDay: clicksByDayResult.rows,
            deviceStats: deviceStatsResult.rows,
            browserStats: browserStatsResult.rows,
            osStats: osStatsResult.rows,
            referrerStats: referrerStatsResult.rows,
            period: `${days} days`
        });

    } catch (err) {
        logger.error('Analytics error - getLinkAnalytics', {
            endpoint: 'getLinkAnalytics',
            userId: req.user.id,
            linkId: req.params.linkId,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};

// Nova função para analytics gerais do usuário
exports.getUserAnalytics = async (req, res) => {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    try {
        // Total de visualizações de perfil
        const profileViewsResult = await pool.query(
            `SELECT COUNT(*) FROM profile_views WHERE user_id = $1`,
            [userId]
        );
        const totalProfileViews = parseInt(profileViewsResult.rows[0].count, 10);

        // Total de cliques em todos os links
        const totalClicksResult = await pool.query(
            `SELECT COUNT(*) FROM analytics_clicks ac
            INNER JOIN links l ON ac.link_id = l.id
            WHERE l.user_id = $1`,
            [userId]
        );
        const totalClicks = parseInt(totalClicksResult.rows[0].count, 10);

        // Visualizações de perfil por dia
        const viewsByDayResult = await pool.query(
            `SELECT
                DATE(viewed_at) as date,
                COUNT(*) as views
            FROM profile_views
            WHERE user_id = $1
                AND viewed_at >= NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(viewed_at)
            ORDER BY date ASC`,
            [userId]
        );

        // Cliques por dia (todos os links)
        const clicksByDayResult = await pool.query(
            `SELECT
                DATE(ac.clicked_at) as date,
                COUNT(*) as clicks
            FROM analytics_clicks ac
            INNER JOIN links l ON ac.link_id = l.id
            WHERE l.user_id = $1
                AND ac.clicked_at >= NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(ac.clicked_at)
            ORDER BY date ASC`,
            [userId]
        );

        // Top 5 links mais clicados
        const topLinksResult = await pool.query(
            `SELECT
                l.id,
                l.title,
                l.url,
                COUNT(ac.id) as clicks
            FROM links l
            LEFT JOIN analytics_clicks ac ON l.id = ac.link_id
            WHERE l.user_id = $1
            GROUP BY l.id, l.title, l.url
            ORDER BY clicks DESC
            LIMIT 5`,
            [userId]
        );

        // Estatísticas de dispositivos (todos os links)
        const deviceStatsResult = await pool.query(
            `SELECT ac.device_type, COUNT(*) as count
            FROM analytics_clicks ac
            INNER JOIN links l ON ac.link_id = l.id
            WHERE l.user_id = $1 AND ac.device_type IS NOT NULL
            GROUP BY ac.device_type
            ORDER BY count DESC`,
            [userId]
        );

        // Estatísticas de navegadores (todos os links)
        const browserStatsResult = await pool.query(
            `SELECT ac.browser, COUNT(*) as count
            FROM analytics_clicks ac
            INNER JOIN links l ON ac.link_id = l.id
            WHERE l.user_id = $1 AND ac.browser IS NOT NULL
            GROUP BY ac.browser
            ORDER BY count DESC`,
            [userId]
        );

        res.json({
            totalProfileViews,
            totalClicks,
            viewsByDay: viewsByDayResult.rows,
            clicksByDay: clicksByDayResult.rows,
            topLinks: topLinksResult.rows,
            deviceStats: deviceStatsResult.rows,
            browserStats: browserStatsResult.rows,
            period: `${days} days`
        });

    } catch (err) {
        logger.error('Analytics error - getUserAnalytics', {
            endpoint: 'getUserAnalytics',
            userId: req.user.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};

// Nova função para registrar visualização de perfil
exports.recordProfileView = async (req, res) => {
    const { username } = req.params;

    try {
        // Buscar ID do usuário pelo username
        const userResult = await pool.query(
            "SELECT id FROM users WHERE username = $1",
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }

        const userId = userResult.rows[0].id;

        // Capturar informações do visitante
        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] || '';
        const referrer = req.headers['referer'] || req.headers['referrer'] || '';
        const deviceType = detectDeviceType(userAgent);
        const browser = detectBrowser(userAgent);
        const os = detectOS(userAgent);

        // Registrar visualização
        await pool.query(
            `INSERT INTO profile_views
             (user_id, ip_address, user_agent, referrer, device_type, browser, os)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, clientIp, userAgent, referrer, deviceType, browser, os]
        );

        res.status(200).json({ msg: 'Visualização registrada' });

    } catch (err) {
        logger.error('Analytics error - recordProfileView', {
            endpoint: 'recordProfileView',
            username: req.params.username,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};