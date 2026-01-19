const pool = require('../db/pool');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { formatPhone, extractYouTubeId } = require('../utils/linkUrlBuilder');
const { handleImageUpload, deleteFromR2 } = require('../services/imageService');

exports.createLink = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, url, color_hash, cover_image_url, link_type, metadata } = req.body;
    const userId = req.user.id;

    try {
        const orderResult = await pool.query("SELECT COUNT(*) FROM links WHERE user_id = $1", [userId]);
        const display_order = parseInt(orderResult.rows[0].count, 10);

        // Para tipo youtube, extrair o ID do video da URL
        let finalMetadata = metadata || {};
        if (link_type === 'youtube' && url) {
            const videoId = extractYouTubeId(url);
            if (videoId) {
                finalMetadata = { ...finalMetadata, videoId };
            }
        }

        const newLink = await pool.query(
            "INSERT INTO links (user_id, title, url, display_order, color_hash, cover_image_url, link_type, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [userId, title, url, display_order, color_hash, cover_image_url, link_type || 'default', finalMetadata]
        );

        res.status(201).json(newLink.rows[0]);
    } catch (err) {
        logger.error('Links error - createLink', {
            endpoint: 'createLink',
            userId: req.user.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.getLinks = async (req, res) => {
    try {
        const links = await pool.query("SELECT * FROM links WHERE user_id = $1 ORDER BY display_order ASC", [req.user.id]);
        res.json(links.rows);
    } catch (err) {
        logger.error('Links error - getLinks', { 
            endpoint: 'getLinks',
            userId: req.user.id,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.updateLink = async (req, res) => {
    const { title, url, color_hash, cover_image_url, display_order, link_type, metadata } = req.body;
    const linkId = req.params.id;
    const userId = req.user.id;

    try {
        const linkResult = await pool.query("SELECT * FROM links WHERE id = $1 AND user_id = $2", [linkId, userId]);
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link nao encontrado ou voce nao tem permissao.' });
        }

        const currentLink = linkResult.rows[0];
        const newTitle = title !== undefined ? title : currentLink.title;
        const newUrl = url !== undefined ? url : currentLink.url;
        const newColorHash = color_hash !== undefined ? color_hash : currentLink.color_hash;
        const newCoverImageUrl = cover_image_url !== undefined ? cover_image_url : currentLink.cover_image_url;
        const newDisplayOrder = display_order !== undefined ? display_order : currentLink.display_order;
        const newLinkType = link_type !== undefined ? link_type : currentLink.link_type;
        
        // Para tipo youtube, extrair o ID do video da URL
        let newMetadata = metadata !== undefined ? metadata : currentLink.metadata;
        if (newLinkType === 'youtube' && newUrl) {
            const videoId = extractYouTubeId(newUrl);
            if (videoId) {
                newMetadata = { ...newMetadata, videoId };
            }
        }

        const updatedLink = await pool.query(
            "UPDATE links SET title = $1, url = $2, color_hash = $3, cover_image_url = $4, display_order = $5, link_type = $6, metadata = $7 WHERE id = $8 RETURNING *",
            [newTitle, newUrl, newColorHash, newCoverImageUrl, newDisplayOrder, newLinkType, newMetadata, linkId]
        );

        res.json(updatedLink.rows[0]);
    } catch (err) {
        logger.error('Links error - updateLink', {
            endpoint: 'updateLink',
            userId: req.user.id,
            linkId: req.params.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.deleteLink = async (req, res) => {
    const linkId = req.params.id;
    const userId = req.user.id;

    try {
        const linkResult = await pool.query("SELECT * FROM links WHERE id = $1 AND user_id = $2", [linkId, userId]);
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link nao encontrado ou voce nao tem permissao.' });
        }

        // Delete cover image from R2 if exists
        const link = linkResult.rows[0];
        if (link.cover_image_url && !link.cover_image_url.startsWith('data:')) {
            await deleteFromR2(link.cover_image_url);
        }

        await pool.query("DELETE FROM links WHERE id = $1", [linkId]);
        
        res.json({ msg: 'Link removido com sucesso.' });
    } catch (err) {
        logger.error('Links error - deleteLink', { 
            endpoint: 'deleteLink',
            userId: req.user.id,
            linkId: req.params.id,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.uploadLinkCoverImage = async (req, res) => {
    const { linkId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ msg: 'Nenhum arquivo enviado.' });
    }

    try {
        const linkResult = await pool.query("SELECT * FROM links WHERE id = $1 AND user_id = $2", [linkId, userId]);
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Link nao encontrado ou voce nao tem permissao.' });
        }

        const oldUrl = linkResult.rows[0].cover_image_url;

        // Process and upload to R2
        const result = await handleImageUpload(
            req.file,
            'linkCover',
            userId.toString(),
            oldUrl
        );

        const updatedLink = await pool.query(
            "UPDATE links SET cover_image_url = $1 WHERE id = $2 RETURNING *",
            [result.url, linkId]
        );

        res.json(updatedLink.rows[0]);

    } catch (err) {
        logger.error('Links error - uploadLinkCover', {
            endpoint: 'uploadLinkCover',
            userId: req.user.id,
            linkId: req.params.linkId,
            error: err.message,
            stack: err.stack
        });
        
        // Check if it's a storage limit error
        if (err.message.includes('Storage limit exceeded')) {
            return res.status(507).json({ 
                msg: err.message,
                error: 'STORAGE_LIMIT_EXCEEDED'
            });
        }
        
        res.status(500).json({ msg: 'Erro no servidor ao salvar a imagem do link.' });
    }
};

exports.reorderLinks = async (req, res) => {
    const { links } = req.body;
    const userId = req.user.id;

    if (!links || !Array.isArray(links)) {
        return res.status(400).json({ msg: 'Dados de reordenacao invalidos.' });
    }

    try {
        for (const link of links) {
            await pool.query(
                "UPDATE links SET display_order = $1 WHERE id = $2 AND user_id = $3",
                [link.display_order, link.id, userId]
            );
        }

        res.json({ msg: 'Links reordenados com sucesso!' });
    } catch (err) {
        logger.error('Links error - reorderLinks', {
            endpoint: 'reorderLinks',
            userId: req.user.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};
