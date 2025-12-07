import * as XLSX from 'xlsx';

export interface SheetData {
  [key: string]: any[];
}

/**
 * Load and parse an ODS file
 * @param file - File object from file input
 * @returns Promise that resolves to an object with sheet names as keys and data arrays as values
 */
export async function loadOdsFile(file: File): Promise<SheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        // Read the workbook
        const workbook = XLSX.read(data, { type: 'array' });

        // Convert all sheets to JSON
        const result: SheetData = {};
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
        });

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Load a specific sheet from an ODS file
 * @param file - File object from file input
 * @param sheetName - Name of the sheet to load (defaults to first sheet)
 * @returns Promise that resolves to an array of row objects
 */
export async function loadOdsSheet(file: File, sheetName?: string): Promise<any[]> {
  const data = await loadOdsFile(file);
  const targetSheet = sheetName || Object.keys(data)[0];
  return data[targetSheet] || [];
}

/**
 * Load and parse an ODS file from a URL
 * @param url - URL to the ODS file
 * @returns Promise that resolves to an object with sheet names as keys and data arrays as values
 */
export async function loadOdsFromUrl(url: string): Promise<SheetData> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Convert all sheets to JSON
    const result: SheetData = {};
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to load ODS file from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
