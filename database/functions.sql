USE ai_chat_db;

DELIMITER //

-- 1. GetSessionSummary(session_id) -> returns message count + total tokens used
-- Note: MySQL functions return a single value. Returning a formatted JSON/String to encapsulate both.
CREATE FUNCTION GetSessionSummary(p_session_id INT)
RETURNS VARCHAR(255)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE msg_count INT DEFAULT 0;
    DECLARE tot_tokens INT DEFAULT 0;
    
    SELECT COUNT(*), COALESCE(SUM(tokens_used), 0)
    INTO msg_count, tot_tokens
    FROM Messages
    WHERE session_id = p_session_id;
    
    RETURN CONCAT('{"message_count":', msg_count, ',"total_tokens":', tot_tokens, '}');
END //

-- 2. GetActiveUsersLast7Days() -> returns count of distinct users who had session activity in the last 7 days
CREATE FUNCTION GetActiveUsersLast7Days()
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE active_count INT DEFAULT 0;
    
    SELECT COUNT(DISTINCT user_id)
    INTO active_count
    FROM Sessions
    WHERE last_active >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY);
    
    RETURN active_count;
END //

DELIMITER ;
