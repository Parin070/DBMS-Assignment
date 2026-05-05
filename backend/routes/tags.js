const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/tags - list user's tags
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [tags] = await pool.query('SELECT * FROM Tags WHERE user_id = ?', [req.user.id]);
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tags - create tag
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await pool.query('INSERT INTO Tags (name, user_id) VALUES (?, ?)', [name, req.user.id]);
        res.json({ id: result.insertId, name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
