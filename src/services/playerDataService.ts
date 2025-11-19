// ============================================================================
// PLAYER DATA SERVICE
// ============================================================================
// This service provides player statistics and comparison data.
// 
// BACKEND INTEGRATION GUIDE:
// When connecting to a real backend, replace the mock data returns with actual
// API calls. The function signatures and return types should remain the same.
//
// Expected API Endpoints:
// - GET /api/players/:playerId - Returns PlayerProfile
// - GET /api/players/:playerId/comparisons - Returns ComparisonsResponse
// ============================================================================

import type {
  PlayerProfile,
  ComparisonPlayer,
  YearlyStats,
  PlayerStatsResponse,
  ComparisonsResponse,
} from '../types';
import { loadPlayersFromCsv, type PlayerStats, isPitcher } from '../data/playerDatabase';
import { fetchMultipleCsvs, mergeCsvRowsByName, getField, getString, normalizePlayerName } from '../data/csvLoader';
import type { StatPeriod, Player } from '../data/playerDatabase';

// ============================================================================
// PLAYER STATISTICS
// ============================================================================

/**
 * Fetches comprehensive statistics for a specific player
 * 
 * @param playerId - Unique identifier for the player (e.g., "pete-alonso")
 * @returns Promise<PlayerProfile> - Complete player statistical profile
 * 
 * BACKEND INTEGRATION:
 * Replace mock return with: 
 * const response = await fetch(`/api/players/${playerId}`);
 * return response.json();
 */
export async function getPlayerStats(playerId: string): Promise<PlayerProfile> {
  // Load rows from all six CSVs (hitters + pitchers) and merge them
  const [fangraphsRows, spotracRows, statscastRows, 
         fangraphsPitchersRows, spotracPitchersRows, statcastPitchersRows] = await fetchMultipleCsvs([
    '/fangraphs.csv',
    '/spotrac.csv',
    '/statscast.csv',
    '/fangraphs_pitchers.csv',
    '/spotrac_pitchers.csv',
    '/statcast_pitchers.csv',
  ]);
  
  const hitterRows = mergeCsvRowsByName(fangraphsRows, spotracRows, statscastRows);
  const pitcherRows = mergeCsvRowsByName(fangraphsPitchersRows, spotracPitchersRows, statcastPitchersRows);
  const rows = [...hitterRows, ...pitcherRows];
  
  const players = await loadPlayersFromCsv();
  const matchInList = players.find(p => p.id === playerId || p.name.toLowerCase() === playerId.toLowerCase());
  if (!matchInList) throw new Error('Player not found');

  const normId = matchInList.id;
  const displayName = matchInList.name;
  const isPitcherPlayerFromObject = isPitcher(matchInList);

  // Try to find player in both CSV sets - use whichever has data
  // This handles cases where player object position might be incorrect
  const pitcherPlayerRows = pitcherRows.filter(r => {
    const name = getString(r, ['Name']);
    const normalized = normalizePlayerName(name);
    return normalized === normId || normalizePlayerName(displayName) === normalized;
  });
  
  const hitterPlayerRows = hitterRows.filter(r => {
    const name = getString(r, ['Name']);
    const normalized = normalizePlayerName(name);
    return normalized === normId || normalizePlayerName(displayName) === normalized;
  });

  // Determine which CSV set has data - prefer the one with more rows
  // If both have data, prefer the one matching the player object's position
  let playerRows: any[];
  let isPitcherPlayer: boolean;
  
  if (pitcherPlayerRows.length > 0 && hitterPlayerRows.length > 0) {
    // Both have data - trust the player object position
    playerRows = isPitcherPlayerFromObject ? pitcherPlayerRows : hitterPlayerRows;
    isPitcherPlayer = isPitcherPlayerFromObject;
  } else if (pitcherPlayerRows.length > 0) {
    // Only pitcher CSV has data
    playerRows = pitcherPlayerRows;
    isPitcherPlayer = true;
  } else if (hitterPlayerRows.length > 0) {
    // Only hitter CSV has data
    playerRows = hitterPlayerRows;
    isPitcherPlayer = false;
  } else {
    // No data found - fall back to player object position
    playerRows = isPitcherPlayerFromObject ? pitcherPlayerRows : hitterPlayerRows;
    isPitcherPlayer = isPitcherPlayerFromObject;
  }

  // Map seasons based on player type
  const yearly = playerRows
    .map((r) => {
      const year = String(getField(r, ['Season', 'year'], 0));
      const war = getField(r, ['fg_WAR', 'fg_L-WAR'], 0);
      
      if (isPitcherPlayer) {
        // Pitcher stats
        return {
          year,
          war,
          era: getField(r, ['fg_ERA'], 0),
          fip: getField(r, ['fg_FIP'], 0),
          xfip: getField(r, ['fg_xFIP'], 0),
          kper9: getField(r, ['fg_K/9'], 0),
          bbper9: getField(r, ['fg_BB/9'], 0),
          whip: getField(r, ['fg_WHIP'], 0),
          ip: getField(r, ['fg_IP'], 0),
          gs: getField(r, ['fg_GS'], 0),
          sv: getField(r, ['fg_SV'], 0),
          wins: getField(r, ['fg_W'], 0),
        };
      } else {
        // Hitter stats
        const wrcPlus = getField(r, ['fg_wRC+'], 0);
        const hr = getField(r, ['fg_HR'], 0);
        const xwoba = getField(r, ['fg_xwOBA'], 0);
        const xslg = getField(r, ['fg_xSLG'], 0);
        const avg = getField(r, ['fg_AVG'], 0);
        const rbi = getField(r, ['fg_RBI'], 0);
        const obp = getField(r, ['fg_OBP'], 0);
        const slg = getField(r, ['fg_SLG'], 0);
        const ops = obp && slg ? obp + slg : 0;
        const exitVelo = getField(r, ['fg_EV', 'exit_velocity_avg'], 0);
        const maxEV = getField(r, ['fg_maxEV'], 0);
        const hardHitPct = getField(r, ['fg_HardHit%', 'fg_HardHit%+'], 0);
        const barrelPct = getField(r, ['fg_Barrel%', 'barrel_batted_rate'], 0);
        const wpa = getField(r, ['fg_WPA'], 0);
        const launchAngle = getField(r, ['fg_LA'], 0);
        return { year, war, wrcPlus, hr, xwoba, xslg, avg, rbi, ops, exitVelo, maxEV, hardHitPct, barrelPct, wpa, launchAngle };
      }
    })
    .filter(s => s.year !== '0')
    .sort((a, b) => Number(a.year) - Number(b.year));

  const latest = yearly[yearly.length - 1];
  const position = matchInList.position;

  if (isPitcherPlayer) {
    // Return pitcher profile
    return {
      playerId: normId,
      name: displayName,
      position,
      age: matchInList.stats2025.age || 0,
      traditional: {
        avg: 0, // Not applicable for pitchers
        hr: 0,
        rbi: 0,
        ops: 0,
      },
      advanced: {
        xwoba: 0,
        xslg: 0,
        wrcPlus: 0,
        war: latest?.war || 0,
        wpa: 0,
      },
      battedBall: {
        exitVelo: 0,
        maxEV: 0,
        hardHitPct: 0,
        barrelPct: 0,
        launchAngle: 0,
      },
      careerStats: yearly.map(y => ({
        year: y.year,
        war: y.war || 0,
        wrcPlus: 0,
        hr: 0,
        xwoba: 0,
        // Pitcher stats
        era: y.era || 0,
        fip: y.fip || 0,
        xfip: y.xfip || 0,
        kper9: y.kper9 || 0,
        bbper9: y.bbper9 || 0,
        whip: y.whip || 0,
        ip: y.ip || 0,
        gs: y.gs || 0,
        sv: y.sv || 0,
        wins: y.wins || 0, // We need to get this from the CSV
      })),
      battedBallTrend: [],
    };
  } else {
    // Return hitter profile (existing logic)
    return {
      playerId: normId,
      name: displayName,
      position,
      age: matchInList.stats2025.age || 0,
      traditional: {
        avg: latest?.avg || 0,
        hr: latest?.hr || 0,
        rbi: latest?.rbi || 0,
        ops: latest?.ops || 0,
      },
      advanced: {
        xwoba: latest?.xwoba || 0,
        xslg: latest?.xslg || 0,
        wrcPlus: latest?.wrcPlus || 0,
        war: latest?.war || 0,
        wpa: latest?.wpa || 0,
      },
      battedBall: {
        exitVelo: latest?.exitVelo || 0,
        maxEV: latest?.maxEV || 0,
        hardHitPct: latest?.hardHitPct || 0,
        barrelPct: latest?.barrelPct || 0,
        launchAngle: latest?.launchAngle || 0,
      },
      careerStats: yearly,
      battedBallTrend: yearly.map(y => ({
        year: y.year,
        war: 0,
        wrcPlus: 0,
        hr: 0,
        xwoba: 0,
        exitVelo: y.exitVelo,
        hardHitPct: y.hardHitPct,
        barrelPct: y.barrelPct,
      })),
    };
  }
}

// ============================================================================
// PLAYER COMPARISONS
// ============================================================================

/**
 * Fetches market comparison players with comprehensive statistics
 * 
 * @param playerId - Target player to compare against
 * @returns Promise<ComparisonPlayer[]> - Array of comparable players with contract data
 * 
 * BACKEND INTEGRATION:
 * Replace mock return with:
 * const response = await fetch(`/api/players/${playerId}/comparisons`);
 * return response.json();
 */
export async function getPlayerComparisons(playerId: string): Promise<ComparisonPlayer[]> {
  const players = await loadPlayersFromCsv();
  const base = players.find(p => p.id === playerId) || players[0];
  if (!base) return [];
  // Filter by same position type (pitchers compare to pitchers, hitters to hitters)
  const baseIsPitcher = isPitcher(base);
  const samePos = players.filter(p => {
    const pIsPitcher = isPitcher(p);
    // Match position type (both pitchers or both hitters) and same specific position if possible
    return pIsPitcher === baseIsPitcher && p.position === base.position && p.id !== base.id;
  }).slice(0, 5);
  return samePos.map(p => ({
    player: p.name,
    age: p.stats2025.age,
    position: p.position,
    team: p.team,
    careerWar: p.careerStats.WAR,
    careerWrcPlus: p.careerStats.wRCplus,
    careerXwoba: p.careerStats.xwOBA,
    careerHr: Math.round((p.careerStats.HRperPA / 100) * p.careerStats.PA),
    careerXslg: p.careerStats.xSLG,
    careerHardHitPct: p.careerStats.HardHitPct,
    careerBarrelPct: p.careerStats.BarrelPerPA,
    war2025: p.stats2025.WAR,
    wrcPlus2025: p.stats2025.wRCplus,
    xwoba2025: p.stats2025.xwOBA,
    hr2025: Math.round((p.stats2025.HRperPA / 100) * p.stats2025.PA),
    xslg2025: p.stats2025.xSLG,
    hardHitPct2025: p.stats2025.HardHitPct,
    barrelPct2025: p.stats2025.BarrelPerPA,
    war3yr: p.threeYearStats.WAR,
    wrcPlus3yr: p.threeYearStats.wRCplus,
    xwoba3yr: p.threeYearStats.xwOBA,
    hr3yr: Math.round((p.threeYearStats.HRperPA / 100) * p.threeYearStats.PA),
    xslg3yr: p.threeYearStats.xSLG,
    hardHitPct3yr: p.threeYearStats.HardHitPct,
    barrelPct3yr: p.threeYearStats.BarrelPerPA,
    warPreSign: p.threeYearContractStats?.WAR || p.threeYearStats.WAR,
    wrcPlusPreSign: p.threeYearContractStats?.wRCplus || p.threeYearStats.wRCplus,
    xwobaPreSign: p.threeYearContractStats?.xwOBA || p.threeYearStats.xwOBA,
    hrPreSign: Math.round((((p.threeYearContractStats?.HRperPA || p.threeYearStats.HRperPA) / 100) * (p.threeYearContractStats?.PA || p.threeYearStats.PA))),
    xslgPreSign: p.threeYearContractStats?.xSLG || p.threeYearStats.xSLG,
    hardHitPctPreSign: p.threeYearContractStats?.HardHitPct || p.threeYearStats.HardHitPct,
    barrelPctPreSign: p.threeYearContractStats?.BarrelPerPA || p.threeYearStats.BarrelPerPA,
    aav: p.AAV || 0,
    years: p.years || 0,
    totalValue: (p.AAV || 0) * (p.years || 0),
    signingYear: p.signedYear || 2025,
  }));
}

// ============================================================================
// PERIOD STATS FROM CSV (for comparisons)
// ============================================================================

function aggregateToPlayerStats(rows: any[]): PlayerStats {
  if (rows.length === 0) {
    return {
      WAR: 0,
      age: 0,
      wRCplus: 0, xwOBA: 0, xSLG: 0, HRperPA: 0, BarrelPerPA: 0, HardHitPct: 0,
      EV50: 0, maxEV: 0, BBpct: 0, Kpct: 0, ContactPct: 0, PA: 0,
      fg_Def: 0, fg_BsR: 0,
    };
  }

  const firstRow = rows[0];
  const isPitcherRow = firstRow.position === 'P' || firstRow.position === 'SP' || 
                      firstRow.position === 'RP' || firstRow.position?.toUpperCase().startsWith('P');

  const avg = (k: string, decimals = 6) => {
    const validValues = rows.map(r => Number(r[k] || 0)).filter(v => !isNaN(v));
    if (validValues.length === 0) return 0;
    const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    return Number(mean.toFixed(decimals));
  };

  const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k] || 0), 0);

  if (isPitcherRow) {
    // Aggregate pitcher stats
    return {
      WAR: avg('war', 3),
      age: avg('age', 2),
      // Hitter stats set to 0
      wRCplus: 0, xwOBA: 0, xSLG: 0, HRperPA: 0, RBI: 0, OPS: 0, BarrelPerPA: 0, HardHitPct: 0,
      EV50: 0, maxEV: 0, BBpct: 0, Kpct: 0, ContactPct: 0, PA: 0, fg_Def: 0, fg_BsR: 0,
      // Pitcher stats
      ERA: avg('ERA', 2),
      FIP: avg('FIP', 2),
      xFIP: avg('xFIP', 2),
      Kper9: avg('Kper9', 2),
      BBper9: avg('BBper9', 2),
      KperBB: avg('KperBB', 2),
      WHIP: avg('WHIP', 3),
      IP: Number(avg('IP', 1).toFixed(1)),
      GS: Number(avg('GS', 0).toFixed(0)),
      SV: Number(avg('SV', 0).toFixed(0)),
      Hper9: avg('Hper9', 2),
      HRper9: avg('HRper9', 2),
      BABIP: avg('BABIP', 3),
      LOBpct: avg('LOBpct', 2),
    };
  } else {
    // Aggregate hitter stats
    const totalPA = sum('PA');
    const totalHR = sum('HR');
    const hrPerPa = totalPA > 0 ? (totalHR / totalPA) * 100 : 0;

    return {
      wRCplus: avg('wRCplus', 2),
      xwOBA: avg('xwOBA', 6),
      xSLG: avg('xSLG', 6),
      HRperPA: Number(hrPerPa.toFixed(2)),
      RBI: avg('RBI', 1),
      OPS: avg('OPS', 3),
      BarrelPerPA: avg('barrelPct', 4),
      HardHitPct: avg('hardHitPct', 4),
      EV50: avg('exitVelo', 4),
      maxEV: avg('maxEV', 1),
      BBpct: avg('bbPct', 4),
      Kpct: avg('kPct', 4),
      ContactPct: avg('contactPct', 4),
      WAR: avg('war', 3),
      PA: Number(avg('PA', 0).toFixed(0)),
      age: avg('age', 2),
      fg_Def: avg('fg_Def', 2),
      fg_BsR: avg('fg_BsR', 2),
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
}

async function getPlayerSeasonRowsFromCsv(player: Player): Promise<Array<any>> {
  // Load rows from all six CSVs (hitters + pitchers) and merge them
  const [fangraphsRows, spotracRows, statscastRows, 
         fangraphsPitchersRows, spotracPitchersRows, statcastPitchersRows] = await fetchMultipleCsvs([
    '/fangraphs.csv',
    '/spotrac.csv',
    '/statscast.csv',
    '/fangraphs_pitchers.csv',
    '/spotrac_pitchers.csv',
    '/statcast_pitchers.csv',
  ]);
  const hitterRows = mergeCsvRowsByName(fangraphsRows, spotracRows, statscastRows);
  const pitcherRows = mergeCsvRowsByName(fangraphsPitchersRows, spotracPitchersRows, statcastPitchersRows);
  const rows = [...hitterRows, ...pitcherRows];
  const normId = player.id;
  const isPitcherPlayer = isPitcher(player);
  
  return rows
    .filter(r => {
      const name = getString(r, ['Name']);
      const normalized = normalizePlayerName(name);
      return normalized === normId;
    })
    .map((r) => {
      const baseObj = {
        season: Number(getField(r, ['Season', 'year'], 0)),
        war: getField(r, ['fg_WAR', 'fg_L-WAR'], 0),
        age: getField(r, ['fg_Age', 'player_age'], 0),
        position: getString(r, ['fg_Pos', 'Pos', 'PosGroup'], 'OF'),
      };
      
      if (isPitcherPlayer) {
        return {
          ...baseObj,
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
        return {
          ...baseObj,
          // Hitter stats
          wRCplus: getField(r, ['fg_wRC+'], 0),
          xwOBA: getField(r, ['fg_xwOBA'], 0),
          xSLG: getField(r, ['fg_xSLG'], 0),
          HR: getField(r, ['fg_HR'], 0),
          PA: getField(r, ['fg_PA', 'pa'], 0),
          barrelPct: getField(r, ['fg_Barrel%', 'barrel_batted_rate'], 0),
          hardHitPct: getField(r, ['fg_HardHit%', 'fg_HardHit%+'], 0),
          exitVelo: getField(r, ['fg_EV', 'exit_velocity_avg'], 0),
          maxEV: getField(r, ['fg_maxEV'], 0),
          bbPct: getField(r, ['fg_BB%', 'bb_percent'], 0),
          kPct: getField(r, ['fg_K%', 'k_percent'], 0),
          contactPct: getField(r, ['fg_Contact%'], 0),
          fg_Def: getField(r, ['fg_Def'], 0),
          fg_BsR: getField(r, ['fg_BsR'], 0),
        };
      }
    })
    .filter(r => r.season > 0)
    .sort((a, b) => a.season - b.season);
}

export async function getPeriodStatsForPlayers(
  players: Player[],
  period: StatPeriod
): Promise<Record<string, PlayerStats>> {
  const results: Record<string, PlayerStats> = {};
  for (const p of players) {
    const seasons = await getPlayerSeasonRowsFromCsv(p);
    let targetRows: any[] = [];
    if (period === '2025') {
      targetRows = seasons.filter(s => s.season === 2025);
    } else if (period === '3yr-avg') {
      targetRows = seasons.filter(s => [2025, 2024, 2023].includes(s.season));
    } else if (period === 'career') {
      targetRows = seasons;
    } else if (period === '3yr-contract') {
      const signedYear = p.signedYear || 0;
      if (signedYear) {
        const years = [signedYear - 1, signedYear - 2, signedYear - 3];
        targetRows = seasons.filter(s => years.includes(s.season));
      } else {
        targetRows = seasons.slice(-3); // fallback last 3
      }
    }
    results[p.id] = aggregateToPlayerStats(targetRows);
  }
  return results;
}

/**
 * Utility function to calculate stat for specific time period view
 * Used by components to display the correct stat based on user selection
 */
export function getStatForTimeView(
  player: ComparisonPlayer,
  metric: keyof Omit<ComparisonPlayer, 'player' | 'age' | 'position' | 'team' | 'aav' | 'years' | 'totalValue' | 'signingYear'>,
  timeView: '2025' | 'career' | '3yr-rolling' | '3yr-pre-signing'
): number {
  const suffix = timeView === '2025' ? '2025' : 
                timeView === 'career' ? '' : 
                timeView === '3yr-rolling' ? '3yr' : 'PreSign';
  
  const key = timeView === 'career' ? `career${metric.charAt(0).toUpperCase() + metric.slice(1)}` : `${metric}${suffix}`;
  return (player as any)[key] || 0;
}
