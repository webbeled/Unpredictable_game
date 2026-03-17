#!/bin/bash

cd /home/owenk/project/Unpredictable_game

# Create data directory if it doesn't exist
mkdir -p data

# Run the export
node --input-type=module - <<'EOF'
import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
})

function convertToCSV(data) {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.map(h => `"${h}"`).join(',')
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      if (typeof value === 'boolean') return value ? 'true' : 'false'
      return String(value)
    }).join(',')
  })
  
  return [csvHeaders, ...csvRows].join('\n')
}

try {
  console.log('📊 Exporting all data...\n')

  // Export quiz_sessions
  console.log('Fetching quiz sessions...')
  const sessionsResult = await pool.query(`
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

  const sessionsCSV = convertToCSV(sessionsResult.rows)
  fs.writeFileSync('data/quiz_sessions.csv', sessionsCSV)
  console.log(`✅ Exported ${sessionsResult.rows.length} quiz sessions`)

  // Export articles
  console.log('Fetching articles...')
  const articlesResult = await pool.query(`
    SELECT 
      id,
      article_id,
      title,
      text,
      created_at
    FROM articles
    ORDER BY created_at DESC
  `)

  const articlesCSV = convertToCSV(articlesResult.rows)
  fs.writeFileSync('data/articles.csv', articlesCSV)
  console.log(`✅ Exported ${articlesResult.rows.length} articles`)

  // Export guessed_words_expanded
  console.log('Fetching guessed words...')
  const guessedWordsResult = await pool.query(`
    SELECT 
      id,
      session_id,
      word,
      correct,
      pos,
      created_at
    FROM guessed_words_expanded
    ORDER BY created_at DESC
  `)

  const guessedWordsCSV = convertToCSV(guessedWordsResult.rows)
  fs.writeFileSync('data/guessed_words.csv', guessedWordsCSV)
  console.log(`✅ Exported ${guessedWordsResult.rows.length} guessed words`)

  // Export users (if exists)
  try {
    console.log('Fetching users...')
    const usersResult = await pool.query(`
      SELECT 
        id,
        email,
        created_at
      FROM users
      ORDER BY created_at DESC
    `)

    const usersCSV = convertToCSV(usersResult.rows)
    fs.writeFileSync('data/users.csv', usersCSV)
    console.log(`✅ Exported ${usersResult.rows.length} users`)
  } catch (e) {
    console.log('⚠️  Users table not found or error reading')
  }

  console.log('\n✨ All data exported to data/ directory!')
  await pool.end()
} catch (error) {
  console.error('Error exporting data:', error.message)
  process.exit(1)
}
EOF

chmod +x export_all_data.sh
