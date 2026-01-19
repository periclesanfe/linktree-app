const pool = require('../src/db/pool');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Starting migration: Add Trackers support...');
        
        // Read SQL file
        // Path relative to backend root where script runs
        const sqlPath = path.join(__dirname, '../../db-init/003_add_trackers.sql');
        
        if (!fs.existsSync(sqlPath)) {
            console.error(`SQL file not found at: ${sqlPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute SQL
        await pool.query(sql);
        
        console.log('✅ Migration applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
