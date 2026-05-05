const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/search?q=keyword
router.get('/', authenticateToken, async (req, res) => {
    try {
        const keyword = req.query.q;
        if (!keyword) return res.json([]);

        // Call SearchMessages stored procedure
        const [rows] = await pool.query('CALL SearchMessages(?, ?)', [req.user.id, keyword]);
        
        res.json(rows[0]); // First result set from the procedure
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
