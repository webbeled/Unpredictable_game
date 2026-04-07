import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

async function resetMigrations() {
  try {
    // First, check what's in pgmigrations
    const check = await pool.query('SELECT * FROM pgmigrations ORDER BY run_on DESC LIMIT 20');
    console.log('\nCurrent migrations in database:');
    console.table(check.rows);
    
    // Clear the pgmigrations table
    await pool.query('TRUNCATE pgmigrations');
    console.log('\n✓ Cleared pgmigrations table');
    
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
}

resetMigrations();
