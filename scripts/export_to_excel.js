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
 * Simple function to convert array of objects to XLSX-like format using a library-free approach
 * We'll create a CSV then convert to JSON for Excel-like viewing
 */
async function exportToExcel() {
  try {
    console.log('Fetching latest quiz sessions...')
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
      LIMIT 50
    `)

    if (result.rows.length === 0) {
      console.log('No quiz sessions found')
      await pool.end()
      return
    }

    // Try to use xlsx if available, otherwise create CSV
    try {
      const XLSX = await import('xlsx')

      const normalizedRows = result.rows.map((row) => {
        const normalizedRow = { ...row }

        scoreColumns.forEach((column) => {
          if (normalizedRow[column] === null || normalizedRow[column] === undefined) {
            normalizedRow[column] = 'NA'
          }
        })

        return normalizedRow
      })

      const ws = XLSX.utils.json_to_sheet(normalizedRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Quiz Sessions')
      
      const exportDir = path.join(__dirname, '..')
      const fileName = 'quiz_sessions_export.xlsx'
      const filePath = path.join(exportDir, fileName)
      
      XLSX.writeFile(wb, filePath)
      console.log(`✅ Exported ${result.rows.length} quiz sessions to ${filePath}`)
    } catch (err) {
      // Fallback to CSV if xlsx not available
      console.log('xlsx not installed, creating CSV instead...')
      
      const headers = [
        'id', 'quiz_id', 'user_id', 'score', 'created_at', 'ended_at',
        'adj_score_before_guess', 'adj_correct', 'adj_guesses',
        'func_score_before_guess', 'func_correct', 'func_guesses',
        'noun_score_before_guess', 'noun_correct', 'noun_guesses',
        'num_score_before_guess', 'num_correct', 'num_guesses',
        'propn_score_before_guess', 'propn_correct', 'propn_guesses',
        'verb_score_before_guess', 'verb_correct', 'verb_guesses',
      ]

      const escapeCSV = (value, header) => {
        if (value === null || value === undefined) {
          if (scoreColumns.has(header)) {
            return 'NA'
          }
          return ''
        }
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      let csvContent = headers.join(',') + '\n'
      result.rows.forEach((row) => {
        const values = headers.map((header) => escapeCSV(row[header], header))
        csvContent += values.join(',') + '\n'
      })

      const exportDir = path.join(__dirname, '..')
      const fileName = 'quiz_sessions_export.csv'
      const filePath = path.join(exportDir, fileName)

      fs.writeFileSync(filePath, csvContent, 'utf-8')
      console.log(`✅ Exported ${result.rows.length} quiz sessions to ${filePath}`)
    }

  } catch (err) {
    console.error('Error exporting data:', err)
  } finally {
    await pool.end()
  }
}

exportToExcel()
