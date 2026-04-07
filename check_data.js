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

async function checkData() {
  try {
    const result = await pool.query(`
      SELECT 
        qs.id,
        qs.created_at,
        COUNT(g.id) as total_guesses,
        COUNT(CASE WHEN g.correct = true THEN 1 END) as correct_guesses,
        qs.score
      FROM quiz_sessions qs
      LEFT JOIN guesses g ON qs.id = g.session_id
      GROUP BY qs.id, qs.created_at, qs.score
      ORDER BY qs.created_at DESC
      LIMIT 25
    `);
    console.log('\n=== Quiz Sessions with Guesses ===\n');
    console.table(result.rows);
    
    const totalSessions = result.rows.length;
    const withGuesses = result.rows.filter(r => r.total_guesses > 0).length;
    const withCorrect = result.rows.filter(r => r.correct_guesses > 0).length;
    
    console.log(`\n=== Summary ===`);
    console.log(`Total sessions: ${totalSessions}`);
    console.log(`Sessions with guesses: ${withGuesses}`);
    console.log(`Sessions with correct guesses: ${withCorrect}`);
    
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
}

checkData();
