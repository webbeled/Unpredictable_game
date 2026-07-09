import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

async function checkMigrations() {
  try {
    const result = await pool.query('SELECT name FROM pgmigrations ORDER BY run_on DESC LIMIT 10')
    console.log('Last 10 migrations:')
    result.rows.forEach(row => console.log('  ' + row.name))
    await pool.end()
  } catch (err) {
    console.error('Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

checkMigrations()
