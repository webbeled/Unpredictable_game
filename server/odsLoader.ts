import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface SheetData {
  [key: string]: any[];
}

/**
 * Load and parse an ODS file from the file system
 * @param filePath - Path to the ODS file
 * @returns Object with sheet names as keys and data arrays as values
 */
export function loadOdsFile(filePath: string): SheetData {
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Convert all sheets to JSON
    const result: SheetData = {};
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to load ODS file from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load and parse a CSV file from the file system
 * @param filePath - Path to the CSV file
 * @returns Object with 'Sheet1' as key and data array as value
 */
export function loadCsvFile(filePath: string): SheetData {
  try {
    const buffer = fs.readFileSync(filePath, 'utf-8');
    const workbook = XLSX.read(buffer, { type: 'string', codepage: 65001 }); // 65001 is UTF-8

    // Convert first sheet to JSON (CSV files typically have one sheet)
    const result: SheetData = {};
    const sheetName = workbook.SheetNames[0] || 'Sheet1';
    const worksheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(worksheet);

    return result;
  } catch (error) {
    throw new Error(`Failed to load CSV file from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load all ODS and CSV files from a directory
 * @param dirPath - Path to the directory containing ODS/CSV files
 * @returns Object with file names as keys and their sheet data as values
 */
export function loadAllOdsFiles(dirPath: string): Record<string, SheetData> {
  const result: Record<string, SheetData> = {};

  try {
    const files = fs.readdirSync(dirPath);
    const dataFiles = files.filter(file => file.endsWith('.ods') || file.endsWith('.csv'));

    for (const fileName of dataFiles) {
      const filePath = path.join(dirPath, fileName);
      if (fileName.endsWith('.csv')) {
        result[fileName] = loadCsvFile(filePath);
      } else {
        result[fileName] = loadOdsFile(filePath);
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to load data files from ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
