const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        const sqlPath = path.resolve(__dirname, 'migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');

        // Unfortunately Supabase JS client doesn't have a direct `evaluate SQL` function
        // unless you expose a custom run_sql RPC.
        // Instead of forcing the user to create a run_sql RPC, let's inform them properly.
        console.log('\n--- IMPORTANT ---');
        console.log('To apply these schema changes, please copy the contents of:');
        console.log(sqlPath);
        console.log('and run it in your Supabase SQL Editor.');
        console.log('-----------------\n');

        process.exit(0);

    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

runMigration();
