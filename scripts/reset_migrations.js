import pg from 'pg'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

async function resetMigrations() {
  try {
    console.log('Attempting to reset pgmigrations table...')
    
    // First, show what's currently in the migrations table
    const result = await pool.query('SELECT * FROM pgmigrations ORDER BY run_on DESC')
    console.log(`Current migrations in pgmigrations table (${result.rows.length} rows):`)
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (run on ${row.run_on})`)
    })
    
    // Clear the migrations table
    console.log('\nTruncating pgmigrations table...')
    await pool.query('TRUNCATE TABLE pgmigrations')
    console.log('✓ pgmigrations table cleared')
    
    // Get all migration files from the migrations directory
    const migrationsDir = path.join(process.cwd(), 'server', 'db', 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
    
    console.log(`\nFound ${files.length} migration files. Marking them as completed:`)
    
    // Insert each migration as "completed"
    for (const file of files) {
      const name = file.replace('.sql', '')
      await pool.query(
        'INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())',
        [name]
      )
      console.log(`  ✓ ${name}`)
    }
    
    console.log('\n✓ All migrations marked as completed')
    
    // Verify
    const check = await pool.query('SELECT COUNT(*) FROM pgmigrations')
    console.log(`✓ pgmigrations now has ${check.rows[0].count} rows`)
    
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('Error resetting migrations:', err)
    await pool.end()
    process.exit(1)
  }
}

resetMigrations()
