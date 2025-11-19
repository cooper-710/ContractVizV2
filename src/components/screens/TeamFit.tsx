import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Info, X } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { SBChip } from '../boras/SBChip';
import type { Player, StatPeriod, PlayerStats } from '../../data/playerDatabase';
import { ALL_PLAYERS, getStatsForPeriod, STAT_LABELS, loadPlayersFromCsv, isPitcher, getStatLabelsForPlayer, PITCHER_STAT_LABELS } from '../../data/playerDatabase';
import { usePayrollData } from '../../hooks/usePayrollData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { fetchMultipleCsvs } from '../../data/csvLoader';
import { getString, getField, normalizePlayerName } from '../../data/csvLoader';
import { StackedBarChart } from '../narrative/StackedBarChart';
import { DepthChartLadder } from '../narrative/DepthChartLadder';
import { DivisionBarChart } from '../narrative/DivisionBarChart';

// Import stat configuration from EstimatedValue calculation method
const STAT_KEY_MAP: Record<string, keyof PlayerStats | 'HR'> = {
  'fg_RBI': 'RBI',
  'fg_HR': 'HR',
  'fg_OPS': 'OPS',
  'fg_wRC+': 'wRCplus',
  'fg_BB%': 'BBpct',
  'fg_K%': 'Kpct',
  'fg_PA': 'PA',
  'fg_WAR': 'WAR',
  'fg_xwOBA': 'xwOBA',
  'fg_xSLG': 'xSLG',
  'sc_EV_brl_pa': 'BarrelPerPA',
  'sc_EV_ev50': 'EV50',
  'fg_Def': 'fg_Def',
  'fg_BsR': 'fg_BsR',
  // Pitcher stats
  'fg_ERA': 'ERA',
  'fg_FIP': 'FIP',
  'fg_xFIP': 'xFIP',
  'fg_K/9': 'Kper9',
  'fg_BB/9': 'BBper9',
  'fg_WHIP': 'WHIP',
  'fg_IP': 'IP',
};

const STAT_CONFIG: Record<string, { label: string; higherBetter: boolean; weight: number }> = {
  'fg_RBI': { label: 'RBI', higherBetter: true, weight: 0.5 },
  'fg_HR': { label: 'HR', higherBetter: true, weight: 0.65 },
  'fg_OPS': { label: 'OPS', higherBetter: true, weight: 0.3 },
  'fg_wRC+': { label: 'wRC+', higherBetter: true, weight: 0.7 },
  'fg_BB%': { label: 'BB%', higherBetter: true, weight: 0.2 },
  'fg_K%': { label: 'K%', higherBetter: false, weight: 0.2 },
  'fg_PA': { label: 'PA', higherBetter: true, weight: 0.3 },
  'fg_WAR': { label: 'WAR', higherBetter: true, weight: 0.6 },
  'fg_xwOBA': { label: 'xwOBA', higherBetter: true, weight: 0.5 },
  'fg_xSLG': { label: 'xSLG', higherBetter: true, weight: 0.3 },
  'sc_EV_brl_pa': { label: 'Barrels/PA', higherBetter: true, weight: 0.3 },
  'sc_EV_ev50': { label: 'avgEV', higherBetter: true, weight: 0.2 },
  'fg_Def': { label: 'Def', higherBetter: true, weight: 0.1 },
  'fg_BsR': { label: 'BsR', higherBetter: true, weight: 0.15 },
};

// Pitcher stat config
const PITCHER_STAT_CONFIG: Record<string, { label: string; higherBetter: boolean; weight: number }> = {
  'fg_ERA': { label: 'ERA', higherBetter: false, weight: 1.0 },
  'fg_FIP': { label: 'FIP', higherBetter: false, weight: 0.8 },
  'fg_xFIP': { label: 'xFIP', higherBetter: false, weight: 0.7 },
  'fg_K/9': { label: 'K/9', higherBetter: true, weight: 1.2 },
  'fg_BB/9': { label: 'BB/9', higherBetter: false, weight: 0.8 },
  'fg_WHIP': { label: 'WHIP', higherBetter: false, weight: 0.9 },
  'fg_IP': { label: 'IP', higherBetter: true, weight: 1.2 },
  'fg_WAR': { label: 'WAR', higherBetter: true, weight: 1.5 },
};

// Position-specific weight presets (for 1B)
const POSITION_WEIGHTS_1B: Record<string, number> = {
  'fg_RBI': 0.50, 'fg_HR': 0.65, 'fg_OPS': 0.30, 'fg_wRC+': 0.70, 'fg_BB%': 0.20, 'fg_K%': 0.20, 'fg_PA': 0.30, 'fg_WAR': 0.60,
  'fg_xwOBA': 0.50, 'fg_xSLG': 0.30,
  'sc_EV_brl_pa': 0.30, 'sc_EV_ev50': 0.20,
  'fg_Def': 0.10, 'fg_BsR': 0.15,
};

function getWeightsForPosition(position: string): Record<string, number> {
  const normalizedPos = position?.trim().toUpperCase() || '';
  
  // Check if it's a pitcher position
  const isPitcherPos = normalizedPos === 'P' || normalizedPos === 'SP' || normalizedPos === 'RP';
  
  if (isPitcherPos) {
    // Return pitcher weights (default from PITCHER_STAT_CONFIG)
    return Object.fromEntries(
      Object.entries(PITCHER_STAT_CONFIG).map(([key, config]) => [key, config.weight])
    );
  }
  
  if (normalizedPos === '1B') return POSITION_WEIGHTS_1B;
  
  // Default hitter weights (sum to 5.0)
  return Object.fromEntries(
    Object.entries(STAT_CONFIG).map(([key, config]) => [key, config.weight])
  );
}

interface TeamFitProps {
  player: Player | null;
  comps: Player[];
  onContinue: () => void;
  onBack: () => void;
}

type StatKey = keyof Omit<typeof STAT_LABELS extends Record<infer K, any> ? K : never, 'PA'>;

const PERIOD_LABELS: Record<StatPeriod, string> = {
  '2025': '2025 Season',
  '3yr-avg': '3-Year Average',
  '3yr-contract': '3-Year Pre-Contract',
  'career': 'Career Average',
};

// Division mapping for MLB teams - comprehensive mapping for all possible team abbreviations
const TEAM_DIVISIONS: Record<string, string> = {
  // AL East
  'NYY': 'AL East', 'BOS': 'AL East', 'TOR': 'AL East', 'TBR': 'AL East', 'TB': 'AL East', 'BAL': 'AL East',
  // AL Central
  'CLE': 'AL Central', 'MIN': 'AL Central', 'DET': 'AL Central', 'CHW': 'AL Central', 'CWS': 'AL Central', 'KCR': 'AL Central', 'KC': 'AL Central',
  // AL West
  'HOU': 'AL West', 'TEX': 'AL West', 'SEA': 'AL West', 'LAA': 'AL West', 'ANA': 'AL West', 'OAK': 'AL West', 'ATH': 'AL West',
  // NL East
  'ATL': 'NL East', 'MIA': 'NL East', 'NYM': 'NL East', 'PHI': 'NL East', 'WSH': 'NL East', 'WSN': 'NL East', 'MON': 'NL East',
  // NL Central
  'CHC': 'NL Central', 'MIL': 'NL Central', 'STL': 'NL Central', 'PIT': 'NL Central', 'CIN': 'NL Central',
  // NL West
  'LAD': 'NL West', 'SD': 'NL West', 'SDP': 'NL West', 'SFG': 'NL West', 'SF': 'NL West', 'ARI': 'NL West', 'ARZ': 'NL West', 'AZ': 'NL West', 'COL': 'NL West',
};

/**
 * Team abbreviation normalization map
 * Maps various team abbreviation formats to canonical abbreviations
 */
const TEAM_ABBREVIATION_MAP: Record<string, string> = {
  // Arizona Diamondbacks variants
  'ARI': 'ARI',
  'ARZ': 'ARI',
  'AZ': 'ARI',
  // San Diego Padres variants
  'SD': 'SD',
  'SDP': 'SD',
  // San Francisco Giants variants
  'SF': 'SF',
  'SFG': 'SF',
  // Chicago White Sox variants
  'CHW': 'CHW',
  'CWS': 'CHW',
  // Kansas City Royals variants
  'KC': 'KC',
  'KCR': 'KC',
  // Tampa Bay Rays variants
  'TB': 'TB',
  'TBR': 'TB',
  // Washington Nationals variants
  'WSH': 'WSH',
  'WSN': 'WSH',
  // Oakland Athletics variants
  'OAK': 'OAK',
  'ATH': 'OAK',
  // Los Angeles Angels variants
  'LAA': 'LAA',
  'ANA': 'LAA',
};

/**
 * Normalize team abbreviation from various formats
 * Handles duplicates ("DET DET" → "DET"), whitespace, case issues
 * Maps team variants to canonical abbreviations (e.g., AZ/ARZ → ARI)
 * Returns clean 2-3 letter MLB abbreviation or null if invalid
 */
function normalizeTeamAbbreviation(teamValue: string): string | null {
  // Handle empty, null, undefined, or placeholder values
  if (!teamValue || typeof teamValue !== 'string') return null;
  
  const trimmed = teamValue.trim();
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return null;
  
  // Convert to uppercase
  const upper = trimmed.toUpperCase();
  
  // Handle duplicate team abbreviations like "DET DET" - extract first part
  const parts = upper.split(/\s+/);
  let teamAbbr = parts[0];
  
  // If first part looks like a valid MLB abbreviation (2-3 letters), use it
  // Otherwise, try to extract abbreviation from common patterns
  if (/^[A-Z]{2,3}$/.test(teamAbbr)) {
    // Map to canonical abbreviation if a mapping exists, otherwise return as-is
    return TEAM_ABBREVIATION_MAP[teamAbbr] || teamAbbr;
  }
  
  // Try second part if first doesn't match (handles edge cases)
  if (parts.length > 1 && /^[A-Z]{2,3}$/.test(parts[1])) {
    const mapped = TEAM_ABBREVIATION_MAP[parts[1]] || parts[1];
    return mapped;
  }
  
  // If no valid abbreviation found, return null
  return null;
}

function getDivision(teamId: string): string {
  const normalizedTeam = normalizeTeamAbbreviation(teamId);
  
  if (!normalizedTeam) {
    return 'AL East'; // Default fallback for invalid teams
  }
  
  return TEAM_DIVISIONS[normalizedTeam] || 'AL East';
}

/**
 * Position code to abbreviation mapping
 * Based on MLB position codes: 1=P, 2=C, 3=1B, 4=2B, 5=3B, 6=SS, 7/8/9=OF, 10=DH
 */
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

/**
 * Load positions and teams that players have played across seasons from Positions.csv
 * This is the authoritative source for position data
 * Returns position map, primary position map, and team map
 */
async function loadPlayerPositionsByTimePeriod(
  timePeriod: StatPeriod
): Promise<{ 
  positions: Map<string, Set<string>>; 
  primaryPositions: Map<string, string>; // playerId -> primary position abbreviation
  teams: Map<string, string> 
}> {
  // Load Positions.csv, positions_pitchers.csv, and fangraphs_pitchers.csv
  const [positionsRows, positionsPitchersRows, fangraphsPitchersRows] = await fetchMultipleCsvs([
    '/Positions.csv',
    '/positions_pitchers.csv',
    '/fangraphs_pitchers.csv'
  ]);
  const allPositionsRows = [...positionsRows, ...positionsPitchersRows];
  const positionsByPlayer = new Map<string, Set<string>>();
  const positionCountsByPlayer = new Map<string, Map<string, number>>(); // playerId -> position -> count
  const teamsByPlayer = new Map<string, string>(); // Most recent team for each player
  const playerSeasons = new Map<string, number>(); // Track highest season seen for each player
  
  // Determine which seasons to check based on time period
  let seasonsToCheck: number[] = [];
  if (timePeriod === '2025') {
    seasonsToCheck = [2025];
  } else if (timePeriod === '3yr-avg') {
    seasonsToCheck = [2025, 2024, 2023];
  } else if (timePeriod === 'career') {
    // Check all seasons (don't filter by season)
    seasonsToCheck = [];
  } else if (timePeriod === '3yr-contract') {
    // For contract period, check 2023-2025 as default (will be refined per player if needed)
    seasonsToCheck = [2025, 2024, 2023];
  }
  
  // Process all CSV rows to build position and team maps
  for (const row of allPositionsRows) {
    const name = getString(row, ['player_name']);
    if (!name) continue;
    
    const normId = normalizePlayerName(name);
    const season = getField(row, ['season'], 0);
    const positionCode = getField(row, ['position_code'], 0);
    const teamAbbrev = getString(row, ['team_abbrev'], '').trim().toUpperCase();
    
    // Check if this season is relevant
    if (seasonsToCheck.length > 0 && !seasonsToCheck.includes(season)) continue;
    
    // Skip invalid position codes
    if (!positionCode || positionCode === 0) continue;
    
    // Build position map (all positions played)
    if (!positionsByPlayer.has(normId)) {
      positionsByPlayer.set(normId, new Set());
    }
    
    // Map position code to abbreviation
    const positionAbbr = POSITION_CODE_MAP[positionCode];
    if (positionAbbr) {
      positionsByPlayer.get(normId)!.add(positionAbbr);
      
      // Track position counts to determine primary position
      if (!positionCountsByPlayer.has(normId)) {
        positionCountsByPlayer.set(normId, new Map());
      }
      const counts = positionCountsByPlayer.get(normId)!;
      counts.set(positionAbbr, (counts.get(positionAbbr) || 0) + 1);
    }
    
    // Store team (use most recent season's team for each player)
    if (teamAbbrev) {
      const existingSeason = playerSeasons.get(normId) || 0;
      if (season >= existingSeason) {
        teamsByPlayer.set(normId, teamAbbrev);
        playerSeasons.set(normId, season);
      }
    }
  }
  
  // Helper function to normalize team abbreviation from CSV data (same as in playerDatabase.ts)
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
  
  // Process fangraphs_pitchers.csv to get more complete team data for pitchers
  // This is especially important for pitchers as it may have more complete team coverage
  // Prioritize fangraphs data for pitchers - it's more reliable for team assignments
  // First, collect all fangraphs team data by player and season
  const fangraphsTeamData = new Map<string, Map<number, string>>(); // playerId -> season -> team
  
  for (const row of fangraphsPitchersRows) {
    const name = getString(row, ['Name']);
    if (!name) continue;
    
    const normId = normalizePlayerName(name);
    const season = getField(row, ['Season', 'year'], 0);
    const rawTeam = getString(row, ['fg_Team'], '');
    
    // Check if this season is relevant
    if (seasonsToCheck.length > 0 && !seasonsToCheck.includes(season)) continue;
    
    const teamAbbrev = normalizeTeamFromCsv(rawTeam);
    
    if (teamAbbrev) {
      if (!fangraphsTeamData.has(normId)) {
        fangraphsTeamData.set(normId, new Map());
      }
      fangraphsTeamData.get(normId)!.set(season, teamAbbrev);
    }
  }
  
  // Now apply fangraphs team data, prioritizing it over positions data for pitchers
  for (const [normId, seasonTeams] of fangraphsTeamData.entries()) {
    // Get the most recent season's team from fangraphs
    const seasons = Array.from(seasonTeams.keys()).sort((a, b) => b - a);
    if (seasons.length > 0) {
      const mostRecentSeason = seasons[0];
      const teamAbbrev = seasonTeams.get(mostRecentSeason)!;
      
      // For pitchers, always prioritize fangraphs data
      // Override any existing team data from positions CSVs
      teamsByPlayer.set(normId, teamAbbrev);
      playerSeasons.set(normId, mostRecentSeason);
    }
  }
  
  // Determine primary position for each player (most frequently played position)
  const primaryPositions = new Map<string, string>();
  for (const [playerId, positionCounts] of positionCountsByPlayer.entries()) {
    let maxCount = 0;
    let primaryPos = '';
    for (const [pos, count] of positionCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        primaryPos = pos;
      }
    }
    if (primaryPos) {
      primaryPositions.set(playerId, primaryPos);
    }
  }
  
  // For pitchers in fangraphs but not in positions CSVs, set primary position to 'P'
  // This ensures they can be matched when filtering by position
  for (const [normId] of fangraphsTeamData.entries()) {
    if (!primaryPositions.has(normId)) {
      // Check if this player has team data from fangraphs (indicating they're a pitcher)
      // and set their primary position to 'P' so they can be matched
      primaryPositions.set(normId, 'P');
    }
  }
  
  return { positions: positionsByPlayer, primaryPositions, teams: teamsByPlayer };
}

export function TeamFit({ player, comps, onContinue, onBack }: TeamFitProps) {
  // If no player selected, show error state
  if (!player) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A3A8B0] mb-4">Please select a player and comparisons from the intro screen.</p>
          <SBButton onClick={onBack}>Go Back</SBButton>
        </div>
      </div>
    );
  }

  const isPitcherPlayer = isPitcher(player);
  const activeStatConfig = isPitcherPlayer ? PITCHER_STAT_CONFIG : STAT_CONFIG;
  const statLabels = getStatLabelsForPlayer(player);

  const { selectedTeamId, setSelectedTeamId, selectedTeamData, availableTeams, loading: payrollLoading } = usePayrollData();
  const [timePeriod, setTimePeriod] = useState<StatPeriod>('2025');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStat, setSelectedStat] = useState<string>(isPitcherPlayer ? 'WAR' : 'wRCplus'); // For division bar chart
  const [allPlayers, setAllPlayers] = useState<Player[]>(ALL_PLAYERS);
  
  // Update selectedStat when player type changes
  useEffect(() => {
    if (isPitcherPlayer) {
      setSelectedStat('WAR');
    } else {
      setSelectedStat('wRCplus');
    }
  }, [isPitcherPlayer]);
  const [playerPositionsMap, setPlayerPositionsMap] = useState<Map<string, Set<string>> | null>(null);
  const [playerPrimaryPositionsMap, setPlayerPrimaryPositionsMap] = useState<Map<string, string>>(new Map()); // playerId -> primary position
  const [playerTeamsMap, setPlayerTeamsMap] = useState<Map<string, string>>(new Map()); // playerId -> team_abbrev from Positions.csv (time period based)
  const [playerTeams2025Map, setPlayerTeams2025Map] = useState<Map<string, string>>(new Map()); // playerId -> team_abbrev from Positions.csv (2025 only)
  const [pitcherTeams2025Map, setPitcherTeams2025Map] = useState<Map<string, string>>(new Map()); // playerId -> team from fangraphs_pitchers.csv (2025 only)
  const [pitcherCsvRows, setPitcherCsvRows] = useState<any[]>([]); // Store pitcher CSV rows for creating Player objects on-the-fly
  
  // All available divisions
  const allDivisions = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];
  
  // State for selected division (initialized from selected team)
  const [selectedDivision, setSelectedDivision] = useState<string>(() => {
    return getDivision(selectedTeamId);
  });

  // Load positions and teams across seasons for the selected time period
  useEffect(() => {
    loadPlayerPositionsByTimePeriod(timePeriod)
      .then(({ positions, primaryPositions, teams }) => {
        setPlayerPositionsMap(positions);
        setPlayerPrimaryPositionsMap(primaryPositions);
        setPlayerTeamsMap(teams);
        console.log(`Loaded positions for ${positions.size} players across time period: ${timePeriod}`);
        console.log(`Loaded primary positions for ${primaryPositions.size} players`);
        console.log(`Loaded teams for ${teams.size} players (from Positions.csv and fangraphs_pitchers.csv)`);
      })
      .catch(err => console.error('Failed to load player positions:', err));
    
    // Also load 2025 teams separately for current team filtering
    loadPlayerPositionsByTimePeriod('2025')
      .then(({ teams: teams2025 }) => {
        setPlayerTeams2025Map(teams2025);
        console.log(`Loaded 2025 teams for ${teams2025.size} players (from Positions.csv and fangraphs_pitchers.csv)`);
      })
      .catch(err => console.error('Failed to load 2025 teams:', err));
    
    // Load pitcher teams directly from fangraphs_pitchers.csv for 2025
    // Also store all pitcher CSV rows for creating Player objects on-the-fly
    fetchMultipleCsvs(['/fangraphs_pitchers.csv', '/spotrac_pitchers.csv', '/statcast_pitchers.csv'])
      .then(([fangraphsPitchersRows, spotracPitchersRows, statcastPitchersRows]) => {
        const pitcherTeams = new Map<string, string>();
        const normalizeTeamFromCsv = (teamValue: string): string => {
          if (!teamValue || typeof teamValue !== 'string') return '';
          const trimmed = teamValue.trim();
          if (trimmed === '' || trimmed === '—' || trimmed === '-') return '';
          const upper = trimmed.toUpperCase();
          const parts = upper.split(/\s+/);
          const teamAbbr = parts[0];
          if (/^[A-Z]{2,3}$/.test(teamAbbr)) {
            return teamAbbr;
          }
          if (parts.length > 1 && /^[A-Z]{2,3}$/.test(parts[1])) {
            return parts[1];
          }
          return trimmed;
        };
        
        // Store all pitcher CSV rows for later use
        setPitcherCsvRows(fangraphsPitchersRows);
        
        for (const row of fangraphsPitchersRows) {
          const name = getString(row, ['Name']);
          if (!name) continue;
          const normId = normalizePlayerName(name);
          const season = getField(row, ['Season', 'year'], 0);
          if (season === 2025) {
            const rawTeam = getString(row, ['fg_Team'], '');
            const teamAbbrev = normalizeTeamFromCsv(rawTeam);
            if (teamAbbrev) {
              pitcherTeams.set(normId, teamAbbrev);
            }
          }
        }
        setPitcherTeams2025Map(pitcherTeams);
        console.log(`Loaded 2025 pitcher teams for ${pitcherTeams.size} pitchers from fangraphs_pitchers.csv`);
        console.log(`Stored ${fangraphsPitchersRows.length} pitcher CSV rows for on-the-fly Player creation`);
      })
      .catch(err => console.error('Failed to load pitcher teams from Fangraphs:', err));
  }, [timePeriod]);

  // Load player data to ensure ALL_PLAYERS is populated
  useEffect(() => {
    loadPlayersFromCsv()
      .then(list => {
        setAllPlayers(list);
      })
      .catch(err => console.error('Failed to load players:', err));
  }, []);

  // Enhanced debug logging when both players and positions map are loaded
  useEffect(() => {
    if (player && allPlayers.length > 0 && playerPositionsMap && playerPrimaryPositionsMap.size > 0 && playerTeamsMap.size > 0) {
      // Extract target position
      const normalizePosition = (pos: string): string => {
        if (!pos) return '';
        return pos.split(/[\/,]/)[0].trim().toUpperCase();
      };
      // Use primary position from Positions.csv if available
      const targetPosition = playerPrimaryPositionsMap.get(player.id) || normalizePosition(player.position);
      
      // Use the same matchesPosition function but check primary positions
      const matchesPos = (p: Player): boolean => {
        // Check primary position from Positions.csv
        if (playerPrimaryPositionsMap.size > 0) {
          const primaryPos = playerPrimaryPositionsMap.get(p.id);
          if (primaryPos === targetPosition) {
            return true;
          }
        }
        
        // Fallback: Check player's stored primary position
        const playerPos = p.position?.toUpperCase().trim() || '';
        if (playerPos) {
          const primaryFromStored = playerPos.split(/[\/,]/)[0].trim();
          if (primaryFromStored === targetPosition) {
            return true;
          }
        }
        
        return false;
      };
      
      // Step 1: Find all players with PRIMARY position matching target
      const allPositionPlayers = allPlayers.filter(matchesPos);
      
      // Step 2: Filter out players with no stats
      const playersWithStats = allPositionPlayers.filter(p => hasValidStats(p));
      
      console.log(`=== Position Filtering Debug (${targetPosition}, time period: ${timePeriod}) ===`);
      console.log(`Total players with PRIMARY position ${targetPosition}:`, allPositionPlayers.length);
      console.log(`Players with valid stats (after filtering zeros):`, playersWithStats.length);
      
      // Group by division with team normalization details
      const byDivision: Record<string, Array<{ name: string; team: string; csvTeam: string; normalizedTeam: string | null }>> = {};
      const unmappedTeams: Array<{ name: string; team: string; csvTeam: string; normalizedTeam: string | null }> = [];
      
      playersWithStats.forEach(p => {
        // Use team from Positions.csv if available, otherwise fall back to player.team
        const csvTeam = playerTeamsMap.get(p.id);
        const teamToUse = csvTeam || p.team;
        const normalizedTeam = normalizeTeamAbbreviation(teamToUse);
        const div = getDivision(teamToUse);
        
        const playerInfo = {
          name: p.name,
          team: p.team,
          csvTeam: csvTeam || 'N/A',
          normalizedTeam: normalizedTeam
        };
        
        if (!byDivision[div]) byDivision[div] = [];
        byDivision[div].push(playerInfo);
        
        // Track players with unmapped teams (defaulting to AL East)
        if (div === 'AL East' && normalizedTeam && !TEAM_DIVISIONS[normalizedTeam]) {
          unmappedTeams.push(playerInfo);
        }
      });
      
      // Log division breakdown
      console.log(`Players by division (${targetPosition}):`);
      Object.entries(byDivision).forEach(([div, players]) => {
        console.log(`  ${div}: ${players.length} players`, players.map(p => {
          const teamSource = p.csvTeam !== 'N/A' ? `CSV:${p.csvTeam}` : `Player:${p.team}`;
          return `${p.name} (${teamSource}→${p.normalizedTeam || '?'})`;
        }));
      });
      
      // Log team normalization examples (first 10)
      const uniqueTeams = new Set(allPositionPlayers.map(p => p.team).filter(t => t && t !== '—'));
      console.log(`Unique team values (first 10):`, Array.from(uniqueTeams).slice(0, 10).map(t => {
        const norm = normalizeTeamAbbreviation(t);
        return `${t} → ${norm || 'UNMAPPED'}`;
      }));
      
      // Log unmapped teams
      if (unmappedTeams.length > 0) {
        console.warn(`⚠️ ${unmappedTeams.length} players with unmapped teams (defaulting to AL East):`, unmappedTeams.map(p => {
          const teamSource = p.csvTeam !== 'N/A' ? `CSV:${p.csvTeam}` : `Player:${p.team}`;
          return `${p.name}: "${teamSource}" → "${p.normalizedTeam}"`;
        }));
      }
    }
  }, [player, allPlayers, playerPositionsMap, playerTeamsMap, timePeriod]);

  // Update division when team changes
  useEffect(() => {
    const teamDivision = getDivision(selectedTeamId);
    setSelectedDivision(teamDivision);
  }, [selectedTeamId]);

  // When division changes, update team to first team in that division
  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    // Find first team in the selected division
    const teamInDivision = availableTeams.find(team => getDivision(team.id) === division);
    if (teamInDivision) {
      setSelectedTeamId(teamInDivision.id);
    }
  };

  // Get the selected player's primary position from Positions.csv
  const playerPrimaryPosition = useMemo(() => {
    if (!player || playerPrimaryPositionsMap.size === 0) {
      // Fallback to stored position if CSV not loaded yet
      const normalizePosition = (pos: string): string => {
        if (!pos) return '';
        return pos.split(/[\/,]/)[0].trim().toUpperCase();
      };
      return normalizePosition(player?.position || '');
    }
    // Use primary position from Positions.csv
    return playerPrimaryPositionsMap.get(player.id) || player.position?.split(/[\/,]/)[0].trim().toUpperCase() || '';
  }, [player, playerPrimaryPositionsMap]);

  // Get estimated AAV and years from localStorage (set by EstimatedValue screen)
  // Fallback to comps average if not available
  const estimatedAAV = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('estimated_fairAAV');
      if (stored) {
        const value = parseFloat(stored);
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }
    // Fallback to comps average
    if (!comps || comps.length === 0) return 0;
    const signedComps = comps.filter(c => c.hasContract && c.AAV);
    if (signedComps.length === 0) return 0;
    return signedComps.reduce((sum, c) => sum + (c.AAV || 0), 0) / signedComps.length;
  }, [comps]);

  const estimatedYears = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('estimated_fairYears');
      if (stored) {
        const value = parseFloat(stored);
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }
    // Fallback to comps average
    if (!comps || comps.length === 0) return 0;
    const signedComps = comps.filter(c => c.hasContract && c.years);
    if (signedComps.length === 0) return 0;
    return signedComps.reduce((sum, c) => sum + (c.years || 0), 0) / signedComps.length;
  }, [comps]);

  // Team payroll data for chart visualization
  const teamPayrollData = useMemo(() => {
    if (!selectedTeamData || payrollLoading || estimatedYears === 0) {
      return [];
    }

    // Create a map of payroll by year from CSV data
    const payrollByYearMap = new Map<number, number>();
    selectedTeamData.payrollByYear.forEach(({ year, payroll }) => {
      payrollByYearMap.set(year, payroll);
    });

    // Generate data for all years from CSV (2026-2031)
    const yearsWithData = Array.from(payrollByYearMap.keys()).sort((a, b) => a - b);
    const lastAvailableYear = yearsWithData[yearsWithData.length - 1];
    const lastAvailablePayroll = lastAvailableYear ? payrollByYearMap.get(lastAvailableYear) || 0 : 0;
    
    // Show all years from 2026 to 2031 (or the last year with data)
    const startYear = 2026;
    const endYear = Math.max(2031, lastAvailableYear || 2031);
    const data = [];
    
    for (let year = startYear; year <= endYear; year++) {
      let basePayroll = payrollByYearMap.get(year);
      if (basePayroll === undefined) {
        // Use last available payroll for missing years
        basePayroll = lastAvailablePayroll;
      }
      
      // Only add player contract for years within the contract period
      const contractYears = Math.ceil(estimatedYears);
      const playerContract = (year - startYear) < contractYears ? estimatedAAV : 0;
      
      data.push({
        year: year.toString(),
        basePayroll,
        playerContract,
      });
    }
    
    return data;
  }, [selectedTeamData, estimatedYears, estimatedAAV, payrollLoading]);

  // Get values for selected year
  const { basePayroll, playerContract, totalPayroll } = useMemo(() => {
    const yearData = teamPayrollData.find(d => parseInt(d.year) === selectedYear);
    if (!yearData) {
      return { basePayroll: 0, playerContract: 0, totalPayroll: 0 };
    }
    
    return {
      basePayroll: yearData.basePayroll,
      playerContract: yearData.playerContract,
      totalPayroll: yearData.basePayroll + yearData.playerContract,
    };
  }, [teamPayrollData, selectedYear]);


  /**
   * Check if player's PRIMARY position matches target position
   * Only includes players where the target position is their primary position in the selected time period
   */
  const matchesPosition = useMemo(() => {
    if (!player || !playerPrimaryPosition) return () => false;
    
    const targetPosition = playerPrimaryPosition;
    const targetIsPitcher = isPitcher(player);
    
    return (p: Player): boolean => {
      if (!targetPosition) return false;
      
      // First, ensure we're comparing the same player type (pitcher vs hitter)
      // This prevents hitters from appearing when analyzing pitchers and vice versa
      const pIsPitcher = isPitcher(p);
      if (targetIsPitcher !== pIsPitcher) {
        return false;
      }
      
      // STRICT: Only use primary position from Positions.csv
      // If we have primary positions loaded, ONLY check those (most accurate)
      if (playerPrimaryPositionsMap.size > 0) {
        const primaryPos = playerPrimaryPositionsMap.get(p.id);
        
        // For pitchers, allow flexible matching (P, SP, RP all match each other)
        if (targetIsPitcher && pIsPitcher && primaryPos) {
          const pitcherPositions = ['P', 'SP', 'RP'];
          const targetIsPitcherPos = pitcherPositions.includes(targetPosition);
          const primaryIsPitcherPos = pitcherPositions.includes(primaryPos);
          if (targetIsPitcherPos && primaryIsPitcherPos) {
            return true;
          }
        }
        
        // Only match if primary position exactly equals target position
        if (primaryPos && primaryPos === targetPosition) {
          return true;
        }
        // If player has a primary position in CSV but it doesn't match, exclude them
        // This prevents players with "3B" from appearing in "OF" analysis
        if (primaryPos) {
          return false;
        }
      }
      
      // Fallback: Only if player has NO primary position in CSV, check stored position
      // Extract primary position (first position before slash/comma) from stored value
      const playerPos = p.position?.toUpperCase().trim() || '';
      if (playerPos) {
        const primaryFromStored = playerPos.split(/[\/,]/)[0].trim();
        if (primaryFromStored === targetPosition) {
          return true;
        }
      }
      
      return false;
    };
  }, [player, playerPrimaryPositionsMap, isPitcherPlayer]);

  // Helper function to check if player has meaningful stats (not all zeros)
  const hasValidStats = (p: Player): boolean => {
    const stats = getStatsForPeriod(p, timePeriod);
    const pIsPitcher = isPitcher(p);
    
    if (pIsPitcher) {
      // For pitchers, be more lenient - just need IP or WAR
      // Some pitchers might have IP but no ERA (e.g., very small sample size)
      const hasIP = (stats.IP || 0) > 0;
      const hasWAR = (stats.WAR || 0) > 0;
      // Include if they have either IP or WAR
      return hasIP || hasWAR;
    } else {
      // Check hitter stats
      const hasPA = (stats.PA || 0) > 0;
      const hasHR = (stats.HR || 0) > 0 || (stats.HRperPA || 0) > 0;
      const hasRBI = (stats.RBI || 0) > 0;
      const hasWRC = (stats.wRCplus || 0) > 0;
      return hasPA && (hasHR || hasRBI || hasWRC);
    }
  };

  // Helper function to check if player played in 2024 or 2025
  const playedIn2024Or2025 = (p: Player): boolean => {
    const pIsPitcher = isPitcher(p);
    const stats2025 = p.stats2025;
    const stats3yr = p.threeYearStats;
    
    if (pIsPitcher) {
      // For pitchers, check IP or WAR in either 2025 or 3yr stats
      const hasIP2025 = (stats2025?.IP || 0) > 0;
      const hasWAR2025 = (stats2025?.WAR || 0) > 0;
      const hasIP3yr = (stats3yr?.IP || 0) > 0;
      const hasWAR3yr = (stats3yr?.WAR || 0) > 0;
      return hasIP2025 || hasWAR2025 || hasIP3yr || hasWAR3yr;
    } else {
      // Check 2025 stats
      const hasPA2025 = (stats2025?.PA || 0) > 0;
      const hasHR2025 = (stats2025?.HRperPA || 0) > 0;
      const hasRBI2025 = (stats2025?.RBI || 0) > 0;
      const hasWRC2025 = (stats2025?.wRCplus || 0) > 0;
      const has2025Stats = hasPA2025 && (hasHR2025 || hasRBI2025 || hasWRC2025);

      // Check 2024 - if player has meaningful threeYearStats and reasonable PA, they likely played in 2024
      const hasPA3yr = (stats3yr?.PA || 0) > 0;
      const hasHR3yr = (stats3yr?.HRperPA || 0) > 0;
      const hasRBI3yr = (stats3yr?.RBI || 0) > 0;
      const hasWRC3yr = (stats3yr?.wRCplus || 0) > 0;
      const has2024Stats = hasPA3yr && (hasHR3yr || hasRBI3yr || hasWRC3yr);

      return has2025Stats || has2024Stats;
    }
  };

  // Helper function to create a Player object from CSV rows for pitchers not in allPlayers
  const createPlayerFromCsvRows = (pitcherId: string, csvRows: any[]): Player | null => {
    const playerRows = csvRows.filter(r => {
      const name = getString(r, ['Name']);
      if (!name) return false;
      const normId = normalizePlayerName(name);
      return normId === pitcherId;
    });
    
    if (playerRows.length === 0) return null;
    
    // Get player name from first row
    const name = getString(playerRows[0], ['Name']);
    if (!name) return null;
    
    // Aggregate stats from CSV rows
    const toSeasonObj = (r: any) => {
      const season = getField(r, ['Season', 'year'], 0);
      const rawTeam = getString(r, ['fg_Team'], '');
      const normalizedTeam = normalizeTeamAbbreviation(rawTeam);
      return {
        season: Number(season),
        WAR: getField(r, ['fg_WAR', 'fg_L-WAR'], 0),
        age: getField(r, ['fg_Age', 'player_age'], 0),
        position: 'P',
        team: normalizedTeam || rawTeam || '',
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
    };
    
    const seasons = playerRows.map(toSeasonObj).filter(s => s.season > 0).sort((a, b) => a.season - b.season);
    if (seasons.length === 0) return null;
    
    // Aggregate stats
    const mean = (k: string, d = 6) => {
      const validValues = seasons.map(r => Number((r as any)[k] || 0)).filter(v => !isNaN(v));
      if (validValues.length === 0) return 0;
      return Number((validValues.reduce((s, v) => s + v, 0) / validValues.length).toFixed(d));
    };
    
    const aggregate = (seasonList: typeof seasons): PlayerStats => {
      if (seasonList.length === 0) {
        return {
          WAR: 0, age: 0,
          wRCplus: 0, xwOBA: 0, xSLG: 0, HRperPA: 0, RBI: 0, OPS: 0, BarrelPerPA: 0, HardHitPct: 0,
          EV50: 0, maxEV: 0, BBpct: 0, Kpct: 0, ContactPct: 0, PA: 0, fg_Def: 0, fg_BsR: 0,
          ERA: 0, FIP: 0, xFIP: 0, Kper9: 0, BBper9: 0, KperBB: 0, WHIP: 0, IP: 0, GS: 0, SV: 0,
          Hper9: 0, HRper9: 0, BABIP: 0, LOBpct: 0,
        };
      }
      return {
        WAR: mean('WAR', 3),
        age: mean('age', 2),
        wRCplus: 0, xwOBA: 0, xSLG: 0, HRperPA: 0, RBI: 0, OPS: 0, BarrelPerPA: 0, HardHitPct: 0,
        EV50: 0, maxEV: 0, BBpct: 0, Kpct: 0, ContactPct: 0, PA: 0, fg_Def: 0, fg_BsR: 0,
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
    };
    
    const s2025 = seasons.filter(s => s.season === 2025);
    const s3yr = seasons.filter(s => [2025, 2024, 2023].includes(s.season));
    const career = seasons;
    const team = (s2025[0]?.team || seasons[seasons.length - 1].team) || '—';
    
    return {
      id: pitcherId,
      name,
      jerseyNumber: 0,
      position: 'P',
      team,
      hasContract: false,
      stats2025: aggregate(s2025),
      threeYearStats: aggregate(s3yr.length ? s3yr : seasons.slice(-3)),
      careerStats: aggregate(career),
      has2025Season: s2025.length > 0,
    };
  };

  // Filter players by position and team (for team-specific analysis)
  const teamPositionPlayers = useMemo(() => {
    if (!player || !selectedTeamId) return [];
    
    // For pitchers, use a more direct approach - match by team from Fangraphs
    if (isPitcherPlayer) {
      // Wait for pitcher teams map to load
      if (pitcherTeams2025Map.size === 0) return [];
      
      // Normalize selected team
      const normalizedSelectedTeam = normalizeTeamAbbreviation(selectedTeamId);
      
      // Build a map of pitcher IDs to Player objects for quick lookup
      const pitcherMap = new Map<string, Player>();
      allPlayers.forEach(p => {
        if (isPitcher(p)) {
          pitcherMap.set(p.id, p);
        }
      });
      
      // Find all pitchers from Fangraphs that match the selected team
      const matchingPitcherIds: string[] = [];
      for (const [pitcherId, team] of pitcherTeams2025Map.entries()) {
        const normalizedTeam = normalizeTeamAbbreviation(team);
        if (normalizedTeam === normalizedSelectedTeam) {
          matchingPitcherIds.push(pitcherId);
        }
      }
      
      // Get Player objects for matching pitchers
      // First, try to get from allPlayers
      const pitcherPlayersFromAll: Player[] = [];
      const missingPitcherIds: string[] = [];
      
      for (const id of matchingPitcherIds) {
        const existingPlayer = pitcherMap.get(id);
        if (existingPlayer) {
          pitcherPlayersFromAll.push(existingPlayer);
        } else {
          missingPitcherIds.push(id);
        }
      }
      
      // Create Player objects from CSV for pitchers not in allPlayers
      const pitcherPlayersFromCsv: Player[] = [];
      for (const id of missingPitcherIds) {
        const csvPlayer = createPlayerFromCsvRows(id, pitcherCsvRows);
        if (csvPlayer && hasValidStats(csvPlayer)) {
          pitcherPlayersFromCsv.push(csvPlayer);
        }
      }
      
      const allPitcherPlayers = [...pitcherPlayersFromAll, ...pitcherPlayersFromCsv];
      
      console.log(`Found ${matchingPitcherIds.length} pitcher IDs for team ${selectedTeamId} (normalized: ${normalizedSelectedTeam})`);
      console.log(`Matched ${pitcherPlayersFromAll.length} pitchers from allPlayers`);
      console.log(`Created ${pitcherPlayersFromCsv.length} pitchers from CSV`);
      console.log(`Total pitchers: ${allPitcherPlayers.length}`);
      
      // Always include the selected player if they're not already in the list
      const playerInList = allPitcherPlayers.some(p => p.id === player.id);
      if (!playerInList) {
        return [player, ...allPitcherPlayers];
      }
      return allPitcherPlayers;
    }
    
    // For hitters, use the original position-based filtering
    if (!playerPositionsMap || playerPrimaryPositionsMap.size === 0) return [];
    
    // Step 1: Filter ALL players by PRIMARY position first
    const allPositionPlayers = allPlayers.filter(p => matchesPosition(p));
    
    // Step 2: Filter out players with all zero/invalid stats
    const playersWithStats = allPositionPlayers.filter(p => hasValidStats(p));
    
    // Step 3: From position-filtered list, filter by selected team
    // Include players who played in 2024 or 2025
    const filtered = playersWithStats.filter(p => {
      // Check if player played in 2024 or 2025
      if (!playedIn2024Or2025(p)) return false;
      
      // For hitters, use positions CSV data
      const teamToUse = playerTeams2025Map.get(p.id) || p.team;
      
      if (!teamToUse || teamToUse === '—' || teamToUse === '') return false;
      
      // Normalize both teams for comparison
      const normalizedTeam = normalizeTeamAbbreviation(teamToUse);
      const normalizedSelectedTeam = normalizeTeamAbbreviation(selectedTeamId);
      
      return normalizedTeam === normalizedSelectedTeam;
    });
    
    // Always include the selected player if they're not already in the list
    const playerInList = filtered.some(p => p.id === player.id);
    if (!playerInList) {
      return [player, ...filtered];
    }
    return filtered;
  }, [player, selectedTeamId, allPlayers, matchesPosition, playerPositionsMap, playerPrimaryPositionsMap, playerTeams2025Map, pitcherTeams2025Map, pitcherCsvRows, isPitcherPlayer, timePeriod, hasValidStats]);

  // Filter players by position and division (two-step process)
  const divisionPositionPlayers = useMemo(() => {
    if (!player || !playerPositionsMap || playerPrimaryPositionsMap.size === 0) return []; // Wait for positions map to load
    
    // For pitchers, use a more direct approach - match by team from Fangraphs
    if (isPitcherPlayer) {
      // Wait for pitcher teams map to load
      if (pitcherTeams2025Map.size === 0) return [];
      
      // Build a map of pitcher IDs to Player objects for quick lookup
      const pitcherMap = new Map<string, Player>();
      allPlayers.forEach(p => {
        if (isPitcher(p)) {
          pitcherMap.set(p.id, p);
        }
      });
      
      // Find all pitchers from Fangraphs that match the selected division
      const matchingPitcherIds: string[] = [];
      for (const [pitcherId, team] of pitcherTeams2025Map.entries()) {
        const playerDivision = getDivision(team);
        if (playerDivision === selectedDivision) {
          matchingPitcherIds.push(pitcherId);
        }
      }
      
      // Get Player objects for matching pitchers
      // First, try to get from allPlayers
      const pitcherPlayersFromAll: Player[] = [];
      const missingPitcherIds: string[] = [];
      
      for (const id of matchingPitcherIds) {
        const existingPlayer = pitcherMap.get(id);
        if (existingPlayer) {
          pitcherPlayersFromAll.push(existingPlayer);
        } else {
          missingPitcherIds.push(id);
        }
      }
      
      // Create Player objects from CSV for pitchers not in allPlayers
      const pitcherPlayersFromCsv: Player[] = [];
      for (const id of missingPitcherIds) {
        const csvPlayer = createPlayerFromCsvRows(id, pitcherCsvRows);
        if (csvPlayer && hasValidStats(csvPlayer)) {
          pitcherPlayersFromCsv.push(csvPlayer);
        }
      }
      
      const allPitcherPlayers = [...pitcherPlayersFromAll, ...pitcherPlayersFromCsv];
      
      // Always include the selected player if they're not already in the list
      const playerInList = allPitcherPlayers.some(p => p.id === player.id);
      if (!playerInList) {
        return [player, ...allPitcherPlayers];
      }
      return allPitcherPlayers;
    }
    
    // For hitters, use the original position-based filtering
    // Step 1: Filter ALL players by PRIMARY position first
    const allPositionPlayers = allPlayers.filter(p => matchesPosition(p));
    
    // Step 2: Filter out players with all zero/invalid stats
    const playersWithStats = allPositionPlayers.filter(p => hasValidStats(p));
    
    // Step 3: From position-filtered list, filter by division
    // Include players who played in 2024 or 2025
    const filtered = playersWithStats.filter(p => {
      // Check if player played in 2024 or 2025
      if (!playedIn2024Or2025(p)) return false;
      
      // Use 2025 team from Positions.csv if available (most accurate for current team)
      // Fall back to player.team which should also reflect 2025 team
      const csvTeam2025 = playerTeams2025Map.get(p.id);
      const teamToUse = csvTeam2025 || p.team;
      if (!teamToUse || teamToUse === '—' || teamToUse === '') return false;
      
      const playerDivision = getDivision(teamToUse);
      return playerDivision === selectedDivision;
    });
    
    // Always include the selected player if they're not already in the list
    const playerInList = filtered.some(p => p.id === player.id);
    if (!playerInList) {
      return [player, ...filtered];
    }
    return filtered;
  }, [player, selectedDivision, allPlayers, matchesPosition, playerPositionsMap, playerPrimaryPositionsMap, playerTeams2025Map, pitcherTeams2025Map, pitcherCsvRows, isPitcherPlayer, timePeriod, hasValidStats, playedIn2024Or2025, createPlayerFromCsvRows]);

  // Helper function to get stat value from player stats
  const getStatValue = (configKey: string, stats: PlayerStats | (PlayerStats & { HR?: number })): number => {
    const statKey = STAT_KEY_MAP[configKey];
    
    if (!statKey) return 0;
    
    if (statKey === 'HR') {
      if ((stats as any)['HR'] !== undefined && !isNaN((stats as any)['HR'])) {
        return (stats as any)['HR'] as number;
      }
      const hrFromHRperPA = Math.round((stats.HRperPA as number) || 0);
      return isNaN(hrFromHRperPA) ? 0 : hrFromHRperPA;
    } else {
      const value = ((stats as any)[statKey] as number) || 0;
      return isNaN(value) ? 0 : value;
    }
  };

  // Calculate composite score for a player compared to selected player (1v1 style)
  // Each player is compared directly to the selected player as the baseline
  const calculateCompositeScore = useMemo(() => {
    if (!player) return () => 0;
    
    const baselineStats = getStatsForPeriod(player, timePeriod);
    const defaultPosition = isPitcherPlayer ? 'P' : '1B';
    const weights = getWeightsForPosition(playerPrimaryPosition || player.position || defaultPosition);
    
    return (comparePlayer: Player): number => {
      // Selected player gets score of 0 (he's the baseline)
      if (comparePlayer.id === player.id) return 0;
      
      const compareStats = getStatsForPeriod(comparePlayer, timePeriod);
      let totalScore = 0;
      
      Object.entries(activeStatConfig).forEach(([configKey, config]) => {
        const baselineValue = getStatValue(configKey, baselineStats);
        const compareValue = getStatValue(configKey, compareStats);
        const weight = weights[configKey] || config.weight;
        
        let ratio = 1;
        if (configKey === 'fg_Def' || configKey === 'fg_BsR') {
          // Special handling for Def/BsR (can be negative)
          const delta = compareValue - baselineValue;
          const typicalRange = 10;
          const deltaRatio = 1 + (delta / typicalRange) * 0.2;
          ratio = Math.max(0.5, Math.min(2.0, deltaRatio));
        } else if (config.higherBetter) {
          // Higher is better: compareValue / baselineValue
          // If compareValue > baselineValue, ratio > 1 (better than Pete)
          if (Math.abs(baselineValue) < 0.001) {
            ratio = compareValue > 0 ? 1.1 : (compareValue < 0 ? 0.9 : 1);
          } else {
            ratio = compareValue / baselineValue;
          }
          ratio = Math.max(0.1, Math.min(10, ratio));
        } else {
          // Lower is better (like K%): baselineValue / compareValue
          // If compareValue < baselineValue (better K%), ratio > 1 (better than Pete)
          if (Math.abs(compareValue) < 0.001) {
            ratio = baselineValue > 0 ? 1.1 : (baselineValue < 0 ? 0.9 : 1);
          } else {
            ratio = baselineValue / compareValue;
          }
          ratio = Math.max(0.1, Math.min(10, ratio));
        }
        
        // Contribution is (ratio - 1) * weight
        // Positive contribution = better than Pete, negative = worse than Pete
        const contribution = (ratio - 1) * weight;
        totalScore += contribution;
      });
      
      return totalScore;
    };
  }, [player, timePeriod, playerPrimaryPosition, isPitcherPlayer, activeStatConfig]);

  // Sort team players by composite score descending (higher score = better rank)
  const sortedTeamPlayers = useMemo(() => {
    const calcScore = calculateCompositeScore;
    return [...teamPositionPlayers].sort((a, b) => {
      const scoreA = calcScore(a);
      const scoreB = calcScore(b);
      return scoreB - scoreA; // Higher score = better rank
    });
  }, [teamPositionPlayers, calculateCompositeScore]);

  // Calculate depth chart metrics using composite score
  const depthChartMetrics = useMemo(() => {
    if (!player) {
      return {
        currentScore: 0,
        projectedScoreMin: 0,
        projectedScoreMax: 0,
        replacementScoreRisk: 0,
        replacementPlayerName: 'No Replacement',
      };
    }

    // Get current composite score (baseline is 0 since we compare to player)
    const calcScore = calculateCompositeScore;
    const currentScore = 0; // Player's score vs themselves is always 0

    // Calculate projected score range based on age
    // Typical aging affects composite score similarly
    const playerStats = getStatsForPeriod(player, timePeriod);
    const playerAge = (playerStats.age || player.threeYearStats.age) as number;
    const contractYears = Math.ceil(estimatedYears);
    
    // Age-based decline rates for composite score
    // Composite score decline is less predictable than WAR, but follows similar patterns
    let annualDecline = 0;
    if (playerAge >= 32) {
      annualDecline = 0.15; // Steeper decline for older players
    } else if (playerAge >= 30) {
      annualDecline = 0.12; // Moderate decline
    } else if (playerAge >= 27) {
      annualDecline = 0.08; // Gentle decline
    } else {
      annualDecline = 0.03; // Minimal decline for younger players
    }

    // Project composite score over contract term
    // Conservative projection (worst case)
    const projectedScoreMin = currentScore - (annualDecline * contractYears * 1.2);
    // Optimistic projection (maintains current level with slight decline)
    const projectedScoreMax = currentScore - (annualDecline * contractYears * 0.8);

    // Calculate replacement composite score risk based on team depth
    // Find the next best player on the team at this position (excluding the target player)
    // Include players who played in 2024 or 2025
    let replacementScoreRisk = 0; // Default to 0 if no replacement available
    let replacementPlayerName = 'No Replacement'; // Default replacement name
    if (sortedTeamPlayers && sortedTeamPlayers.length > 1) {
      // Find players other than the target player (already filtered to players who played in 2024 or 2025)
      const otherTeamPlayers = sortedTeamPlayers.filter(p => {
        if (p.id === player.id) return false;
        // Already filtered to players who played in 2024 or 2025 in teamPositionPlayers
        return true;
      });
      if (otherTeamPlayers.length > 0) {
        // Get the best replacement player's composite score
        const bestReplacement = otherTeamPlayers[0];
        replacementPlayerName = bestReplacement.name;
        const replacementScore = calcScore(bestReplacement);
        
        // Replacement risk is the difference (negative because it's a loss)
        // Current player score is 0, so risk is just negative replacement score
        replacementScoreRisk = -replacementScore;
      } else {
        // No other players at position who played in 2024 or 2025 - replacement would be 0 (same as losing the player)
        replacementScoreRisk = 0;
      }
    } else if (sortedTeamPlayers && sortedTeamPlayers.length === 1) {
      // Only the target player is on the team - no replacement available
      replacementScoreRisk = 0;
    }

    return {
      currentScore,
      projectedScoreMin: Math.round(projectedScoreMin * 10) / 10,
      projectedScoreMax: Math.round(projectedScoreMax * 10) / 10,
      replacementScoreRisk: Math.round(replacementScoreRisk * 10) / 10,
      replacementPlayerName,
    };
  }, [player, timePeriod, estimatedYears, sortedTeamPlayers, calculateCompositeScore]);

  // Sort by composite score descending (higher score = better rank)
  const sortedDivisionPlayers = useMemo(() => {
    const calcScore = calculateCompositeScore;
    return [...divisionPositionPlayers].sort((a, b) => {
      const scoreA = calcScore(a);
      const scoreB = calcScore(b);
      return scoreB - scoreA; // Higher score = better rank
    });
  }, [divisionPositionPlayers, calculateCompositeScore]);

  // Find player's rank in team
  const teamRank = useMemo(() => {
    const index = sortedTeamPlayers.findIndex(p => p.id === player.id);
    return index >= 0 ? index + 1 : sortedTeamPlayers.length;
  }, [sortedTeamPlayers, player]);

  // Find player's rank in division (by composite score)
  const playerRank = useMemo(() => {
    const index = sortedDivisionPlayers.findIndex(p => p.id === player.id);
    return index >= 0 ? index + 1 : sortedDivisionPlayers.length;
  }, [sortedDivisionPlayers, player]);

  // Find player's rank in division by selected stat
  const playerStatRank = useMemo(() => {
    if (!player || !sortedDivisionPlayers.length || !selectedStat) return 1;
    
    // Sort players by selected stat (descending - higher is better for most stats)
    const sortedByStat = [...sortedDivisionPlayers].sort((a, b) => {
      const statsA = getStatsForPeriod(a, timePeriod);
      const statsB = getStatsForPeriod(b, timePeriod);
      const valueA = (statsA[selectedStat as keyof PlayerStats] || 0) as number;
      const valueB = (statsB[selectedStat as keyof PlayerStats] || 0) as number;
      
      // For pitcher stats where lower is better (ERA, FIP, WHIP, BB/9)
      if (isPitcherPlayer && (selectedStat === 'ERA' || selectedStat === 'FIP' || selectedStat === 'xFIP' || selectedStat === 'WHIP' || selectedStat === 'BBper9')) {
        return valueA - valueB;
      }
      
      // For K%, lower is better
      if (selectedStat === 'Kpct') {
        return valueA - valueB;
      }
      
      return valueB - valueA;
    });
    
    const index = sortedByStat.findIndex(p => p.id === player.id);
    return index >= 0 ? index + 1 : sortedByStat.length;
  }, [player, sortedDivisionPlayers, selectedStat, timePeriod, isPitcherPlayer]);

  // Helper function to format rank as ordinal (1st, 2nd, 3rd, etc.)
  const formatOrdinalRank = (rank: number): string => {
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${rank}th`;
    }
    
    if (lastDigit === 1) return `${rank}st`;
    if (lastDigit === 2) return `${rank}nd`;
    if (lastDigit === 3) return `${rank}rd`;
    return `${rank}th`;
  };

  // Format stat value for display (matching PlayerComparisons)
  const formatStatValue = (statKey: string, value: number): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '—';
    }
    
    const label = statLabels[statKey as keyof typeof statLabels] || STAT_LABELS[statKey as keyof typeof STAT_LABELS];
    if (!label) return '—';
    
    // Pitcher-specific formatting
    if (isPitcherPlayer) {
      if (statKey === 'ERA' || statKey === 'FIP' || statKey === 'xFIP' || statKey === 'WHIP' || statKey === 'BABIP') {
        return value.toFixed(2);
      }
      if (statKey === 'Kper9' || statKey === 'BBper9' || statKey === 'Hper9' || statKey === 'HRper9') {
        return value.toFixed(1);
      }
      if (statKey === 'IP') {
        return value.toFixed(1);
      }
      if (statKey === 'GS' || statKey === 'SV') {
        return Math.round(value).toString();
      }
      if (statKey === 'LOBpct') {
        const pct = value <= 1 ? value * 100 : value;
        return `${pct.toFixed(1)}%`;
      }
      if (statKey === 'WAR') {
        return value.toFixed(1);
      }
    }
    
    // Hitter formatting
    if (label.includes('%')) {
      const pct = value <= 1 ? value * 100 : value;
      return `${pct.toFixed(2)}%`;
    }
    if (statKey === 'wRCplus' || statKey === 'PA') {
      return Math.round(value).toString();
    }
    if (statKey === 'xwOBA' || statKey === 'xSLG') {
      return value.toFixed(3);
    }
    if (statKey === 'age' || statKey === 'years') {
      return Math.round(value).toString();
    }
    return value.toFixed(1);
  };

  // Get all stat keys for the table (excluding PA and age which are displayed separately)
  const statKeys: StatKey[] = useMemo(() => {
    if (isPitcherPlayer) {
      return Object.keys(PITCHER_STAT_LABELS).filter(k => k !== 'age') as StatKey[];
    }
    return Object.keys(STAT_LABELS).filter(k => k !== 'PA' && k !== 'age') as StatKey[];
  }, [isPitcherPlayer]);

  return (
    <div className="min-h-screen bg-[#0B0B0C] overflow-auto">
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Team Fit Analysis</h2>
          </div>
          <div className="flex gap-3">
            <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
              Back
            </SBButton>
            <SBButton onClick={onContinue} icon={<ArrowRight size={18} />} iconPosition="right">
              Build Contract
            </SBButton>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Team Position Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-8 grain-overlay"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-[200px] bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                  {[...availableTeams].sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
                    <SelectItem
                      key={team.id}
                      value={team.id}
                      className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                    >
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <h3 className="text-[#ECEDEF]">
                {playerPrimaryPosition || player.position || '1B'} Analysis
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#A3A8B0] text-sm">Time Period:</span>
              <Select value={timePeriod} onValueChange={(v: StatPeriod) => setTimePeriod(v)}>
                <SelectTrigger className="w-[200px] bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                  {(Object.keys(PERIOD_LABELS) as StatPeriod[]).map((period) => (
                    <SelectItem
                      key={period}
                      value={period}
                      className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                    >
                      {PERIOD_LABELS[period]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team Ranking Summary */}
          <div className="mb-6 bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#A3A8B0]">
                {player.name} ranks
              </span>
              <span className="text-xl font-bold text-[#004B73]">
                #{teamRank}
              </span>
              <span className="text-sm text-[#A3A8B0]">
                on {availableTeams.find(t => t.id === selectedTeamId)?.name || selectedTeamId}
              </span>
              <span className="text-xs text-[#A3A8B0] opacity-75">
                (ranked using composite score)
              </span>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto -mx-8 px-8">
            <table className="w-full text-xs border-collapse table-fixed min-w-[800px]" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.14)]">
                  <th className="text-left text-[#A3A8B0] py-2 px-1 sticky left-0 bg-[#17181B] z-20 border-r border-[rgba(255,255,255,0.08)]" style={{ width: '100px' }}>Player</th>
                  <th className="text-center text-[#A3A8B0] py-2 px-0.5" style={{ width: '40px' }}>Pos</th>
                  <th className="text-center text-[#A3A8B0] py-2 px-0.5" style={{ width: '50px' }}>Team</th>
                  <th className="text-right text-[#A3A8B0] py-2 px-0.5" style={{ width: '40px' }}>Age</th>
                  {statKeys.map((stat) => (
                    <th key={stat} className="text-right text-[#A3A8B0] py-2 px-0.5" style={{ width: '55px' }}>
                      {statLabels[stat as keyof typeof statLabels] || STAT_LABELS[stat as keyof typeof STAT_LABELS]}
                    </th>
                  ))}
                  <th className="text-right text-[#A3A8B0] py-2 px-0.5" style={{ width: '55px' }}>AAV</th>
                  <th className="text-right text-[#A3A8B0] py-2 px-0.5" style={{ width: '50px' }}>Years</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeamPlayers.map((p) => {
                  const isTargetPlayer = p.id === player.id;
                  const stats = getStatsForPeriod(p, timePeriod);
                  
                  return (
                    <tr 
                      key={p.id}
                      className={`border-b border-[rgba(255,255,255,0.08)] ${
                        isTargetPlayer ? 'bg-[#004B73]/10' : ''
                      }`}
                    >
                      <td className={`py-2 px-1 text-left text-[#ECEDEF] font-medium sticky left-0 z-20 border-r border-[rgba(255,255,255,0.08)] ${
                        isTargetPlayer ? 'bg-[#17181B]' : 'bg-[#17181B]'
                      }`} style={{ 
                        width: '100px',
                        backgroundColor: isTargetPlayer ? '#1a2d3a' : '#17181B'
                      }}>
                        {p.name}
                        {isTargetPlayer && (
                          <span className="ml-1 text-[10px] text-[#004B73] bg-[#004B73]/20 px-1 py-0.5 rounded">
                            Target
                          </span>
                        )}
                      </td>
                      <td className={`py-2 px-0.5 text-center text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`} style={{ width: '40px' }}>
                        {playerPrimaryPositionsMap.get(p.id) || p.position}
                      </td>
                      <td className={`py-2 px-0.5 text-center text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`} style={{ width: '50px' }}>
                        {(() => {
                          // For pitchers, prioritize Fangraphs data
                          if (isPitcher(p)) {
                            return pitcherTeams2025Map.get(p.id) || playerTeamsMap.get(p.id) || p.team;
                          }
                          return playerTeamsMap.get(p.id) || p.team;
                        })()}
                      </td>
                      <td className={`py-2 px-0.5 text-right text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`} style={{ width: '40px' }}>{p.stats2025?.age || p.threeYearStats?.age || stats.age}</td>
                      {statKeys.map((stat) => {
                        // Safely get stat value, handling undefined/optional pitcher stats
                        const statValue = (stats[stat as keyof PlayerStats] as number | undefined) ?? 0;
                        return (
                          <td key={stat} className={`py-2 px-0.5 text-right text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`} style={{ width: '55px' }}>
                            {formatStatValue(stat as string, statValue)}
                          </td>
                        );
                      })}
                      <td className={`py-2 px-0.5 text-right text-[#A8B4BD] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`} style={{ width: '55px' }}>
                        {p.hasContract && p.AAV ? `$${p.AAV}M` : '—'}
                      </td>
                      <td className={`py-2 px-0.5 text-right text-[#ECEDEF] ${isTargetPlayer ? 'bg-[#004B73]/10' : ''}`} style={{ width: '50px' }}>
                        {p.hasContract && p.years ? p.years : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Depth Chart Impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6 bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-8 grain-overlay"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-[#ECEDEF]">Depth Chart Impact</h3>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                  aria-label="Composite Score Explanation"
                >
                  <Info size={18} className="text-[#A3A8B0] hover:text-[#ECEDEF]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-[#17181B] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#ECEDEF]">Composite Score Guide</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50"></div>
                        <span className="font-medium text-green-400">Positive (+0.5 or higher)</span>
                      </div>
                      <p className="text-[#A3A8B0] ml-5">Better than the target player</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50"></div>
                        <span className="font-medium text-emerald-400">Near Zero (+0.1 to +0.4)</span>
                      </div>
                      <p className="text-[#A3A8B0] ml-5">Slightly better or comparable</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]"></div>
                        <span className="font-medium text-[#A3A8B0]">Zero (0.0)</span>
                      </div>
                      <p className="text-[#A3A8B0] ml-5">Matches target player baseline</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/50"></div>
                        <span className="font-medium text-yellow-400">Negative (-0.1 to -0.9)</span>
                      </div>
                      <p className="text-[#A3A8B0] ml-5">Below target player</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50"></div>
                        <span className="font-medium text-red-400">Very Negative (-1.0 or lower)</span>
                      </div>
                      <p className="text-[#A3A8B0] ml-5">Significantly below target player</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] mt-3">
                    <p className="text-xs text-[#A3A8B0]">
                      Scores compare players to the target player across multiple weighted statistics ({isPitcherPlayer ? 'pitching, defense, age, etc.' : 'hitting, defense, age, etc.'})
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-6">
            {/* Depth Chart Ladder */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[#A3A8B0] text-sm font-medium">
                  {isPitcherPlayer ? 'Pitchers' : 'Outfield'}
                </h4>
              </div>
              <div className="overflow-y-auto pr-2" style={{ maxHeight: '350px' }}>
                <DepthChartLadder
                  players={sortedTeamPlayers}
                  targetPlayerId={player.id}
                  getCompositeScore={calculateCompositeScore}
                  maxPlayers={sortedTeamPlayers.length}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Division Position Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6 bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-8 grain-overlay"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#ECEDEF]">
              {selectedDivision} {playerPrimaryPosition || player.position || '1B'} Analysis
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#A3A8B0] text-sm">Stat:</span>
                <Select value={selectedStat} onValueChange={setSelectedStat}>
                  <SelectTrigger className="w-[160px] bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                    {statKeys.map((stat) => (
                      <SelectItem
                        key={stat}
                        value={stat}
                        className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                      >
                        {statLabels[stat as keyof typeof statLabels] || STAT_LABELS[stat as keyof typeof STAT_LABELS]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#A3A8B0] text-sm">Time Period:</span>
                <Select value={timePeriod} onValueChange={(v: StatPeriod) => setTimePeriod(v)}>
                  <SelectTrigger className="w-[200px] bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                    {(Object.keys(PERIOD_LABELS) as StatPeriod[]).map((period) => (
                      <SelectItem
                        key={period}
                        value={period}
                        className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF]"
                      >
                        {PERIOD_LABELS[period]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-6">
            <h4 className="text-[#ECEDEF] text-lg font-medium text-center mb-4">
              {player.name} Ranks {formatOrdinalRank(playerStatRank)} in {statLabels[selectedStat as keyof typeof statLabels] || STAT_LABELS[selectedStat as keyof typeof STAT_LABELS] || selectedStat} in the {selectedDivision}
            </h4>
            <DivisionBarChart
              players={sortedDivisionPlayers}
              selectedStat={selectedStat}
              timePeriod={timePeriod}
              targetPlayerId={player.id}
              formatStatValue={formatStatValue}
            />
          </div>

          {/* Composite Score Ranking Summary */}
          <div className="mt-6 bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#A3A8B0]">
                {player.name} ranks
              </span>
              <span className="text-xl font-bold text-[#004B73]">
                #{playerRank}
              </span>
              <span className="text-sm text-[#A3A8B0]">
                out of {sortedDivisionPlayers.length} in the {selectedDivision}
              </span>
              <span className="text-xs text-[#A3A8B0] opacity-75">
                (ranked using composite scoring)
              </span>
            </div>
          </div>
        </motion.div>

        {/* Payroll Impact Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#ECEDEF]">Team Payroll</h3>
            <span className="text-[#A3A8B0] text-sm">
              {availableTeams.find(t => t.id === selectedTeamId)?.name || selectedTeamId}
            </span>
          </div>
          {payrollLoading ? (
            <div className="h-[280px] flex items-center justify-center text-[#A3A8B0] text-sm">
              Loading payroll data...
            </div>
          ) : teamPayrollData.length > 0 ? (
            <>
              <StackedBarChart 
                data={teamPayrollData}
                xKey="year"
                dataKeys={[
                  { key: 'basePayroll', color: '#60A5FA', label: 'Team Payroll' },
                  { key: 'playerContract', color: '#A8B4BD', label: 'Player Contract' }
                ]}
                height={280}
              />
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#A3A8B0] text-xs">Year:</span>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[100px] h-7 bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                      {teamPayrollData.map((d) => (
                        <SelectItem
                          key={d.year}
                          value={d.year}
                          className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF] text-xs"
                        >
                          {d.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#121315] rounded p-3">
                    <div className="text-[#A3A8B0] mb-1">Base Payroll</div>
                    <div className="text-[#ECEDEF]">${basePayroll.toFixed(1)}M</div>
                  </div>
                  <div className="bg-[#121315] rounded p-3">
                    <div className="text-[#A3A8B0] mb-1">Player $</div>
                    <div className="text-[#ECEDEF]">${playerContract.toFixed(1)}M</div>
                  </div>
                  <div className="bg-[#121315] rounded p-3">
                    <div className="text-[#A3A8B0] mb-1">Total Payroll</div>
                    <div className="text-emerald-400">${totalPayroll.toFixed(1)}M</div>
                  </div>
                </div>
              </div>
              <p className="text-[#A3A8B0] text-xs mt-3 italic">
                * Payroll data may be incomplete for some teams. Missing years use the last available year's value.<br />
                * Player contract values are based on estimated values.
              </p>
            </>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-[#A3A8B0] text-sm">
              No payroll data available. Please ensure mlb_payroll_commitments_2026_2031.csv is in the public folder.
            </div>
          )}
        </motion.div>

        {/* Build Contract Button */}
        <SBButton 
          size="lg" 
          onClick={onContinue}
          icon={<ArrowRight size={18} />}
          iconPosition="right"
          className="w-full mt-6"
        >
          Build Contract
        </SBButton>
      </div>
    </div>
  );
}

