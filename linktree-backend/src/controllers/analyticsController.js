const pool = require('../db/pool');
const logger = require('../utils/logger');


exports.recordClickAndRedirect = async (req, res) => {
    const { linkId } = req.params;

    try {
        const linkResult = await pool.query("SELECT url FROM links WHERE id = $1", [linkId]);

        if (linkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado.' });
        }

        const originalUrl = linkResult.rows[0].url;


        pool.query(
            "INSERT INTO analytics_clicks (link_id) VALUES ($1)",
            [linkId]
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
    const { days = 30 } = req.query; // Padrão: últimos 30 dias

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

        res.json({
            linkId,
            linkTitle,
            totalClicks,
            clicksToday,
            clicksThisWeek,
            clicksThisMonth,
            clicksByDay: clicksByDayResult.rows,
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