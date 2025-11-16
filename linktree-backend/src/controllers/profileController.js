const pool = require('../db/pool');
const logger = require('../utils/logger');

exports.getPublicProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const userResult = await pool.query(
            "SELECT id, username, display_name, bio, profile_image_url, background_image_url, accent_color FROM users WHERE username = $1",
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Perfil não encontrado.' });
        }

        const userProfile = userResult.rows[0];
        const userId = userProfile.id;

        const [linksResult, socialIconsResult] = await Promise.all([
            pool.query("SELECT id, title, url, cover_image_url, color_hash FROM links WHERE user_id = $1 ORDER BY display_order ASC", [userId]),
            pool.query("SELECT id, platform, url FROM social_icons WHERE user_id = $1", [userId])
        ]);

        const publicProfile = {
            ...userProfile,
            links: linksResult.rows,
            socialIcons: socialIconsResult.rows
        };
        
        res.json(publicProfile);

    } catch (err) {
        logger.error('Profile error', { 
            endpoint: 'getPublicProfile',
            username: req.params.username,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};