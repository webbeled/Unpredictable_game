import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

/**
 * Export quiz_sessions data to CSV
 * Each row represents one quiz session
 */
async function exportQuizSessionsToCSV() {
  try {
    console.log('Fetching quiz sessions data...')
    const scoreColumns = new Set([
      'adj_score_before_guess',
      'func_score_before_guess',
      'noun_score_before_guess',
      'num_score_before_guess',
      'propn_score_before_guess',
      'verb_score_before_guess',
    ])

    const result = await pool.query(`
      SELECT 
        id,
        quiz_id,
        user_id,
        score,
        created_at,
        ended_at,
        adj_score_before_guess,
        adj_correct,
        adj_guesses,
        func_score_before_guess,
        func_correct,
        func_guesses,
        noun_score_before_guess,
        noun_correct,
        noun_guesses,
        num_score_before_guess,
        num_correct,
        num_guesses,
        propn_score_before_guess,
        propn_correct,
        propn_guesses,
        verb_score_before_guess,
        verb_correct,
        verb_guesses
      FROM quiz_sessions
      ORDER BY created_at DESC
    `)

    if (result.rows.length === 0) {
      console.log('No quiz sessions found in database')
      await pool.end()
      return
    }

    // Define CSV headers
    const headers = [
      'id',
      'quiz_id',
      'user_id',
      'score',
      'created_at',
      'ended_at',
      'adj_score_before_guess',
      'adj_correct',
      'adj_guesses',
      'func_score_before_guess',
      'func_correct',
      'func_guesses',
      'noun_score_before_guess',
      'noun_correct',
      'noun_guesses',
      'num_score_before_guess',
      'num_correct',
      'num_guesses',
      'propn_score_before_guess',
      'propn_correct',
      'propn_guesses',
      'verb_score_before_guess',
      'verb_correct',
      'verb_guesses',
    ]

    // Helper function to escape CSV values
    const escapeCSV = (value, header) => {
      if (value === null || value === undefined) {
        if (scoreColumns.has(header)) {
          return 'NA'
        }
        return ''
      }
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"` // Double quotes and wrap in quotes
      }
      return str
    }

    // Build CSV content
    let csvContent = headers.join(',') + '\n'

    result.rows.forEach((row) => {
      const values = headers.map((header) => escapeCSV(row[header], header))
      csvContent += values.join(',') + '\n'
    })

    // Write to file
    const exportDir = path.join(__dirname, '..')
    const fileName = 'quiz_sessions_export.csv'
    const filePath = path.join(exportDir, fileName)

    fs.writeFileSync(filePath, csvContent, 'utf-8')
    console.log(`✅ Exported ${result.rows.length} quiz sessions to ${filePath}`)

  } catch (err) {
    console.error('Error exporting quiz sessions:', err)
  } finally {
    await pool.end()
  }
}

// Run the export
exportQuizSessionsToCSV()
