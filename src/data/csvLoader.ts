import Papa from 'papaparse';

export interface RawCsvRow {
  [key: string]: string | number | null | undefined;
}

export async function fetchCsv(url: string): Promise<RawCsvRow[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  const parsed = Papa.parse<RawCsvRow>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  if (parsed.errors && parsed.errors.length > 0) {
    // Keep going but surface first error for debugging
    // This should be logged by callers if needed
    // eslint-disable-next-line no-console
    console.warn('CSV parse errors:', parsed.errors.slice(0, 3));
  }
  return (parsed.data || []) as RawCsvRow[];
}

export function getField(row: RawCsvRow, keys: string[], fallback: number = 0): number {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.replace(/[$,%]/g, ''));
      if (!Number.isNaN(n)) return n;
    }
  }
  return fallback;
}

export function getString(row: RawCsvRow, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return fallback;
}

/**
 * Normalize player name for matching across different CSV formats
 * Handles: "Aaron Judge", "Judge, Aaron", "Vladimir Guerrero Jr."
 */
export function normalizePlayerName(name: string): string {
  if (!name) return '';
  
  // Remove extra whitespace
  let normalized = name.trim().replace(/\s+/g, ' ');
  
  // Handle "Last, First" format (from Statcast)
  if (normalized.includes(',')) {
    const parts = normalized.split(',').map(p => p.trim());
    if (parts.length === 2) {
      // Convert "Last, First" to "First Last"
      normalized = `${parts[1]} ${parts[0]}`;
    }
  }
  
  // Convert to lowercase for case-insensitive matching
  return normalized.toLowerCase();
}

/**
 * Fetch multiple CSVs in parallel
 */
export async function fetchMultipleCsvs(urls: string[]): Promise<RawCsvRow[][]> {
  const results = await Promise.all(urls.map(url => fetchCsv(url)));
  return results;
}

/**
 * Merge multiple CSV data sets by player name
 * Fangraphs data is the base, with Spotrac and Statcast data merged in
 */
export function mergeCsvRowsByName(
  fangraphsRows: RawCsvRow[],
  spotracRows: RawCsvRow[],
  statscastRows: RawCsvRow[]
): RawCsvRow[] {
  // Create lookup maps by normalized name and year
  const spotracMap = new Map<string, RawCsvRow>();
  const statscastMap = new Map<string, RawCsvRow>();
  
  // Index Spotrac data by player name (no year in Spotrac, so use name only)
  for (const row of spotracRows) {
    const playerName = getString(row, ['Player']);
    if (playerName) {
      const normalized = normalizePlayerName(playerName);
      spotracMap.set(normalized, row);
    }
  }
  
  // Index Statscast data by player name and year
  for (const row of statscastRows) {
    const playerName = getString(row, ['last_name, first_name']);
    const year = getField(row, ['year']);
    if (playerName && year) {
      const normalized = normalizePlayerName(playerName);
      const key = `${normalized}|${year}`;
      statscastMap.set(key, row);
    }
  }
  
  // Merge: start with Fangraphs rows, add matching data from other sources
  const merged: RawCsvRow[] = [];
  
  for (const fgRow of fangraphsRows) {
    const playerName = getString(fgRow, ['Name']);
    const season = getField(fgRow, ['Season']);
    
    if (!playerName) continue;
    
    const normalizedName = normalizePlayerName(playerName);
    const mergedRow: RawCsvRow = { ...fgRow };
    
    // Add Spotrac data (if available)
    const spotracRow = spotracMap.get(normalizedName);
    if (spotracRow) {
      // Copy all Spotrac fields with sp_ prefix
      Object.keys(spotracRow).forEach(key => {
        if (!mergedRow[key]) {
          mergedRow[key] = spotracRow[key];
        }
      });
    }
    
    // Add Statscast data (if available for this year)
    const statscastKey = `${normalizedName}|${season}`;
    const statscastRow = statscastMap.get(statscastKey);
    if (statscastRow) {
      // Copy all Statscast fields with sc_ prefix
      Object.keys(statscastRow).forEach(key => {
        if (!mergedRow[key]) {
          mergedRow[key] = statscastRow[key];
        }
      });
    }
    
    merged.push(mergedRow);
  }
  
  return merged;
}


