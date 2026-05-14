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

        console.log("Running schema.sql...");
        const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
        await connection.query(schema);

        console.log("Running triggers.sql...");
        const triggers = fs.readFileSync(path.join(__dirname, '../database/triggers.sql'), 'utf8');
        await connection.query(triggers);

        console.log("Running procedures.sql...");
        const procedures = fs.readFileSync(path.join(__dirname, '../database/procedures.sql'), 'utf8');
        await connection.query(procedures);

        console.log("Running functions.sql...");
        const functions = fs.readFileSync(path.join(__dirname, '../database/functions.sql'), 'utf8');
        await connection.query(functions);

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
