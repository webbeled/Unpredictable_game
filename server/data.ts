import { loadAllOdsFiles, SheetData } from './odsLoader';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface QuizEntry {
  id: string;
  fileName: string;
  sheetName: string;
  annotate: string;
  to_annotate?: string;
}

export interface QuizAnswer {
  id: string;
  solution: string;
  solution_adj?: string;
  solution_closed_class?: string;
  solution_nouns?: string;
  solution_numbers?: string;
  solution_proper_nouns?: string;
  solution_verbs?: string;
  to_annotate?: string;
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

// Per-user seen-article tracking keyed by userId + lang
const seenByUser: Map<string, Set<string>> = new Map();

/**
 * Format an ID from CSV (ensures it's a string)
 */
function formatId(csvId: any): string {
  return String(csvId).trim();
}

/**
 * Load all ODS files and cache them
 */
export function loadData(): Record<string, SheetData> {
  if (!cachedOdsData) {
    const dataDir = path.join(__dirname, '..', 'src', 'assets', 'data');
    console.log('Loading data from:', dataDir);
    cachedOdsData = loadAllOdsFiles(dataDir);
    console.log('Data loaded successfully. Files:', Object.keys(cachedOdsData));

    // Build index of all entries
    allEntries = [];
    entryMap.clear();

    for (const [fileName, fileData] of Object.entries(cachedOdsData)) {
      for (const [sheetName, sheetData] of Object.entries(fileData)) {
        sheetData.forEach((rowData, rowIndex) => {
          const annotate = rowData.annotate || rowData.Annotate || rowData.annotation || rowData.text || JSON.stringify(rowData);
          // Use ID from CSV if available, otherwise fall back to row index as string
          const id = rowData.ID ? formatId(rowData.ID) : String(rowIndex);

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

    console.log(`Loaded ${Object.keys(cachedOdsData).length} ODS/CSV files with ${allEntries.length} total entries`);
  }
  return cachedOdsData;
}

/**
 * Determine the language from the filename
 */
function getLanguageFromFileName(fileName: string): 'en' | 'fr' {
  if (fileName.toUpperCase().includes('FR')) {
    return 'fr';
  }
  return 'en';
}

/**
 * Filter entries by language
 */
function filterEntriesByLanguage(entries: FullEntry[], lang: 'en' | 'fr'): FullEntry[] {
  return entries.filter(entry => getLanguageFromFileName(entry.fileName) === lang);
}

/**
 * Pick a random quiz entry (without solution)
 */
export function getRandomQuiz(lang: 'en' | 'fr' = 'en'): QuizEntry {
  loadData(); // Ensure data is loaded

  if (allEntries.length === 0) {
    throw new Error('No quiz entries found');
  }

  const filteredEntries = filterEntriesByLanguage(allEntries, lang);
  if (filteredEntries.length === 0) {
    throw new Error(`No quiz entries found for language: ${lang}`);
  }

  const randomEntry = filteredEntries[Math.floor(Math.random() * filteredEntries.length)];
  const id = randomEntry.rowData.ID ? formatId(randomEntry.rowData.ID) : String(randomEntry.rowIndex);

  return {
    id,
    fileName: randomEntry.fileName,
    sheetName: randomEntry.sheetName,
    annotate: randomEntry.annotate,
    to_annotate: randomEntry.rowData.to_annotate,
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

  // Try to get the main solution field (for backward compatibility)
  const solution = entry.rowData.solution || entry.rowData.Solution || entry.rowData.SOLUTION ||
                   entry.rowData.to_annotate || '';

  return {
    id,
    solution,
    solution_adj: entry.rowData.solution_adj,
    solution_closed_class: entry.rowData.solution_closed_class,
    solution_nouns: entry.rowData.solution_nouns,
    solution_numbers: entry.rowData.solution_numbers,
    solution_proper_nouns: entry.rowData.solution_proper_nouns,
    solution_verbs: entry.rowData.solution_verbs,
    to_annotate: entry.rowData.to_annotate,
  };
}

/**
 * Check if a guess is correct for a quiz
 * Returns the mask number and solution word if correct, null if quiz not found, false if incorrect
 */
export function checkGuess(id: string, guess: string): { mask: string; word: string } | false | null {
  loadData(); // Ensure data is loaded

  const entry = entryMap.get(id);
  if (!entry) {
    return null;
  }

  const normalizedGuess = guess.toLowerCase().trim();

  // Map solution fields to their mask numbers
  const solutionMap = [
    { mask: '1111', field: entry.rowData.solution_adj },
    { mask: '2222', field: entry.rowData.solution_closed_class },
    { mask: '3333', field: entry.rowData.solution_nouns },
    { mask: '4444', field: entry.rowData.solution_numbers },
    { mask: '5555', field: entry.rowData.solution_proper_nouns },
    { mask: '6666', field: entry.rowData.solution_verbs },
  ];

  for (const { mask, field } of solutionMap) {
    if (field) {
      const normalizedSolution = String(field).toLowerCase().trim();
      if (normalizedGuess === normalizedSolution) {
        return { mask, word: String(field) };
      }
    }
  }

  return false;
}

/**
 * Compute the current "day epoch" adjusted for 2AM GMT daily reset.
 * Returns the same number for everyone between 2AM GMT today and 2AM GMT tomorrow.
 */
export function getDayEpoch(): number {
  const now = new Date();
  const reset = new Date(now);
  reset.setUTCHours(2, 0, 0, 0);
  // If we haven't reached 2AM UTC yet, use yesterday's reset
  if (now.getTime() < reset.getTime()) {
    reset.setUTCDate(reset.getUTCDate() - 1);
  }
  return Math.floor(reset.getTime() / (24 * 60 * 60 * 1000));
}

/**
 * Return when the next daily reset is (2AM GMT).
 */
export function getNextDailyReset(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(2, 0, 0, 0);
  next.setUTCSeconds(0, 0);
  if (now.getTime() >= next.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

/**
 * Return today's daily article — deterministic, same for every user.
 */
export function getDailyQuiz(lang: 'en' | 'fr' = 'en'): QuizEntry {
  loadData();

  const filteredEntries = filterEntriesByLanguage(allEntries, lang);
  if (filteredEntries.length === 0) {
    throw new Error(`No quiz entries found for language: ${lang}`);
  }

  const index = getDayEpoch() % filteredEntries.length;
  const entry = filteredEntries[index];
  const id = entry.rowData.ID ? formatId(entry.rowData.ID) : String(entry.rowIndex);

  return {
    id,
    fileName: entry.fileName,
    sheetName: entry.sheetName,
    annotate: entry.annotate,
    to_annotate: entry.rowData.to_annotate,
  };
}

/**
 * Get a random unseen quiz for a user, tracking seen articles in memory.
 * Cycles through all articles before repeating.
 */
export function getRandomUnseenQuiz(userId: string, lang: 'en' | 'fr' = 'en'): QuizEntry {
  loadData();

  if (allEntries.length === 0) {
    throw new Error('No quiz entries found');
  }

  const filteredEntries = filterEntriesByLanguage(allEntries, lang);
  if (filteredEntries.length === 0) {
    throw new Error(`No quiz entries found for language: ${lang}`);
  }

  const key = `${userId}:${lang}`;
  let seen = seenByUser.get(key);
  if (!seen) {
    seen = new Set<string>();
    seenByUser.set(key, seen);
  }

  let available = filteredEntries.filter(entry => {
    const id = entry.rowData.ID ? formatId(entry.rowData.ID) : String(entry.rowIndex);
    return !seen!.has(id);
  });

  // All seen — reset and start the cycle again
  if (available.length === 0) {
    seen.clear();
    available = filteredEntries;
  }

  const randomEntry = available[Math.floor(Math.random() * available.length)];
  const id = randomEntry.rowData.ID ? formatId(randomEntry.rowData.ID) : String(randomEntry.rowIndex);
  seen.add(id);

  return {
    id,
    fileName: randomEntry.fileName,
    sheetName: randomEntry.sheetName,
    annotate: randomEntry.annotate,
    to_annotate: randomEntry.rowData.to_annotate,
  };
}
