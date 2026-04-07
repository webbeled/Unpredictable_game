import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

async function removeMigrations() {
  try {
    // Delete the new migrations from pgmigrations so they'll run
    const newMigrations = [
      '202604070200_add_user_uuid',
      '202604070300_add_readable_timestamps', 
      '202604070400_migrate_user_ids_to_uuid'
    ]
    
    for (const migration of newMigrations) {
      await pool.query('DELETE FROM pgmigrations WHERE name = $1', [migration])
      console.log(`Removed ${migration} from pgmigrations`)
    }
    
    console.log('Ready for npm run migrate to execute pending migrations')
    
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

removeMigrations()
