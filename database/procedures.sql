USE ai_chat_db;

DELIMITER //

-- 1. CreateSession(user_id, title) -> inserts a new session, returns the new session_id
CREATE PROCEDURE CreateSession(IN p_user_id INT, IN p_title VARCHAR(255))
BEGIN
    INSERT INTO Sessions (user_id, title) VALUES (p_user_id, p_title);
    -- Select the last insert ID so the backend can consume it directly
    SELECT LAST_INSERT_ID() AS session_id;
END //

-- 2. SearchMessages(user_id, keyword) -> full-text search across all messages belonging to that user's sessions
CREATE PROCEDURE SearchMessages(IN p_user_id INT, IN p_keyword VARCHAR(255))
BEGIN
    SELECT m.id, m.session_id, m.role, m.content, m.timestamp, s.title AS session_title
    FROM Messages m
    JOIN Sessions s ON m.session_id = s.id
    WHERE s.user_id = p_user_id 
      AND m.content LIKE CONCAT('%', p_keyword, '%')
    ORDER BY m.timestamp DESC;
END //

DELIMITER ;
