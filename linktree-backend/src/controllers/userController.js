const pool = require('../db/pool');
const bcrypt = require('bcryptjs');

exports.getMe = async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, email, display_name, bio FROM users WHERE id = $1", [req.user.id]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

exports.updateMe = async (req, res) => {
    const { username, email, display_name, bio } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users SET 
                username = COALESCE($1, username), 
                email = COALESCE($2, email),
                display_name = COALESCE($3, display_name),
                bio = COALESCE($4, bio)
            WHERE id = $5 RETURNING id, username, email, display_name, bio`,
            [username, email, display_name, bio, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

exports.deleteMe = async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);
        res.json({ msg: 'Usuário deletado com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

exports.uploadProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Nenhum arquivo enviado.' });
    }

    try {
        const mimeType = req.file.mimetype;
        const base64Data = req.file.buffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64Data}`;

        await pool.query(
            "UPDATE users SET profile_image_url = $1 WHERE id = $2",
            [dataUrl, req.user.id]
        );

        res.json({ msg: 'Imagem de perfil atualizada com sucesso!', url: dataUrl });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao salvar a imagem.');
    }
};