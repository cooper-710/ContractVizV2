// ============================================================================
// TYPE DEFINITIONS FOR BORAS CORP CONTRACT PRESENTATION
// ============================================================================
// These types define the data contracts between frontend and backend.
// When integrating with a real API, ensure backend responses match these types.

// Player Statistics
// ============================================================================

export interface TraditionalStats {
  avg: number;
  hr: number;
  rbi: number;
  ops: number;
}

export interface AdvancedStats {
  xwoba: number;
  xslg: number;
  wrcPlus: number;
  war: number;
  wpa: number;
}

export interface BattedBallStats {
  exitVelo: number;
  hardHitPct: number;
  barrelPct: number;
  launchAngle: number;
}

export interface YearlyStats {
  year: string;
  war: number;
  wrcPlus: number;
  hr: number;
  xwoba: number;
  avg?: number;
  rbi?: number;
  ops?: number;
  exitVelo?: number;
  hardHitPct?: number;
  barrelPct?: number;
}

export interface PlayerProfile {
  playerId: string;
  name: string;
  position: string;
  age: number;
  traditional: TraditionalStats;
  advanced: AdvancedStats;
  battedBall: BattedBallStats;
  careerStats: YearlyStats[];
  battedBallTrend: YearlyStats[];
}

// Player Comparisons
// ============================================================================

export interface ComparisonPlayer {
  player: string;
  age: number;
  position: string;
  team: string;
  
  // Career stats
  careerWar: number;
  careerWrcPlus: number;
  careerXwoba: number;
  careerHr: number;
  careerXslg: number;
  careerHardHitPct: number;
  careerBarrelPct: number;
  
  // 2025 stats (or most recent season)
  war2025: number;
  wrcPlus2025: number;
  xwoba2025: number;
  hr2025: number;
  xslg2025: number;
  hardHitPct2025: number;
  barrelPct2025: number;
  
  // 3-year rolling averages
  war3yr: number;
  wrcPlus3yr: number;
  xwoba3yr: number;
  hr3yr: number;
  xslg3yr: number;
  hardHitPct3yr: number;
  barrelPct3yr: number;
  
  // 3-year pre-signing averages
  warPreSign: number;
  wrcPlusPreSign: number;
  xwobaPreSign: number;
  hrPreSign: number;
  xslgPreSign: number;
  hardHitPctPreSign: number;
  barrelPctPreSign: number;
  
  // Contract details
  aav: number; // Average annual value in millions
  years: number;
  totalValue: number;
  signingYear: number;
}

// Contract Terms & Structure
// ============================================================================

export type SalaryStructure = 'even' | 'front-loaded' | 'back-loaded';
export type NoTradeClause = 'full' | 'limited' | 'none';
export type EscalatorTrigger = 'MVP finish' | 'All-Star' | '40 HR' | 'Playoffs';

export interface ContractTerms {
  // Base terms
  years: number;
  baseAAV: number;
  signingBonus: number;
  
  // Salary structure
  salaryStructure: SalaryStructure;
  frontLoadPercent: number;
  
  // Deferrals
  deferralPercent: number;
  deferralYears: number;
  deferralInterest: number;
  
  // Performance bonuses
  performanceBonus: number;
  awardBonus: number;
  playingTimeBonus: number;
  
  // Options and clauses
  optOutYear: number | null;
  teamOptionYear: number | null;
  teamOptionValue: number;
  buyoutValue: number;
  noTradeClause: NoTradeClause;
  limitedNoTradeTeams: number;
  
  // Escalators
  hasEscalator: boolean;
  escalatorPercent: number;
  escalatorTrigger: EscalatorTrigger;
}

export interface YearlyBreakdown {
  year: number;
  baseSalary: number;
  bonus: number;
  deferred: number;
  totalCash: number;
  cbtHit: number;
}

export interface ContractCalculations {
  totalValue: number;
  guaranteedValue: number;
  potentialValue: number;
  cbtImpact: number;
  yearlyBreakdown: YearlyBreakdown[];
}

// Team Payroll Data
// ============================================================================

export interface TeamPayroll {
  teamId: string;
  teamName: string;
  year: number;
  basePayroll: number; // Existing payroll before player addition
  luxuryTaxThreshold: number;
}

export interface PayrollProjection {
  year: number;
  basePayroll: number;
  playerContract: number;
  totalPayroll: number;
  luxuryTaxStatus: 'under' | 'tier1' | 'tier2' | 'tier3';
}

// API Response Types
// ============================================================================
// Use these for type-safe API responses

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface PlayerStatsResponse {
  player: PlayerProfile;
}

export interface ComparisonsResponse {
  targetPlayer: ComparisonPlayer;
  comparablePlayers: ComparisonPlayer[];
}

export interface TeamPayrollResponse {
  team: TeamPayroll;
  projections: PayrollProjection[];
}
