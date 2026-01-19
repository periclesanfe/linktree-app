const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// POST /api/invite-codes/validate - Validar código (publico)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: 'Código de convite é obrigatório'
      });
    }

    // Remove espacos e hifens para validacao flexivel
    const cleanCode = code.toUpperCase().replace(/[\s-]/g, '');

    // Buscar código no banco (ignorando hifens no banco tambem)
    const result = await pool.query(
      `SELECT * FROM invite_codes
       WHERE replace(code, '-', '') = $1
       AND is_used = false
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [cleanCode]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        valid: false,
        message: 'Código inválido, já utilizado ou expirado'
      });
    }

    res.json({
      valid: true,
      message: 'Código válido!'
    });

  } catch (error) {
    logger.error('Erro ao validar código:', error);
    res.status(500).json({
      valid: false,
      message: 'Erro ao validar código de convite'
    });
  }
});

// POST /api/invite-codes - Gerar código(s) (apenas admin/autenticado)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { count = 1, expiresInDays, notes } = req.body;
    const userId = req.user.id;

    // Validar count
    if (count < 1 || count > 100) {
      return res.status(400).json({
        error: 'Quantidade deve ser entre 1 e 100'
      });
    }

    // Verificar quantos códigos nao usados o usuario ja tem
    const userCodes = await pool.query(
      "SELECT COUNT(*) FROM invite_codes WHERE created_by = $1 AND is_used = false AND (expires_at IS NULL OR expires_at > NOW())",
      [userId]
    );
    
    const activeCodesCount = parseInt(userCodes.rows[0].count);
    
    // Limite de 10 códigos ativos por usuário
    if (activeCodesCount + count > 10) {
      return res.status(400).json({
        error: `Limite de códigos ativos atingido. Você tem ${activeCodesCount} códigos ativos e o limite é 10.`
      });
    }

    // Calcular data de expiração
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Usar função do banco para gerar múltiplos códigos
    const result = await pool.query(
      `SELECT * FROM generate_multiple_invite_codes($1, $2, $3)`,
      [count, userId, expiresAt]
    );

    const codes = result.rows.map(row => row.code);

    // Se houver notes, atualizar os códigos gerados
    if (notes) {
      await pool.query(
        `UPDATE invite_codes SET notes = $1 WHERE code = ANY($2)`,
        [notes, codes]
      );
    }

    logger.info(`${count} código(s) gerado(s)`, {
      userId,
      count,
      expiresAt
    });

    res.status(201).json({
      success: true,
      codes,
      count: codes.length,
      expiresAt
    });

  } catch (error) {
    logger.error('Erro ao gerar código(s):', error);
    res.status(500).json({
      error: 'Erro ao gerar código(s) de convite'
    });
  }
});

// GET /api/invite-codes - Listar códigos (apenas admin/autenticado)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        id,
        code,
        is_used,
        created_at,
        used_at,
        expires_at,
        notes,
        used_by
      FROM invite_codes
      WHERE created_by = $1
    `;

    const params = [userId];

    // Filtrar por status
    if (status === 'used') {
      query += ` AND is_used = true`;
    } else if (status === 'available') {
      query += ` AND is_used = false AND (expires_at IS NULL OR expires_at > NOW())`;
    } else if (status === 'expired') {
      query += ` AND is_used = false AND expires_at < NOW()`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Buscar estatísticas
    const stats = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_used = true) as used,
        COUNT(*) FILTER (WHERE is_used = false AND (expires_at IS NULL OR expires_at > NOW())) as available,
        COUNT(*) FILTER (WHERE is_used = false AND expires_at < NOW()) as expired
       FROM invite_codes
       WHERE created_by = $1`,
      [userId]
    );

    res.json({
      codes: result.rows,
      stats: stats.rows[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(stats.rows[0].total)
      }
    });

  } catch (error) {
    logger.error('Erro ao listar códigos:', error);
    res.status(500).json({
      error: 'Erro ao listar códigos de convite'
    });
  }
});

// DELETE /api/invite-codes/:id - Deletar código (apenas se não usado)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM invite_codes
       WHERE id = $1
       AND created_by = $2
       AND is_used = false
       RETURNING code`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Código não encontrado, já usado, ou você não tem permissão'
      });
    }

    logger.info('Código deletado', {
      userId,
      code: result.rows[0].code
    });

    res.json({
      success: true,
      message: 'Código deletado com sucesso'
    });

  } catch (error) {
    logger.error('Erro ao deletar código:', error);
    res.status(500).json({
      error: 'Erro ao deletar código'
    });
  }
});

// GET /api/invite-codes/stats - Estatísticas gerais
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_used = true) as used,
        COUNT(*) FILTER (WHERE is_used = false AND (expires_at IS NULL OR expires_at > NOW())) as available,
        COUNT(*) FILTER (WHERE is_used = false AND expires_at < NOW()) as expired,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as created_last_7_days,
        COUNT(*) FILTER (WHERE used_at >= NOW() - INTERVAL '7 days') as used_last_7_days
       FROM invite_codes
       WHERE created_by = $1`,
      [userId]
    );

    res.json({
      stats: stats.rows[0]
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas'
    });
  }
});

module.exports = router;
