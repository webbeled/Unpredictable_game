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
 * Load all ODS files from a directory
 * @param dirPath - Path to the directory containing ODS files
 * @returns Object with file names as keys and their sheet data as values
 */
export function loadAllOdsFiles(dirPath: string): Record<string, SheetData> {
  const result: Record<string, SheetData> = {};

  try {
    const files = fs.readdirSync(dirPath);
    const odsFiles = files.filter(file => file.endsWith('.ods'));

    for (const fileName of odsFiles) {
      const filePath = path.join(dirPath, fileName);
      result[fileName] = loadOdsFile(filePath);
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to load ODS files from ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
