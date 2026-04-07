import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5433,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

/**
 * Export detailed guesses with readable timestamps and participant info
 */
async function exportGuessesReadable() {
  try {
    console.log('Fetching guesses data...')
    const result = await pool.query(`
      SELECT 
        u.user_uuid::text as participant_code,
        u.id as user_id,
        g.session_id,
        qs.quiz_id,
        qs.created_at as session_start_ms,
        to_timestamp(qs.created_at::double precision / 1000) AT TIME ZONE 'UTC' as session_start_readable,
        qs.ended_at as session_end_ms,
        to_timestamp(qs.ended_at::double precision / 1000) AT TIME ZONE 'UTC' as session_end_readable,
        qs.score as final_score,
        g.guess_order,
        g.ts as guess_time_ms,
        to_timestamp(g.ts::double precision / 1000) AT TIME ZONE 'UTC' as guess_time_readable,
        g.guessed_word,
        g.part_of_speech,
        g.correct,
        g.score_before_guess,
        g.score_after_guess
      FROM guesses g
      LEFT JOIN quiz_sessions qs ON g.session_id = qs.id
      LEFT JOIN users u ON g.user_id = u.user_uuid
      ORDER BY g.ts DESC
    `)

    if (result.rows.length === 0) {
      console.log('No guesses found')
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

    // Generate filename with timestamp including hours/minutes/seconds
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    const filename = `guesses_export_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.csv`
    const filepath = path.join(__dirname, '..', 'data', filename)
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    fs.writeFileSync(filepath, csv)

    console.log(`\n✓ Exported ${result.rows.length} guesses to ${filepath}`)
    console.log(`\nFirst 10 guesses (most recent):`)
    console.table(result.rows.slice(0, 10))

    await pool.end()
  } catch (err) {
    console.error('Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

exportGuessesReadable()
