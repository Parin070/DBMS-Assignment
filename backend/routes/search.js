const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/search?q=keyword
router.get('/', authenticateToken, async (req, res) => {
    try {
        const keyword = req.query.q;
        if (!keyword) return res.json([]);

        // Direct SQL instead of CALL SearchMessages (procedure may not exist on Railway)
        const [rows] = await pool.query(
            `SELECT m.id, m.session_id, m.role, m.content, m.timestamp, s.title AS session_title
             FROM Messages m
             JOIN Sessions s ON m.session_id = s.id
             WHERE s.user_id = ? AND m.content LIKE CONCAT('%', ?, '%')
             ORDER BY m.timestamp DESC`,
            [req.user.id, keyword]
        );
        
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
