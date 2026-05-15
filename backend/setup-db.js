const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function setupDatabase() {
    let connection;
    try {
        console.log("Connecting to the database...");
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',
            port: process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306,
            user: process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
            password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',
            multipleStatements: true
        });

        // Helper to execute files with DELIMITER //
        async function executeDelimiterFile(filePath) {
            const sqlFile = fs.readFileSync(filePath, 'utf8');
            // Remove USE statements to prevent access denied on Railway
            let sql = sqlFile.replace(/USE ai_chat_db;/gi, '');
            // Strip out the DELIMITER commands
            sql = sql.replace(/DELIMITER \/\//gi, '');
            sql = sql.replace(/DELIMITER ;/gi, '');
            
            // Split by //
            const blocks = sql.split('//').map(b => b.trim()).filter(b => b.length > 0);
            
            for (const block of blocks) {
                try {
                    await connection.query(block);
                } catch (err) {
                    // Ignore "already exists" errors just in case it partially ran before
                    if (!err.message.includes("already exists")) {
                        throw err;
                    }
                }
            }
        }

        console.log("Running schema.sql...");
        let schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
        schema = schema.replace(/USE ai_chat_db;/gi, ''); // Strip USE to be safe
        schema = schema.replace(/CREATE DATABASE IF NOT EXISTS ai_chat_db;/gi, ''); // Strip CREATE DB
        await connection.query(schema);

        console.log("Running triggers.sql...");
        await executeDelimiterFile(path.join(__dirname, '../database/triggers.sql'));

        console.log("Running procedures.sql...");
        await connection.query("DROP PROCEDURE IF EXISTS CreateSession");
        await connection.query("DROP PROCEDURE IF EXISTS SearchMessages");
        await executeDelimiterFile(path.join(__dirname, '../database/procedures.sql'));

        console.log("Running functions.sql...");
        await connection.query("DROP FUNCTION IF EXISTS GetSessionSummary");
        await connection.query("DROP FUNCTION IF EXISTS GetActiveUsersLast7Days");
        await executeDelimiterFile(path.join(__dirname, '../database/functions.sql'));

        console.log("✅ Database successfully initialized!");
    } catch (error) {
        console.error("❌ Error setting up database:", error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
