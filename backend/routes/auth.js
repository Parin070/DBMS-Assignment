const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const [existing] = await pool.query('SELECT id FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already exists.' });
        
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const [result] = await pool.query(
            'INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, password_hash]
        );
        
        const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: result.insertId, name, email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ error: 'Invalid credentials.' });
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials.' });
        
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
