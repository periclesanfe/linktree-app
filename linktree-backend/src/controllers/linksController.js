const pool = require('../db/pool');
const { validationResult } = require('express-validator');

exports.createLink = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, url, color_hash, cover_image_url } = req.body;
    const userId = req.user.id; 

    try {
        const orderResult = await pool.query("SELECT COUNT(*) FROM links WHERE user_id = $1", [userId]);
        const display_order = parseInt(orderResult.rows[0].count, 10);

        const newLink = await pool.query(
            "INSERT INTO links (user_id, title, url, display_order, color_hash, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [userId, title, url, display_order, color_hash, cover_image_url]
        );

        res.status(201).json(newLink.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

exports.getLinks = async (req, res) => {
    try {
        const links = await pool.query("SELECT * FROM links WHERE user_id = $1 ORDER BY display_order ASC", [req.user.id]);
        res.json(links.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

exports.updateLink = async (req, res) => {
    const { title, url, color_hash, cover_image_url, display_order } = req.body;
    const linkId = req.params.id;
    const userId = req.user.id;

    try {
        const linkResult = await pool.query("SELECT * FROM links WHERE id = $1 AND user_id = $2", [linkId, userId]);
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado ou você não tem permissão.' });
        }

        const currentLink = linkResult.rows[0];
        const newTitle = title !== undefined ? title : currentLink.title;
        const newUrl = url !== undefined ? url : currentLink.url;
        const newColorHash = color_hash !== undefined ? color_hash : currentLink.color_hash;
        const newCoverImageUrl = cover_image_url !== undefined ? cover_image_url : currentLink.cover_image_url;
        const newDisplayOrder = display_order !== undefined ? display_order : currentLink.display_order;

        const updatedLink = await pool.query(
            "UPDATE links SET title = $1, url = $2, color_hash = $3, cover_image_url = $4, display_order = $5 WHERE id = $6 RETURNING *",
            [newTitle, newUrl, newColorHash, newCoverImageUrl, newDisplayOrder, linkId]
        );
        
        res.json(updatedLink.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

exports.deleteLink = async (req, res) => {
    const linkId = req.params.id;
    const userId = req.user.id;

    try {
        const linkResult = await pool.query("SELECT * FROM links WHERE id = $1 AND user_id = $2", [linkId, userId]);
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link não encontrado ou você não tem permissão.' });
        }

        await pool.query("DELETE FROM links WHERE id = $1", [linkId]);
        
        res.json({ msg: 'Link removido com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};