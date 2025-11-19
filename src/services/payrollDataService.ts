// ============================================================================
// PAYROLL DATA SERVICE
// ============================================================================
// Service to load and manage MLB team payroll commitments data from CSV
// ============================================================================

import { fetchCsv, getField, getString, type RawCsvRow } from '../data/csvLoader';

export interface TeamPayrollYearlyData {
  team: string;
  teamId: string;
  2026: number;
  2027: number;
  2028: number;
  2029: number;
  2030: number;
  2031: number;
}

export interface TeamPayrollData {
  team: string;
  teamId: string;
  payrollByYear: {
    year: number;
    payroll: number;
  }[];
}

/**
 * Loads MLB payroll commitments CSV data
 * Expected CSV format: Team, 2026, 2027, 2028, 2029, 2030, 2031
 * CSV uses team abbreviations (LAD, NYM, etc.) and values in dollars
 */
export async function loadPayrollData(): Promise<TeamPayrollData[]> {
  const csvUrl = '/mlb_payroll_commitments_2026_2031.csv';
  
  try {
    const rows = await fetchCsv(csvUrl);
    
    if (!rows || rows.length === 0) {
      console.warn('No payroll data found in CSV file');
      return [];
    }
    
    const teamData: TeamPayrollData[] = [];
    const years = [2026, 2027, 2028, 2029, 2030, 2031];
    
    for (const row of rows) {
      // Try multiple possible column names for team
      const teamAbbr = getString(row, ['Team', 'team', 'TEAM', 'Team Name', 'TEAM_NAME', 'TeamName']);
      if (!teamAbbr || teamAbbr.trim() === '') continue;
      
      // Skip totals row
      const normalized = teamAbbr.trim().toUpperCase();
      if (normalized === 'TOTALS' || normalized === 'TOTAL') continue;
      
      // Use abbreviation as team ID (CSV uses abbreviations like LAD, NYM, etc.)
      const teamId = normalized;
      
      // Get full team name from abbreviation
      const teamName = getTeamNameFromAbbr(teamId);
      
      const payrollByYear = years.map(year => {
        // Get the payroll value in dollars
        // Try the year as a string first (most common format)
        const yearStr = year.toString();
        let payrollDollars = getField(row, [yearStr], 0);
        
        // If not found, try alternative formats
        if (payrollDollars === 0) {
          payrollDollars = getField(row, [
            `Year ${year}`, 
            `FY${year}`, 
            `_${year}`,
            ` ${year}`
          ], 0);
        }
        
        // Handle empty strings or null values (some years may be blank)
        if (payrollDollars === 0 && row[yearStr] !== undefined) {
          const rawValue = row[yearStr];
          // If it's an empty string or null, keep it as 0
          if (rawValue === '' || rawValue === null || rawValue === undefined) {
            payrollDollars = 0;
          }
        }
        
        // Convert from dollars to millions (divide by 1,000,000)
        // Round to 1 decimal place for accuracy
        const payrollMillions = payrollDollars > 0 ? Math.round((payrollDollars / 1000000) * 10) / 10 : 0;
        return { year, payroll: payrollMillions };
      });
      
      // Only add teams that have at least some payroll data
      const hasData = payrollByYear.some(p => p.payroll > 0);
      if (hasData) {
        teamData.push({
          team: teamName, // Use full name for display
          teamId, // Use abbreviation as ID
          payrollByYear
        });
      }
    }
    
    console.log(`Loaded payroll data for ${teamData.length} teams from CSV`);
    if (teamData.length > 0) {
      console.log('Sample team data:', teamData[0]);
      // Log Chicago Cubs specifically for verification
      const cubsData = teamData.find(t => t.teamId === 'CHC');
      if (cubsData) {
        console.log('Chicago Cubs payroll data:', cubsData);
      }
    }
    
    return teamData;
  } catch (error) {
    console.error('Error loading payroll data from CSV:', error);
    // Return empty array to allow fallback behavior
    return [];
  }
}

/**
 * Get payroll data for a specific team
 */
export function getTeamPayrollData(
  allData: TeamPayrollData[],
  teamId: string
): TeamPayrollData | undefined {
  return allData.find(t => t.teamId === teamId);
}

/**
 * Get all available teams
 */
export function getAvailableTeams(allData: TeamPayrollData[]): Array<{ id: string; name: string }> {
  return allData.map(t => ({ id: t.teamId, name: t.team }));
}

/**
 * Get full team name from abbreviation
 */
function getTeamNameFromAbbr(abbr: string): string {
  const teamNames: Record<string, string> = {
    'LAD': 'Los Angeles Dodgers',
    'NYM': 'New York Mets',
    'ATL': 'Atlanta Braves',
    'NYY': 'New York Yankees',
    'SD': 'San Diego Padres',
    'TOR': 'Toronto Blue Jays',
    'PHI': 'Philadelphia Phillies',
    'HOU': 'Houston Astros',
    'BOS': 'Boston Red Sox',
    'CHC': 'Chicago Cubs',
    'TEX': 'Texas Rangers',
    'SF': 'San Francisco Giants',
    'LAA': 'Los Angeles Angels',
    'MIL': 'Milwaukee Brewers',
    'ARI': 'Arizona Diamondbacks',
    'SEA': 'Seattle Mariners',
    'KC': 'Kansas City Royals',
    'STL': 'St. Louis Cardinals',
    'COL': 'Colorado Rockies',
    'DET': 'Detroit Tigers',
    'TB': 'Tampa Bay Rays',
    'CIN': 'Cincinnati Reds',
    'MIN': 'Minnesota Twins',
    'WSH': 'Washington Nationals',
    'ATH': 'Oakland Athletics', // CSV uses ATH instead of OAK
    'OAK': 'Oakland Athletics',
    'CHW': 'Chicago White Sox',
    'CWS': 'Chicago White Sox',
    'CLE': 'Cleveland Guardians',
    'PIT': 'Pittsburgh Pirates',
    'BAL': 'Baltimore Orioles',
    'MIA': 'Miami Marlins',
  };
  
  return teamNames[abbr.toUpperCase()] || abbr;
}

/**
 * Generate team ID from team name
 * Maps common team names to their abbreviations
 * This is kept for backward compatibility but CSV now uses abbreviations directly
 */
function generateTeamId(teamName: string): string {
  const normalized = teamName.toLowerCase().trim();
  
  // Common team name mappings
  const teamMap: Record<string, string> = {
    'new york mets': 'NYM',
    'mets': 'NYM',
    'los angeles dodgers': 'LAD',
    'dodgers': 'LAD',
    'atlanta braves': 'ATL',
    'braves': 'ATL',
    'st. louis cardinals': 'STL',
    'st louis cardinals': 'STL',
    'cardinals': 'STL',
    'toronto blue jays': 'TOR',
    'blue jays': 'TOR',
    'new york yankees': 'NYY',
    'yankees': 'NYY',
    'boston red sox': 'BOS',
    'red sox': 'BOS',
    'chicago cubs': 'CHC',
    'cubs': 'CHC',
    'chicago white sox': 'CWS',
    'white sox': 'CWS',
    'cleveland guardians': 'CLE',
    'guardians': 'CLE',
    'detroit tigers': 'DET',
    'tigers': 'DET',
    'houston astros': 'HOU',
    'astros': 'HOU',
    'kansas city royals': 'KC',
    'royals': 'KC',
    'los angeles angels': 'LAA',
    'angels': 'LAA',
    'miami marlins': 'MIA',
    'marlins': 'MIA',
    'milwaukee brewers': 'MIL',
    'brewers': 'MIL',
    'minnesota twins': 'MIN',
    'twins': 'MIN',
    'oakland athletics': 'OAK',
    'athletics': 'OAK',
    'philadelphia phillies': 'PHI',
    'phillies': 'PHI',
    'pittsburgh pirates': 'PIT',
    'pirates': 'PIT',
    'san diego padres': 'SD',
    'padres': 'SD',
    'san francisco giants': 'SF',
    'giants': 'SF',
    'seattle mariners': 'SEA',
    'mariners': 'SEA',
    'tampa bay rays': 'TB',
    'rays': 'TB',
    'texas rangers': 'TEX',
    'rangers': 'TEX',
    'washington nationals': 'WSH',
    'nationals': 'WSH',
    'colorado rockies': 'COL',
    'rockies': 'COL',
    'arizona diamondbacks': 'ARI',
    'diamondbacks': 'ARI',
    'baltimore orioles': 'BAL',
    'orioles': 'BAL',
    'cincinnati reds': 'CIN',
    'reds': 'CIN',
  };
  
  if (teamMap[normalized]) {
    return teamMap[normalized];
  }
  
  // If no mapping found, create abbreviation from first letters of words
  const words = normalized.split(/\s+/);
  if (words.length >= 2) {
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 3);
  }
  
  return normalized.slice(0, 3).toUpperCase();
}
