const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/bookmarks - list user's bookmarks
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [bookmarks] = await pool.query(`
            SELECT b.id, b.message_id, b.note, b.created_at, m.content as message_content, m.session_id, s.title as session_title
            FROM Bookmarks b
            JOIN Messages m ON b.message_id = m.id
            JOIN Sessions s ON m.session_id = s.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [req.user.id]);
        res.json(bookmarks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/bookmarks - bookmark a message with optional note
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { message_id, note } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Bookmarks (user_id, message_id, note) VALUES (?, ?, ?)',
            [req.user.id, message_id, note]
        );
        res.json({ id: result.insertId, message_id, note });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
