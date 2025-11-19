// ============================================================================
// PLAYER DATABASE
// ============================================================================
// Central database of players available for valuation and comparison

export interface PlayerStats {
  // Common stats
  WAR: number;
  age: number;
  
  // Hitter stats (required for hitters, 0 for pitchers)
  wRCplus: number;
  xwOBA: number;
  xSLG: number;
  HRperPA: number;
  RBI: number;
  OPS: number;
  BarrelPerPA: number;
  HardHitPct: number;
  EV50: number;
  maxEV: number;
  BBpct: number;
  Kpct: number;
  ContactPct: number;
  PA: number;
  fg_Def: number;
  fg_BsR: number;
  
  // Pitcher stats (required for pitchers, undefined for hitters)
  ERA?: number;
  FIP?: number;
  xFIP?: number;
  Kper9?: number;
  BBper9?: number;
  KperBB?: number;
  WHIP?: number;
  IP?: number;
  GS?: number;
  SV?: number;
  Hper9?: number;
  HRper9?: number;
  BABIP?: number;
  LOBpct?: number;
}

export type StatPeriod = '2025' | '3yr-avg' | '3yr-contract' | 'career';

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  team: string;
  
  // Stats for different time periods
  stats2025: PlayerStats;
  threeYearStats: PlayerStats; // 3-year rolling average
  threeYearContractStats?: PlayerStats; // 3-year avg at time of contract signing (for comps)
  careerStats: PlayerStats;
  
  // Contract info (for comps who have already signed)
  hasContract?: boolean;
  AAV?: number;
  years?: number;
  signedYear?: number;

  // Availability flags
  has2025Season?: boolean;
}

// Helper to get stats for a specific period
export function getStatsForPeriod(player: Player, period: StatPeriod): PlayerStats {
  switch (period) {
    case '2025':
      return player.stats2025;
    case '3yr-avg':
      return player.threeYearStats;
    case '3yr-contract':
      return player.threeYearContractStats || player.threeYearStats;
    case 'career':
      return player.careerStats;
  }
}

// Stat labels for UI (hitter stats)
export const STAT_LABELS: Record<keyof Omit<PlayerStats, 'age'>, string> = {
  wRCplus: 'wRC+',
  xwOBA: 'xwOBA',
  xSLG: 'xSLG',
  HRperPA: 'HR',
  RBI: 'RBI',
  BarrelPerPA: 'Barrel%',
  HardHitPct: 'Hard Hit%',
  EV50: 'avgEV',
  maxEV: 'maxEV',
  BBpct: 'BB%',
  Kpct: 'K%',
  ContactPct: 'Contact%',
  WAR: 'WAR',
  PA: 'PA',
  fg_Def: 'Def',
  fg_BsR: 'BsR',
  // Pitcher stats (optional, will be filtered based on player type)
  ERA: 'ERA',
  FIP: 'FIP',
  xFIP: 'xFIP',
  Kper9: 'K/9',
  BBper9: 'BB/9',
  KperBB: 'K/BB',
  WHIP: 'WHIP',
  IP: 'IP',
  GS: 'GS',
  SV: 'SV',
  Hper9: 'H/9',
  HRper9: 'HR/9',
  BABIP: 'BABIP',
  LOBpct: 'LOB%',
};

// Pitcher-specific stat labels
export const PITCHER_STAT_LABELS: Record<string, string> = {
  WAR: 'WAR',
  ERA: 'ERA',
  FIP: 'FIP',
  xFIP: 'xFIP',
  Kper9: 'K/9',
  BBper9: 'BB/9',
  KperBB: 'K/BB',
  WHIP: 'WHIP',
  IP: 'IP',
  GS: 'GS',
  SV: 'SV',
  Hper9: 'H/9',
  HRper9: 'HR/9',
  BABIP: 'BABIP',
  LOBpct: 'LOB%',
};

// Helper function to check if a player is a pitcher
export function isPitcher(player: Player): boolean {
  const pos = player.position?.toUpperCase().trim() || '';
  return pos === 'P' || pos === 'SP' || pos === 'RP' || pos.startsWith('P');
}

// Get stat labels based on player type
export function getStatLabelsForPlayer(player: Player): Record<string, string> {
  if (isPitcher(player)) {
    return PITCHER_STAT_LABELS;
  }
  // For hitters, return only hitter stats
  const hitterLabels: Record<string, string> = {};
  Object.keys(STAT_LABELS).forEach(key => {
    if (!PITCHER_STAT_LABELS[key]) {
      hitterLabels[key] = STAT_LABELS[key as keyof typeof STAT_LABELS];
    }
  });
  return hitterLabels;
}

// Helper to generate stat variations for different periods
// This creates realistic variations from a base stat set
function generateStatPeriods(
  baseStats: PlayerStats,
  age: number,
  signedYear?: number
): {
  stats2025: PlayerStats;
  threeYearStats: PlayerStats;
  threeYearContractStats?: PlayerStats;
  careerStats: PlayerStats;
} {
  // 2025 stats (slight random variation from 3yr avg)
  const stats2025: PlayerStats = {
    ...baseStats,
    wRCplus: Math.round(baseStats.wRCplus * (0.95 + Math.random() * 0.1)),
    xwOBA: baseStats.xwOBA * (0.97 + Math.random() * 0.06),
    xSLG: baseStats.xSLG * (0.97 + Math.random() * 0.06),
    HRperPA: baseStats.HRperPA * (0.9 + Math.random() * 0.2),
    RBI: baseStats.RBI,
    WAR: baseStats.WAR * (0.85 + Math.random() * 0.3),
    age,
  };

  // Career stats (generally slightly better for prime years)
  const careerStats: PlayerStats = {
    ...baseStats,
    wRCplus: Math.round(baseStats.wRCplus * 1.05),
    xwOBA: baseStats.xwOBA * 1.02,
    xSLG: baseStats.xSLG * 1.02,
    RBI: baseStats.RBI,
    WAR: baseStats.WAR * 1.1,
    age,
  };

  // 3-year contract stats (at time of signing, often peak performance)
  let threeYearContractStats: PlayerStats | undefined;
  if (signedYear) {
    threeYearContractStats = {
      ...baseStats,
      wRCplus: Math.round(baseStats.wRCplus * 1.08),
      xwOBA: baseStats.xwOBA * 1.03,
      xSLG: baseStats.xSLG * 1.03,
      RBI: baseStats.RBI,
      WAR: baseStats.WAR * 1.15,
      age: age - (2025 - signedYear), // Age at signing
    };
  }

  return {
    stats2025,
    threeYearStats: baseStats,
    threeYearContractStats,
    careerStats,
  };
}

// All available players (can be valued or used as comps if they have contracts)
import { fetchMultipleCsvs, mergeCsvRowsByName, getField, getString, normalizePlayerName, fetchCsv } from './csvLoader';

const FANGRAPHS_URL = '/fangraphs.csv';
const SPOTRAC_URL = '/spotrac.csv';
const STATSCAST_URL = '/statscast.csv';
const FANGRAPHS_PITCHERS_URL = '/fangraphs_pitchers.csv';
const SPOTRAC_PITCHERS_URL = '/spotrac_pitchers.csv';
const STATCAST_PITCHERS_URL = '/statcast_pitchers.csv';

let cachedPlayers: Player[] | null = null;

export async function loadPlayersFromCsv(): Promise<Player[]> {
  if (cachedPlayers) return cachedPlayers;
  
  // Fetch all six CSVs in parallel (3 hitter + 3 pitcher)
  const [fangraphsRows, spotracRows, statscastRows, 
         fangraphsPitchersRows, spotracPitchersRows, statcastPitchersRows] = await fetchMultipleCsvs([
    FANGRAPHS_URL,
    SPOTRAC_URL,
    STATSCAST_URL,
    FANGRAPHS_PITCHERS_URL,
    SPOTRAC_PITCHERS_URL,
    STATCAST_PITCHERS_URL,
  ]);
  
  // Load positions_pitchers.csv as authoritative source for pitcher positions
  const positionsPitchersRows = await fetchCsv('/positions_pitchers.csv');
  
  // Build a map of pitcher positions from positions_pitchers.csv
  // Map: playerId -> Map<season -> position>
  const pitcherPositionsBySeason = new Map<string, Map<number, string>>();
  const POSITION_CODE_MAP: Record<number, string> = {
    1: 'P',
    2: 'C',
    3: '1B',
    4: '2B',
    5: '3B',
    6: 'SS',
    7: 'OF',
    8: 'OF',
    9: 'OF',
    10: 'DH',
  };
  
  for (const row of positionsPitchersRows) {
    const name = getString(row, ['player_name']);
    const season = getField(row, ['season'], 0);
    const positionCode = getField(row, ['position_code'], 0);
    
    if (!name || !season || !positionCode || positionCode === 0) continue;
    
    const normId = normalizePlayerName(name);
    const positionAbbr = POSITION_CODE_MAP[positionCode];
    
    if (positionAbbr) {
      if (!pitcherPositionsBySeason.has(normId)) {
        pitcherPositionsBySeason.set(normId, new Map());
      }
      pitcherPositionsBySeason.get(normId)!.set(season, positionAbbr);
    }
  }
  
  // Helper function to get pitcher position from positions_pitchers.csv
  const getPitcherPosition = (playerId: string, season: number): string | null => {
    const seasonMap = pitcherPositionsBySeason.get(playerId);
    if (!seasonMap) return null;
    // Try exact season first
    if (seasonMap.has(season)) {
      return seasonMap.get(season)!;
    }
    // Find most recent season <= this season
    let bestSeason = -1;
    let bestPosition: string | null = null;
    for (const [s, pos] of seasonMap.entries()) {
      if (s <= season && s > bestSeason) {
        bestSeason = s;
        bestPosition = pos;
      }
    }
    return bestPosition;
  };
  
  // Merge hitter data
  const hitterRows = mergeCsvRowsByName(fangraphsRows, spotracRows, statscastRows);
  
  // Merge pitcher data
  const pitcherRows = mergeCsvRowsByName(fangraphsPitchersRows, spotracPitchersRows, statcastPitchersRows);
  
  // Combine all rows
  const rows = [...hitterRows, ...pitcherRows];

  // Group all seasons per player by normalized name
  const byId: Map<string, any[]> = new Map();
  const names: Map<string, string> = new Map();

  for (const row of rows) {
    const name = getString(row, ['Name']);
    if (!name) continue;
    const normId = normalizePlayerName(name);
    if (!byId.has(normId)) byId.set(normId, []);
    byId.get(normId)!.push(row);
    names.set(normId, name);
  }

  // Helper function to normalize team abbreviation from CSV data
  const normalizeTeamFromCsv = (teamValue: string): string => {
    if (!teamValue || typeof teamValue !== 'string') return '';
    const trimmed = teamValue.trim();
    if (trimmed === '' || trimmed === '—' || trimmed === '-') return '';
    
    // Convert to uppercase and handle duplicates like "DET DET"
    const upper = trimmed.toUpperCase();
    const parts = upper.split(/\s+/);
    const teamAbbr = parts[0];
    
    // Return first valid 2-3 letter abbreviation, or empty string
    if (/^[A-Z]{2,3}$/.test(teamAbbr)) {
      return teamAbbr;
    }
    
    // Try second part if first doesn't match
    if (parts.length > 1 && /^[A-Z]{2,3}$/.test(parts[1])) {
      return parts[1];
    }
    
    return trimmed; // Return original if can't normalize
  };

  const toSeasonObj = (r: any) => {
    const season = getField(r, ['Season', 'year'], 0);
    const rawTeam = getString(r, ['fg_Team'], '');
    const playerName = getString(r, ['Name']);
    const normId = normalizePlayerName(playerName);
    
    // For pitchers, use positions_pitchers.csv as authoritative source
    // For hitters, use the position from the CSV row
    const pitcherPosition = getPitcherPosition(normId, season);
    let position: string;
    
    if (pitcherPosition) {
      // This is a pitcher - use position from positions_pitchers.csv
      position = pitcherPosition;
    } else {
      // This is a hitter - use position from CSV row
      position = getString(r, ['fg_Pos', 'Pos', 'PosGroup'], 'OF');
    }
    
    const isPitcherRow = position === 'P' || position === 'SP' || position === 'RP' || position.toUpperCase().startsWith('P');
    
    const baseObj = {
      season: Number(season),
      WAR: getField(r, ['fg_WAR', 'fg_L-WAR'], 0),
      age: getField(r, ['fg_Age', 'player_age'], 0),
      position,
      team: normalizeTeamFromCsv(rawTeam),
      signedYear: getField(r, ['Start'], 0),
      aavRaw: getField(r, ['AAV'], 0),
      yrs: getField(r, ['Yrs'], 0),
    };
    
    if (isPitcherRow) {
      // Pitcher stats
      return {
        ...baseObj,
        // Hitter stats set to 0 for pitchers
        wRCplus: 0,
        xwOBA: 0,
        xSLG: 0,
        HRperPA: 0,
        RBI: 0,
        OPS: 0,
        BarrelPerPA: 0,
        HardHitPct: 0,
        EV50: 0,
        maxEV: 0,
        BBpct: 0,
        Kpct: 0,
        ContactPct: 0,
        PA: 0,
        fg_Def: 0,
        fg_BsR: 0,
        // Pitcher stats
        ERA: getField(r, ['fg_ERA'], 0),
        FIP: getField(r, ['fg_FIP'], 0),
        xFIP: getField(r, ['fg_xFIP'], 0),
        Kper9: getField(r, ['fg_K/9'], 0),
        BBper9: getField(r, ['fg_BB/9'], 0),
        KperBB: getField(r, ['fg_K/BB'], 0),
        WHIP: getField(r, ['fg_WHIP'], 0),
        IP: getField(r, ['fg_IP'], 0),
        GS: getField(r, ['fg_GS'], 0),
        SV: getField(r, ['fg_SV'], 0),
        Hper9: getField(r, ['fg_H/9'], 0),
        HRper9: getField(r, ['fg_HR/9'], 0),
        BABIP: getField(r, ['fg_BABIP'], 0),
        LOBpct: getField(r, ['fg_LOB%'], 0),
      };
    } else {
      // Hitter stats
      const pa = getField(r, ['fg_PA', 'pa'], 0);
      const hr = getField(r, ['fg_HR', 'home_run'], 0);
      const hrPerPa = pa > 0 ? (hr / pa) * 100 : 0;
      return {
        ...baseObj,
        wRCplus: getField(r, ['fg_wRC+'], 0),
        xwOBA: getField(r, ['fg_xwOBA'], 0),
        xSLG: getField(r, ['fg_xSLG'], 0),
        HRperPA: Number(hrPerPa.toFixed(2)),
        HR: hr,
        RBI: getField(r, ['fg_RBI'], 0),
        OPS: getField(r, ['fg_OPS'], 0),
        BarrelPerPA: getField(r, ['fg_Barrel%', 'barrel_batted_rate'], 0),
        HardHitPct: getField(r, ['fg_HardHit%', 'fg_HardHit%+'], 0),
        EV50: getField(r, ['fg_EV', 'exit_velocity_avg'], 0),
        maxEV: getField(r, ['fg_maxEV'], 0),
        BBpct: getField(r, ['fg_BB%', 'bb_percent'], 0),
        Kpct: getField(r, ['fg_K%', 'k_percent'], 0),
        ContactPct: getField(r, ['fg_Contact%'], 0),
        PA: pa,
        fg_Def: getField(r, ['fg_Def'], 0),
        fg_BsR: getField(r, ['fg_BsR'], 0),
        // Pitcher stats undefined for hitters
        ERA: undefined,
        FIP: undefined,
        xFIP: undefined,
        Kper9: undefined,
        BBper9: undefined,
        KperBB: undefined,
        WHIP: undefined,
        IP: undefined,
        GS: undefined,
        SV: undefined,
        Hper9: undefined,
        HRper9: undefined,
        BABIP: undefined,
        LOBpct: undefined,
      };
    }
  };

  const aggregate = (seasons: any[]): PlayerStats => {
    if (seasons.length === 0) {
      return { 
        WAR: 0,
        age: 0,
        wRCplus: 0, xwOBA: 0, xSLG: 0, HRperPA: 0, RBI: 0, OPS: 0, BarrelPerPA: 0, HardHitPct: 0, 
        EV50: 0, maxEV: 0, BBpct: 0, Kpct: 0, ContactPct: 0, PA: 0, fg_Def: 0, fg_BsR: 0 
      };
    }
    
    const firstSeason = seasons[0];
    const isPitcherSeason = firstSeason.position === 'P' || firstSeason.position === 'SP' || 
                           firstSeason.position === 'RP' || firstSeason.position?.toUpperCase().startsWith('P');
    
    const mean = (k: string, d = 6) => {
      const validValues = seasons.map(r => Number(r[k] || 0)).filter(v => !isNaN(v));
      if (validValues.length === 0) return 0;
      return Number((validValues.reduce((s, v) => s + v, 0) / validValues.length).toFixed(d));
    };
    const sum = (k: string) => seasons.reduce((s, r) => s + Number(r[k] || 0), 0);
    
    if (isPitcherSeason) {
      // Aggregate pitcher stats
      return {
        WAR: mean('WAR', 3),
        age: mean('age', 2),
        // Hitter stats set to 0
        wRCplus: 0,
        xwOBA: 0,
        xSLG: 0,
        HRperPA: 0,
        RBI: 0,
        OPS: 0,
        BarrelPerPA: 0,
        HardHitPct: 0,
        EV50: 0,
        maxEV: 0,
        BBpct: 0,
        Kpct: 0,
        ContactPct: 0,
        PA: 0,
        fg_Def: 0,
        fg_BsR: 0,
        // Pitcher stats
        ERA: mean('ERA', 2),
        FIP: mean('FIP', 2),
        xFIP: mean('xFIP', 2),
        Kper9: mean('Kper9', 2),
        BBper9: mean('BBper9', 2),
        KperBB: mean('KperBB', 2),
        WHIP: mean('WHIP', 3),
        IP: Number(mean('IP', 1).toFixed(1)),
        GS: Number(mean('GS', 0).toFixed(0)),
        SV: Number(mean('SV', 0).toFixed(0)),
        Hper9: mean('Hper9', 2),
        HRper9: mean('HRper9', 2),
        BABIP: mean('BABIP', 3),
        LOBpct: mean('LOBpct', 2),
      };
    } else {
      // Aggregate hitter stats
      const totalPA = sum('PA');
      const avgHR = mean('HR', 1);
      return {
        wRCplus: mean('wRCplus', 2),
        xwOBA: mean('xwOBA', 6),
        xSLG: mean('xSLG', 6),
        HRperPA: avgHR,
        RBI: mean('RBI', 1),
        OPS: mean('OPS', 3),
        BarrelPerPA: mean('BarrelPerPA', 4),
        HardHitPct: mean('HardHitPct', 4),
        EV50: mean('EV50', 4),
        maxEV: mean('maxEV', 1),
        BBpct: mean('BBpct', 4),
        Kpct: mean('Kpct', 4),
        ContactPct: mean('ContactPct', 4),
        WAR: mean('WAR', 3),
        PA: Number(mean('PA', 0).toFixed(0)),
        age: mean('age', 2),
        fg_Def: mean('fg_Def', 2),
        fg_BsR: mean('fg_BsR', 2),
        // Pitcher stats undefined for hitters
        ERA: undefined,
        FIP: undefined,
        xFIP: undefined,
        Kper9: undefined,
        BBper9: undefined,
        KperBB: undefined,
        WHIP: undefined,
        IP: undefined,
        GS: undefined,
        SV: undefined,
        Hper9: undefined,
        HRper9: undefined,
        BABIP: undefined,
        LOBpct: undefined,
      };
    }
  };

  const players: Player[] = [];
  for (const [id, arr] of byId.entries()) {
    const seasons = arr.map(toSeasonObj).filter(s => s.season > 0).sort((a, b) => a.season - b.season);
    if (seasons.length === 0) continue;
    const name = names.get(id) || id;

    const s2025 = seasons.filter(s => s.season === 2025);
    const s3yr = seasons.filter(s => [2025, 2024, 2023].includes(s.season));
    const career = seasons;

    // 3yr pre-contract based on signedYear (if present in any row)
    const anySigned = seasons.find(s => s.signedYear);
    const signedYear = anySigned?.signedYear ? Number(anySigned.signedYear) : undefined;
    const preYears = signedYear ? [signedYear - 1, signedYear - 2, signedYear - 3] : [];
    const s3pre = signedYear ? seasons.filter(s => preYears.includes(s.season)) : [];

    const team = (s2025[0]?.team || seasons[seasons.length - 1].team) || '—';
    const position = (s2025[0]?.position || seasons[seasons.length - 1].position) || 'OF';

    const contractRow = seasons.find(s => s.aavRaw && s.yrs);
    const rawAav = contractRow?.aavRaw || 0;
    const years = contractRow?.yrs || 0;
    const aavMillions = rawAav > 1000 ? Math.round((rawAav / 1_000_000) * 10) / 10 : rawAav;

    players.push({
      id,
      name,
      jerseyNumber: 0,
      position,
      team,
      hasContract: !!aavMillions && !!years,
      AAV: aavMillions || undefined,
      years: years || undefined,
      signedYear: signedYear || undefined,
      stats2025: aggregate(s2025),
      threeYearStats: aggregate(s3yr.length ? s3yr : seasons.slice(-3)),
      threeYearContractStats: s3pre.length ? aggregate(s3pre) : undefined,
      careerStats: aggregate(career),
      has2025Season: s2025.length > 0,
    });
  }

  cachedPlayers = players.sort((a, b) => a.name.localeCompare(b.name));
  return cachedPlayers;
}

// Provide an empty list immediately for synchronous imports; real data is async via loadPlayersFromCsv
export const ALL_PLAYERS: Player[] = [];

// Helper function to get player by ID or name
export function getPlayerById(playerId: string): Player | undefined {
  if (!cachedPlayers) return undefined;
  return cachedPlayers.find(p => p.id === playerId);
}

export function getPlayerByName(playerName: string): Player | undefined {
  return ALL_PLAYERS.find(p => p.name.toLowerCase() === playerName.toLowerCase());
}

// Helper function to search players
export function searchPlayers(query: string): Player[] {
  const lowerQuery = query.toLowerCase();
  return ALL_PLAYERS.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.team.toLowerCase().includes(lowerQuery) ||
    p.position.toLowerCase().includes(lowerQuery)
  );
}

// Get players with contracts (for use as comparisons)
export function getPlayersWithContracts(): Player[] {
  return ALL_PLAYERS.filter(p => p.hasContract === true);
}

// Helper function to get suggested comps for a player (same position preferred)
export function getSuggestedComps(player: Player, limit: number = 4): Player[] {
  const withContracts = getPlayersWithContracts();
  
  // First, get same position players
  const samePosition = withContracts.filter(comp => 
    comp.position === player.position && comp.id !== player.id
  );
  
  // If we have enough same position players, return them
  if (samePosition.length >= limit) {
    return samePosition.slice(0, limit);
  }
  
  // Otherwise, fill with other players
  const others = withContracts.filter(comp => 
    comp.position !== player.position && comp.id !== player.id
  );
  
  return [...samePosition, ...others].slice(0, limit);
}
