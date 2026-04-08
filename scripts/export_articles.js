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
 * Export articles with their IDs and metadata
 */
async function exportArticles() {
  try {
    console.log('Fetching articles data...')
    const result = await pool.query(`
      SELECT 
        id as article_id,
        title,
        source,
        content,
        created_at
      FROM articles
      ORDER BY created_at DESC
    `)

    if (result.rows.length === 0) {
      console.log('No articles found')
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

    const filename = `articles_export_${new Date().toISOString().split('T')[0]}.csv`
    const filepath = path.join(__dirname, '..', 'data', filename)
    
    fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true })
    fs.writeFileSync(filepath, csv)

    console.log(`\n✓ Exported ${result.rows.length} articles to ${filepath}`)
    console.log(`\nFirst 10 articles:`)
    console.table(result.rows.slice(0, 10).map(row => ({ article_id: row.id, title: row.title, source: row.source })))

    await pool.end()
  } catch (err) {
    console.error('Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

exportArticles()
