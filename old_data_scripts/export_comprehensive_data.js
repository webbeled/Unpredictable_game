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
 * Determine language from first_language_is_english field
 */
function getLanguage(firstLanguageIsEnglish) {
  if (firstLanguageIsEnglish === true) return 'english'
  if (firstLanguageIsEnglish === false) return 'french'
  return 'unknown'
}

/**
 * Export comprehensive guesses data with language preference and paragraph IDs
 */
async function exportComprehensiveData() {
  try {
    console.log('Fetching comprehensive guesses data with language preferences...')
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.participant_code,
        u.first_language_is_english,
        g.session_id,
        g.quiz_id as paragraph_id,
        qs.created_at as session_start_ms,
        to_timestamp(qs.created_at::double precision / 1000) AT TIME ZONE 'UTC' as session_start_readable,
        qs.ended_at as session_end_ms,
        CASE WHEN qs.ended_at IS NOT NULL THEN to_timestamp(qs.ended_at::double precision / 1000) AT TIME ZONE 'UTC' ELSE NULL END as session_end_readable,
        qs.score as final_session_score,
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
      LEFT JOIN users u ON g.user_id = u.id
      ORDER BY g.ts DESC
    `)

    if (result.rows.length === 0) {
      console.log('No guesses found')
      await pool.end()
      return
    }

    // Create CSV with language column added
    const headers = [
      'user_id',
      'participant_code',
      'session_id',
      'paragraph_id',
      'language',
      'session_start_ms',
      'session_start_readable',
      'session_end_ms',
      'session_end_readable',
      'final_session_score',
      'guess_order',
      'guess_time_ms',
      'guess_time_readable',
      'guessed_word',
      'part_of_speech',
      'correct',
      'score_before_guess',
      'score_after_guess'
    ]

    const csv = [
      headers.join(','),
      ...result.rows.map(row => {
        const language = getLanguage(row.first_language_is_english)
        return [
          row.user_id || '',
          row.participant_code || '',
          row.session_id || '',
          row.paragraph_id || '',
          language,
          row.session_start_ms || '',
          row.session_start_readable || '',
          row.session_end_ms || '',
          row.session_end_readable || '',
          row.final_session_score || '',
          row.guess_order || '',
          row.guess_time_ms || '',
          row.guess_time_readable || '',
          row.guessed_word || '',
          row.part_of_speech || '',
          row.correct ? '1' : '0',
          row.score_before_guess || '',
          row.score_after_guess || ''
        ].map(val => {
          if (val === null || val === undefined || val === '') return ''
          const str = String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',')
      })
    ].join('\n')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `comprehensive_guesses_${timestamp}.csv`
    const filepath = path.join(__dirname, '..', '..', 'data', filename)
    
    // Ensure data directory exists
    const dataDir = path.dirname(filepath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    fs.writeFileSync(filepath, csv)

    console.log(`\n✓ Exported ${result.rows.length} guesses to ${filepath}`)
    console.log(`\nFirst 10 guesses (most recent):`)
    
    // Display preview
    const previewRows = result.rows.slice(0, 10).map(row => ({
      user_id: row.user_id,
      participant_code: (row.participant_code || '').substring(0, 8) + '...',
      paragraph_id: row.paragraph_id,
      language: getLanguage(row.first_language_is_english),
      guessed_word: row.guessed_word,
      part_of_speech: row.part_of_speech,
      correct: row.correct ? '✓' : '✗',
      score_after: row.score_after_guess
    }))
    console.table(previewRows)

    await pool.end()
  } catch (err) {
    console.error('Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

exportComprehensiveData()
