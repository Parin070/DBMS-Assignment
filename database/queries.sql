-- 1. Get all sessions where message count > average message count across all sessions
-- (Nested Query)
SELECT s.id, s.title, COUNT(m.id) as message_count
FROM Sessions s
LEFT JOIN Messages m ON s.id = m.session_id
GROUP BY s.id
HAVING message_count > (
    SELECT AVG(msg_count)
    FROM (
        SELECT COUNT(id) as msg_count
        FROM Messages
        GROUP BY session_id
    ) AS avg_counts
);

-- 2. Find users who bookmarked messages from sessions they no longer own
-- (For instance, if a user bookmarked another user's session's message somehow, or ownership changed)
SELECT DISTINCT u.id, u.name, u.email
FROM Users u
JOIN Bookmarks b ON u.id = b.user_id
JOIN Messages m ON b.message_id = m.id
JOIN Sessions s ON m.session_id = s.id
WHERE s.user_id != b.user_id;

-- 3. Correlated: for each user, retrieve their most recent session
SELECT s1.user_id, s1.id AS session_id, s1.title, s1.last_active
FROM Sessions s1
WHERE s1.last_active = (
    SELECT MAX(last_active)
    FROM Sessions s2
    WHERE s2.user_id = s1.user_id
);

-- 4. Cross-Session Context: Fetch messages from a specific session ordered by timestamp
SELECT role, content, timestamp
FROM Messages
WHERE session_id = ?
ORDER BY timestamp ASC;
