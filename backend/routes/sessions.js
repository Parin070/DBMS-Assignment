const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/sessions - list all sessions for logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [sessions] = await pool.query(
            'SELECT id, title, created_at, last_active FROM Sessions WHERE user_id = ? ORDER BY last_active DESC',
            [req.user.id]
        );
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sessions - call CreateSession stored procedure
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title } = req.body;
        const [rows] = await pool.query('CALL CreateSession(?, ?)', [req.user.id, title || 'New Session']);
        const newSessionId = rows[0][0].session_id;
        
        res.json({ id: newSessionId, title: title || 'New Session' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/sessions/:id - delete session (triggers Audit_Log entry)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM Sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found or not authorized.' });
        }
        res.json({ message: 'Session deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sessions/:id/tags - attach tag to session
router.post('/:id/tags', authenticateToken, async (req, res) => {
    try {
        const { tag_id } = req.body;
        const [sessions] = await pool.query('SELECT id FROM Sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (sessions.length === 0) return res.status(403).json({ error: 'Not authorized' });

        await pool.query('INSERT IGNORE INTO Session_Tags (session_id, tag_id) VALUES (?, ?)', [req.params.id, tag_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
