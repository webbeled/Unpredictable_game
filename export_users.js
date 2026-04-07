import pkg from 'pg';
import fs from 'fs';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

async function exportUsers() {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(u.user_uuid::text, 'no-uuid-' || u.id::text) as user_id,
        u.id as internal_id,
        u.email,
        u.created_at,
        COUNT(DISTINCT qs.id) as total_sessions,
        COUNT(DISTINCT g.id) as total_guesses,
        COUNT(DISTINCT CASE WHEN g.correct = true THEN g.id END) as correct_guesses,
        ROUND(AVG(qs.score)::numeric, 2) as avg_score
      FROM users u
      LEFT JOIN quiz_sessions qs ON u.id = qs.user_id
      LEFT JOIN guesses g ON qs.id = g.session_id
      GROUP BY u.id, u.user_uuid, u.email, u.created_at
      ORDER BY u.id
    `);
    
    if (result.rows.length === 0) {
      console.log('No users found');
      pool.end();
      return;
    }

    // Create CSV header
    const headers = Object.keys(result.rows[0]);
    const csv = [
      headers.join(','),
      ...result.rows.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if needed
          if (value === null || value === undefined) return '';
          const str = String(value);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      )
    ].join('\n');

    const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csv);
    
    console.log(`\n✓ Exported ${result.rows.length} users to ${filename}`);
    console.log(`\nFirst few rows:`);
    console.table(result.rows.slice(0, 5));
    
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
}

exportUsers();
