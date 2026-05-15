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
        const sessionTitle = title || 'New Session';
        const [result] = await pool.query('INSERT INTO Sessions (user_id, title) VALUES (?, ?)', [req.user.id, sessionTitle]);
        const newSessionId = result.insertId;
        
        res.json({ id: newSessionId, title: sessionTitle });
    } catch (err) {
        console.error('POST /api/sessions error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/sessions/:id - delete session (with audit log)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Check session exists and belongs to user
        const [sessions] = await pool.query('SELECT id FROM Sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session not found or not authorized.' });
        }

        // Manually insert audit log (trigger may not exist on Railway)
        await pool.query(
            'INSERT INTO Audit_Log (session_id, deleted_at, deleted_by) VALUES (?, CURRENT_TIMESTAMP, ?)',
            [req.params.id, req.user.id]
        );

        // Now delete the session
        await pool.query('DELETE FROM Sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Session deleted successfully' });
    } catch (err) {
        console.error('DELETE /api/sessions error:', err.message);
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

// GET /api/sessions/:id/tags-list - get tags for a session
router.get('/:id/tags-list', authenticateToken, async (req, res) => {
    try {
        const [tags] = await pool.query(
            `SELECT t.id, t.name FROM Tags t
             JOIN Session_Tags st ON t.id = st.tag_id
             WHERE st.session_id = ?`,
            [req.params.id]
        );
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
