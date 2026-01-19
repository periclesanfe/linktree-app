const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { handleImageUpload, deleteFromR2 } = require('../services/imageService');

exports.getMe = async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, email, display_name, bio, profile_image_url, background_image_url, accent_color FROM users WHERE id = $1", [req.user.id]);
        res.json(user.rows[0]);
    } catch (err) {
        logger.error('User error - getMe', {
            endpoint: 'getMe',
            userId: req.user.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.updateMe = async (req, res) => {
    const { username, email, display_name, bio } = req.body;
    
    // Forçar username lowercase se fornecido
    const usernameLower = username ? username.toLowerCase() : undefined;

    // Validacao de username
    if (usernameLower) {
        if (!/^[a-z0-9._-]+$/.test(usernameLower)) {
            return res.status(400).json({ msg: 'O usuario so pode conter letras minusculas, numeros, ponto, traco e sublinhado.' });
        }
        if (usernameLower.length > 30) {
            return res.status(400).json({ msg: 'O usuario deve ter no maximo 30 caracteres.' });
        }
    }

    try {
        const result = await pool.query(
            `UPDATE users SET 
                username = COALESCE($1, username), 
                email = COALESCE($2, email),
                display_name = COALESCE($3, display_name),
                bio = COALESCE($4, bio)
            WHERE id = $5 RETURNING id, username, email, display_name, bio`,
            [usernameLower, email, display_name, bio, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('User error - updateMe', { 
            endpoint: 'updateMe',
            userId: req.user.id,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.deleteMe = async (req, res) => {
    try {
        // Get user's current images to delete from R2
        const userResult = await pool.query(
            "SELECT profile_image_url, background_image_url FROM users WHERE id = $1",
            [req.user.id]
        );

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            // Delete images from R2 if they exist
            if (user.profile_image_url && !user.profile_image_url.startsWith('data:')) {
                await deleteFromR2(user.profile_image_url);
            }
            if (user.background_image_url && !user.background_image_url.startsWith('data:')) {
                await deleteFromR2(user.background_image_url);
            }
        }

        await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);
        res.json({ msg: 'Usuario deletado com sucesso.' });
    } catch (err) {
        logger.error('User error - deleteMe', { 
            endpoint: 'deleteMe',
            userId: req.user.id,
            error: err.message,
            stack: err.stack 
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.uploadProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Nenhum arquivo enviado.' });
    }

    try {
        // Get current profile image URL to delete old one
        const userResult = await pool.query(
            "SELECT profile_image_url FROM users WHERE id = $1",
            [req.user.id]
        );
        const oldUrl = userResult.rows[0]?.profile_image_url;

        // Process and upload to R2
        const result = await handleImageUpload(
            req.file,
            'avatar',
            req.user.id.toString(),
            oldUrl
        );

        // Update database with new URL
        await pool.query(
            "UPDATE users SET profile_image_url = $1 WHERE id = $2",
            [result.url, req.user.id]
        );

        res.json({ 
            msg: 'Imagem de perfil atualizada com sucesso!', 
            url: result.url 
        });

    } catch (err) {
        logger.error('User error - uploadProfilePicture', {
            endpoint: 'uploadProfilePicture',
            userId: req.user.id,
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
        
        res.status(500).json({ msg: 'Erro no servidor ao salvar a imagem.' });
    }
};

exports.uploadBackgroundImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Nenhum arquivo enviado.' });
    }

    try {
        // Get current background image URL to delete old one
        const userResult = await pool.query(
            "SELECT background_image_url FROM users WHERE id = $1",
            [req.user.id]
        );
        const oldUrl = userResult.rows[0]?.background_image_url;

        // Process and upload to R2
        const result = await handleImageUpload(
            req.file,
            'background',
            req.user.id.toString(),
            oldUrl
        );

        // Update database with new URL
        await pool.query(
            "UPDATE users SET background_image_url = $1 WHERE id = $2",
            [result.url, req.user.id]
        );

        res.json({ 
            msg: 'Imagem de background atualizada com sucesso!', 
            url: result.url 
        });

    } catch (err) {
        logger.error('User error - uploadBackgroundImage', {
            endpoint: 'uploadBackgroundImage',
            userId: req.user.id,
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
        
        res.status(500).json({ msg: 'Erro no servidor ao salvar a imagem de background.' });
    }
};

exports.updateAccentColor = async (req, res) => {
    const { accent_color } = req.body;

    if (!accent_color) {
        return res.status(400).json({ msg: 'Cor de destaque nao fornecida.' });
    }

    try {
        const result = await pool.query(
            "UPDATE users SET accent_color = $1 WHERE id = $2 RETURNING accent_color",
            [accent_color, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('User error - updateAccentColor', {
            endpoint: 'updateAccentColor',
            userId: req.user.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};

exports.helloWorld = async (req, res) => {
    res.json({ message: 'Hello, World!' });
};

exports.helloWorld2 = async (req, res) => {
    res.json({ message: 'Hello, World! 2' });
};

exports.getVersion = async (req, res) => {
    res.json({
        version: 'v2.0.0-canary',
        deploymentType: 'canary',
        message: 'Testing Canary Deployment Strategy'
    });
};

exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Senha atual e nova senha sao obrigatorias.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        // Busca a senha atual do usuario
        const userResult = await pool.query(
            "SELECT password_hash FROM users WHERE id = $1",
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuario nao encontrado.' });
        }

        const user = userResult.rows[0];

        // Verifica se a senha atual esta correta
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Senha atual incorreta.' });
        }

        // Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Atualiza a senha no banco
        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [newPasswordHash, req.user.id]
        );

        res.json({ msg: 'Senha atualizada com sucesso!' });

    } catch (err) {
        logger.error('User error - updatePassword', {
            endpoint: 'updatePassword',
            userId: req.user.id,
            error: err.message,
            stack: err.stack
        });
        res.status(500).send('Erro no servidor');
    }
};
