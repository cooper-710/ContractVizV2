import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import type { Player, PlayerStats } from '../../data/playerDatabase';
import { isPitcher } from '../../data/playerDatabase';
import { fetchMultipleCsvs } from '../../data/csvLoader';
import { getString, getField, normalizePlayerName } from '../../data/csvLoader';

interface EstimatedValueProps {
  player: Player | null;
  comps: Player[];
  onContinue: () => void;
  onBack: () => void;
}



// Mapping from config key to PlayerStats field name (or special marker)
const STAT_KEY_MAP: Record<string, keyof import('../../data/playerDatabase').PlayerStats | 'HR'> = {
  'fg_RBI': 'RBI',
  'fg_HR': 'HR', // Special: extracted from HRperPA
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

const STAT_CONFIG = {
  // Outcome stats
  'fg_RBI': { label: 'RBI', higherBetter: true, weight: 0.1, decimals: 0, scale: 'raw' as const },
  'fg_HR': { label: 'HR', higherBetter: true, weight: 0.1, decimals: 0, scale: 'raw' as const },
  'fg_OPS': { label: 'OPS', higherBetter: true, weight: 0.1, decimals: 3, scale: 'decimal' as const },
  'fg_wRC+': { label: 'wRC+', higherBetter: true, weight: 0.1, decimals: 0, scale: 'raw' as const },
  'fg_BB%': { label: 'BB%', higherBetter: true, weight: 0.1, decimals: 1, scale: 'pct' as const },
  'fg_K%': { label: 'K%', higherBetter: false, weight: 0.1, decimals: 1, scale: 'pct' as const },
  'fg_PA': { label: 'PA', higherBetter: true, weight: 0.1, decimals: 0, scale: 'raw' as const },
  'fg_WAR': { label: 'WAR', higherBetter: true, weight: 0.1, decimals: 1, scale: 'raw' as const },
  // Expected stats
  'fg_xwOBA': { label: 'xwOBA', higherBetter: true, weight: 0.1, decimals: 3, scale: 'decimal' as const },
  'fg_xSLG': { label: 'xSLG', higherBetter: true, weight: 0.1, decimals: 3, scale: 'decimal' as const },
  // Batted stats
  'sc_EV_brl_pa': { label: 'Barrels/PA', higherBetter: true, weight: 0.1, decimals: 1, scale: 'pct' as const },
  'sc_EV_ev50': { label: 'avgEV', higherBetter: true, weight: 0.1, decimals: 1, scale: 'mph' as const },
  // Defensive/Base running
  'fg_Def': { label: 'Def', higherBetter: true, weight: 0.1, decimals: 1, scale: 'runs' as const },
  'fg_BsR': { label: 'BsR', higherBetter: true, weight: 0.1, decimals: 1, scale: 'runs' as const },
};

// Pitcher stat config
const PITCHER_STAT_CONFIG = {
  'fg_ERA': { label: 'ERA', higherBetter: false, weight: 0.15, decimals: 2, scale: 'decimal' as const },
  'fg_FIP': { label: 'FIP', higherBetter: false, weight: 0.15, decimals: 2, scale: 'decimal' as const },
  'fg_xFIP': { label: 'xFIP', higherBetter: false, weight: 0.15, decimals: 2, scale: 'decimal' as const },
  'fg_K/9': { label: 'K/9', higherBetter: true, weight: 0.15, decimals: 1, scale: 'raw' as const },
  'fg_BB/9': { label: 'BB/9', higherBetter: false, weight: 0.15, decimals: 2, scale: 'raw' as const },
  'fg_WHIP': { label: 'WHIP', higherBetter: false, weight: 0.15, decimals: 2, scale: 'decimal' as const },
  'fg_IP': { label: 'IP', higherBetter: true, weight: 0.10, decimals: 1, scale: 'raw' as const },
  'fg_WAR': { label: 'WAR', higherBetter: true, weight: 0.20, decimals: 1, scale: 'raw' as const },
};

// Position-specific weight presets (total: 5.0 per position)
const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  '1B': {
    'fg_RBI': 0.50, 'fg_HR': 0.65, 'fg_OPS': 0.30, 'fg_wRC+': 0.70, 'fg_BB%': 0.20, 'fg_K%': 0.20, 'fg_PA': 0.30, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.50, 'fg_xSLG': 0.30,
    'sc_EV_brl_pa': 0.30, 'sc_EV_ev50': 0.20,
    'fg_Def': 0.10, 'fg_BsR': 0.15,
  },
  'DH': {
    'fg_RBI': 0.50, 'fg_HR': 0.60, 'fg_OPS': 0.35, 'fg_wRC+': 0.60, 'fg_BB%': 0.25, 'fg_K%': 0.25, 'fg_PA': 0.35, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.50, 'fg_xSLG': 0.35,
    'sc_EV_brl_pa': 0.35, 'sc_EV_ev50': 0.25,
    'fg_Def': 0.00, 'fg_BsR': 0.05,
  },
  'SS': {
    'fg_RBI': 0.20, 'fg_HR': 0.20, 'fg_OPS': 0.30, 'fg_wRC+': 0.50, 'fg_BB%': 0.30, 'fg_K%': 0.30, 'fg_PA': 0.50, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.45, 'fg_xSLG': 0.20,
    'sc_EV_brl_pa': 0.20, 'sc_EV_ev50': 0.15,
    'fg_Def': 1.00, 'fg_BsR': 0.10,
  },
  '2B': {
    'fg_RBI': 0.20, 'fg_HR': 0.20, 'fg_OPS': 0.30, 'fg_wRC+': 0.50, 'fg_BB%': 0.30, 'fg_K%': 0.30, 'fg_PA': 0.50, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.35, 'fg_xSLG': 0.20,
    'sc_EV_brl_pa': 0.20, 'sc_EV_ev50': 0.15,
    'fg_Def': 0.70, 'fg_BsR': 0.50,
  },
  '3B': {
    'fg_RBI': 0.40, 'fg_HR': 0.55, 'fg_OPS': 0.30, 'fg_wRC+': 0.45, 'fg_BB%': 0.20, 'fg_K%': 0.20, 'fg_PA': 0.30, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.40, 'fg_xSLG': 0.45,
    'sc_EV_brl_pa': 0.30, 'sc_EV_ev50': 0.20,
    'fg_Def': 0.55, 'fg_BsR': 0.10,
  },
  'CF': {
    'fg_RBI': 0.20, 'fg_HR': 0.20, 'fg_OPS': 0.30, 'fg_wRC+': 0.50, 'fg_BB%': 0.30, 'fg_K%': 0.30, 'fg_PA': 0.40, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.40, 'fg_xSLG': 0.20,
    'sc_EV_brl_pa': 0.20, 'sc_EV_ev50': 0.15,
    'fg_Def': 0.70, 'fg_BsR': 0.55,
  },
  'OF': {
    'fg_RBI': 0.20, 'fg_HR': 0.20, 'fg_OPS': 0.30, 'fg_wRC+': 0.50, 'fg_BB%': 0.30, 'fg_K%': 0.30, 'fg_PA': 0.40, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.40, 'fg_xSLG': 0.20,
    'sc_EV_brl_pa': 0.20, 'sc_EV_ev50': 0.15,
    'fg_Def': 0.70, 'fg_BsR': 0.55,
  },
  'LF': {
    'fg_RBI': 0.40, 'fg_HR': 0.45, 'fg_OPS': 0.30, 'fg_wRC+': 0.50, 'fg_BB%': 0.30, 'fg_K%': 0.30, 'fg_PA': 0.40, 'fg_WAR': 0.45,
    'fg_xwOBA': 0.40, 'fg_xSLG': 0.30,
    'sc_EV_brl_pa': 0.25, 'sc_EV_ev50': 0.20,
    'fg_Def': 0.50, 'fg_BsR': 0.25,
  },
  'RF': {
    'fg_RBI': 0.40, 'fg_HR': 0.45, 'fg_OPS': 0.30, 'fg_wRC+': 0.50, 'fg_BB%': 0.30, 'fg_K%': 0.30, 'fg_PA': 0.40, 'fg_WAR': 0.45,
    'fg_xwOBA': 0.40, 'fg_xSLG': 0.30,
    'sc_EV_brl_pa': 0.25, 'sc_EV_ev50': 0.20,
    'fg_Def': 0.50, 'fg_BsR': 0.25,
  },
  'C': {
    'fg_RBI': 0.25, 'fg_HR': 0.25, 'fg_OPS': 0.35, 'fg_wRC+': 0.50, 'fg_BB%': 0.35, 'fg_K%': 0.35, 'fg_PA': 0.60, 'fg_WAR': 0.60,
    'fg_xwOBA': 0.35, 'fg_xSLG': 0.30,
    'sc_EV_brl_pa': 0.25, 'sc_EV_ev50': 0.20,
    'fg_Def': 0.60, 'fg_BsR': 0.05,
  },
  // Pitcher positions
  'P': {
    'fg_ERA': 1.0, 'fg_FIP': 0.8, 'fg_xFIP': 0.7, 'fg_K/9': 1.2, 'fg_BB/9': 0.8, 'fg_WHIP': 0.9, 'fg_IP': 0.6, 'fg_WAR': 1.5,
  },
  // Starting Pitcher weights - emphasize IP and WAR (volume stats)
  'SP': {
    'fg_ERA': 1.2, 'fg_FIP': 1.0, 'fg_xFIP': 0.9, 'fg_K/9': 1.1, 'fg_BB/9': 0.9, 'fg_WHIP': 1.0, 'fg_IP': 1.2, 'fg_WAR': 1.8,
  },
  // Relief Pitcher weights - match P weights
  'RP': {
    'fg_ERA': 1.0, 'fg_FIP': 0.8, 'fg_xFIP': 0.7, 'fg_K/9': 1.2, 'fg_BB/9': 0.8, 'fg_WHIP': 0.9, 'fg_IP': 0.6, 'fg_WAR': 1.5,
  },
};

// Position code to abbreviation mapping
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
 * Load primary position from Positions.csv and positions_pitchers.csv for 2025 season
 */
async function loadPrimaryPosition(playerId: string): Promise<string | null> {
  const [positionsRows, positionsPitchersRows] = await fetchMultipleCsvs([
    '/Positions.csv',
    '/positions_pitchers.csv'
  ]);
  const allPositionsRows = [...positionsRows, ...positionsPitchersRows];
  const positionCounts = new Map<string, number>();
  
  // Process rows for 2025 season only
  for (const row of allPositionsRows) {
    const name = getString(row, ['player_name']);
    const season = getField(row, ['season'], 0);
    const positionCode = getField(row, ['position_code'], 0);
    
    if (!name || season !== 2025 || !positionCode || positionCode === 0) continue;
    
    const normId = normalizePlayerName(name);
    if (normId !== playerId) continue;
    
    const positionAbbr = POSITION_CODE_MAP[positionCode];
    if (positionAbbr) {
      positionCounts.set(positionAbbr, (positionCounts.get(positionAbbr) || 0) + 1);
    }
  }
  
  // Determine primary position (most frequently played)
  let maxCount = 0;
  let primaryPos = null;
  for (const [pos, count] of positionCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      primaryPos = pos;
    }
  }
  
  return primaryPos;
}

// Helper function to get weights for a specific position
function getWeightsForPosition(position: string): Record<string, number> {
  const normalizedPos = position?.trim().toUpperCase() || '';
  const positionWeights = POSITION_WEIGHTS[normalizedPos];
  
  if (positionWeights) {
    return positionWeights;
  }
  
  // Fallback to default weights from STAT_CONFIG or PITCHER_STAT_CONFIG
  const isPitcherPos = normalizedPos === 'P' || normalizedPos === 'SP' || normalizedPos === 'RP';
  const defaultConfig = isPitcherPos ? PITCHER_STAT_CONFIG : STAT_CONFIG;
  return Object.fromEntries(
    Object.entries(defaultConfig).map(([key, config]) => [key, config.weight])
  );
}

const ESTIMATED_VALUE_STORAGE_KEY_PREFIX = 'borasApp_estimatedValueSettings_';

interface EstimatedValueSettings {
  selectedCompIds: string[];
  selectedPosition: string;
  customWeights: Record<string, number>;
  adjustAAV: boolean;
  adjustYears: boolean;
  inflationPercent: number;
  weightsOpen: boolean;
}

function getStorageKey(playerId: string): string {
  return `${ESTIMATED_VALUE_STORAGE_KEY_PREFIX}${playerId}`;
}

export function EstimatedValue({ player, comps, onContinue, onBack }: EstimatedValueProps) {
  // If no player selected, show error state
  if (!player || !comps || comps.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A3A8B0] mb-4">Please select a player and comparisons from the intro screen.</p>
          <SBButton onClick={onBack}>Go Back</SBButton>
        </div>
      </div>
    );
  }

  const PETE_STATS = player.threeYearStats;
  const COMPS = comps;
  const isPitcherPlayer = isPitcher(player);
  
  // Use appropriate stat config based on player type
  const activeStatConfig = isPitcherPlayer ? PITCHER_STAT_CONFIG : STAT_CONFIG;
  
  // Get primary position from player's stored position (normalize to primary)
  const normalizePosition = (pos: string): string => {
    if (!pos) return isPitcherPlayer ? 'SP' : '1B';
    const normalized = pos.trim().toUpperCase();
    // Extract primary position (first before slash/comma)
    const primary = normalized.split(/[\/,]/)[0].trim();
    
    // For pitchers, convert P to SP and preserve SP or RP
    // Only default to SP if position is completely empty
    if (isPitcherPlayer) {
      if (primary === '' || !primary) {
        // Only default to SP if we have no position at all
        return 'SP';
      }
      // Convert P to SP, otherwise return SP or RP as-is
      return primary === 'P' ? 'SP' : primary;
    }
    
    return primary || '1B';
  };
  
  // Load saved settings from localStorage for this specific player
  const savedSettings = useMemo((): Partial<EstimatedValueSettings> | null => {
    if (typeof window !== 'undefined') {
      try {
        const storageKey = getStorageKey(player.id);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('Failed to load EstimatedValue settings from localStorage:', error);
      }
    }
    return null;
  }, [player.id]); // Reload when player changes

  // Use primary position from CSV if available, otherwise use player.position
  const [playerPrimaryPosition, setPlayerPrimaryPosition] = useState<string | null>(null);
  
  // Load primary position and use it for initial position
  useEffect(() => {
    loadPrimaryPosition(player.id)
      .then((primaryPos) => {
        if (primaryPos) {
          setPlayerPrimaryPosition(primaryPos);
        }
      })
      .catch((err) => {
        console.error('Failed to load primary position:', err);
      });
  }, [player.id]);
  
  // Determine initial position: use player.position for now, will update when primary position loads
  const initialPlayerPosition = normalizePosition(player.position || (isPitcherPlayer ? 'SP' : '1B'));
  
  // Initialize state with saved settings or defaults
  const defaultCompIds = comps.map((c) => c.id);
  const savedCompIds = savedSettings?.selectedCompIds?.filter(id => defaultCompIds.includes(id)) || defaultCompIds;
  
  const [selectedComps, setSelectedComps] = useState<Set<string>>(
    () => new Set(savedCompIds.length > 0 ? savedCompIds : defaultCompIds)
  );
  const [selectedPosition, setSelectedPosition] = useState<string>(
    () => savedSettings?.selectedPosition || initialPlayerPosition
  );
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(
    () => savedSettings?.customWeights || getWeightsForPosition(savedSettings?.selectedPosition || initialPlayerPosition)
  );
  const [adjustAAV, setAdjustAAV] = useState(() => savedSettings?.adjustAAV !== undefined ? savedSettings.adjustAAV : true);
  const [adjustYears, setAdjustYears] = useState(() => savedSettings?.adjustYears !== undefined ? savedSettings.adjustYears : true);
  const [inflationPercent, setInflationPercent] = useState(() => savedSettings?.inflationPercent !== undefined ? savedSettings.inflationPercent : 4);
  const [weightsOpen, setWeightsOpen] = useState(() => savedSettings?.weightsOpen !== undefined ? savedSettings.weightsOpen : false);

  // Track previous player ID to detect player changes
  const prevPlayerIdRef = useRef<string>(player.id);
  
  // Reset state when player changes (but not when navigating back to the same player)
  useEffect(() => {
    if (prevPlayerIdRef.current !== player.id) {
      prevPlayerIdRef.current = player.id;
      
      // Player changed - reset to defaults
      const defaultCompIds = comps.map((c) => c.id);
      setSelectedComps(new Set(defaultCompIds));
      setSelectedPosition(initialPlayerPosition);
      setCustomWeights(getWeightsForPosition(initialPlayerPosition));
      setAdjustAAV(true);
      setAdjustYears(true);
      setInflationPercent(4);
      setWeightsOpen(false);
    }
    // Note: When navigating back to the same player, the component remounts
    // and the useState initializers will load savedSettings automatically
  }, [player.id, comps, initialPlayerPosition]);

  // Update selected position when primary position loads from CSV (only if no saved position)
  useEffect(() => {
    if (playerPrimaryPosition && !savedSettings?.selectedPosition) {
      const normalizedPos = normalizePosition(playerPrimaryPosition);
      setSelectedPosition(normalizedPos);
      setCustomWeights(getWeightsForPosition(normalizedPos));
    }
  }, [playerPrimaryPosition, savedSettings?.selectedPosition]);

  // Sync selectedComps when comps prop changes (e.g., user selected different comps)
  // Use a ref to track previous comp IDs to avoid unnecessary updates
  const prevCompIdsRef = useRef<string>(comps.map(c => c.id).join(','));
  useEffect(() => {
    const currentCompIdsStr = comps.map(c => c.id).join(',');
    if (currentCompIdsStr !== prevCompIdsRef.current) {
      prevCompIdsRef.current = currentCompIdsStr;
      const currentCompIds = new Set(comps.map((c) => c.id));
      
      // Check if player changed (comps completely different) vs just comps updated for same player
      const currentSelected = Array.from(selectedComps);
      const validSelected = currentSelected.filter(id => currentCompIds.has(id));
      
      // If player changed, the player change effect already reset to all comps
      // If just comps updated for same player, try to preserve valid selections
      // But if no valid selections remain, use all comps
      if (validSelected.length > 0 && validSelected.length === currentSelected.length) {
        // All current selections are still valid - keep them (comps were just reordered or something)
        // Don't update, keep current state
      } else if (validSelected.length > 0) {
        // Some selections are still valid - use those
        setSelectedComps(new Set(validSelected));
      } else {
        // No valid selections - use all comps
        setSelectedComps(currentCompIds);
      }
    }
  }, [comps, selectedComps]);

  // Save settings to localStorage whenever they change (per player)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storageKey = getStorageKey(player.id);
        const settingsToSave: EstimatedValueSettings = {
          selectedCompIds: Array.from(selectedComps),
          selectedPosition,
          customWeights,
          adjustAAV,
          adjustYears,
          inflationPercent,
          weightsOpen,
        };
        localStorage.setItem(storageKey, JSON.stringify(settingsToSave));
      } catch (error) {
        console.warn('Failed to save EstimatedValue settings to localStorage:', error);
      }
    }
  }, [player.id, selectedComps, selectedPosition, customWeights, adjustAAV, adjustYears, inflationPercent, weightsOpen]);

  // Update weights when position changes
  const handlePositionChange = (position: string) => {
    setSelectedPosition(position);
    setCustomWeights(getWeightsForPosition(position));
  };

  const calculations = useMemo(() => {
    const activeComps = COMPS.filter((c) => selectedComps.has(c.id));
    
    if (activeComps.length === 0) {
      return {
        baselineAAV: 0,
        baselineYears: 0,
        fairAAV: 0,
        fairYears: 0,
        aavMultiplier: 1,
        yearsAdjustment: 0,
        cohortStats: {} as PlayerStats,
        statComparisons: [] as any[],
        statImpacts: [] as any[],
      };
    }

    // Calculate baseline from comps adjusted for inflation (average of inflation-adjusted AAVs)
    const presentYear = 2025;
    const inflationRate = Math.max(0, inflationPercent) / 100;
    const adjustedAAVs = activeComps.map((c) => {
      const signedYear = (c as any).signedYear as number | undefined;
      const yearsSinceSigning = signedYear ? Math.max(0, presentYear - signedYear) : 0;
      const factor = Math.pow(1 + inflationRate, yearsSinceSigning);
      return c.AAV * factor;
    });
    const baselineAAV = adjustedAAVs.reduce((sum, v) => sum + v, 0) / activeComps.length;
    const inflationAdjustedById = Object.fromEntries(
      activeComps.map((c, idx) => [c.id, adjustedAAVs[idx]])
    );
    const rawBaselineAAV = activeComps.reduce((sum, c) => sum + c.AAV, 0) / activeComps.length;
    const cohortAvgSignedYear = activeComps.reduce((sum, c) => sum + ((c as any).signedYear || 0), 0) / activeComps.length;
    const baselineYears = activeComps.reduce((sum, c) => sum + c.years, 0) / activeComps.length;

    // Cohort average age at signing (prefer age at signing if present)
    const cohortSigningAge = (activeComps.reduce((sum, c) => {
      const ageAtSigning = (c.threeYearContractStats?.age as number) || (c.threeYearStats.age as number);
      return sum + ageAtSigning;
    }, 0) / activeComps.length) || PETE_STATS.age;

    // Calculate cohort average stats (using pre-contract stats for comps)
    const cohortStats = Object.keys(activeStatConfig).reduce((acc, configKey) => {
      const statKey = STAT_KEY_MAP[configKey];
      if (statKey === 'HR') {
        // HR is extracted from HRperPA (which stores HR count)
        const avgHr = activeComps.reduce((sum, c) => {
          const s = c.threeYearContractStats || c.threeYearStats;
          const hr = Math.round((s.HRperPA as number) || 0);
          return sum + hr;
        }, 0) / activeComps.length;
        (acc as any)[statKey] = isNaN(avgHr) ? 0 : avgHr;
      } else {
        (acc as any)[statKey] = activeComps.reduce((sum, c) => {
          const s = c.threeYearContractStats || c.threeYearStats;
          return sum + ((s as any)[statKey] as number || 0);
        }, 0) / activeComps.length;
      }
      return acc;
    }, {} as any) as PlayerStats & { HR?: number; OPS?: number };

    // Calculate Pete's performance relative to cohort for each stat
    const statComparisons = Object.entries(activeStatConfig).map(([configKey, config]) => {
      const statKey = STAT_KEY_MAP[configKey];
      let peteValue: number;
      let cohortValue: number;
      
      if (statKey === 'HR') {
        peteValue = Math.round(PETE_STATS.HRperPA as number);
        cohortValue = (cohortStats as any)[statKey] as number;
      } else {
        peteValue = ((PETE_STATS as any)[statKey] as number) || 0;
        cohortValue = ((cohortStats as any)[statKey] as number) || 0;
      }
      
      const delta = peteValue - cohortValue;
      
      // Calculate percentage difference with protection against division by zero or very small denominators
      let pctDiff: number;
      if (Math.abs(cohortValue) < 0.001) {
        // If cohort value is essentially zero, use absolute difference scaled appropriately
        // For very small denominators, cap the percentage to avoid extreme values
        pctDiff = Math.sign(delta) * Math.min(500, Math.abs(delta * 100));
      } else {
        pctDiff = (delta / Math.abs(cohortValue)) * 100;
        // Clamp percentage to reasonable bounds (-500% to +500%)
        pctDiff = Math.max(-500, Math.min(500, pctDiff));
      }
      
      // Calculate ratio for AAV impact
      // For stats that can be negative (like Def, BsR), we need special handling
      let ratio = 1;
      if (configKey === 'fg_Def' || configKey === 'fg_BsR') {
        // For Def/BsR: higher is better, but values can be negative
        // Use delta-based approach: convert delta to ratio equivalent
        // A delta of +5 Def should give similar impact to +10% on a positive stat
        // Scale: each unit of Def/BsR delta = 2% ratio change (scaled by typical range)
        const typicalRange = 10; // Typical range for Def/BsR is about -10 to +10
        const deltaRatio = 1 + (delta / typicalRange) * 0.2; // 0.2 = 2% per unit
        ratio = Math.max(0.5, Math.min(2.0, deltaRatio));
      } else if (config.higherBetter) {
        // For regular stats where higher is better
        if (Math.abs(cohortValue) < 0.001) {
          ratio = peteValue > 0 ? 1.1 : (peteValue < 0 ? 0.9 : 1);
        } else {
          ratio = peteValue / cohortValue;
        }
        // Clamp ratio to reasonable bounds to prevent extreme values
        ratio = Math.max(0.1, Math.min(10, ratio));
      } else {
        // For stats where lower is better (like K%, age)
        if (Math.abs(peteValue) < 0.001) {
          ratio = cohortValue > 0 ? 1.1 : (cohortValue < 0 ? 0.9 : 1);
        } else {
          ratio = cohortValue / peteValue;
        }
        // Clamp ratio to reasonable bounds to prevent extreme values
        ratio = Math.max(0.1, Math.min(10, ratio));
      }
      
      return {
        stat: config.label,
        key: configKey,
        peteValue,
        cohortValue,
        ratio,
        delta,
        pctDiff,
        weight: customWeights[configKey],
      };
    });

    // Calculate weighted multiplier for AAV and individual stat impacts
    let weightedSum = 0;
    let totalWeight = 0;
    
    const statImpacts = statComparisons.map((comp) => {
      const contribution = (comp.ratio - 1) * comp.weight;
      weightedSum += comp.ratio * comp.weight;
      totalWeight += comp.weight;
      
      // Calculate impact on AAV (this stat's contribution to the multiplier)
      const statMultiplier = 1 + (contribution / totalWeight);
      const aavImpact = baselineAAV * contribution / totalWeight;
      
      return {
        ...comp,
        contribution,
        aavImpact,
      };
    });
    
    const rawMultiplier = weightedSum / totalWeight;
    
    // Apply a scaling factor to amplify performance differences
    // This makes the multiplier more sensitive to performance differences
    const sensitivityMultiplier = 1.4; // Increase this to make performance matter more
    const scaledMultiplier = 1 + (rawMultiplier - 1) * sensitivityMultiplier;
    
    // Expanded range to allow for larger performance impacts (0.50-2.0 = -50% to +100%)
    const aavMultiplier = adjustAAV ? Math.max(0.50, Math.min(2.0, scaledMultiplier)) : 1.0;
    const fairAAV = baselineAAV * aavMultiplier;

    // Scale individual stat impacts to account for multiplier clamping
    // This ensures the sum of impacts matches the actual clamped difference
    const rawImpactSum = statImpacts.reduce((sum, impact) => sum + impact.aavImpact, 0);
    const actualDifference = fairAAV - baselineAAV;
    const impactScale = rawImpactSum !== 0 ? actualDifference / rawImpactSum : 1;
    
    // Scale each impact proportionally to preserve relative contributions
    const scaledStatImpacts = statImpacts.map(impact => ({
      ...impact,
      aavImpact: impact.aavImpact * impactScale,
    }));

    // Years adjustment - cleaner formula based on age and performance
    // Formula: Baseline × age_multiplier + performance_adjustment
    
    const ageDelta = PETE_STATS.age - cohortSigningAge;
    
    // Curved age multiplier using a quadratic response
    // Older than cohort signing age => increasingly harsh penalty
    // Younger than cohort signing age => tempered benefit (reduced)
    const olderDelta = Math.max(0, ageDelta);
    const youngerDelta = Math.max(0, -ageDelta);
    
    // Different age penalties for pitchers vs hitters
    // Pitchers age more gracefully, so they get reduced penalties
    let penaltyComponent, benefitComponent;
    if (isPitcherPlayer) {
      // Reduced penalties for pitchers: 0.05 → 0.03, quadratic 0.010 → 0.005
      penaltyComponent = (0.03 * olderDelta) + (0.005 * olderDelta * olderDelta);
      // Increased benefits for younger pitchers - they should get more credit for being younger
      // Increase linear coefficient from 0.03 to 0.05, reduce quadratic penalty from 0.005 to 0.002
      benefitComponent = (0.05 * youngerDelta) - (0.002 * youngerDelta * youngerDelta);
    } else {
      // Original penalties for hitters
      penaltyComponent = (0.05 * olderDelta) + (0.010 * olderDelta * olderDelta);
      benefitComponent = (0.03 * youngerDelta) - (0.005 * youngerDelta * youngerDelta);
    }
    
    const rawAgeMultiplier = 1 - penaltyComponent + benefitComponent;
    
    // Enhanced age multiplier for very young high-performing players (both hitters and pitchers)
    // Threshold: age <= 25 and AAV multiplier >= 1.15 (top 15% performance)
    const isVeryYoungHighPerformer = PETE_STATS.age <= 25 && aavMultiplier >= 1.15;
    
    let ageMultiplier;
    if (isVeryYoungHighPerformer) {
      // Apply additional boost: increase max multiplier from 1.5 to 1.8
      // This rewards elite young talent with longer contracts
      const boostedMultiplier = rawAgeMultiplier * 1.15; // 15% additional boost
      ageMultiplier = Math.max(0.6, Math.min(1.8, boostedMultiplier));
    } else {
      // Standard bounds for all other players
      ageMultiplier = Math.max(0.6, Math.min(1.5, rawAgeMultiplier));
    }
    
    // Absolute age penalty: reduce years for players 31+ (stronger)
    // Pitchers get reduced penalty: start at 33 instead of 31, lower rate (0.15 vs 0.25)
    let absoluteAgePenalty;
    if (isPitcherPlayer) {
      // Pitchers: start penalty at 33, rate 0.15 per year, cap at 1.5 years
      absoluteAgePenalty = PETE_STATS.age >= 33 
        ? Math.min(1.5, (PETE_STATS.age - 32) * 0.15)
        : 0;
    } else {
      // Hitters: original penalty starting at 31, rate 0.25 per year, cap at 2.0 years
      absoluteAgePenalty = PETE_STATS.age >= 31 
        ? Math.min(2.0, (PETE_STATS.age - 30) * 0.25)
        : 0;
    }
    
    // Performance adjustment: elite players get slightly longer deals (damped)
    // Increase multiplier from 1.2 to 1.8, expand cap from ±1 to ±1.5
    // For younger pitchers, apply a higher multiplier to reward their youth + performance
    const performanceMultiplier = (isPitcherPlayer && youngerDelta > 0) ? 2.75 : 1.8;
    const performanceAdjustmentRaw = (aavMultiplier - 1) * performanceMultiplier;
    const performanceAdjustment = Math.max(-1.5, Math.min(1.5, performanceAdjustmentRaw));
    
    const totalYearsAdjustment = adjustYears 
      ? ((baselineYears * ageMultiplier) - baselineYears) - absoluteAgePenalty + performanceAdjustment
      : 0;
    
    // Soft cap: do not exceed baseline by more than +2.0 years (was +1.0)
    // For very young high performers, allow up to +5.0 years to match the enhanced age multiplier
    const softCapLimit = isVeryYoungHighPerformer ? 5.0 : 2.0;
    const proposedYears = baselineYears + totalYearsAdjustment;
    const cappedYears = Math.min(baselineYears + softCapLimit, proposedYears);
    const fairYears = Math.max(1, Math.round(cappedYears * 2) / 2); // Min 1 year, round to 0.5

    return {
      baselineAAV,
      baselineYears,
      fairAAV,
      fairYears,
      aavMultiplier,
      yearsAdjustment: totalYearsAdjustment,
      cohortStats,
      ageDelta,
      ageMultiplier,
      absoluteAgePenalty,
      performanceAdjustment,
      proposedYears,
      cappedYears,
      cohortSigningAge,
      statComparisons,
      statImpacts: scaledStatImpacts,
      rawBaselineAAV,
      inflationAdjustedById,
      presentYear,
      cohortAvgSignedYear,
    };
  }, [selectedComps, customWeights, adjustAAV, adjustYears, inflationPercent]);

  // Save calculated fairAAV and fairYears to localStorage for use in TeamFit
  useEffect(() => {
    if (typeof window !== 'undefined' && calculations.fairAAV > 0) {
      localStorage.setItem('estimated_fairAAV', calculations.fairAAV.toString());
      localStorage.setItem('estimated_fairYears', calculations.fairYears.toString());
    }
  }, [calculations.fairAAV, calculations.fairYears]);

  const barChartData = [
    {
      name: 'Baseline',
      value: calculations.baselineAAV,
    },
    {
      name: 'Adjusted',
      value: calculations.fairAAV,
    },
  ];

  // Helper to get stat value, handling special cases like HR
  const getStatValue = (configKey: string, stats: PlayerStats | (PlayerStats & { HR?: number }), comp?: Player): number => {
    const statKey = STAT_KEY_MAP[configKey];
    
    if (statKey === 'HR') {
      // Check if HR is already stored directly (like in cohortStats)
      if ((stats as any)['HR'] !== undefined && !isNaN((stats as any)['HR'])) {
        return (stats as any)['HR'] as number;
      }
      // Otherwise extract HR from HRperPA (which stores HR count)
      const hrFromHRperPA = Math.round((stats.HRperPA as number) || 0);
      return isNaN(hrFromHRperPA) ? 0 : hrFromHRperPA;
    } else {
      const value = ((stats as any)[statKey] as number) || 0;
      return isNaN(value) ? 0 : value;
    }
  };

  const formatStatValue = (stat: keyof typeof STAT_CONFIG | keyof typeof PITCHER_STAT_CONFIG, value: number) => {
    const config = (activeStatConfig as any)[stat];
    
    // Handle based on scale type
    if (config.scale === 'pct') {
      // Percentage: assume value is between 0-1 if less than 1, otherwise it's already a percentage
      const pct = value <= 1 ? value * 100 : value;
      return `${pct.toFixed(config.decimals)}%`;
    } else if (config.scale === 'decimal') {
      // Decimal format (like xwOBA, xSLG) - display as 0.###
      return value.toFixed(config.decimals);
    } else if (config.scale === 'mph') {
      // Exit velocity in mph
      return `${value.toFixed(config.decimals)} mph`;
    } else if (config.scale === 'runs') {
      // Runs saved/contributed (can be negative)
      return value.toFixed(config.decimals);
    } else if (config.scale === 'rate') {
      // Rate (like Brls/PA)
      return value.toFixed(config.decimals);
    } else {
      // Raw numbers (like PA) - if decimals is 0, show as integer
      if (config.decimals === 0) {
        return Math.round(value).toString();
      }
    return value.toFixed(config.decimals);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] overflow-auto">
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Estimated Value</h2>
          </div>
          <div className="flex gap-3">
            <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
              Back
            </SBButton>
            <SBButton onClick={onContinue} icon={<ArrowRight size={18} />} iconPosition="right">
              Team Fit
            </SBButton>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex gap-6 justify-center">
          {/* Main Content */}
          <div className="flex-1 max-w-[900px] space-y-6">
            {/* Main Visual: AAV Calculation Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-8 grain-overlay"
            >
              <div className="mb-8 text-center">
                <h3 className="text-[#ECEDEF] mb-1">AAV Calculation</h3>
              </div>

              <div className="flex items-center justify-center gap-6">
                {/* Cohort Baseline */}
                <div className="flex-1 bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 text-center">
                  <div className="text-xs text-[#A3A8B0] mb-3 uppercase tracking-wider">Cohort Average AAV</div>
                  <div className="text-5xl text-[#A8B4BD] mb-2">
                    ${calculations.baselineAAV.toFixed(1)}M
                  </div>
                  <div className="text-xs text-[#A3A8B0]">Inflation Adjusted</div>
                </div>

                {/* Multiplier Arrow */}
                <div className="flex flex-col items-center px-4">
                  <div className="bg-gradient-to-r from-[#004B73]/20 to-[#004B73]/40 border border-[#004B73]/50 rounded-lg px-6 py-3 mb-2">
                    <div className="text-xs text-[#A8B4BD] mb-1 text-center">Performance Multiplier</div>
                    <div className="text-3xl text-[#004B73]">
                      {calculations.aavMultiplier.toFixed(3)}×
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#A3A8B0]">
                    <div className="h-px w-8 bg-[rgba(255,255,255,0.2)]"></div>
                    <ArrowRight className="text-[#004B73]" size={24} />
                    <div className="h-px w-8 bg-[rgba(255,255,255,0.2)]"></div>
                  </div>
                </div>

                {/* Estimated Value */}
                <div className="flex-1 bg-gradient-to-br from-[#004B73]/30 to-[#004B73]/10 border border-[#004B73]/50 rounded-xl p-6 text-center">
                  <div className="text-xs text-[#A8B4BD] mb-3 uppercase tracking-wider">
                    Estimated Fair AAV
                  </div>
                  <div className="text-5xl text-[#ECEDEF] mb-2">
                    ${calculations.fairAAV.toFixed(1)}M
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {calculations.fairAAV > calculations.baselineAAV ? (
                      <>
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-xs text-green-500">
                          +${(calculations.fairAAV - calculations.baselineAAV).toFixed(1)}M above cohort
                        </span>
                      </>
                    ) : calculations.fairAAV < calculations.baselineAAV ? (
                      <>
                        <TrendingDown size={14} className="text-red-500" />
                        <span className="text-xs text-red-500">
                          ${(calculations.baselineAAV - calculations.fairAAV).toFixed(1)}M below cohort
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus size={14} className="text-[#A3A8B0]" />
                        <span className="text-xs text-[#A3A8B0]">
                          At cohort average
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistical Basis Summary */}
              <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-[#A3A8B0] mb-1">Total AAV Impact</div>
                    <div className={`text-xl ${
                      calculations.fairAAV > calculations.baselineAAV ? 'text-green-500' :
                      calculations.fairAAV < calculations.baselineAAV ? 'text-red-500' : 'text-[#A3A8B0]'
                    }`}>
                      {calculations.fairAAV > calculations.baselineAAV ? '+' : ''}
                      ${(calculations.fairAAV - calculations.baselineAAV).toFixed(2)}M
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[#A3A8B0] mb-1">Net Performance</div>
                    <div className={`text-xl ${
                      calculations.aavMultiplier > 1 ? 'text-green-500' :
                      calculations.aavMultiplier < 1 ? 'text-red-500' : 'text-[#A3A8B0]'
                    }`}>
                      {calculations.aavMultiplier > 1 ? '+' : ''}
                      {((calculations.aavMultiplier - 1) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Comprehensive Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
            >
              <h3 className="text-[#ECEDEF] mb-4">Statistical Comparison & AAV Impact</h3>
              <div className="w-full overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="inline-block min-w-full">
                  <Table className="table-fixed w-full" style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                      <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-transparent">
                        <TableHead className="text-[#A8B4BD] sticky left-0 bg-[#17181B] z-10 w-[60px] px-1.5 py-1.5 text-[10px]">Stat</TableHead>
                        {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                          <TableHead key={comp.id} className="text-[#A8B4BD] text-center w-[55px] px-1.5 py-1.5 text-[10px]">
                            <div className="truncate">{comp.name.split(' ').slice(-1)[0]}</div>
                          </TableHead>
                        ))}
                        <TableHead className="text-[#004B73] text-center w-[55px] px-1.5 py-1.5 text-[10px]">Cohort Avg</TableHead>
                        <TableHead className="text-[#004B73] text-center w-[55px] px-1.5 py-1.5 text-[10px]">{player.name.split(' ').slice(-1)[0]}</TableHead>
                        <TableHead className="text-[#A8B4BD] text-center w-[50px] px-1.5 py-1.5 text-[10px]">Diff %</TableHead>
                        <TableHead className="text-[#A8B4BD] text-center w-[55px] px-1.5 py-1.5 text-[10px]">AAV Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {Object.entries(activeStatConfig).map(([configKey, config]) => {
                      const statKey = STAT_KEY_MAP[configKey] as keyof PlayerStats;
                      const impact = calculations.statImpacts.find(s => s.key === configKey);
                      
                      return (
                        <TableRow key={configKey} className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                          <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10 px-1.5 py-1.5 text-[10px]">
                            {config.label}
                          </TableCell>
                          {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => {
                            const compStats = comp.threeYearContractStats || comp.threeYearStats;
                            const value = getStatValue(configKey, compStats, comp);
                            return (
                              <TableCell key={comp.id} className="text-[#A3A8B0] text-center px-1.5 py-1.5 text-[10px]">
                                {formatStatValue(configKey as any, value)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-[#004B73] text-center px-1.5 py-1.5 text-[10px]">
                            {formatStatValue(configKey as any, getStatValue(configKey, calculations.cohortStats as PlayerStats))}
                          </TableCell>
                          <TableCell className="text-[#ECEDEF] text-center px-1.5 py-1.5 text-[10px]">
                            {formatStatValue(configKey as any, getStatValue(configKey, PETE_STATS))}
                          </TableCell>
                          <TableCell className="text-center px-1.5 py-1.5 text-[10px]">
                            <span className={`${
                              impact && impact.pctDiff > 2
                                ? 'text-green-500'
                                : impact && impact.pctDiff < -2
                                ? 'text-red-500'
                                : 'text-[#A3A8B0]'
                            }`}>
                              {impact ? (impact.pctDiff > 0 ? '+' : '') + impact.pctDiff.toFixed(1) : '0.0'}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center px-1.5 py-1.5 text-[10px]">
                            <span className={`${
                              impact && impact.aavImpact > 0.1
                                ? 'text-green-500'
                                : impact && impact.aavImpact < -0.1
                                ? 'text-red-500'
                                : 'text-[#A3A8B0]'
                            }`}>
                              {impact ? (impact.aavImpact > 0 ? '+' : '') + impact.aavImpact.toFixed(2) : '0.00'}M
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Total AAV Impact Row */}
                    {(() => {
                      const totalImpact = calculations.statImpacts.reduce((sum, impact) => sum + impact.aavImpact, 0);
                      return (
                        <TableRow className="border-t-2 border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)] bg-[rgba(255,255,255,0.02)]">
                          <TableCell className="text-[#ECEDEF] font-semibold sticky left-0 bg-[#17181B] z-10 px-1.5 py-1.5 text-[10px]">
                            Impact
                          </TableCell>
                          {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                            <TableCell key={comp.id} className="text-center px-1.5 py-1.5 text-[10px]">
                              —
                            </TableCell>
                          ))}
                          <TableCell className="text-center px-1.5 py-1.5 text-[10px]">—</TableCell>
                          <TableCell className="text-center px-1.5 py-1.5 text-[10px]">—</TableCell>
                          <TableCell className="text-center px-1.5 py-1.5 text-[10px]">—</TableCell>
                          <TableCell className="text-center px-1.5 py-1.5 text-[10px]">
                            <span className={`font-semibold ${
                              totalImpact > 0.1
                                ? 'text-green-500'
                                : totalImpact < -0.1
                                ? 'text-red-500'
                                : 'text-[#A3A8B0]'
                            }`}>
                              {(totalImpact > 0 ? '+' : '') + totalImpact.toFixed(2) + 'M'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                    
                    {/* Contract context rows moved to bottom */}
                    <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                      <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10 px-1.5 py-1.5 text-[10px]">Year Signed</TableCell>
                      {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                        <TableCell key={comp.id} className="text-[#A3A8B0] text-center px-1.5 py-1.5 text-[10px]">
                          {(comp as any).signedYear || '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-[#004B73] text-center px-1.5 py-1.5 text-[10px]">
                        {Number.isFinite(calculations.cohortAvgSignedYear) ? Math.round(calculations.cohortAvgSignedYear) : '—'}
                      </TableCell>
                      <TableCell className="text-[#ECEDEF] text-center px-1.5 py-1.5 text-[10px]">
                        2026
                      </TableCell>
                      <TableCell className="text-center text-[#A3A8B0] px-1.5 py-1.5 text-[10px]">—</TableCell>
                      <TableCell className="text-center text-[#A3A8B0] px-1.5 py-1.5 text-[10px]">—</TableCell>
                    </TableRow>

                    <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                      <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10 px-1.5 py-1.5 text-[10px]">AAV</TableCell>
                      {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                        <TableCell key={comp.id} className="text-[#A3A8B0] text-center px-1.5 py-1.5 text-[10px]">
                          {comp.AAV ? `$${comp.AAV.toFixed(1)}M` : '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-[#004B73] text-center px-1.5 py-1.5 text-[10px]">
                        {(() => {
                          const filteredComps = COMPS.filter(c => selectedComps.has(c.id) && c.AAV);
                          return filteredComps.length > 0 
                            ? `$${(filteredComps.reduce((s, c) => s + c.AAV, 0) / filteredComps.length).toFixed(1)}M`
                            : '—';
                        })()}
                      </TableCell>
                      <TableCell className="text-[#ECEDEF] text-center px-1.5 py-1.5 text-[10px]">
                        —
                      </TableCell>
                      <TableCell className="text-center text-[#A3A8B0] px-1.5 py-1.5 text-[10px]">—</TableCell>
                      <TableCell className="text-center text-[#A3A8B0] px-1.5 py-1.5 text-[10px]">—</TableCell>
                    </TableRow>

                    <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                      <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10 px-1.5 py-1.5 text-[10px]">Inflation Adj</TableCell>
                      {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                        <TableCell key={comp.id} className="text-[#A3A8B0] text-center px-1.5 py-1.5 text-[10px]">
                          {comp.AAV 
                            ? `$${calculations.inflationAdjustedById?.[comp.id]?.toFixed(1) || comp.AAV.toFixed(1)}M`
                            : '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-[#004B73] text-center px-1.5 py-1.5 text-[10px]">
                        ${calculations.baselineAAV.toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-[#ECEDEF] text-center px-1.5 py-1.5 text-[10px]">
                        —
                      </TableCell>
                      <TableCell className="text-center text-[#A3A8B0] px-1.5 py-1.5 text-[10px]">—</TableCell>
                      <TableCell className="text-center text-[#A3A8B0] px-1.5 py-1.5 text-[10px]">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                <p className="text-[#A3A8B0] text-xs leading-relaxed">
                  <span className="text-[#A8B4BD] font-medium">Data Source:</span> 3 Year Pre-Contract Averages
                </p>
              </div>
            </motion.div>

            

            {/* Fair Value Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-[#004B73]/20 to-[#004B73]/10 border border-[#004B73]/30 rounded-[14px] p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#A8B4BD] mb-2">Fair Market Value</div>
                  <div className="text-3xl text-[#ECEDEF]">
                    ${calculations.fairAAV.toFixed(1)}M × {calculations.fairYears} years
                  </div>
                  <div className="text-sm text-[#A3A8B0] mt-2">
                    Total Value: ${(calculations.fairAAV * calculations.fairYears).toFixed(1)}M
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#A3A8B0] mb-1">vs Baseline</div>
                  <div className={`text-2xl ${
                    calculations.fairAAV > calculations.baselineAAV ? 'text-green-500' : 
                    calculations.fairAAV < calculations.baselineAAV ? 'text-red-500' : 'text-[#A3A8B0]'
                  }`}>
                    {calculations.fairAAV > calculations.baselineAAV ? '+' : ''}
                    {(calculations.fairAAV - calculations.baselineAAV).toFixed(1)}M AAV
                  </div>
                  <div className={`text-sm ${
                    calculations.fairYears > calculations.baselineYears ? 'text-green-500' : 
                    calculations.fairYears < calculations.baselineYears ? 'text-red-500' : 'text-[#A3A8B0]'
                  }`}>
                    {calculations.fairYears > calculations.baselineYears ? '+' : ''}
                    {(calculations.fairYears - calculations.baselineYears).toFixed(1)} years
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar: Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-80 space-y-4"
          >
            {/* Inflation Adjustment */}
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-5 grain-overlay space-y-3">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Inflation Adjustment</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="inflation" className="text-[#ECEDEF] text-sm">
                  Annual inflation
                </Label>
                <span className="text-[#A3A8B0] text-sm font-mono">{inflationPercent.toFixed(1)}%</span>
              </div>
              <Slider
                value={[inflationPercent]}
                onValueChange={(value) => setInflationPercent(value[0])}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
            {/* Comps Selection */}
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-5 grain-overlay">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Include Comps</h4>
              <div className="space-y-2">
                {COMPS.map((comp) => (
                  <div key={comp.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`comp-${comp.id}`}
                      checked={selectedComps.has(comp.id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedComps);
                        if (checked) {
                          newSet.add(comp.id);
                        } else {
                          if (newSet.size > 1) { // Ensure at least one comp remains
                            newSet.delete(comp.id);
                          }
                        }
                        setSelectedComps(newSet);
                      }}
                    />
                    <Label
                      htmlFor={`comp-${comp.id}`}
                      className="text-[#ECEDEF] text-sm cursor-pointer flex-1"
                    >
                      {comp.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjustment Toggles */}
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-5 grain-overlay space-y-3">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Adjustments</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="adjust-aav" className="text-[#ECEDEF] text-sm">
                  Adjust AAV
                </Label>
                <Checkbox
                  id="adjust-aav"
                  checked={adjustAAV}
                  onCheckedChange={setAdjustAAV}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="adjust-years" className="text-[#ECEDEF] text-sm">
                  Adjust Years
                </Label>
                <Checkbox
                  id="adjust-years"
                  checked={adjustYears}
                  onCheckedChange={setAdjustYears}
                />
              </div>
            </div>

            {/* Stat Weights (Collapsible) */}
            <Collapsible open={weightsOpen} onOpenChange={setWeightsOpen}>
              <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[#A8B4BD] text-sm">Stat Weights</h4>
                    <Select value={selectedPosition} onValueChange={handlePositionChange}>
                      <SelectTrigger className="w-[80px] h-7 bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                        {isPitcherPlayer ? (
                          // Pitcher positions
                          ['SP', 'RP'].map((pos) => (
                            <SelectItem
                              key={pos}
                              value={pos}
                              className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF] text-xs"
                            >
                              {pos}
                            </SelectItem>
                          ))
                        ) : (
                          // Hitter positions
                          ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'OF', 'DH'].map((pos) => (
                            <SelectItem
                              key={pos}
                              value={pos}
                              className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF] text-xs"
                            >
                              {pos}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <CollapsibleTrigger asChild>
                    <button className="hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded p-1">
                      <ChevronDown
                        size={16}
                        className={`text-[#A3A8B0] transition-transform ${
                          weightsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>
                {/* Info message for pitchers labeled as "P" */}
                {isPitcherPlayer && (playerPrimaryPosition === 'P' || (playerPrimaryPosition === null && player.position?.trim().toUpperCase() === 'P')) && (
                  <div className="px-5 pb-3">
                    <Alert className="bg-[#004B73]/10 border-[#004B73]/20">
                      <Info className="h-4 w-4 text-[#004B73]" />
                      <AlertDescription className="text-[#A8B4BD] text-xs">
                        All pitchers are labeled as "P". Select "RP" if this is a relief pitcher.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                <CollapsibleContent>
                  <div className="px-5 pb-5 space-y-3">
                    {Object.entries(activeStatConfig).map(([key, config]) => {
                      const weight = customWeights[key] ?? 0;
                      
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                              <Label className="text-[#ECEDEF] text-xs">{config.label}</Label>
                            <span className="text-[#A3A8B0] text-xs font-mono">
                              {weight.toFixed(2)}x
                            </span>
                          </div>
                          <Slider
                            value={[weight]}
                            onValueChange={(value) => {
                              setCustomWeights((prev) => ({ ...prev, [key]: value[0] }));
                            }}
                            min={0}
                            max={1}
                            step={0.05}
                            className="w-full"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Contract Length Breakdown moved to sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
            >
              <h3 className="text-[#ECEDEF] mb-4">Contract Length Formula</h3>
              <div className="grid grid-cols-1 gap-3 mb-2">
                <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
                  <div className="text-xs text-[#A3A8B0] mb-1">Average Cohort Years</div>
                  <div className="text-xl text-[#ECEDEF]">
                    {calculations.baselineYears.toFixed(1)}
                  </div>
                </div>
                
                {adjustYears && (
                  <>
                    <div className="border-t border-[rgba(255,255,255,0.1)] pt-3 mt-2">
                      <div className="text-xs text-[#A3A8B0] mb-2 uppercase tracking-wider">Adjustments</div>
                      <div className="space-y-2">
                        <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                          <div className="text-xs text-[#A3A8B0] mb-1">Age Multiplier Effect</div>
                          <div className={`text-lg ${((calculations.baselineYears * calculations.ageMultiplier) - calculations.baselineYears) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {((calculations.baselineYears * calculations.ageMultiplier) - calculations.baselineYears) > 0 ? '+' : ''}{((calculations.baselineYears * calculations.ageMultiplier) - calculations.baselineYears).toFixed(2)}
                          </div>
                        </div>
                        
                        {calculations.absoluteAgePenalty > 0 && (
                          <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                            <div className="text-xs text-[#A3A8B0] mb-1">Absolute Age Penalty</div>
                            <div className={`text-lg text-red-500`}>
                              -{calculations.absoluteAgePenalty.toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                          <div className="text-xs text-[#A3A8B0] mb-1">Performance Adjustment</div>
                          <div className={`text-lg ${calculations.performanceAdjustment < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {calculations.performanceAdjustment > 0 ? '+' : ''}{calculations.performanceAdjustment.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)]">
                        <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                          <div className="text-xs text-[#A3A8B0] mb-1">Total Adjustment</div>
                          <div className={`text-lg ${calculations.yearsAdjustment < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {calculations.yearsAdjustment > 0 ? '+' : ''}{calculations.yearsAdjustment.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
                      <div className="text-xs text-[#A3A8B0] mb-1">Proposed Years</div>
                      <div className={`text-lg ${calculations.proposedYears >= calculations.baselineYears ? 'text-green-500' : 'text-red-500'}`}>
                        {calculations.proposedYears.toFixed(2)}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="bg-[#004B73] border border-[#004B73] rounded-lg p-4">
                  <div className="text-xs text-[#A8B4BD] mb-1">Fair Length</div>
                  <div className="text-xl text-[#ECEDEF]">
                    {calculations.fairYears.toFixed(1)} years
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Full-width bottom button */}
        <SBButton 
          size="lg" 
          onClick={onContinue}
          icon={<ArrowRight size={18} />}
          iconPosition="right"
          className="w-full mt-6"
        >
          Team Fit
        </SBButton>
      </div>
    </div>
  );
}
