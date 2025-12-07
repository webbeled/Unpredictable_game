import { loadAllOdsFiles, SheetData } from './odsLoader';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface QuizEntry {
  id: string;
  fileName: string;
  sheetName: string;
  annotate: string;
}

export interface QuizAnswer {
  id: string;
  solution: string;
}

interface FullEntry {
  fileName: string;
  sheetName: string;
  rowIndex: number;
  rowData: any;
  annotate: string;
}

let cachedOdsData: Record<string, SheetData> | null = null;
let allEntries: FullEntry[] = [];
let entryMap: Map<string, FullEntry> = new Map();

/**
 * Generate a unique ID for an entry
 */
function generateId(fileName: string, sheetName: string, rowIndex: number): string {
  const data = `${fileName}:${sheetName}:${rowIndex}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Load all ODS files and cache them
 */
export function loadData(): Record<string, SheetData> {
  if (!cachedOdsData) {
    const dataDir = path.join(__dirname, '..', 'src', 'assets', 'data');
    cachedOdsData = loadAllOdsFiles(dataDir);

    // Build index of all entries
    allEntries = [];
    entryMap.clear();

    for (const [fileName, fileData] of Object.entries(cachedOdsData)) {
      for (const [sheetName, sheetData] of Object.entries(fileData)) {
        sheetData.forEach((rowData, rowIndex) => {
          const annotate = rowData.annotate || rowData.Annotate || rowData.annotation || rowData.text || JSON.stringify(rowData);
          const id = generateId(fileName, sheetName, rowIndex);

          const entry: FullEntry = {
            fileName,
            sheetName,
            rowIndex,
            rowData,
            annotate,
          };

          allEntries.push(entry);
          entryMap.set(id, entry);
        });
      }
    }

    console.log(`Loaded ${Object.keys(cachedOdsData).length} ODS files with ${allEntries.length} total entries`);
  }
  return cachedOdsData;
}

/**
 * Pick a random quiz entry (without solution)
 */
export function getRandomQuiz(): QuizEntry {
  loadData(); // Ensure data is loaded

  if (allEntries.length === 0) {
    throw new Error('No quiz entries found');
  }

  const randomEntry = allEntries[Math.floor(Math.random() * allEntries.length)];
  const id = generateId(randomEntry.fileName, randomEntry.sheetName, randomEntry.rowIndex);

  return {
    id,
    fileName: randomEntry.fileName,
    sheetName: randomEntry.sheetName,
    annotate: randomEntry.annotate,
  };
}

/**
 * Get the answer for a quiz by ID
 */
export function getQuizAnswer(id: string): QuizAnswer | null {
  loadData(); // Ensure data is loaded

  const entry = entryMap.get(id);
  if (!entry) {
    return null;
  }

  const solution = entry.rowData.solution || entry.rowData.Solution || entry.rowData.SOLUTION || '';

  return {
    id,
    solution,
  };
}

/**
 * Check if a guess is correct for a quiz
 */
export function checkGuess(id: string, guess: string): boolean | null {
  loadData(); // Ensure data is loaded

  const entry = entryMap.get(id);
  if (!entry) {
    return null;
  }

  const solution = entry.rowData.solution || entry.rowData.Solution || entry.rowData.SOLUTION || '';
  return guess.toLowerCase().trim() === solution.toLowerCase().trim();
}
