const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GET /api/sessions/:id/messages - get all messages in a session
router.get('/:id/messages', authenticateToken, async (req, res) => {
    try {
        const [sessions] = await pool.query('SELECT id FROM Sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (sessions.length === 0) return res.status(403).json({ error: 'Not authorized' });

        const [messages] = await pool.query('SELECT * FROM Messages WHERE session_id = ? ORDER BY timestamp ASC', [req.params.id]);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/sessions/:id/messages/summary - first 5 and last 5 messages for preview
router.get('/:id/messages/summary', authenticateToken, async (req, res) => {
    try {
        const [sessions] = await pool.query('SELECT id FROM Sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (sessions.length === 0) return res.status(403).json({ error: 'Not authorized' });

        const [allMessages] = await pool.query('SELECT * FROM Messages WHERE session_id = ? ORDER BY timestamp ASC', [req.params.id]);
        
        let summary;
        if (allMessages.length <= 10) {
            summary = allMessages;
        } else {
            summary = [...allMessages.slice(0, 5), ...allMessages.slice(-5)];
        }
        res.json({ total: allMessages.length, messages: summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sessions/:id/messages - send message & call Gemini
router.post('/:id/messages', authenticateToken, async (req, res) => {
    try {
        const { content, context_session_id } = req.body;
        const sessionId = req.params.id;

        // Verify session ownership
        const [sessions] = await pool.query('SELECT id FROM Sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
        if (sessions.length === 0) return res.status(403).json({ error: 'Not authorized' });

        // 1. Fetch current session history
        const [currentSessionMessages] = await pool.query('SELECT role, content FROM Messages WHERE session_id = ? ORDER BY timestamp ASC', [sessionId]);

        let contextMessages = [];
        if (context_session_id) {
            // Fetch cross-session context (up to 50 msgs: first 10 + last 40)
            const [oldMessages] = await pool.query('SELECT role, content, timestamp FROM Messages WHERE session_id = ? ORDER BY timestamp ASC', [context_session_id]);
            if (oldMessages.length > 50) {
                contextMessages = [...oldMessages.slice(0, 10), ...oldMessages.slice(-40)];
            } else {
                contextMessages = oldMessages;
            }
        }

        // 2. Insert user message to DB
        await pool.query('INSERT INTO Messages (session_id, role, content) VALUES (?, ?, ?)', [sessionId, 'user', content]);

        // 3. Prepare Gemini History
        const formatForGemini = (msgs) => msgs.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const combinedHistory = [
            ...formatForGemini(contextMessages),
            ...formatForGemini(currentSessionMessages)
        ];

        // 4. Call Gemini
        // We handle empty history because startChat history doesn't like being empty array sometimes depending on SDK version
        // But gemini-3-flash-preview is fine with it.
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        let chat;
        if (combinedHistory.length > 0) {
             chat = model.startChat({ history: combinedHistory });
        } else {
             chat = model.startChat();
        }
        
        const result = await chat.sendMessage(content);
        const responseText = result.response.text();

        const tokens_used = Math.ceil(responseText.length / 4) + Math.ceil(content.length / 4);

        // 5. Insert assistant message to DB
        const [insertResponse] = await pool.query(
            'INSERT INTO Messages (session_id, role, content, tokens_used) VALUES (?, ?, ?, ?)',
            [sessionId, 'assistant', responseText, tokens_used]
        );

        res.json({
            id: insertResponse.insertId,
            session_id: sessionId,
            role: 'assistant',
            content: responseText,
            tokens_used
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
