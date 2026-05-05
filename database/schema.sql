CREATE DATABASE IF NOT EXISTS ai_chat_db;
USE ai_chat_db;

CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX idx_sessions_user_id ON Sessions(user_id);

CREATE TABLE Messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    tokens_used INT DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES Sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_messages_session_id ON Messages(session_id);

CREATE TABLE Tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX idx_tags_user_id ON Tags(user_id);

CREATE TABLE Session_Tags (
    session_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (session_id, tag_id),
    FOREIGN KEY (session_id) REFERENCES Sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
);
CREATE INDEX idx_sessiontags_tag_id ON Session_Tags(tag_id);

CREATE TABLE Bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message_id INT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES Messages(id) ON DELETE CASCADE
);
CREATE INDEX idx_bookmarks_user_id ON Bookmarks(user_id);
CREATE INDEX idx_bookmarks_message_id ON Bookmarks(message_id);

CREATE TABLE Audit_Log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_by INT
);
