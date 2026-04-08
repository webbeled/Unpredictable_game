import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCsvFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath, 'utf-8');
    const workbook = XLSX.read(buffer, { type: 'string', codepage: 65001 });
    const sheetName = workbook.SheetNames[0] || 'Sheet1';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error(`Failed to load CSV file from ${filePath}: ${error.message}`);
  }
}

function formatId(csvId) {
  return String(csvId).trim();
}

// Load the CSV file
const dataDir = path.join(__dirname, '..', 'src', 'assets', 'data');
const csvPath = path.join(dataDir, 'Base_vignettes_all_pos_combined.csv');

console.log('Loading CSV from:', csvPath);
const data = loadCsvFile(csvPath);

console.log(`\nLoaded ${data.length} rows\n`);
console.log('First 5 quizzes with their IDs:\n');

// Display first 5 entries
data.slice(0, 5).forEach((row, index) => {
  const id = row.ID ? formatId(row.ID) : String(index);
  const annotate = (row.annotate || row.Annotate || '').substring(0, 60);
  console.log(`Row ${index}:`);
  console.log(`  ID: ${id}`);
  console.log(`  Text preview: ${annotate}...`);
  console.log();
});

console.log('\n✅ CSV loading works! IDs are being read correctly.');
