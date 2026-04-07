import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

async function showData() {
  try {
    const result = await pool.query(`
      SELECT 
        qs.id,
        qs.created_at,
        COUNT(g.id) as total_guesses,
        COUNT(CASE WHEN g.correct = true THEN 1 END) as correct_guesses
      FROM quiz_sessions qs
      LEFT JOIN guesses g ON qs.id = g.session_id
      GROUP BY qs.id, qs.created_at
      ORDER BY qs.created_at DESC
      LIMIT 20
    `);
    console.table(result.rows);
    pool.end();
  } catch (err) {
    console.error(err);
    pool.end();
    process.exit(1);
  }
}

showData();
