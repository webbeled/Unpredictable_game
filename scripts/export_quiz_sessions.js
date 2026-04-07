import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

/**
 * Export quiz_sessions data to CSV with user UUIDs
 */
async function exportQuizSessionsToCSV() {
  try {
    console.log('Fetching quiz sessions data...')
    const result = await pool.query(`
      SELECT 
        qs.id as session_id,
        qs.quiz_id,
        u.user_uuid::text as user_id,
        qs.score,
        qs.created_at,
        qs.ended_at,
        to_timestamp(qs.created_at::double precision / 1000) as created_at_readable,
        CASE WHEN qs.ended_at IS NOT NULL THEN to_timestamp(qs.ended_at::double precision / 1000) ELSE NULL END as ended_at_readable,
        COUNT(DISTINCT g.id) as total_guesses,
        COUNT(DISTINCT CASE WHEN g.correct = true THEN g.id END) as correct_guesses
      FROM quiz_sessions qs
      LEFT JOIN users u ON qs.user_id = u.user_uuid
      LEFT JOIN guesses g ON qs.id = g.session_id
      GROUP BY qs.id, qs.quiz_id, qs.score, qs.created_at, qs.ended_at, u.user_uuid
      ORDER BY qs.created_at DESC
    `)

    if (result.rows.length === 0) {
      console.log('No quiz sessions found')
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

    const filename = `quiz_sessions_export_${new Date().toISOString().split('T')[0]}.csv`
    fs.writeFileSync(filename, csv)

    console.log(`\n✓ Exported ${result.rows.length} quiz sessions to ${filename}`)
    console.log(`\nFirst 10 sessions (most recent):`)
    console.table(result.rows.slice(0, 10))

    await pool.end()
  } catch (err) {
    console.error('Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

exportQuizSessionsToCSV()
