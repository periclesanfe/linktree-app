const pool = require('../db/pool');


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
        ).catch(err => console.error("Falha ao registrar clique:", err.message)); // Apenas logamos o erro no servidor

        res.redirect(301, originalUrl);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};


exports.getLinkAnalytics = async (req, res) => {
    const { linkId } = req.params;
    const userId = req.user.id;

    try {
        const linkOwnerResult = await pool.query("SELECT id FROM links WHERE id = $1 AND user_id = $2", [linkId, userId]);
        if (linkOwnerResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado ou você não tem permissão.' });
        }
        
        const clickCountResult = await pool.query("SELECT COUNT(*) FROM analytics_clicks WHERE link_id = $1", [linkId]);
        const count = parseInt(clickCountResult.rows[0].count, 10);

        res.json({ linkId, click_count: count });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};