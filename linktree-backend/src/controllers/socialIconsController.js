const pool = require('../db/pool');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const VALID_PLATFORMS = ['instagram', 'twitter', 'facebook', 'tiktok', 'youtube', 'linkedin', 'github', 'whatsapp'];

exports.createSocialIcon = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { platform, url } = req.body;
    const userId = req.user.id;

    if (!VALID_PLATFORMS.includes(platform.toLowerCase())) {
        return res.status(400).json({ msg: 'Plataforma social inválida.' });
    }

    try {
        const newIcon = await pool.query(
            "INSERT INTO social_icons (user_id, platform, url) VALUES ($1, $2, $3) RETURNING *",
            [userId, platform.toLowerCase(), url]
        );

        res.status(201).json(newIcon.rows[0]);
    } catch (err) {
        logger.error('Social icons error - createSocialIcon', { 
            endpoint: 'createSocialIcon',
            userId: req.user.id,
            platform: req.body.platform,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.getSocialIcons = async (req, res) => {
    try {
        const icons = await pool.query("SELECT * FROM social_icons WHERE user_id = $1", [req.user.id]);
        res.json(icons.rows);
    } catch (err) {
        logger.error('Social icons error - getSocialIcons', { 
            endpoint: 'getSocialIcons',
            userId: req.user.id,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.updateSocialIcon = async (req, res) => {
    const { url } = req.body;
    const iconId = req.params.id;
    const userId = req.user.id;

    try {
        const iconResult = await pool.query("SELECT * FROM social_icons WHERE id = $1 AND user_id = $2", [iconId, userId]);
        if (iconResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Ícone não encontrado ou você não tem permissão.' });
        }

        const updatedIcon = await pool.query(
            "UPDATE social_icons SET url = $1 WHERE id = $2 RETURNING *",
            [url, iconId]
        );
        
        res.json(updatedIcon.rows[0]);
    } catch (err) {
        logger.error('Social icons error - updateSocialIcon', { endpoint: 'updateSocialIcon', userId, iconId, error: err.message, stack: err.stack });
        res.status(500).send('Erro no servidor');
    }
};

exports.deleteSocialIcon = async (req, res) => {
    const iconId = req.params.id;
    const userId = req.user.id;

    try {
        const iconResult = await pool.query("SELECT * FROM social_icons WHERE id = $1 AND user_id = $2", [iconId, userId]);
        if (iconResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Ícone não encontrado ou você não tem permissão.' });
        }

        await pool.query("DELETE FROM social_icons WHERE id = $1", [iconId]);
        
        res.json({ msg: 'Ícone social removido com sucesso.' });
    } catch (err) {
        logger.error('Social icons error - deleteSocialIcon', { endpoint: 'deleteSocialIcon', userId, iconId, error: err.message, stack: err.stack });
        res.status(500).send('Erro no servidor');
    }
};