import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

/**
 * Export users data to CSV with demographics
 */
async function exportUsersToCSV() {
  try {
    console.log('Fetching users data...')
    const result = await pool.query(`
      SELECT 
        u.user_uuid::text as alphanumeric_id,
        u.id as user_id,
        u.email,
        COALESCE(u.gender, '') as gender,
        COALESCE(u.english_speaker::text, '') as english_speaker,
        COALESCE(u.location, '') as location,
        EXTRACT(EPOCH FROM u.created_at)::bigint * 1000 as account_created_ms,
        u.created_at AT TIME ZONE 'UTC' as account_created_readable,
        COUNT(DISTINCT qs.id) as total_sessions,
        COUNT(DISTINCT g.id) as total_guesses,
        SUM(CASE WHEN g.correct = true THEN 1 ELSE 0 END) as correct_guesses,
        ROUND(AVG(qs.score)::numeric, 2) as avg_score
      FROM users u
      LEFT JOIN quiz_sessions qs ON u.user_uuid = qs.user_id
      LEFT JOIN guesses g ON u.user_uuid = g.user_id
      GROUP BY u.id, u.user_uuid, u.email, u.gender, u.english_speaker, u.location, u.created_at
      ORDER BY u.created_at DESC
    `)

    if (result.rows.length === 0) {
      console.log('No users found')
      await pool.end()
      return
    }

    // Create CSV
    const headers = Object.keys(result.rows[0])
    const csv = [
      headers.join(','),
      ...result.rows.map(row =>
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          const str = String(value)
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',')
      )
    ].join('\n')

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const filename = `users_export_${dateStr}_${timeStr}.csv`
    const filepath = path.join('data', filename)
    
    fs.mkdirSync('data', { recursive: true })
    fs.writeFileSync(filepath, csv)

    console.log(`\n✓ Exported ${result.rows.length} users to ${filepath}`)
    console.log(`\nFirst 10 users (most recent):`)
    console.table(result.rows.slice(0, 10))

    await pool.end()
  } catch (err) {
    console.error('Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

exportUsersToCSV()
