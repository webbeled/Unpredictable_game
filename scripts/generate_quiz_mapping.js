import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'src', 'assets', 'data')

function generateId(fileName, sheetName, rowIndex) {
  const data = `${fileName}:${sheetName}:${rowIndex}`
  const h = crypto.createHash('sha256').update(data).digest('hex')
  const variant = ['8', '9', 'a', 'b'][parseInt(h[16], 16) & 3]
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`
}

async function generateQuizMapping() {
  console.log('Generating quiz ID to article mapping...')
  
  const mapping = []
  
  // Find all CSV files in the data directory
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'))
  
  for (const file of files) {
    const filePath = path.join(dataDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    // Parse CSV
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        results.data.forEach((row, rowIndex) => {
          const quizId = generateId(file, 'Sheet1', rowIndex)
          mapping.push({
            quiz_id: quizId,
            file_name: file,
            row_index: rowIndex,
            to_annotate: row.to_annotate || '',
            first_50_chars: (row.to_annotate || '').substring(0, 50)
          })
        })
      },
      error: (error) => {
        console.error(`Error parsing ${file}:`, error)
      }
    })
  }
  
  // Create CSV output
  const headers = ['quiz_id', 'file_name', 'row_index', 'first_50_chars']
  const csv = [
    headers.join(','),
    ...mapping.map(row =>
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        const str = String(value)
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(',')
    )
  ].join('\n')
  
  const outputPath = path.join(__dirname, '..', 'data', 'quiz_id_mapping.csv')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, csv)
  
  console.log(`\n✓ Generated mapping for ${mapping.length} quiz entries`)
  console.log(`✓ Saved to ${outputPath}`)
  console.log('\nFirst 10 entries:')
  console.table(mapping.slice(0, 10))
}

generateQuizMapping()
