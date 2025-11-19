// ============================================================================
// TEAM DATA SERVICE
// ============================================================================
// This service provides team payroll and financial data.
//
// BACKEND INTEGRATION GUIDE:
// When connecting to a real backend, replace the mock data returns with actual
// API calls. The function signatures and return types should remain the same.
//
// Expected API Endpoints:
// - GET /api/teams/:teamId/payroll - Returns TeamPayroll
// - GET /api/teams/:teamId/payroll/projections - Returns PayrollProjection[]
// - GET /api/league/luxury-tax-thresholds/:year - Returns luxury tax data
// ============================================================================

import type { TeamPayroll, PayrollProjection } from '../types';

// ============================================================================
// TEAM PAYROLL DATA
// ============================================================================

/**
 * Fetches current team payroll information
 * 
 * @param teamId - Team identifier (e.g., "NYM", "LAD")
 * @param year - Season year
 * @returns Promise<TeamPayroll> - Team's financial snapshot
 * 
 * BACKEND INTEGRATION:
 * Replace mock return with:
 * const response = await fetch(`/api/teams/${teamId}/payroll?year=${year}`);
 * return response.json();
 */
export async function getTeamPayroll(teamId: string, year: number = 2025): Promise<TeamPayroll> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // MOCK DATA - Replace with real API call
  return {
    teamId: teamId,
    teamName: getTeamName(teamId),
    year: year,
    basePayroll: 180, // Base payroll in millions (before adding new player)
    luxuryTaxThreshold: 241, // 2025 luxury tax threshold
  };
}

/**
 * Generates payroll projections with a new player contract
 * 
 * @param teamId - Team identifier
 * @param contractYears - Number of years in contract
 * @param yearlyImpact - Annual payroll impact per year
 * @returns Promise<PayrollProjection[]> - Year-by-year payroll projections
 * 
 * BACKEND INTEGRATION:
 * Replace mock return with:
 * const response = await fetch(`/api/teams/${teamId}/payroll/projections`, {
 *   method: 'POST',
 *   body: JSON.stringify({ contractYears, yearlyImpact })
 * });
 * return response.json();
 */
export async function getPayrollProjections(
  teamId: string,
  contractYears: number,
  yearlyImpact: number[]
): Promise<PayrollProjection[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Get current team data
  const teamData = await getTeamPayroll(teamId);
  const baseYear = 2025;
  
  // MOCK CALCULATION - Backend should handle this logic
  // This assumes a baseline payroll growth of 3% annually
  const projections: PayrollProjection[] = [];
  
  for (let i = 0; i < contractYears; i++) {
    const year = baseYear + i;
    const basePayroll = teamData.basePayroll * Math.pow(1.03, i); // 3% annual growth
    const playerContract = yearlyImpact[i] || 0;
    const totalPayroll = basePayroll + playerContract;
    
    // Determine luxury tax status
    // Thresholds typically increase ~3% annually
    const threshold = teamData.luxuryTaxThreshold * Math.pow(1.03, i);
    let luxuryTaxStatus: 'under' | 'tier1' | 'tier2' | 'tier3';
    
    if (totalPayroll < threshold) {
      luxuryTaxStatus = 'under';
    } else if (totalPayroll < threshold + 20) {
      luxuryTaxStatus = 'tier1';
    } else if (totalPayroll < threshold + 40) {
      luxuryTaxStatus = 'tier2';
    } else {
      luxuryTaxStatus = 'tier3';
    }
    
    projections.push({
      year,
      basePayroll,
      playerContract,
      totalPayroll,
      luxuryTaxStatus,
    });
  }
  
  return projections;
}

/**
 * Gets luxury tax thresholds for a given year
 * 
 * @param year - Season year
 * @returns Promise<number> - Luxury tax threshold in millions
 * 
 * BACKEND INTEGRATION:
 * Replace mock return with:
 * const response = await fetch(`/api/league/luxury-tax-thresholds/${year}`);
 * return response.json();
 */
export async function getLuxuryTaxThreshold(year: number): Promise<number> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // MOCK DATA - Replace with real API call
  // Real backend should return actual MLB luxury tax thresholds
  const baseThreshold = 241; // 2025 threshold
  const yearDiff = year - 2025;
  
  // Assume ~3% annual increase
  return baseThreshold * Math.pow(1.03, yearDiff);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper to get full team name from team ID
 * In production, this would come from the backend
 */
function getTeamName(teamId: string): string {
  const teamNames: Record<string, string> = {
    'NYM': 'New York Mets',
    'LAD': 'Los Angeles Dodgers',
    'ATL': 'Atlanta Braves',
    'STL': 'St. Louis Cardinals',
    'TOR': 'Toronto Blue Jays',
    'NYY': 'New York Yankees',
    'BOS': 'Boston Red Sox',
    // Add more teams as needed
  };
  
  return teamNames[teamId] || teamId;
}

/**
 * Calculates luxury tax penalty
 * Backend should handle this calculation with current CBA rules
 */
export function calculateLuxuryTaxPenalty(
  payroll: number,
  threshold: number,
  isRepeatOffender: boolean = false
): number {
  if (payroll <= threshold) return 0;
  
  const overage = payroll - threshold;
  let penalty = 0;
  
  // Simplified penalty calculation
  // Real backend should use actual MLB CBA rules
  if (overage <= 20) {
    penalty = overage * (isRepeatOffender ? 0.30 : 0.20);
  } else if (overage <= 40) {
    penalty = 20 * (isRepeatOffender ? 0.30 : 0.20);
    penalty += (overage - 20) * (isRepeatOffender ? 0.42 : 0.32);
  } else {
    penalty = 20 * (isRepeatOffender ? 0.30 : 0.20);
    penalty += 20 * (isRepeatOffender ? 0.42 : 0.32);
    penalty += (overage - 40) * (isRepeatOffender ? 0.95 : 0.75);
  }
  
  return Math.round(penalty * 10) / 10;
}
