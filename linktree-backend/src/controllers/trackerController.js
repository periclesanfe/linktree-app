const pool = require('../db/pool');
const logger = require('../utils/logger');

// Criar um novo tracker para um link
exports.createTracker = async (req, res) => {
    const { linkId } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) {
        return res.status(400).json({ msg: 'Nome do rastreador é obrigatório' });
    }

    try {
        // Verificar se o link pertence ao usuário
        const linkCheck = await pool.query(
            "SELECT id FROM links WHERE id = $1 AND user_id = $2",
            [linkId, userId]
        );

        if (linkCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado' });
        }

        const newTracker = await pool.query(
            "INSERT INTO link_trackers (link_id, name) VALUES ($1, $2) RETURNING *",
            [linkId, name.trim()]
        );

        res.status(201).json(newTracker.rows[0]);
    } catch (err) {
        logger.error('Tracker error - create', { error: err.message });
        res.status(500).send('Erro no servidor');
    }
};

// Listar trackers de um link (com contagem de cliques)
exports.getTrackers = async (req, res) => {
    const { linkId } = req.params;
    const userId = req.user.id;

    try {
        // Verificar permissão
        const linkCheck = await pool.query(
            "SELECT id FROM links WHERE id = $1 AND user_id = $2",
            [linkId, userId]
        );

        if (linkCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado' });
        }

        // Buscar trackers com count de cliques
        const trackers = await pool.query(
            `SELECT t.*, COUNT(ac.id) as clicks
             FROM link_trackers t
             LEFT JOIN analytics_clicks ac ON t.id = ac.tracker_id
             WHERE t.link_id = $1
             GROUP BY t.id
             ORDER BY t.created_at DESC`,
            [linkId]
        );

        res.json(trackers.rows.map(row => ({
            ...row,
            clicks: parseInt(row.clicks, 10)
        })));
    } catch (err) {
        logger.error('Tracker error - list', { error: err.message });
        res.status(500).send('Erro no servidor');
    }
};

// Deletar tracker
exports.deleteTracker = async (req, res) => {
    const { trackerId } = req.params;
    const userId = req.user.id;

    try {
        // Verificar permissão (join com links para checar user_id)
        const trackerCheck = await pool.query(
            `SELECT t.id FROM link_trackers t
             JOIN links l ON t.link_id = l.id
             WHERE t.id = $1 AND l.user_id = $2`,
            [trackerId, userId]
        );

        if (trackerCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Rastreador não encontrado' });
        }

        await pool.query("DELETE FROM link_trackers WHERE id = $1", [trackerId]);
        res.json({ msg: 'Rastreador removido' });
    } catch (err) {
        logger.error('Tracker error - delete', { error: err.message });
        res.status(500).send('Erro no servidor');
    }
};
