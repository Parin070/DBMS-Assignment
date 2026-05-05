USE ai_chat_db;

DELIMITER //

-- 1. AFTER INSERT ON Messages -> auto-update Sessions.last_active to current timestamp
CREATE TRIGGER update_session_last_active
AFTER INSERT ON Messages
FOR EACH ROW
BEGIN
    UPDATE Sessions
    SET last_active = NEW.timestamp
    WHERE id = NEW.session_id;
END //

-- 2. BEFORE DELETE ON Sessions -> insert a row into Audit_Log
CREATE TRIGGER log_session_deletion
BEFORE DELETE ON Sessions
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (session_id, deleted_at, deleted_by)
    VALUES (OLD.id, CURRENT_TIMESTAMP, OLD.user_id);
END //

DELIMITER ;
